/* eslint-disable */
//  NPM packages
const express = require("express");
const crypto = require("crypto");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");

// imports
const { BadCredentialsError, BadParamsError, DuplicateKeyError, DocumentNotFoundError } = require("../../lib/custom_errors");

const User = require("../models/user");

// setups
const router = express.Router();
const requireToken = passport.authenticate("bearer", { session: false });

router.get(
	"/refreshAccess",
	asyncHandler(async (req, res, next) => {
		const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


		await delay(1500);
		// get the jwt refresh tocken from the cookies
		const cookies = req.cookies;

		// if no refresh token respond to json
		// but later try to throw BadCredentialsError

		/**
		 * if cookies are cleared
		 * that means user signed out or user is new
		 * in that case when user visit "/" route,
		 * no need to apply delay and show Backdrop
		 * so make sure there is no delay above this line
		 *
		 */
		if (!cookies || !cookies.jwt) {
			/** status code is 401 */
			throw new BadCredentialsError();
		}

		// if refresh token, have it
		const refreshToken = cookies.jwt;

		// based on refreshToken got it from the cookies
		// verify and decode for a new access-token generator

		/**
		 *  delay here
		 */
		

		jwt.verify(
			refreshToken,
			process.env.REFRESH_TOKEN_SECRET,
			asyncHandler(async (err, decoded) => {
				/**
				 *  cookies token expired
				 * 	status code is 422
				 */
				if (err) throw new BadParamsError();

				/**
				 *  if token is valid
				 * 	retrieve the user and response with
				 * 	current user
				 * 	there is no way the user is undefined
				 * 	thats why no need to check the user id defined or not
				 * 	because if cookies are provided and not expired then it will get decoded
				 */
				const user = await User.findOne({ email: decoded.email });

				//: generate access token again
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

				/*  set users accessToken */
				user.accessToken = accessToken;
				await user.save();

				/* response */
				res.status(200).json({ user: user.toObject() });
			})
		);
	})
);

module.exports = router;
