/* eslint-disable */
//  NPM packages
const express = require("express");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const crypto = require("crypto");
const multer = require("multer");
const passport = require("passport");
const chalk = require("chalk");

/* Custom Error */
const {
	DocumentNotFoundError,
	BadParamsError,
	BadCredentialsError,
	SocketMissingTokenError,
	SocketExpireTokendError,
	DocumentAlreadyExist,
	EmailValidationError,
} = require("../../lib/custom_errors");

/** Schemas */
const Like = require("../models/like");
const Post = require("../models/post");
const Comment = require("../models/comment");
const PrivateMessage = require("../models/private_message");

/* multer */
const privatemessage_multer = require("../middlewares/privatemessage_multer");

/* start router */
const router = express.Router();

/* check token and attached it to req object */
const requireToken = passport.authenticate("bearer", { session: false });

/* POST */
router.post(
	"/private_messages/create",
	requireToken,
	privatemessage_multer.single("image"),
	asyncHandler(async (req, res, next) => {
		const { _id } = req.user;
		const { imagename } = req;
		const { text, baseurl, recipientId, randomDate } = req.body;

		const pvt_msg_media = imagename ? baseurl + "/" + imagename : undefined;

		await PrivateMessage.create({
			sender: _id,
			recipient: recipientId,
			message: text,
			media: pvt_msg_media,
		});

		// emit the new post event to all connected clients
		req.app.get("io").server.emit("on_new_pvtmessage", true);

		// response
		res.status(201).json({ created: true });
	})
);

/* GET */
router.get(
	"/private_messages/read",
	requireToken,
	asyncHandler(async (req, res, next) => {
		const { _id } = req.user;

		try {
			const all_pvt_messages = await PrivateMessage.find().populate({
				path: "recipient",
				select: "-accessToken -hashedPassword",
			});

			// Uncomment if you need to emit an event
			// req.app.get("io").server.emit("on_newpost", true);

			// response
			res.status(200).json({ all_pvt_messages });
		} catch (error) {
			// Optional: Error handling for improved debugging
			next(error);
		}
	})
);

module.exports = router;
