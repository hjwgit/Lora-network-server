var JoinRequest = require('./joinRequest');
var MacPayload = require('./macPayload');
var MetaData = require('./metaData');
var _ = require('lodash');
var Promise = require('bluebird');
var utils = require('./utils');
var Log = require('./log');

function PhyPayload() {

  this.rawPhypl = {};
  this.MACPayload = null;
  this.originalData = {};//original data from lora node
  this.metaData = null;
  this.dbGet = {};//some items from database, like NwkSKey, AppSKey, Did, ...

}

/**
 * get phypayload
 * @param rxpk
 * @return
 */
PhyPayload.prototype.getPhypayload = function (rxpk, gwmtdt, log, sqlConn, callback) {
  log.info('<----PHYPAYLOAD_GETPHYPAYLOAD---->');
  var _this = this;
  var rawPhypl;
  try {

    log.info('rxpk.data:' + rxpk.data);

    // 0.if no rxpk.data
    if (rxpk.data === undefined) {
      throw new Error('There is no data in the packet');
    }

    // 1. base64 decode
    var oriData = new Buffer(rxpk.data, 'base64');

    // 2. parse into phypayload
    // -----------------------------------------------------
    // |            |                          |           |
    // |  MHDR(1B)  |   MACPayload(1B ~ MaxB)  |  MIC(4B)  |
    // |            |                          |           |
    // -----------------------------------------------------
    rawPhypl = {
      'MHDR': null,
      'macpayloadBuffer': null,
      'MIC': null,
      'micIsvalid': true,
      'MType': 2,
      'Major': 0,
    };
    rawPhypl.MHDR = oriData.slice(0, 1);
    rawPhypl.macpayloadBuffer = oriData.slice(1, oriData.length - 4);
    rawPhypl.MIC = oriData.slice(oriData.length - 4, oriData.length);
    rawPhypl.micIsvalid = true;

    // 3. switch MessageType
    // ---------------------------------------------------
    // |                |               |                |
    // |  MType(7 ~ 5)  |   RFU(4 ~ 2)  |  Major(1 ~ 0)  |
    // |                |               |                |
    // ---------------------------------------------------
    rawPhypl.MType = (rawPhypl.MHDR[0] & 224) >> 5;

    // Major = 00 LoRaWAN R1 Version ;
    // Major = 01 ~ 11 RFU
    rawPhypl.Major = rawPhypl.MHDR[0] & 3;
    log.info('msgType:' + rawPhypl.MType);

    // 4. set metadata of rxpk
    var mtdt = new MetaData();
    mtdt.setall(rxpk, gwmtdt, log);
    _this.metaData = mtdt;

  } catch (err) {
    log.error(err).end();
    return false;
  }

  // 5. parse into macpayload
  var key;
  var mic;
  var i;
  var promiseRes;
  switch (rawPhypl.MType) {
    case 0: /* Join Request 000xxxxx */
      var joinreq = new JoinRequest();
      var appeui;
      var deveui;
      var devnonce;
      promiseRes = new Promise(function (resolve, reject) {
        if (joinreq.setall(rawPhypl.macpayloadBuffer, log)) {
          appeui = joinreq.rawMacpl.AppEUI.toString('hex');
          deveui = joinreq.rawMacpl.DevEUI.toString('hex');
          devnonce = joinreq.rawMacpl.DevNonce.toString('hex');

          // a. deduplicate
          return resolve(sqlConn.getDevNonce(devnonce));
        } else {
          return reject('Invalid Macpayload.');
        }
      })
        .then(function (res) {
          if (res === true) {
            return sqlConn.getAppInfo(appeui);
          } else {
            throw new Error('Duplicate DevNonce.');
          }

        })
        .then(function (data) {
          if (data !== null) {
            _this.dbGet.AppKey = data.AppKey;

            // when Join, use AppKey
            key = new Buffer(data.AppKey, 'hex');

            // log.info('key');
            // log.info(key);
            // a. calculate MIC
            mic = joinreq.calculateMIC(key, rawPhypl.MHDR, log);
            for (i = 0; i < mic.length; i++) {
              if (mic[i] !== rawPhypl.MIC[i]) {
                rawPhypl.micIsvalid = false;
              }
            }

            // b. get the original data from node
            if (rawPhypl.micIsvalid) {
              _this.MACPayload = joinreq;
              _this.originalData = {
                'AppEUI': joinreq.rawMacpl.AppEUI,
                'DevEUI': joinreq.rawMacpl.DevEUI,
                'DevNonce': joinreq.rawMacpl.DevNonce,
              };
              log.info('------------------------origin_data------------------------');
              log.info(_this.originalData);
              var obj = {
                DevEUI: deveui,
                Did: '',
                Passcode: '12345678',
                DevAddr: '',
                FcntUp: 0,
                FcntDown: 0,
                AppSKey: '',
                NwkSKey: '',
                AppNonce: '',
              };
              return sqlConn.upsertDevInfo(obj);
            } else {
              throw new Error('Invalid MIC.');
            }

          } else {
            throw new Error('No such App By AppEUI.');
          }

        })
        .then(function (res) {

          /* if device did not received join accept and send again,
             upsert device will fail. So do not throw error,
             and in function handleJoinaccept it will send downlink again.*/
          if (res === 'false' | res === 0) {
            throw new Error('upsert new device info failed.');
          } else {
            return sqlConn.upsertApp2DevInfo(appeui, deveui);
          }
        })
        .then(function (res) {
          if (res === 'false' | res === 0) {
            throw new Error('upsert app2device info failed.');
          } else {
            return sqlConn.upsertNonce(devnonce);
          }
        })
        .then(function (res) {
          if (!res) {
            throw new Error('upsert devnonce info failed.');
          } else {
            return res;
          }
        });

      break;

    case 2: /* Unconfirmed Data Up 010xxxxx */ // fall through

    case 4: /* Confirmed Data Up 100xxxxx */
      var dataup = new MacPayload();
      var devaddr;
      var fport;
      var pld;
      promiseRes = new Promise(function (resolve, reject) {
        if (dataup.setall(rawPhypl.MType, rawPhypl.macpayloadBuffer, log)) {
          devaddr = dataup.rawMacpl.DevAddr.toString('hex');
          fport = dataup.rawMacpl.FPort;
          pld = dataup.deduplicate(rawPhypl.macpayloadBuffer, log);  //dataup.rawMacpl.FRMPayload);

          // a. deduplicate
          return resolve(sqlConn.getDedup(pld));
        } else {
          return reject('Invalid Macpayload.');
        }
      })
        .then(function (res) {

          // if (res === true) {
          return sqlConn.getDevInfoByDevaddr(devaddr);

          //          } else {
          //           throw new Error('Duplicate FramePayload.');
          //}
        })
        .then(function (data) {
          if (data !== null) {
            _this.dbGet.NwkSKey = data.NwkSKey;
            _this.dbGet.AppSKey = data.AppSKey;
            _this.dbGet.Did = data.Did;
            _this.dbGet.FcntUp = data.FcntUp;
            _this.dbGet.FcntDown = data.FcntDown;
            _this.dbGet.DevEUI = data.DevEUI;

            // NwkSKey
            key = new Buffer(data.NwkSKey, 'hex');

            // b. calculate MIC
            mic = dataup.calculateMIC(key,
              Buffer.concat([rawPhypl.MHDR, rawPhypl.macpayloadBuffer]), log);
            for (i = 0; i < mic.length; i++) {
              if (mic[i] !== rawPhypl.MIC[i]) {
                rawPhypl.micIsvalid = false;
              }

            }

            // FPort = 0, NwkSKey ; FPort = 1 ~ 255, AppSKey
            key = new Buffer(fport === '00' ? data.NwkSKey : data.AppSKey, 'hex');

            // c. get the original data from node
            if (rawPhypl.micIsvalid) {
              _this.MACPayload = dataup;
              _this.originalData = { 'data': dataup.decryptFRMPayload(key, log) };
              log.info('------------------------origin_data------------------------');
              log.info(_this.originalData.data);
              log.info('origin_data_length :' + _this.originalData.data.length);
              return sqlConn.increaseFcnt(_this.dbGet.DevEUI, { FcntUp: 1, });
            } else {
              throw new Error('Invalid MIC!');
            }

          } else {
            throw new Error('No Such Device By DevAddr.');
          }

        })
        .then(function (res) {
          if ('dataValues' in res) {
            return sqlConn.upsertDedup(pld);
          } else {
            throw new Error('update fcntup value failed.');
          }
        })
        .then(function (res) {

          //if (!res) {
          //  throw new Error('upsert md5sum value of pld failed.');
          //} else {
          return res;

          //}
        });

      break;

      // case 1: // Join Accept 001xxxxx
      // case 3: // Unconfirmed Data Down 011xxxxx
      // case 5: // Confirmed Data Down 101xxxxx
      // case 6: // RFU 110xxxxx
      // case 7: // Proprietary 111xxxxx
    default:
      promiseRes = new Promise(function (resolve, reject) {
        return resolve(null);
      });break;
  }
  _this.rawPhypl = rawPhypl;

  return utils.functionReturn(promiseRes, callback);
};

