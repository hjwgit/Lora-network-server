var Log = require('./log');

function MacCommand() {

  this.cid = 0x00;
  this.pld = {};
  this.cmdBuf = null;
  this.isReq = false;
}

MacCommand.prototype.setall = function (msg, log) {
  var _this = this;
  log.info('<----MACCOMMAND_SETALL---->');
  try {
    if (msg.length <= 0) {
      throw new Error('At least 1 byte needed to decode cmd.');
    }

    var pld = {};
    var status;
    var tmp;
    _this.cmdBuf = msg;
    _this.cid = msg[0];
    switch (_this.cid) {
      case 0x02: /* LinkCheckReq *//* has no payload */
        _this.isReq = true;
        log.info('cid : 0x02 LinkCheck');
        break;
      case 0x03: /* LinkADRAns */
        log.info('cid : 0x03 Link ADR Ans');
        status = msg[1].toString(10);
        tmp = {
          powerAck: (status & 4) >> 2,
          dataRateAck: (status & 2) >> 1,
          channelMaskAck: status & 1,
        };
        pld.status = tmp;
        break;
      case 0x04: /* DutyCycleAns *//* has no payload */
        log.info('cid : 0x04 DutyCycleAns');
        break;
      case 0x05: /* RXParamSetupReq */
        log.info('cid : 0x05 RxParamSetupAns');
        status = msg[1].toString(10);
        tmp = {
          rxOnedrOffsetAck: (status & 4) >> 2,
          rxTwoDtrtAck: (status & 2) >> 1,
          channelAck: status & 1,
        };
        pld.status = tmp;
        break;
      case 0x06: /* DevStatusAns */
        log.info('cid : 0x06 Dev Status Ans');
        var complement = (msg[2] & 0x3F).toString(10);
        if (complement >= 32) { // < 0
          complement = ~(msg[2] & 0x1F);
        }

        pld = {
          battery: msg[1].toString(10),
          margin: complement, // signed integer from -32 to 31
        };
        break;
      case 0x07: /* NewChannelAns */
        log.info('cid : 0x07 New Channel Ans');
        status = msg[1].toString(10);
        tmp = {
          dataRateRangeOk: (status & 2) >> 1,
          channelFreqOk: status & 1,
        };
        pld.status = tmp;
        break;
      case 0x08: /* RXTimingSetupAns *//* has no payload */
        log.info('cid : 0x08 RX Timing Setup Ans');
        break;
      default: /* 0x80 ~ 0xFF Proprietary*/
        log.info('CID : ' + _this.cid);
        break;
    }
    _this.pld = pld;
    log.info('pld');
    log.info(pld);
    log.info('<----MACCOMMAND_SETALL_END---->');
  } catch (err) {
    log.error(err).end();
  }
};

MacCommand.prototype.generateDlk = function (cid, pld, log) {
  var _this = this;
  log.info('<----MACCOMMAND_DOWNLINK---->');
  _this.cid = cid;
  _this.pld = pld;
  var res = new Buffer(1);
  res[0] = cid;// e.g. cid = 0x02

  switch (_this.cid) {
    case 0x02: /* LinkCheckAns */
      _this.isReq = true;
      var ans = new Buffer(2);
      ans[0] = pld.Margin;
      ans[1] = pld.GwCnt; // Get from DB ?
      res = Buffer.concat([res, ans]);
      log.info(res);
      break;

      // May no need to generate dlk manually
      // Just get mqtt msg and set framepld
    case 0x03: /* LinkADRReq */
      break;
    case 0x04: /* DutyCycleReq */
      break;
    case 0x05: /* RXParamSetupReq */
      break;
    case 0x06: /* DevStatusReq */
      break;
    case 0x07: /* NewChannelReq */
      break;
    case 0x08: /* RXTimingSetupReq */
      break;
    default: /* 0x80 ~ 0xFF Proprietary*/
      break;
  }
  log.info('response');
  log.info(res);
  log.info('<----MACCOMMAND_DOWNLINK_END---->');
  return res.toString('hex');
};

module.exports = MacCommand;
