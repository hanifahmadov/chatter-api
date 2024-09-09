/* eslint-disable */
// First, we'll create some custom error types by extending `Error.prototype`
// This is simplest with ES6 class syntax. We'll set `name` and `message` in
// the constructor method of each custom error type to match the pattern that
// Express and Mongoose use for custom errors.

class OwnershipError extends Error {
	constructor() {
		super();
		this.name = "OwnershipError";
		this.message = "The provided token does not match the owner of this document";
	}
}

class DocumentNotFoundError extends Error {
	constructor() {
		super();
		this.name = "DocumentNotFoundError";
		this.message = "The provided ID doesn't match any documents";
	}
}

class BadParamsError extends Error {
	constructor() {
		super();
		this.name = "BadParamsError";
		this.message = "A required parameter was omitted or invalid. a) Passwords dont match!";
	}
}

class BadCredentialsError extends Error {
	constructor() {
		super();
		this.name = "BadCredentialsError";
		this.message = "No user founded in the DB, the provided username or password is incorrect";
	}
}

class DocumentAlreadyExist extends Error {
	constructor() {
		super();
		this.name = "DocumentAlreadyExist";
		this.message = "This email is founded in the database, duplicate hey error!";
		this.statusCode = 11000;
	}
}

class EmailValidationError extends Error {
	constructor() {
		super();
		this.name = "EmailValidationError";
		this.message = "The email doesnt contain domain name, (.com, .net .etc)";
	}
}

class SocketMissingTokenError extends Error {
	constructor(token) {
		super();
		this.name = "SocketMissingTokenError";
		this.message = "Socket token is not provided. \nProvided token :: " + token;
	}
}

class SocketExpireTokendError extends Error {
	constructor(token) {
		super();
		console.log(token);
		this.name = "SocketExpireTokendError";
		this.message = "Socket token is expired.";
	}
}
class BadMimetypeError extends Error {
	constructor(token) {
		super();
		this.name = "BadMimetypeError";
		this.message = "The file extension is not allowed by > private message multer.js filetype";
	}
}

const requireOwnership = (requestObject, resource) => {
	// `requestObject.user` will be defined in any route that uses `requireToken`
	// `requireToken` MUST be passed to the route as a second argument
	const owner = resource.owner._id ? resource.owner._id : resource.owner;
	//  check if the resource.owner is an object in case populate is being used
	//  if it is, use the `_id` property and if not, just use its value
	if (!requestObject.user._id.equals(owner)) {
		throw new OwnershipError();
	}

	return resource;
};

// return 404
const handle404 = (record) => {
	if (!record) {
		throw new DocumentNotFoundError();
	} else {
		return record;
	}
};

module.exports = {
	DocumentNotFoundError,
	requireOwnership,
	handle404,
	BadParamsError,
	BadCredentialsError,
	SocketMissingTokenError,
	SocketExpireTokendError,
	DocumentAlreadyExist,
	EmailValidationError,
	BadMimetypeError,
};
