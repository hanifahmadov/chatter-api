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
const Message = require("../models/message");

/* multer */
const message_multer = require("../middlewares/message_multer");

/* start router */
const router = express.Router();

/* check token and attached it to req object */
const requireToken = passport.authenticate("bearer", { session: false });

/* POST */
router.post(
	"/messages/create",
	requireToken,
	message_multer.single("image"),
	asyncHandler(async (req, res, next) => {
		console.log("arrived");
		const { _id } = req.user;
		const { imagename } = req;
		const { text, baseurl, recipientId, randomDate } = req.body;

		const msg_media = imagename ? baseurl + "/" + imagename : undefined;

		await Message.create({
			sender: _id,
			recipient: recipientId,
			message: text,
			media: msg_media,
			createdAt: randomDate ? randomDate : new Date(),
		});

		// emit the new post event to all connected clients
		req.app.get("io").server.emit("on_messages", true);

		// response
		res.status(201).json({ created: true });
	})
);

/* GET */
router.get(
	"/messages/read",
	requireToken,
	asyncHandler(async (req, res, next) => {
		const { _id } = req.user;

		try {
			const messages = await Message.find().populate({
				path: "recipient",
				select: "-accessToken -hashedPassword",
			});



			// Uncomment if you need to emit an event
			// req.app.get("io").server.emit("on_messages", true);

			// response
			res.status(200).json({ messages });
		} catch (error) {
			/* Error handling for improved debugging */
			console.log("messages/read error >> ", error);
			next(error);
		}
	})
);

/* GET SINGLE MESSAGES last messages*/
router.get(
	"/messages/:recipientId/last-message",
	requireToken,
	asyncHandler(async (req, res, next) => {
		const { _id } = req.user;
		const { recipientId: recipient } = req.params;

		try {
			const messages = await Message.find({
				$or: [
					{ sender: _id, recipient: recipient },
					{ sender: recipient, recipient: _id },
				],
			}).populate({
				path: "recipient",
				select: "-accessToken -hashedPassword",
			});

			/* sort messages based on dates */
			await messages.sort((a, b) => {
				new Date(a.createdAt) - new Date(b.createdAt);
			});

			/* cached */
			const result = {
				unread: 0,
				lastMessage: messages.length > 0 ? messages[messages.length - 1] : {},
			};

			/* count for unread */
			for (const mess of messages) {
				if (mess.sender.equals(recipient) && mess.isRead == false) {
					result.unread += 1;
				}
			}

			// response
			res.status(200).json({ messages: result });
		} catch (error) {
			/* Error handling for improved debugging */
			console.log("messages/read error >> ", error);
			next(error);
		}
	})
);

/* GET SINGLE MESSAGES */
router.post(
	"/messages/:recipientId/mark-read",
	requireToken,
	asyncHandler(async (req, res, next) => {
		const { recipientId } = req.params;
		const { _id: userId } = req.user;

		try {
			// Find and update all messages that have not been read yet
			await Message.updateMany(
				{
					sender: recipientId,
					recipient: userId,
					isRead: false,
				},
				{ $set: { isRead: true } }
			);

			res.status(200).json({ message: "Messages marked as read." });
		} catch (error) {
			res.status(500).json({ error: "Failed to mark messages as read." });
		}
	})
);

module.exports = router;
