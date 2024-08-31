const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
	sender: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	recipient: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	}, 
	message: {
		type: String,
		required: false,
	},

	media: {
		type: String, // URL or path to the image file
		required: false, // Optional field
		default: undefined,
	},

	isRead: {
		type: Boolean,
		default: false,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	updatedAt: {
		type: Date,
	},
});

// Before saving the message, update the `updatedAt` field
messageSchema.pre("save", function (next) {
	this.updatedAt = Date.now();
	next();
});

module.exports = mongoose.model("Message", messageSchema);

