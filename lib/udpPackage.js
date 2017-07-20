var moment = require('moment');
var _ = require('lodash');
var CustomError = require('./customError');

function UdpPackage(data, log) {
  var _this = this;

  this.log = log;
  if (Buffer.isBuffer(data)) {
    this.rawData = data;//raw data get from udp
    this.package = {};
  } else if (typeof data === 'object') {
    this.package = data;
  } else {
    //FIXME dont konw how to do this now
    this.rawData = new Buffer(1);
  }

  this.isValidate = false;//whether the comming message is validate
  this.validIdentifiers = {
    uplink: ['0', '2', '5'],
    downlink: ['1', '3', '4'],
  };//valid protocol identifiers
  this.validProtocolVersions = ['1'];

}

/**add a new function to its prototype
 * @param name function name
 * @param func function logic
 */
UdpPackage.prototype.method = function (name, func) {

  var _this = this;
  _this.prototype[name] = func;
  return _this;
};

/** unpack the raw data and fill the package with it
 *
 */
UdpPackage.prototype.unpack = function (sqlConn) {
  var _this = this;
  var rawData = this.rawData;
  var log = this.log;

  log.info('<----UNPACK_UDP_PACKAGE---->');

  try {

    var size = rawData.length;
    var package = {};
    if (size < 12) {
      throw new CustomError('INVALID_UDP_RAW_DATA_FORMAT_ERROR');
    }

    package.version = rawData[0].toString(16);
    package.token = rawData.slice(1, 3);
    package.identifier = rawData[3].toString(16);

    if (package.version !== '1' && package.version !== '2') {
      throw new CustomError('INVALID_UDP_PROTOCOL_VERSION_ERROR');
    }

    // only PUSH_DATA , PULL_DATA accepted
    if (package.identifier !== '0' && package.identifier !== '2' && package.identifier !== '5') {
      throw new CustomError('INVALID_UDP_PROTOCOL_IDENTIFIER_ERROR');
    }

    package.gatewayID = rawData.slice(4, 12);

    if (package.identifier === '0') {
      var payload = rawData.slice(12);
      package.payload = JSON.parse(payload.toString());
    }

    log.info('Version : ' + package.version);
    if (package.identifier === '0') {
      log.info('Identifier : PUSH_DATA');
    } else if (package.identifier === '2') {
      log.info('Identifier : PULL_DATA');
    }

    log.info('GatewayID : ' + package.gatewayID.toString('hex'));
    log.info(package.payload);

    this.package = package;

  } catch (err) {
    log.error(err).end();
    return false;
  }

  return true;
};

//get the ack message
UdpPackage.prototype.getAck = function () {

  var ack = _.take(this.rawData, 4);//now ack is a array
  ack[3] = ack[3] === 0x00 ? 0x01 : 0x04;

  return new Buffer(ack);
};

/** pack the raw data with the package message
 *
 */
UdpPackage.prototype.pack = function () {
  var _this = this;
  var rawData = new Buffer(4);
  var log = this.log;
  var package = this.package;
  var validProtocolVersions = this.validProtocolVersions;
  var validIdentifiers = this.validIdentifiers.downlink;

  log.info('pack udp package');

  try {

    log.info(package);
    if (typeof package.identifier  === 'undefined' ||
      typeof package.version === 'undefined' ||
      typeof package.token === 'undefined') {
      throw new CustomError('INVALID_UDP_PACKAGE_DATA_FORMAT_ERROR');
    }

    if (validProtocolVersions.indexOf(package.version) === -1) {
      throw new CustomError('INVALID_UDP_PROTOCOL_VERSION_ERROR');
    }

    if (!Buffer.isBuffer(package.token) || package.token.length !== 2) {
      throw new CustomError('INVALID_UDP_PROTOCOL_TOKEN_ERROR');
    }

    if (validIdentifiers.indexOf(package.identifier) === -1) {
      throw new CustomError('INVALID_UDP_PROTOCOL_IDENTIFIER_ERROR');
    }

    rawData[0] = parseInt(package.version);
    rawData[1] = package.token[0];
    rawData[2] = package.token[1];
    rawData[3] = parseInt(package.identifier);

    if (package.identifier === '3') {
      var payload = package.payload;
      var payloadBuffer = new Buffer(JSON.stringify(payload));
      rawData = Buffer.concat([rawData, payloadBuffer]);
    }

    log.info(rawData);
    this.rawData = rawData;

  } catch (err) {
    log.error(err).end();
    return false;
  }

  return true;
};

module.exports = UdpPackage;
