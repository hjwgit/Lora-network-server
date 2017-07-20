var Log = require('./log');
var MacCommand = require('./macCommand');

function MacPayload() {

  // ---------------------------------------------------
  // |               |            |                    |
  // | FHDR(7 ~ 22B) |  FPort(1B) | FRMPayload(0 ~ NB) |
  // |               |            |                    |
  // ---------------------------------------------------
  //       | |
  //       | |
  //      \   /
  //       \ /
  // --------------------------------------------------------------------
  // |               |              |                |                  |
  // |  DevAddr(4B)  |   FCtrl(1B)  |  FCnt(2B->4B)  |  FOpts(0 ~ 15B)  |
  // |               |              |                |                  |
  // --------------------------------------------------------------------
  //				  	        	 | |
  // 				           		 | |
  // 			      	    		\   /
  // 			      			     \ /
  // ---------------------------------------------------------------
  // |       |              |       |            |                 |
  // |  ADR  |   ADRACKReq  |  ACK  |  FPending  |  FOptsLen(3-0)  |
  // |       |              |       |            |                 |
  // ---------------------------------------------------------------
  this.rawMacpl = {};
  this.log = new Log();

}
/**
 * generate downlink macpayload
 * @param devaddr, adr, adrackreq, ack, fpending, foptslen, fcnt, fport, ori_data
 * @return
 */

MacPayload.prototype.setall = function (msgtype, macpayload, log) {
  log.info('<----MACPAYLOAD_SETALL---->');
  try {
    var rawMacpl = {
      'isUplink': true,
      'DevAddr': null,
      'FCtrl': null,
      'ADR': 0,
      'ADRACKReq': 0,
      'ACK': 0,
      'FOptsLen': 0,
      'FCnt': null,
      'FOpts': null,
      'FPort': null,
      'FRMPayload': null,
      'hasCmd': false,
      'cmd': null,
    };
    if (msgtype === 2 || msgtype === 4) {
      rawMacpl.isUplink = true;
    } else if (msgtype === 3 || msgtype === 5) {
      rawMacpl.isUplink = false;
    }

    if (macpayload.length < 7) {
      throw new Error('At least 7 bytes needed to decode FHDR');
    }

    // DeVAddr (Little Endian)
    rawMacpl.DevAddr = new Buffer(4);
    for (var i = 0; i < 4; i++) {
      rawMacpl.DevAddr[i] = macpayload.slice(0, 4)[3 - i];
    }

    log.info('DevAddr:    ' + rawMacpl.DevAddr[0].toString(16) +
      ':' + rawMacpl.DevAddr[1].toString(16) +
      ':' + rawMacpl.DevAddr[2].toString(16) +
      ':' + rawMacpl.DevAddr[3].toString(16));

    // FCtrl
    rawMacpl.FCtrl = new Buffer(1);
    rawMacpl.FCtrl[0] = macpayload[4];
    var FCtrl = macpayload[4].toString(10);
    rawMacpl.ADR = FCtrl >> 7;
    rawMacpl.ADRACKReq = (FCtrl & 64) >> 6;
    rawMacpl.ACK = (FCtrl & 32) >> 5;
    rawMacpl.FOptsLen = FCtrl & 15;

    log.info('ADR:         ' + rawMacpl.ADR);
    log.info('ADRACKReq:   ' + rawMacpl.ADRACKReq);
    log.info('ACK:         ' + rawMacpl.ACK);
    log.info('FOptsLen:    ' + rawMacpl.FOptsLen);

    if (macpayload.length < 7 + rawMacpl.FOptsLen) {
      throw new Error('not enough bytes to decode FHDR');
    }

    // FCnt (Little Endian and 4 Bytes)
    rawMacpl.FCnt = new Buffer(4);
    rawMacpl.FCnt[0] = 0x00;
    rawMacpl.FCnt[1] = 0x00;
    rawMacpl.FCnt[2] = macpayload.slice(5, 7)[1];
    rawMacpl.FCnt[3] = macpayload.slice(5, 7)[0];
    log.info('FCnt:        ' +
      rawMacpl.FCnt[0] + ' ' +
      rawMacpl.FCnt[1] + ' ' +
      rawMacpl.FCnt[2] + ' ' +
      rawMacpl.FCnt[3]);

    // FOpts : length of FOpts is up to FOptsLen
    if (rawMacpl.FOptsLen > 0) {
      rawMacpl.hasCmd = true;
      rawMacpl.FOpts = macpayload.slice(7, 7 + rawMacpl.FOptsLen);
      var cmd = new MacCommand();
      cmd.setall(rawMacpl.FOpts, log);
      rawMacpl.cmd = cmd;
    }

    // FPort
    if (macpayload.length > 7 + rawMacpl.FOptsLen) {
      rawMacpl.FPort = macpayload.slice(7 + rawMacpl.FOptsLen, 7 + rawMacpl.FOptsLen + 1)
        .toString('hex');
    }

    log.info('FPort:' + rawMacpl.FPort);

    if (macpayload.length > 7 + rawMacpl.FOptsLen + 1) {
      if (rawMacpl.FOptsLen > 0) {
        if (rawMacpl.FPort !== null && rawMacpl.FPort === '00') {
          throw new Error('FPort must be 0 when FOpts are set');
        }

      } else if (rawMacpl.FPort === '00') {
        rawMacpl.hasCmd = true;
      }

      rawMacpl.FRMPayload = macpayload.slice(7 + rawMacpl.FOptsLen + 1);
    }

    log.info('FRMPayload:   ' + rawMacpl.FRMPayload);
    this.rawMacpl = rawMacpl;
    log.info('<----MACPAYLOAD_SETALL_END---->');
    return true;

  } catch (err) {
    log.error(err).end();
  }
};

