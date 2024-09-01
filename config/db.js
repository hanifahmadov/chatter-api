/* eslint-disable */
"use strict";
const currentDB = process.env.LOCAL_HOST_DB == "true" ? process.env.MONGO_DB_DEVELOPMENT : process.env.MONGO_DB_PRODUCTION;
module.exports = currentDB;