/**
 * generate downlink phypayload
 * @param msgtype, macpayload
 * @return string
 */
PhyPayload.prototype.geneResPhypayload = function (msgtype, macpayload, macplBuf, key, mtdt, log) {

  // this macpayload is a filled payload , do not encode
  log.info('<----PHYPAYLOAD_GENERATERESPONSE---->');
  var _this = this;
  var rawPhypl = {};

  // a. MHDR
  rawPhypl.MType = msgtype;
  rawPhypl.Major = 0;
  rawPhypl.MHDR = new Buffer((msgtype << 5).toString(16), 'hex');
  var phypayloadBuf = rawPhypl.MHDR;

  // case 1 :32: Join Accept 001xxxxx
  // case 3: 96: Unconfirmed Data Down 011xxxxx	this.MType = 3
  // case 5: 160: COnfirmed Data Down 101xxxxx this.MType = 5
  // b. MACPayload
  _this.MACPayload = macpayload;
  var rawMacpl = macpayload.rawMacpl;
  if (msgtype === 1) { //joinaccept
    rawPhypl.macpayloadBuffer = macplBuf.slice(0, macplBuf.length - 4);
    rawPhypl.MIC = macplBuf.slice(macplBuf.length - 4, macplBuf.length);
  } else if (msgtype === 5 || msgtype === 3) { //confirmed data down or unconfirmed data down
    rawPhypl.macpayloadBuffer = macplBuf;

    // c. MIC (use argument macpayload to calculate MIC)
    rawPhypl.MIC = macpayload.calculateMIC(key,
      Buffer.concat([rawPhypl.MHDR, rawPhypl.macpayloadBuffer]), log);
  }

  rawPhypl.micIsvalid = true;
  _this.rawPhypl = rawPhypl;
  _this.originalData = {};
  _this.metaData = mtdt;
  phypayloadBuf = Buffer.concat([phypayloadBuf, rawPhypl.macpayloadBuffer, rawPhypl.MIC]);
  log.info('phypayloadBuf');
  log.info(phypayloadBuf);
  log.info('after base64' + phypayloadBuf.toString('base64'));
  log.info('<----PHYPAYLOAD_GENERATERESPONSE_END---->');

  return phypayloadBuf.toString('base64');
};

/**
 * calculate size of 'data'
 * @param macpayload
 * @return string
 */
PhyPayload.prototype.geneResSize = function (macpayload, flag) {

  // log.info('<----PHYPAYLOAD_RESPONSESIZE---->');
  //log.info(1 + 4 + 1 + 2 + macpayload.rawMacpl.FOptsLen +
  //1 + macpayload.rawMacpl.FRMPayload.length + 4);
  if (flag === '24') {
    return 1 + 4 + 1 + 2 + macpayload.rawMacpl.FOptsLen +
      1 + macpayload.rawMacpl.FRMPayload.length + 4;
  } else if (flag === '0') {
    if (macpayload.rawMacpl.CFList === null) {
      return 1 + 3 + 3 + 4 + 1 + 1 + 4;
    } else {
      return 1 + 3 + 3 + 4 + 1 + 1 + 16 + 4;
    }
  }

};

module.exports = PhyPayload;
