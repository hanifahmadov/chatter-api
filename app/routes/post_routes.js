/* eslint-disable */
//  NPM packages
const express = require("express");
const asyncHandler = require("express-async-handler");
const passport = require("passport");

/*  IMPORTS */
const { BadCredentialsError, BadParamsError, DuplicateKeyError } = require("../../lib/custom_errors");

/** Schemas */
const Like = require("../models/like");
const Post = require("../models/post");
const Comment = require("../models/comment");

const chalk = require("chalk");
const newpost_multer = require("../middlewares/newpost_multer");
const delete_media = require("../middlewares/delete_media");

/* START ROUTER */
const router = express.Router();

/* PASSPORT WILL CHECK THE TOKEN */
const requireToken = passport.authenticate("bearer", { session: false });

/* POST */
router.post(
	"/newpost",
	requireToken,
	newpost_multer.single("image"),
	asyncHandler(async (req, res, next) => {
		/* GET PROPERTIES FRO THE HOST */
		const { text } = req.body;
		const { baseurl } = req.body;
		const { _id } = req.user;
		const { imagename } = req;

		/* checking if the avatar image is provided or not */
		const avatarAddress = imagename ? baseurl + "/" + imagename : undefined;

		/* CREATE THE POST */
		const post = await Post.create({
			content: text,
			owner: _id,
			media: avatarAddress,
		});

		console.log(req.app.get("io"));
		// Emit the new post event to all connected clients
		req.app.get("io").server.emit("on_newpost", true);

		// response
		res.status(201).json({ created: true });
	})
);

/** Getting all posts, request from Homejs useEffect on submit and liketype change */
router.get(
	"/posts",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/**
		 *  here we haveto populated all detailed nested objects
		 * 	owner, likes, like_owners
		 *
		 * 	explanation: first all posts owner will be populated and then likes will be populated.
		 * 	its possible to chain the populated functions.
		 * 	then likes object has a owner property _id (mongoose ID, fyu - only mongoose ID can be populated)
		 * 	so, we can add another populated property with pass and model and selected option
		 * 	inside populate() function to get the nested objects populated.
		 *
		 * 	fyi - Post.find() will get all posts single first, populate it then will store inside allpost as an array.
		 */
		const allPosts = await Post.find()
			.populate({
				path: "owner",
				select: "-accessToken -hashedPassword",
			})
			.populate({
				path: "likes",
				populate: {
					path: "owner",
					model: "User",
					select: "-accessToken -hashedPassword",
				},
			})
			.populate({
				path: "comments",
				populate: [
					{
						path: "owner",
						model: "User",
						select: "-accessToken -hashedPassword",
					},
					{
						path: "replies",
						model: "Comment",
						populate: [
							{
								path: "owner",
								model: "User",
								select: "-accessToken -hashedPassword",
							},
							{
								path: "likes",
								model: "Like",
								populate: [
									{
										path: "owner",
										model: "User",
										select: "-accessToken -hashedPassword",
									},
								],
							},

							{
								path: "referral",
								model: "User",
								select: "-accessToken -hashedPassword",
							},

							{
								path: "replies",
								model: "Comment",
								populate: [
									{
										path: "owner",
										model: "User",
										select: "-accessToken -hashedPassword",
									},

									{
										path: "referral",
										model: "User",
										select: "-accessToken -hashedPassword",
									},
									{
										path: "likes",
										model: "Like",
										populate: [
											{
												path: "owner",
												model: "User",
												select: "-accessToken -hashedPassword",
											},
										],
									},
								],
							},
						],
					},
					{
						path: "likes",
						model: "Like",
						populate: {
							path: "owner",
							model: "User",
							select: "-accessToken -hashedPassword",
						},
					},
				],
			})
			.exec();

		// response
		res.status(201).json({ posts: allPosts });
	})
);

/* LIKE POST WITH PUT REQUEST */
/**
 * 	GENERAL INFORMATION HERE TOMORROW EXPLAIN WHATS GOING ON
 */
router.put(
	"/posts/:postId/reaction",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/* GET PROPERTIES FRO THE HOST */

		const { postId } = req.params;
		const { likeType } = req.body;
		const { _id: userId } = req.user;

		/* get the post */
		let thePost = await Post.findById(postId).populate("likes");

		/* get the currentUser like if there is one */
		let theLike = await thePost.likes.find((like) => like.owner._id.equals(userId));

		if (theLike) {
			/* if types are same, remove the like */
			if (theLike.reaction == likeType) {
				/* undo */
				thePost.likes = await thePost.likes.filter((like) => !like.owner.equals(userId));
				// Remove the like document from the Likes collection
				await Like.findByIdAndDelete(theLike._id);
				req.app.get("io").server.emit("on_postreaction", true);
			} else {
				/* if not then update like */
				theLike.reaction = likeType;
				await theLike.save(); // Save the updated like document
				req.app.get("io").server.emit("on_postreaction", true);
			}
		} else {
			/*  create a new like */
			const newLike = await Like.create({
				owner: userId,
				reaction: likeType,
				rootPostId: postId,
			});

			/* new version */
			await thePost.likes.push(newLike._id);
		}

		await thePost.save();
		req.app.get("io").server.emit("on_postreaction", true);

		/* response resolved */
		res.status(201).json(true);
	})
);

/** add comment to the post */
router.post(
	"/posts/:postId/addcomment",
	requireToken,
	/** add multer to handle the picture or any media of the comments if uploaded, later */
	// newpost_multer.single("image"),
	asyncHandler(async (req, res, next) => {
		/* GET PROPERTIES FRO THE HOST */
		const { text } = req.body;
		const { _id: userId } = req.user;
		const { postId } = req.params;

		/** create a Comment */
		const comment = await Comment.create({
			content: text,
			owner: userId,
			rootPostId: postId,
		});

		/** now, pull the post */
		const thepost = await Post.findById(postId);

		/* the post has a comments section data type is array. */
		await thepost.comments.push(comment._id);

		/* save the updated post */
		await thepost.save();

		req.app.get("io").server.emit("on_newcomment", true);

		// response
		res.status(201).json({ created: true });
	})
);

/** DELETE THE POST */
router.delete(
	"/posts/:postId/delete",
	requireToken,
	delete_media,
	asyncHandler(async (req, res, next) => {
		/* GET PROPERTIES FRO THE HOST */
		const { postId } = req.params;

		const media_deleted = req.post_media_deleted;

		/* if it == 1 means mead */
		if (!media_deleted) return res.status(201).json({ deleted: "media NOT deleted" });

		/* FIRST >> DELETE ALL LIKES RELATED TO THIS POST  */
		await Like.deleteMany({ rootPostId: postId })
			.then((res) => {
				console.log(res.deletedCount);
			})
			.catch((err) => {
				console.log(err);
			});

		/* SECOND >> DELETE ALL COMMENTS RELATED TO THIS POST  */
		await Comment.deleteMany({ rootPostId: postId })
			.then((res) => {
				console.log(res.deletedCount);
			})
			.catch((err) => {
				console.log(err);
			});

		/* LASST >> DELETE THE POST ITSELF */
		await Post.findByIdAndDelete(postId);

		req.app.get("io").server.emit("on_deletepost", true);

		// response
		res.status(204).json();
	})
);

module.exports = router;
