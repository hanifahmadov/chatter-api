const passport = require("passport");
const bearer = require("passport-http-bearer");
const jwt = require("jsonwebtoken");

/*  custom errors */
const {
	DocumentNotFoundError,
	BadParamsError,
	BadCredentialsError,
	SocketMissingTokenError,
	SocketExpireTokendError,
	DocumentAlreadyExist,
	EmailValidationError,
} = require("../lib/custom_errors");


/* models  */
const User = require("../app/models/user");

const tokenValidation = async (socket, next) => {
	const authorization = await socket.handshake.headers.authorization;

	if (authorization == undefined || authorization == "undefined") {
		next(new SocketMissingTokenError(authorization));
		return;
	}

	/* token validation */
	const token = authorization.split(" ")[1];

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
		/* token expired */
		if (err) {
            throw new SocketExpireTokendError();
        }

		/* token decode */
		let user = await User.findOne({ _id: decoded.UserInfo.id });

        /* no user */
		if (!user) throw new DocumentNotFoundError();

        /* attach user */
        socket.user = user;
       
        next();
	});

};

module.exports = {
	tokenValidation,
};
