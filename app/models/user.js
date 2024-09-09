/* eslint-disable */
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			match: [
				/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63}$/,
				"Email Validation Error: email is not matched with internal regex",
			],
		},
		hashedPassword: {
			type: String,
			required: true,
		},

		username: {
			type: String,
			sparse: true, // Allows multiple documents to have no value for the indexed field
			unique: true,
			trim: true,
		},

		role: {
			type: String,
			default: "user",
			enum: ["user", "editor", "admin"],
		},

		avatar: {
			type: String,
			required: true,
			trim: true,
		},

		blocked: {
			type: Boolean,
			default: false,
		},

		accessToken: {
			type: String,
			default: null,
			trim: true,
		},

		lastseen: {
			type: Date,
			default: null,
		},

		online: {
			type: Boolean,
			default: false,
		},

		followers: [
			{
				type: [mongoose.Schema.Types.ObjectId],
				ref: "User",
			},
		],
		followings: [
			{
				type: [mongoose.Schema.Types.ObjectId],
				ref: "User",
			},
		],

		notifications: [{}],
	},

	{
		timestamps: true,
		toObject: {
			// removes `hashedPassword` field when returns user.toObject()
			// check it out user_routes.js line 45 post sign up
			transform: (_doc, user) => {
				delete user.hashedPassword;
				return user;
			},
		},
	}
);

userSchema.pre("save", function (next) {
	// capitalize
	this.username.charAt(0).toUpperCase() + this.username.slice(1).toLowerCase();
	next();
});

module.exports = mongoose.model("User", userSchema);