/**
 * generate downlink macpayload
 * @param devaddr, fctrl, fcnt, fport, data, key
 * @return macpl
 */
MacPayload.prototype.generateDownlink = function (devaddr, fctrl, fcnt, fopts, fp, data, key, log) {

  log.info('<----MACPAYLOAD_GENERATEDOWNLINK---->');
  log.info(devaddr);
  log.info(fctrl.adr);
  log.info(fctrl.adrackreq);
  log.info(fctrl.ack);
  log.info(fctrl.fpending);
  log.info(fctrl.foptslen);
  log.info(fcnt);
  log.info(fopts);
  log.info(fp);
  log.info('framepayload : ' + data.toString('hex'));
  log.info(key);

  var rawMacpl = {};
  rawMacpl.isUplink = false;

  // DevAddr : can be set directly
  rawMacpl.DevAddr = new Buffer(4);
  for (var i = 0; i < 4; i++) {
    rawMacpl.DevAddr[i] = devaddr[i];
  }

  // FCtrl
  rawMacpl.ADR = fctrl.adr;
  rawMacpl.ADRACKReq = fctrl.adrackreq;
  rawMacpl.ACK = fctrl.ack;
  rawMacpl.FPending = fctrl.fpending;
  rawMacpl.FOptsLen = fctrl.foptslen;
  rawMacpl.FCtrl = new Buffer(1);
  rawMacpl.FCtrl.writeUInt8((fctrl.adr << 7) + (fctrl.adrackreq << 6) +
    (fctrl.ack << 5) + (fctrl.fpending << 4) + (fctrl.foptslen));

  // FCnt
  rawMacpl.FCnt = new Buffer(4);
  rawMacpl.FCnt[0] = 0x00;
  rawMacpl.FCnt[1] = 0x00;
  rawMacpl.FCnt[2] = fcnt >> 8;
  rawMacpl.FCnt[3] = fcnt % 256;

  //log.info(rawMacpl.FCnt);

  // FOpts
  if (fctrl.foptslen > 0) {
    rawMacpl.FOpts = fopts;
  } else {
    rawMacpl.FOpts = null;
  }

  // FPort
  rawMacpl.FPort = fp;

  // FRMPayload
  rawMacpl.FRMPayload = this.encryptFRMPayload(key,
    false,
    rawMacpl.DevAddr,
    rawMacpl.FCnt,
    data,
    log);

  this.rawMacpl = rawMacpl;

  //concat MACPayload by DevAddr | FCtrl | FCnt | FOpts | FPort | FRMPayload
  var macplLen = 4 + 1 + 2;
  var macpl = new Buffer(macplLen);
  for (var j = 0; j < 4; j++) {
    macpl[j] = rawMacpl.DevAddr[3 - j]; // Little Endian
  }

  macpl[4] = rawMacpl.FCtrl[0];
  macpl[5] = rawMacpl.FCnt[3];
  macpl[6] = rawMacpl.FCnt[2];
  if (fctrl.foptslen > 0) {
    macpl = Buffer.concat([macpl, rawMacpl.FOpts]);
  }

  macpl = Buffer.concat([macpl, rawMacpl.FPort, rawMacpl.FRMPayload]);

  log.info('downlink macpld buffer');
  log.info(macpl);
  log.info('<----MACPAYLOAD_GENERATEDOWNLINK_END---->');

  return macpl;
};

/**
 * encrypt or decrypt the data using aes128 algorithm
 * @param key, flag, devaddr, fcnt, data
 * @return encrypted or decrypted framepayload
 */
