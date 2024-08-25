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

// imports
const {
	BadCredentialsError,
	BadParamsError,
	DuplicateKeyError,
	DocumentAlreadyExist,
	EmailValidationError,
} = require("../../lib/custom_errors");
const User = require("../models/user");
const chalk = require("chalk");
// const loginLimitter = require("../middlewares/loginLimiter");

// setups
const bcryptSaltRounds = 10;
const requireToken = passport.authenticate("bearer", { session: false });
const router = express.Router();
/* ASYNC AWAIT */

// POST
// SIGN UP
router.post(
	"/signup",
	signup_multer.single("avatar"),
	asyncHandler(async (req, res, next) => {
		const { email, password, passwordConfirmation, baseurl } = req.body;

		/* attached on signup_multer file as filename */
		const filename = req.filename;

		/* default value based on image/profiles/file name in there */
		const defaultFilename = "default01.jpeg";

		/* check if avatar image is provided or not */
		const avatarAddress = filename ? baseurl + "/" + filename : baseurl + "/" + defaultFilename;

		// check inputs
		if (!email || !password || password !== passwordConfirmation) throw new BadParamsError();

		// check if the user is already exist
		const existUser = await User.findOne({ email });

		if (existUser) throw new DocumentAlreadyExist();

		// hash password - returns promise
		const hashed = await bcrypt.hash(password.toString(), bcryptSaltRounds);

		try {
			// create
			const user = await User.create({
				email,
				hashedPassword: hashed,
				username: email.split("@")[0],
				avatar: avatarAddress,
			});

			// response
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

// POST
// SIGN IN
router.post(
	"/signin",
	asyncHandler(async (req, res, next) => {
		const { password, email, remember } = req.body.credentials;

		// gets user from db
		const user = await User.findOne({ email });

		if (!user) throw new BadCredentialsError();

		// check that the password is correct
		let correctPassword = await bcrypt.compare(password, user.hashedPassword);

		if (!correctPassword) throw new BadCredentialsError();

		// # generate access token
		const accessToken = jwt.sign(
			{
				UserInfo: {
					id: user._id,
					email: user.email,
				},
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: "1d" }
		);

		// # generate refresh token
		const refreshToken = jwt.sign({ email: user.email }, process.env.REFRESH_TOKEN_SECRET, {
			expiresIn: remember ? "7d" : "1d",
		});

		// Create secure cookie with refresh token
		res.cookie("jwt", refreshToken, {
			httpOnly: true, //accessible only by web server
			secure: true, //https
			sameSite: "None", //cross-site cookie
			maxAge: 7 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
		});

		// # set users accessToken
		user.accessToken = accessToken;
		user.signedIn = true;

		// save user
		await user.save();

		// response
		res.status(200).json({ user: user.toObject() });
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

// DELETE
// SIGN OUT
// requireToken,
router.delete(
	"/signout",
	requireToken,
	asyncHandler(async (req, res, next) => {
		console.log(req.app.get("io").onlineUsers.size);

		console.log("user routes signout reached");
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

		console.log(chalk.green("cookies CLEARED, and returns 204"));
		// save the token and respond with 204

		// clear access token in user
		let user = await User.findOne({ _id });

		// create an custom Error like UserNotFound error
		if (!user) throw new BadCredentialsError();

		user.accessToken = null;

		await user.save();

		console.log(chalk.green("accessToken and signedIn cleared, user saved"));

		req.app.get("io").onlineUsers.delete(_id.toString());

		console.log(req.app.get("io").onlineUsers.size);

		// response
		res.sendStatus(204); //No content
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
