var Log = require('./log');

function JoinAccept() {

  // ----------------------------------------------------------------------------------------
  // |              |            |             |                |             |             |
  // | AppNonce(3B) |  NetID(3B) | DevAddr(4B) | DLSettings(1B) | RxDelay(1B) | CFList(16B) |
  // |              |            |             |                |             |             |
  // ----------------------------------------------------------------------------------------
  this.rawMacpl = {};
  this.log = new Log();

}

/**
 * generate join accept
 * @param macpayload
 */
JoinAccept.prototype.generateAccept = function (appn, nid, devaddr, dls, rxd, cflist, key, log) {
  log.info('<----JOINACCEPT_GENERATEACCEPT---->');

  /*log.info(appn);
  log.info(nid);
  log.info(devaddr);
  log.info(dls);
  log.info(rxd);
  log.info(cflist);*/

  try {
    var rawMacpl = {
      AppNonce: appn,
      NetID: nid,
      DevAddr: devaddr,
      DLSettings: dls,
      RxDelay: rxd,
      CFList: cflist,
    };

    this.rawMacpl = rawMacpl;

    var msgtype = 1;
    var mhdr = new Buffer((msgtype << 5).toString(16), 'hex');
    var mic = this.calculateMIC(key, mhdr, log);
    var encryptedMsg = this.encryptMsg(key, mic, log);
    log.info('encryptedMsg');
    log.info(encryptedMsg);
    log.info('<----JOINACCEPT_GENERATEACCEPT_END---->');
    return encryptedMsg;

  } catch (err) {
    log.error(err).end();
  }

};

/**
 * encrypt msg
 * @param key : should be AppKey
 * @param mic
 * @return data : encrypted msg
 */
JoinAccept.prototype.encryptMsg = function (key, mic, log) {
  log.info('<----JOINACCEPT_ENCRYPTMSG---->');

  var pl = this.rawMacpl;
  var con = new Buffer(12);

  // AppNonce : little endian
  for (var i = 0; i < 3; i++) {
    con[0 + i] = pl.AppNonce[2 - i];
  }

  // NetID : little endian
  for (var j = 0; j < 3; j++) {
    con[3 + j] = pl.NetID[2 - j];
  }

  // DevAddr : little endian
  for (var m = 0; m < 4; m++) {
    con[6 + m]  = pl.DevAddr[3 - m];
  }

  // DLSettings
  con[10] = pl.DLSettings[0];

  // RxDelay
  con[11] = pl.RxDelay[0];

  // CFList : little endian
  if (pl.CFList !== null) {

    con = Buffer.concat([con, pl.CFList]);

    //concat[31] = 0x00;
  }

  // MIC : big endian
  con = Buffer.concat([con, mic]);

  // aes128_decrypt(AppKey, AppNonce|NetID|DevAddr|RFU|RxDelay|CFList|MIC)
  var crypto = require('crypto');
  var iv = '';
  var decipher = crypto.createDecipheriv('aes-128-ecb', key, iv);
  decipher.setAutoPadding(false);
  var data = decipher.update(con);

  //log.info('------------------------key------------------------');
  //log.info(key);
  //log.info('------------------------concat------------------------');
  //log.info(con);
  //log.info('------------------------data------------------------');
  //log.info(data);
  log.info('<----JOINACCEPT_ENCRYPTMSG_END---->');

  return data;
};

/**
 * calculateMIC
 * @param key, mhdr
 * @return MIC
 */
JoinAccept.prototype.calculateMIC = function (key, mhdr, log) {
  log.info('<----JOINACCEPT_CALCULATEMIC---->');

  var aesCmac = require('node-aes-cmac').aesCmac;

  var pl = this.rawMacpl;
  var concat = new Buffer(13);
  concat[0] = mhdr[0];

  // AppNonce : little endian
  for (var i = 0; i < 3; i++) {
    concat[1 + i] = pl.AppNonce[2 - i];
  }

  // NetID : little endian
  for (var j = 0; j < 3; j++) {
    concat[4 + j] = pl.NetID[2 - j];
  }

  // DevAddr : little endian
  for (var m = 0; m < 4; m++) {
    concat[7 + m]  = pl.DevAddr[3 - m];
  }

  // DLSettings
  concat[11] = pl.DLSettings[0];

  // RxDelay
  concat[12] = pl.RxDelay[0];

  // CFList : little endian
  if (pl.CFList !== null) {

    // TODO : CFList should be 5 frequencies. Check in node.!
    // e.g.
    // frequency a : 0x010203  --> concat[13] = 0x03  concat[14] = 0x02   concat[15] = 0x01
    concat = Buffer.concat([concat, pl.CFList]);

    //concat[28] = 0x00;
  }

  // aes128_cmac(AppKey, MHDR|AppNonce|NetID|Devaddr|RFU|RxDelay|CFList)
  var options = { returnAsBuffer: true };
  var	cmac = aesCmac(key, concat, options);

  //log.info('------------------------concat------------------------');
  //log.info(concat);
  //log.info('------------------------cmac------------------------');
  //log.info(cmac);
  log.info('<----JOINACCEPT_CALCULATEMIC_END---->');

  return cmac.slice(0, 4);
};

/**calculate NwkSKey or AppSKey
 * @param flag
 * @param devnonce
 * @return key
 */
JoinAccept.prototype.calculateKey = function (key, flag, devnonce, log) {
  log.info('<----JOINACCEPT_CALCULATEKEY---->');

  var pl = this.rawMacpl;
  var con = new Buffer(9);
  if (flag === '1') {
    con[0] = 0x01;
  } else if (flag === '2') {
    con[0] = 0x02;
  }

  // AppNonce : little endian
  for (var i = 0; i < 3; i++) {
    con[1 + i] = pl.AppNonce[2 - i];
  }

  // NetID : little endian
  for (var j = 0; j < 3; j++) {
    con[4 + j] = pl.NetID[2 - j];
  }

  // DevNonce : little endian
  con[7] = devnonce[1];
  con[8] = devnonce[0];

  var data16 = new Buffer('');
  var len = con.length;
  if ((len % 16) !== 0) { // the length of data must be a multiple of 16
    var pad = new Buffer(16 - (len % 16));
    for (i = 0; i < 16 - (len % 16); i++) {
      pad[i] = 0x00;
    }

    data16 = Buffer.concat([con, pad]);
  } else {
    data16 = con;
  }

  // log.info('------------------------key------------------------');
  // log.info(key);
  // log.info('------------------------con------------------------');
  // log.info(con);
  // log.info('------------------------data16------------------------');
  // log.info(data16);

  // NwkSKey = aes128_encrypt(AppKey, 0x01|AppNonce|NetID|DevNonce|pad16)
  // AppSKey = aes128_encrypt(AppKey, 0x02|AppNonce|NetID|DevNonce|pad16)
  var crypto = require('crypto');
  var iv = '';
  var cipher = crypto.createCipheriv('aes-128-ecb', key, iv);
  var skey = cipher.update(data16);

  //log.info('------------------------skey------------------------');
  //log.info(skey);
  log.info('<----JOINACCEPT_CALCULATEKEY_END---->');

  return skey;
};

module.exports = JoinAccept;
