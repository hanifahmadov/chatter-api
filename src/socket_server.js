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
const { UserSocket } = require("./user_socket");
/*  */

/** Control Schema */
class _IO {
	constructor(server) {
		this.events = new Emitter();
		this.server = server;
		this.rooms = new Set();
		this.onlineUsers = new Map();
		this.messages = [];
		this.newUser = undefined;

		this.server.use(tokenValidation);

		this.server.on(
			"connection",
			asyncHandler(async (socket) => {
				console.log("_IO: new connection ~ username: " + socket.user.email);

				/* add to online */
				const newuser = new UserSocket(socket);
				this.onlineUsers.set(socket.user._id.toString(), newuser);

				socket.on(
					"disconnect",
					asyncHandler(async () => {
						console.log("_IO: socket disconnected");

						this.onlineUsers.delete(socket.user._id);
						this.server.emit("on_disconnect");
					})
				);
			})
		);
	}

	static create(server) {
		return new this(server);
	}
}

module.exports = _IO;
