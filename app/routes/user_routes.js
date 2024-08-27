/* eslint-disable */
//  NPM packages
const express = require("express");
const crypto = require("crypto");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const multer = require("multer");
const signup_multer = require("../middlewares/signup_multer");

/* custom errors */
const {
	BadCredentialsError,
	BadParamsError,
	DuplicateKeyError,
	DocumentAlreadyExist,
	EmailValidationError,
} = require("../../lib/custom_errors");

/* models */
const User = require("../models/user");

/* passport setup */
const requireToken = passport.authenticate("bearer", { session: false });

/* password encryption */
const bcryptSaltRounds = 10;

/* router initiate */
const router = express.Router();

/* sign up */
router.post(
	"/signup",
	signup_multer.single("avatar"),
	asyncHandler(async (req, res, next) => {
		const { email, pwd, repwd, baseurl } = req.body;

		/* attached on signup_multer file as filename */
		const filename = req.filename;

		/* default value based on image/profiles/file name in there */
		const defaultFilename = "default-user.jpeg";

		/* check if avatar image is provided or not */
		const avatarAddress = filename ? baseurl + "/" + filename : baseurl + "/" + defaultFilename;

		// check inputs
		if (!email || !pwd || pwd !== repwd) throw new BadParamsError();

		// check if the user is already exist
		const existUser = await User.findOne({ email });

		if (existUser) throw new DocumentAlreadyExist();

		// hash password - returns promise
		const hashed = await bcrypt.hash(pwd.toString(), bcryptSaltRounds);

		try {
			/* create a user */
			const user = await User.create({
				email,
				hashedPassword: hashed,
				username: email.split("@")[0],
				avatar: avatarAddress,
			});

			/* response */
			res.status(201).json({ user: user.toObject() });
		} catch (error) {
			if (error.name == "ValidationError") {
				res.status(400).json({
					status: 12000,
					errors: "Validation errors occurred",
					message: `This email doesnt contain a valid domain name.\nEnding with ( gmail.com yahoo.com  ..etc )`,
				});
			}
		}
	})
);

/* signin */
router.post(
	"/signin",
	asyncHandler(async (req, res, next) => {
		const { email, pwd, remember } = req.body;

		/* get user */
		const user = await User.findOne({ email });
		if (!user) throw new BadCredentialsError();

		/* check password */
		const correctPassword = await bcrypt.compare(pwd, user.hashedPassword);
		if (!correctPassword) throw new BadCredentialsError();

		/* generate access-token */
		const accessToken = jwt.sign(
			{
				UserInfo: {
					id: user._id,
					email: user.email,
				},
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: "1h" }
		);

		/* generate refresh-token */
		const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_TOKEN_SECRET, {
			expiresIn: remember ? "7d" : "1h",
		});

		/*  secure cookie with refresh token */
		res.cookie("jwt", refreshToken, {
			httpOnly: true, //accessible only by web server
			secure: true, //https
			sameSite: "None", //cross-site cookie
			maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
		});

		/* user setup */
		user.accessToken = accessToken;
		user.signedIn = true;
		await user.save();

		/* response */
		res.status(200).json({ user: user.toObject() });
	})
);

/* sign out */
router.delete(
	"/signout",
	asyncHandler(async (req, res, next) => {
		/* get cookies */
		const cookies = req.cookies;
		const { _id } = req.body;

		if (!cookies || !cookies.jwt) {
			console.log("cokkies ARE EMPTY, returns 204");
			res.sendStatus(204); //No content
		}
		// clear cookies
		res.clearCookie("jwt", {
			httpOnly: true,
			sameSite: "None",
			secure: true,
		});

		console.log("cookies cleared, returns 204");

		/* get user and clear the token */
		const user = await User.findOne({ _id });

		if (!user) throw new BadCredentialsError();

		/* clear token  */
		user.accessToken = null;

		/* dave */
		await user.save();

		console.log("toke all cleared > user saved");

		/* delete user from socket online user server */
		req.app.get("io").onlineUsers.delete(_id.toString());

		/* 204 no content */
		res.sendStatus(204);
	})
);

// PATCH
// CHANGE password
router.patch(
	"/change-password",
	requireToken,
	asyncHandler(async (req, res, next) => {
		const { passwords } = req.body;

		// gets user from db
		const user = await User.findById(req.user.id);

		// check that the old password is correct
		const correctPassword = await bcrypt.compare(passwords.old, user.hashedPassword);

		if (!passwords.new || !correctPassword) throw new BadParamsError();

		// hash new password
		const newPass = await bcrypt.hash(passwords.new, bcryptSaltRounds);

		// set it to user
		user.hashedPassword = newPass;

		// save user
		await user.save();

		// response
		res.sendStatus(204);
	})
);

/* GET > all users  */
router.get(
	"/users",
	requireToken,
	asyncHandler(async (req, res, next) => {
		const { _id: userId } = req.user;

		// Fetch all users except the current one, excluding accessToken and hashedPassword
		const allUsers = await User.find({ _id: { $ne: userId } }).select("-accessToken -hashedPassword");

		res.status(200).json({ allUsers });
	})
);

module.exports = router;
