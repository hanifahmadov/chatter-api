/* eslint-disable */
//  NPM packages
const express = require("express");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

/* IMPORTS FOR requireTOKEN SETUP LINE 25 */
const passport = require("passport");

/*  IMPORTS */
const { BadCredentialsError, BadParamsError, DuplicateKeyError } = require("../../lib/custom_errors");

/** Schemas */
const Like = require("../models/like");
const Post = require("../models/post");
const Comment = require("../models/comment");

/* PASSPORT WILL CHECK THE TOKEN */
const requireToken = passport.authenticate("bearer", { session: false });

/* START ROUTER */
const router = express.Router();

/* LIKE COMMENT */
router.put(
	"/comments/:commentId/reaction",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/** get all properties */
		const { commentId } = req.params;
		const { likeType, rootPostId, rootCommentId, parentCommentId } = req.body;
		const { _id: userId } = req.user;

		/** retrieve valid Comment and populated likes */
		let theComment = await Comment.findById(commentId).populate({ path: "likes", model: "Like" });

		/* find the current user's like */

		let theLike = await theComment.likes.find((like) => like.owner._id.equals(userId));

		/* if user has a like, then just update it */
		if (theLike) {
			/* if the same likeType, remove the like */
			if (theLike.reaction == likeType) {
				/* remove from the array */
				theComment.likes = await theComment.likes.filter((like) => !like.owner._id.equals(userId));

				/* delete that like itself */
				await Like.findByIdAndDelete(theLike._id);
				req.app.get("io").server.emit("on_commentreaction", true);
			} else {
				/* if likeType is different, then update it */
				theLike.reaction = likeType;

				/** save theLike here,
				 *  cause if theLike is undefined,
				 *  cant get saved all the way down
				 * */
				await theLike.save();
				req.app.get("io").server.emit("on_commentreaction", true);
			}
		} else {
			/* else means there is no like belongs to this user, so create one */
			/** create new Like */
			const newLike = await Like.create({
				owner: userId,
				reaction: likeType,
				rootPostId: rootPostId,
				rootCommentId: rootCommentId,
				parentCommentId: parentCommentId,
			});

			/** add it to the reply likes array */
			await theComment.likes.push(newLike._id);
		}

		/* save all shits */
		await theComment.save();
		req.app.get("io").server.emit("on_commentreaction", true);

		// response
		res.status(201).json({ created: true });
	})
);

/* ADD REPLY */
router.post(
	"/comments/:commentId/addreply",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/** get all properties */
		const { commentId } = req.params;
		const { replyText, referralId, rootPostId, rootCommentId } = req.body;
		const { _id: userId } = req.user;

		/* get the comment */
		const theComment = await Comment.findById(commentId);

		// /* create reply - its also a comment */
		const newComment = await Comment.create({
			content: replyText,
			referral: referralId,
			owner: userId,
			rootPostId: rootPostId,
			rootCommentId: rootCommentId,
		});

		/* add to replies */
		await theComment.replies.push(newComment._id);

		/* save */
		await theComment.save();
		req.app.get("io").server.emit("on_newreply", true);

		// response
		res.status(201).json({ created: true });
	})
);

/** DELETE COMMENT */
router.delete(
	"/comments/:commentId/delete",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/** get all properties */
		const { commentId } = req.params;
		const { rootCommentId } = req.body;
		const { _id: userId } = req.user;

		/* DELETE ALL RELATED COMMENTS */
		await Comment.deleteMany({ rootCommentId: rootCommentId })
			.then((res) => {
				console.log(res.deletedCount);
			})
			.catch((err) => {
				console.log(err);
			});

		/* DELETE ALL RELATED LIKES */
		await Like.deleteMany({ rootCommentId: rootCommentId })
			.then((res) => {
				console.log(res.deletedCount);
			})
			.catch((err) => {
				console.log(err);
			});

		/* DELETE COMMENT ITSELF */
		await Comment.findByIdAndDelete(commentId);
		req.app.get("io").server.emit("on_deletecomment", true);

		// response
		res.status(204).end(); // No content is sent back
	})
);

/** DELETE REPLY */
router.delete(
	"/comments/:commentId/delete-reply",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/** get all properties */
		const { commentId } = req.params;
		const { _id: userId } = req.user;

		console.log(commentId);

		/* DELETE ALL RELATED COMMENTS */
		let theReply = await Comment.findById(commentId).populate("replies");

		/* DELETE REPLY OWN LIKES */
		for (const likeid of theReply.likes) {
			await Like.findByIdAndDelete(likeid);
		}

		/* DELETE REPLY COMMENT'S LIKE */
		await Like.deleteMany({ parentCommentId: commentId })


		/* DELETE ITS COMMENTS */
		for (const comment of theReply.replies) {
			await Comment.findByIdAndDelete(comment._id);
		}

		/* DELETE ITSLEF */
		await Comment.findByIdAndDelete(commentId);
		req.app.get("io").server.emit("on_deletereply", true);

		// response
		res.status(204).end(); // No content is sent back
	})
);

/** DELETE SUB-REPLY */
router.delete(
	"/comments/:commentId/delete-subreply",
	requireToken,
	asyncHandler(async (req, res, next) => {
		/** get all properties */
		const { commentId } = req.params;
		const { _id: userId } = req.user;


		/* DELETE ALL RELATED COMMENTS */
		let theSubReply = await Comment.findById(commentId)

		console.log(theSubReply)

		/* DELETE REPLY OWN LIKES */
		for (const likeid of theSubReply.likes) {
			await Like.findByIdAndDelete(likeid);
		}

		/* DELETE ITSLEF */
		await Comment.findByIdAndDelete(commentId);
		req.app.get("io").server.emit("on_delete_subreply", true);

		// response
		res.status(204).end(); // No content is sent back
	})
);

module.exports = router;
