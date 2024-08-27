/* eslint-disable */
const chalk = require('chalk');

/* log incoming req type & url & body */
const requestLogger = function (req, res, next) {
  console.log(chalk.bold.green('\n===== Incoming Request =====\n'))
  console.log(chalk.white(`${new Date()}`))
  console.log(chalk.white(`${req.method} ${req.url}`))
  console.log(chalk.white(`body ${JSON.stringify(req.body)}`))
  console.log(chalk.bold.green('\n============================\n'))
  next()
}

module.exports = requestLogger
