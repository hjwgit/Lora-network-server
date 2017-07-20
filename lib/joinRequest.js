var Log = require('./log');

function JoinRequest() {

  // -------------------------------------------------
  // |              |               |                |
  // |  AppEUI(8B)  |   DevEUI(8B)  |  DevNonce(2B)  |
  // |              |               |                |
  // -------------------------------------------------

  this.rawMacpl = {};
  this.log = new Log();

}

JoinRequest.prototype.setall = function (macpayload, log) {
  log.info('<----JOINREQUEST_SETALL---->');
  try {
    var rawMacpl = {
      'AppEUI': null,
      'DevEUI': null,
      'DevNonce': null,
    };

    if (macpayload.length !== 18) {
      throw new Error('Invalid MAC payload. 18 bytes of data are expected');
    }

    // Little Endian
    // example :
    // var tmp = new Buffer(4);
    // tmp.writeInt16LE(0x5463,2);
    // tmp.writeInt16LE(0x0400,0);
    // log.info('tmp:  ' + tmp[0].toString(16) + ':' +
    // tmp[1].toString(16) + ':' + tmp[2].toString(16) + ':' + tmp[3].toString(16));
    // print 00 04 63 54
    // AppEUI
    rawMacpl.AppEUI = new Buffer(8);
    for (var i = 0; i < 8; i++) {
      rawMacpl.AppEUI[i] = macpayload.slice(0, 8)[7 - i];
    }

    // DevEUI
    rawMacpl.DevEUI = new Buffer(8);
    for (var j = 0; j < 8; j++) {
      rawMacpl.DevEUI[j] = macpayload.slice(8, 16)[7 - j];
    }

    // DevNonce
    rawMacpl.DevNonce = new Buffer(2);
    rawMacpl.DevNonce[0] = macpayload[17];
    rawMacpl.DevNonce[1] = macpayload[16];

    log.info('AppEUI:  ' +
      rawMacpl.AppEUI[0].toString(16) + ':' +
      rawMacpl.AppEUI[1].toString(16) + ':' +
      rawMacpl.AppEUI[2].toString(16) + ':' +
      rawMacpl.AppEUI[3].toString(16) + ':' +
      rawMacpl.AppEUI[4].toString(16) + ':' +
      rawMacpl.AppEUI[5].toString(16) + ':' +
      rawMacpl.AppEUI[6].toString(16) + ':' +
      rawMacpl.AppEUI[7].toString(16));
    log.info('DevEUI:  ' +
      rawMacpl.DevEUI[0].toString(16) + ':' +
      rawMacpl.DevEUI[1].toString(16) + ':' +
      rawMacpl.DevEUI[2].toString(16) + ':' +
      rawMacpl.DevEUI[3].toString(16) + ':' +
      rawMacpl.DevEUI[4].toString(16) + ':' +
      rawMacpl.DevEUI[5].toString(16) + ':' +
      rawMacpl.DevEUI[6].toString(16) + ':' +
      rawMacpl.DevEUI[7].toString(16));
    log.info('DevNonce ' +
      rawMacpl.DevNonce[0].toString(16) + ':' +
      rawMacpl.DevNonce[1].toString(16));
    this.rawMacpl = rawMacpl;
    log.info('<----JOINREQUEST_SETALL_END---->');
    return true;

  } catch (err) {
    log.error(err).end();
  }
};

JoinRequest.prototype.calculateMIC = function (key, mhdr, log) {
  log.info('<----JOINREQUEST_CALCULATEMIC---->');

  var aesCmac = require('node-aes-cmac').aesCmac;

  var pl = this.rawMacpl;
  var concat = new Buffer(19);
  concat[0] = mhdr[0];

  // AppEUI : little endian
  for (var j = 0; j < 8; j++) {
    concat[1 + j] = pl.AppEUI[7 - j];
  }

  // DevEUI : little endian
  for (var k = 0; k < 8; k++) {
    concat[9 + k] = pl.DevEUI[7 - k];
  }

  // DevNonce : little endian
  concat[17] = pl.DevNonce[1];
  concat[18] = pl.DevNonce[0];

  log.info('------------------------concat------------------------');
  log.info(concat);

  // aes128_cmac(AppKey, MHDR|AppEUI|DevEUI|DevNonce)
  var options = { returnAsBuffer: true };
  var	cmac = aesCmac(key, concat, options);

  // log.info('------------------------cmac------------------------');
  // log.info(cmac);
  log.info('<----JOINREQUEST_CALCULATEMIC_END---->');

  return cmac.slice(0, 4);
};

module.exports = JoinRequest;
