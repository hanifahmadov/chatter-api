/* eslint-disable */
const passport = require("passport");
const bearer = require("passport-http-bearer");
const jwt = require("jsonwebtoken");
const User = require("../app/models/user");
const { BadCredentialsError } = require("./custom_errors");

// this strategy will grab a bearer token from the HTTP headers and then
// run the callback with the found token as `token`
const strategy = new bearer.Strategy(function (token, done) {
	/* if no token  */
	if (!token || token == "null") {
		console.log("NO TOKEN");
		return done(err);
	}

	/* verify user token */
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
		/* error */
		if (err) return done(err);

		/* get user */
		const user = await User.findOne({ _id: decoded.UserInfo.id });

		/* if no user */
		if (!user) throw new BadCredentialsError();

		return done(null, user, { scope: "all" });
	});
});

// serialize and deserialize functions are used by passport under
// the hood to determine what `req.user` should be inside routes
passport.serializeUser((user, done) => {
	console.log("PASSPORT SERIALIZER USED");
	done(null, user);
});

passport.deserializeUser((user, done) => {
	console.log("PASSPORT DE-SERIALIZER USED");
	done(null, user);
});

// register this strategy with passport
passport.use(strategy);

// create a passport middleware based on all the above configuration
module.exports = passport.initialize();
