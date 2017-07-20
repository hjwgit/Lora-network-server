var defines = require('./defines');
var ERROR = defines.ERROR;

function CustomError(value) {
  if (typeof value === 'string' && ERROR[value]) {
    this.message = ERROR[value].message;
    this.code = ERROR[value].code;
  } else if (typeof value === 'object') {
    this.code = value.code;
    this.message = value.message;
  }

  // default values
  this.code = this.code || ERROR.INTERNAL_SERVER_ERROR.code;
  this.message = this.message || ERROR.INTERNAL_SERVER_ERROR.message;

  Error.captureStackTrace(this, CustomError);
}

CustomError.prototype = Object.create(Error.prototype);
CustomError.prototype.constructor = CustomError;

module.exports = CustomError;
