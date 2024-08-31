/* eslint-disable */
var fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require('uuid');


const { BadMimetypeError } = require("../../lib/custom_errors");

// Storage
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const rootDir = path.dirname(require.main.filename);
		/* the file full path */
		const dir = rootDir + "/public/messages/";
        /* return the path */
		cb(null, dir);
	},

	filename: (req, file, cb) => {

		/* get the file extendion ex: jpg */
		const ext = file.mimetype.split("/")[1];

        /* make custom name for the file */
		const filename = uuidv4() + "." + ext;

		/* attach the filename into req object */
		req.imagename = filename

	
		/* return filename */
		cb(null, filename);
	},

	limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

const fileFilter = (req, file, cb) => {

	let allowTypes = [
		"image/jpg",
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/avif",
		"image/webp",

		"image.jpg",
		"image.jpeg",
		"image.png",
		"image.gif",
		"image.avif",
		"image.webp",
	];

	if (!allowTypes.includes(file.mimetype)) {
		return cb(new BadMimetypeError(), false);
	}

    /* return valid types */
	return cb(null, true);
};

const message_multer = multer({ storage, fileFilter });
module.exports = message_multer;
