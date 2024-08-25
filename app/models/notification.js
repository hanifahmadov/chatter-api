const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
	{
		recipient: {
			type: mongoose.Schema.Types.ObjectId, // Mentioned user
			ref: "User",
			required: true,
		},
		sender: {
			type: mongoose.Schema.Types.ObjectId, // User who mentioned
			ref: "User",
		},
		comment: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment",
		},
		post: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Post",
		},

		message: {
			type: String,
			require: "false",
		},

		isRead: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("Notification", notificationSchema);
