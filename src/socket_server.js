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

				// get the ids of online users
				const onlineUsers = Array.from(this.onlineUsers.keys());

				/** when user signs out */
				this.server.emit("new_connection", onlineUsers);

				socket.on(
					"disconnect",
					asyncHandler(async () => {
						console.log("_IO: socket disconnected", socket.user.email + "left");

						/** when user lost a connection to the server
						 *  update his lastseen with the current time
						 * 	fyi- user is assigned to socket and socket.user is a reference type
						 * 	any change like below affects the database user details
						 */
						socket.user.lastseen = new Date()
						await socket.user.save()

						/** when user sings out
						 *  remove him from server online-users
						 */
						this.onlineUsers.delete(socket.user._id.toString());

						console.log("this.onlineUsers.", this.onlineUsers);

						// get the ids of online users
						const onlineUsers = Array.from(this.onlineUsers.keys());

						/* emit online users */
						this.server.emit("new_connection", onlineUsers);

						/* emit info who left */
						this.server.emit("on_disconnect", socket.user.email + " left");
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
