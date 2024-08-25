const mongoose = require("mongoose");
const { Schema } = mongoose;

const reactionTypes = ["heart", "smile", "dislike", "wow", "sad", "angry"];

const LikeSchema = new Schema(
	{
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User", // Assuming you have a User model
			required: true,
		},

		reaction: {
			type: String,
			enum: reactionTypes,
			required: true,
		},

		rootPostId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Post",
			default: undefined,
		},

		rootCommentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment",
			default: undefined,
		},

		parentCommentId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Comment",
			default: undefined,
		},
	},
	{ timestamps: true }
);

const Like = mongoose.model("Like", LikeSchema);

module.exports = Like;
