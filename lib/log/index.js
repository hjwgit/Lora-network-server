var logger = require('./logger.js')();
var moment = require('moment');
var _ = require('lodash');

function logLevelInit() {
  var _this = this;

  this.levels.forEach(function (level) {
    _this[level] = function (message) {
      if (!Array.isArray(this.logs)) {
        this.logs = [];
      }

      this.logs.push({
        level: level,
        message: message,
      });

      return this;
    };
  });

  return null;
}

function Log() {
  var _this = this;
  this.logs = [];
  this.levels = ['info', 'debug', 'verbose', 'error', 'warn'];

  //initial the allowed log levels
  logLevelInit.call(this);
}

/**print the cached logs
 */
Log.prototype.end = function () {
  this.logs.forEach(function (log) {
    //call logger's functions according to log's level
    logger[log.level](log.message);
  });

  this.logs = [];
  return this;
};

module.exports = Log;
