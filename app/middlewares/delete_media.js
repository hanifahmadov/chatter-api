/* eslint-disable */
var fs = require("fs");
const path = require("path");
const { BadCredentialsError } = require("../../lib/custom_errors");

const delete_media = function (req, res, next) {
	const { postMedia } = req.body;
	
	/* there is no media attached */
	if (!postMedia) {
		req.post_media_deleted = true
		return next();
	}

	const array = postMedia.split("/");
	const imageName = array[array.length - 1];

	const rootDir = path.dirname(require.main.filename);
	const dir = rootDir + "/public/posts/";

	try {
		const existingFiles = fs.readdirSync(dir);

		/* iterate all uplaoded image file and delete the image which name start with user email */
		existingFiles.forEach((file) => {
			if (file.startsWith(imageName)) {
				fs.unlinkSync(dir + file);
			}
		});
	} catch (err) {
		console.error("Error creating directory:", err);
		return cb(new BadCredentialsError(), false);
	}

	req.post_media_deleted = true
	next();
};

module.exports = delete_media;