MacPayload.prototype.encryptFRMPayload = function (key, flag, devaddr, fcnt, data, log) {
  log.info('<----MACPAYLOAD_ENCRYPT---->');
  var i;
  var j;
  var k;
  var crypto = require('crypto');
  var iv = '';
  var cipher = crypto.createCipheriv('aes-128-ecb', key, iv);

  var data16 = new Buffer('');
  var len = data.length;
  if ((len % 16) !== 0) { // the length of data must be a multiple of 16
    var pad = new Buffer(16 - (len % 16));
    for (i = 0; i < 16 - (len % 16); i++) {
      pad[i] = 0x00;
    }

    data16 = Buffer.concat([data, pad]);
  } else {
    data16 = data;
  }

  //log.info('------------------------key------------------------');
  //log.info(key);
  //log.info('------------------------data------------------------');
  //log.info(data);
  // log.info('------------------------data16------------------------');
  // log.info(data16);

  // make a sequence of blocks Ai
  // -----------------------------------------------------------------
  // |      |         |                  |         |      |      |   |
  // |   1  |    4    |        1         |    4    |   4  |   1  | 1 |
  // |      |         |                  |         |      |      |   |
  // -----------------------------------------------------------------
  // |      |         |                  |         |      |      |   |
  // | 0x01 |  0x00*4 | Dir(Uplink 0x00) | DevAddr | FCnt | 0x00 | i |
  // |      |         |                  |         |      |      |   |
  // -----------------------------------------------------------------
  var blockA = new Buffer(16);
  var blockS = new Buffer(16);

  blockA[0] = 0x01;

  for (i = 1; i < 5; i++) {
    blockA[i] = 0x00;
  }

  // 0 for uplink, 1 for downlink
  blockA[5] = flag ? 0x00 : 0x01;

  // DevAddr : Little Endian
  for (j = 0; j < 4; j++) {
    blockA[6 + j] = devaddr[3 - j];
  }

  // FCnt : Little Endian
  for (j = 0; j < 4; j++) {
    blockA[10 + j] = fcnt[3 - j];
  }

  blockA[14] = 0x00;

  for (i = 0; i < len / 16; i++) {
    blockA[15] = (i + 1) & 0xFF;

    // aes128_encrypt
    blockS = cipher.update(blockA, 'binary');

    for (k = 0; k < blockS.length; k++) {
      data16[16 * i + k] = data16[16 * i + k] ^ blockS[k];
    }

    // log.info('------------------------blockA------------------------');
    // log.info(blockA);
    // log.info('------------------------blockS------------------------');
    // log.info(blockS);

  }

  log.info('<----MACPAYLOAD_ENCRYPT_END---->');

  return data16.slice(0, len);
};

/**
 * decryptFRMPayload
 * @param key : NwkSKey or AppSKey
 * @return macpl : decrypted FRMPayload
 */
MacPayload.prototype.decryptFRMPayload = function (key, log) {
  var _this = this;

  log.info('<----MACPAYLOAD_DECRYPT---->');
  var macpl = _this.encryptFRMPayload(key, _this.rawMacpl.isUplink,
    _this.rawMacpl.DevAddr, _this.rawMacpl.FCnt, _this.rawMacpl.FRMPayload, log);

  if (_this.rawMacpl.hasCmd === true && _this.rawMacpl.FPort === '00') {
    log.info('has cmd in frame pld.');
    var cmd = new MacCommand();
    cmd.setall(macpl, log);
    _this.rawMacpl.cmd = cmd;
  }

  log.info('<----MACPAYLOAD_DECRYPT_END---->');

  return macpl;
};

/**
 * calculateMIC
 * @param key : NwkSKey or AppKey
          msg : MHDR | FHDR | FPort | FRMPayload
 * @return MIC
 */
MacPayload.prototype.calculateMIC = function (key, msg, log) {
  log.info('<----MACPAYLOAD_CALCULATEMIC---->');

  var aesCmac = require('node-aes-cmac').aesCmac;

  var blockB = new Buffer(16);
  blockB[0] = 0x49;

  for (var i = 1; i < 5; i++) {
    blockB[i] = 0x00;
  }

  // 0 for uplink, 1 for downlink
  blockB[5] = this.rawMacpl.isUplink ? 0x00 : 0x01;

  // DevAddr : Little Endian
  for (var j = 0; j < 4; j++) {
    blockB[6 + j] = this.rawMacpl.DevAddr[3 - j];

    // log.info(blockB[6+j]);
  }

  // FCnt : Little Endian
  for (var k = 0; k < 4; k++) {
    blockB[10 + k] = this.rawMacpl.FCnt[3 - k];

    //log.info(blockB[10+j]);
  }

  blockB[14] = 0x00;

  blockB[15] = msg.length & 0xFF;

  //log.info('------------------------blockB------------------------');
  //log.info(blockB);

  var concat = Buffer.concat([blockB, msg]);

  //log.info('------------------------concat------------------------');
  //log.info(concat);
  //log.info(key);

  // aes128_cmac(NwkSKey, Bo|msg)
  var options = { returnAsBuffer: true };
  var	cmac = aesCmac(key, concat, options);

  log.info('MIC');
  log.info(cmac.slice(0, 4));
  log.info('<----MACPAYLOAD_CALCULATEMIC_END---->');

  return cmac.slice(0, 4);
};

/**
 * deduplicate
 * @param msg : FRMPayload
 * @return re : value of md5sum
 */
MacPayload.prototype.deduplicate = function (msg, log) {
  log.info('<----MACPAYLOAD_DEDUPLICATE---->');
  var crypto = require('crypto');
  var md5 = crypto.createHash('md5');
  md5.update(msg);
  var re = md5.digest('hex');
  log.info('md5sum_value : ' + re);
  log.info('<----MACPAYLOAD_DEDUPLICATE_END---->');

  return re;
};

module.exports = MacPayload;
