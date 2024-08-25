/* NPM packages*/
const Emitter = require("events");
const passport = require("passport");
const bearer = require("passport-http-bearer");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

/* User Sockets */
// const UserSocket = require("./UserSocket");

/* Schema & Models */
const Post = require("../app/models/post");
const User = require("../app/models/user");

/* Custom Error */
const {
	DocumentNotFoundError,
	BadParamsError,
	BadCredentialsError,
	SocketMissingTokenError,
	SocketExpireTokendError,
	DocumentAlreadyExist,
	EmailValidationError,
} = require("../lib/custom_errors");

/* HELPERS */
const { tokenValidation } = require("./socket_helpers");
/*  */

class UserSocket {
	constructor(socket) {
		this.socket = socket;
	}
}

module.exports = { UserSocket };
