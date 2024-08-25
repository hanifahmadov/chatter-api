/* eslint-disable */
"use strict";

// creating a base name for the mongodb
// const mongooseBaseName = "polarx";

// create the mongodb uri for development and test
// const database = {
// 	// set this to mongodb atlas after  .env file created
// 	development: `mongodb://localhost/${mongooseBaseName}-dev`,
// 	test: `mongodb://localhost/${mongooseBaseName}-test`,
// };

// Identify if development environment is test or development
// select DB based on whether a test file was executed before `server.js`
// const localDb = process.env.TESTENV ? database.test : database.development;

// Environment variable DB_URI will be available in
// heroku production evironment otherwise use test or development db
const currentDB = Boolean(process.env.LOCAL_HOST_DB) ? process.env.MONGO_DB_DEVELOPMENT : process.env.MONGO_DB;

module.exports = currentDB;
