/* eslint-disable */
"use strict";
const currentDB = Boolean(process.env.LOCAL_HOST_DB) ? process.env.MONGO_DB_DEVELOPMENT : process.env.MONGO_DB_PRODUCTION;
module.exports = currentDB;
