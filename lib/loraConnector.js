var Promise = require('bluebird');
var moment = require('moment');
var _ = require('lodash');
var dgram = require('dgram');
var udpServer = dgram.createSocket('udp4');
var Log = require('./log');
var UdpPackage = require('./udpPackage');
var MqttConnector = require('./mqttConnector');
var HttpConnector = require('./httpConnector');
var SqlConnector = require('../models/index');
var PhyPayload = require('./phyPayload');
var MetaData = require('./metaData');
var MacPayload = require('./macPayload');
var JoinAccept = require('./joinAccept');
var MacCommand = require('./macCommand');
var createMQ = require('rejmq');

var Que = [];

var defaultOptions = {
  mysql: {
    database: 'lora_ns',
    username: 'root',
    password: '650915',
    dialect: 'mysql',
    host: 'localhost',
    port: '3306',
  },
  database: {
    db: 'redis',
    cluster: false,
    options: [{ host: 'localhost', port: '6379' }],
  },
  udp: {
    host: '10.3.242.233',
    port: '1700',
  },
  mqtt: {
    username: 'Ue5a54aa88162b713c98c5a503112d98',
    password: '123456',
    host: '115.28.69.224',
    port: 1883,
    protocolId: 'MQTT',
    prototocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    keepalive: 120,
    keyPath: null,
    certPath: null,
    rejectUnauthorized: false,
  },
  http: {
    did: {
      body: {
        'mac': '00000000',
        'product_key': '0e0f74a7775879619f16d313bfe00ec3',
        'passcode': '12345678',
      },
      option: {
        host: '115.28.69.224',
        port: 3000,
        path: '/v1/device_register',
        method: 'post',
        headers: {
          'content-type': 'application/json',
        },
      },
    },
    token: {
      body: {
        'grant_type': 'password',
        'client_id': 'xxx',
        'client_secret': 'xxx.xxx.xxx', // jwt
        'username': '00000000', // mac address if device_type is 'device'
        'password': '12345678',
        'device_type': 'device',
      },
      option: {
        host: '115.28.69.224',
        port: 3000,
        path: '/v1/oauth2/token',
        method: 'post',
        headers: {
          'content-type': 'application/json',
        },
      },
    },
  },
};

/** log error message
 * @param err
 * @param bytes
 */
function errHandler(err, bytes) {
  var log = new Log();
  if (err) {
    //FIXME maybe when return ack failed, we need to do something else
    log.error(err).end();
  }

}

function ipToNum(ip) {
  var num = 0;
  ip = ip.split('.');
  num = Number(ip[0]) * 256 * 256 * 256 +
    Number(ip[1]) * 256 * 256 +
    Number(ip[2]) * 256 + Number(ip[3]);
  num = num >>> 0;
  return num;
}

function numToIp(num) {
  var str;
  var tt = [];
  tt[0] = (num >>> 24) >>> 0;
  tt[1] = ((num << 8) >>> 24) >>> 0;
  tt[2] = (num << 16) >>> 24;
  tt[3] = (num << 24) >>> 24;
  str = String(tt[0]) + '.' +
    String(tt[1]) + '.' +
    String(tt[2]) + '.' +
    String(tt[3]);
  return str;
}

/** generate join accept message and get did
 * @param
 * @param
 */
function handleJoin(sqlConn, httpConn, mqttConn, phyPayload, log) {
  log.info('<----HANDLEJOIN---->');

  var msgtype = 1;
  var joinpl = phyPayload.MACPayload.rawMacpl;
  var mtdt = phyPayload.metaData;

  var appeui = joinpl.AppEUI.toString('hex');
  var deveui = joinpl.DevEUI.toString('hex');
  var devnonce = joinpl.DevNonce;
  log.info('appeui : ' + appeui + '/ deveui : ' + deveui);

  var netid = '000000';
  var productkey = '';
  var appkey = '';

  var appnonce = '111111';
  var devaddr = '02046354';
  var dls = '30'; // can be set by NC
  var rxdelay = '00';
  var did = '';

  // CFList should be 5 frequencies. Buffer size 16B.
  // e.g. frequency 0x010203  --> concat[12] = 0x03  concat[13] = 0x02   concat[14] = 0x01
  // concat15] = 0x00; --> RFU
  var cflist = null;
  var body = {};
  var tx;

  var promiseReturn;
  promiseReturn = sqlConn.getAppInfo(appeui)
    .then(function (appinfo) {
      if (appinfo !== null) {
        productkey = appinfo.ProductKey;
        netid = appinfo.NetID;
        appkey = new Buffer(appinfo.AppKey, 'hex');
        return sqlConn.setDevAddr();
      } else {
        throw new Error('No such app by appeui.');
      }

    })
    .then(function (res) {

      // 1. generate DevAddr, AppNonce
      // a. generate random appnonce
      var rd = Math.floor(Math.random() * 16777215).toString(16);
      if (rd.length % 2 !== 0) {
        rd = '0' + rd;
      }

      appnonce = rd;

      // b. generate last 25 bits of devaddr and concat 7 bits of netid
      devaddr = ((parseInt(netid, 16) << 25) | (parseInt(res, 16) & 0x01ffffff)).toString(16);
      if (devaddr.length % 2 !== 0) {
        devaddr = '0' + devaddr;
      }

      log.info('new random devaddr');
      log.info(devaddr);

      // 2. generate join accept
      var j = new JoinAccept();
      var jpld = j.generateAccept(new Buffer(appnonce, 'hex'),
        new Buffer(netid, 'hex'),
        new Buffer(devaddr, 'hex'),
        new Buffer(dls, 'hex'),
        new Buffer(rxdelay, 'hex'),
        cflist,
        appkey,
        log);

      var ppld = new PhyPayload();
      var newTmst = mtdt.rawMetadata.tmst + 1000000;
      tx = {
        txpk: {
          tmst: newTmst, // '{\'imme\':true' +
          freq: mtdt.rawMetadata.freq,
          rfch: 0,
          powe: 25,
          modu: mtdt.rawMetadata.modu,
          datr: mtdt.rawMetadata.datr,
          codr: mtdt.rawMetadata.codr,
          ipol: false,
          size: ppld.geneResSize(j, '0'),
          data: ppld.geneResPhypayload(msgtype, j, jpld, appkey, mtdt, log),
        },
      };

      // 3. update NwkSKey, AppSKey, AppNonce, DevAddr
      var upkobj = {
        NwkSKey: j.calculateKey(appkey, '1', devnonce, log).toString('hex'),
        AppSKey: j.calculateKey(appkey, '2', devnonce, log).toString('hex'),
        AppNonce: appnonce,
        DevAddr: devaddr,
      };
      return sqlConn.updateDevInfo(deveui, upkobj);
    })
    .then(function (upkey) {
      if (upkey > 0) {
        // 1.if did existed
        return sqlConn.getDevInfo(deveui);
      } else {
        throw new Error('Update info of device:' + deveui + ' failed.');
      }

    })
    .then(function (data) {
      if (data !== null) {
        if (data.Did === '') {

          // 2.use devaddr and passcode to get did
          body.product_key = productkey;
          body.mac = deveui; // devaddr;
          body.passcode = data.Passcode;
          return httpConn.getdid(body);
        } else {
          throw new Error('Has did.');// FIXME : more like a warning
        }

      } else {
        throw new Error('No such device by deveui.');
      }

    })
    .then(function (response) {
      if ('did' in response) {

        // 3.update did
        did = response.did;
        var upobj = {
          Did: response.did,
        };
        return sqlConn.updateDevInfo(deveui, upobj);
      } else {
        throw new Error('No did in response.');
      }

    })
    .then(function (res) {
      if (res > 0) {

        // 4. subscribe new topics of new did
        var subTopics = [];
        subTopics.push(`$rlwio/devices/${did}/shadow/update/accepted`);
        subTopics.push(`$rlwio/devices/${did}/shadow/update/rejected`);
        subTopics.push(`$rlwio/devices/${did}/shadow/update/delta`);
        subTopics.push(`$rlwio/devices/${did}/shadow/get/accepted`);
        subTopics.push(`$rlwio/devices/${did}/shadow/get/rejected`);
        return mqttConn.sub(subTopics);
      } else {
        throw new Error('Update did of device:' + deveui + ' failed.');
      }
    })
    .then(function () {
      log.info('sub new topics success');
      return tx;
    })
    .catch(function (err) {
      log.error(err).end();
    });

  log.info('<----HANDLEJOIN_END---->');

  return promiseReturn;
}

/** add message to pub queue
 * @param mqttConn mqtt connect
 * @param phyPayload
 */
function handleDataup(mqttConn, phyPayload, log) {
  log.info('<----HANDLEDATAUP---->');

  var dataobj = phyPayload.metaData.rawMetadata;
  dataobj.isCmd = '0';
  dataobj.gwid = phyPayload.metaData.gwid;
  dataobj.data = phyPayload.originalData.data.toString('hex'); //dataobj.is_online = null;
  var obj = {
    state: {
      reported: dataobj,
      desired: dataobj,
    },
  };
  var did = phyPayload.dbGet.Did;
  mqttConn.pubAdd(`$rlwio/devices/` + did + `/shadow/update`, obj);
  log.info('<----HANDLEDATAUP_END---->');
}

/** generate downlink package and send response
 * @param topic
 * @param message
 */
function handleDatadown(sqlConn, mq, phyPayload, log) {
  log.info('<----HANDLEDATADOWN---->');

  // get items of uplink phyPayload
  var msgtype = phyPayload.rawPhypl.MType;

  var mtdt = phyPayload.metaData;
  var macpl = phyPayload.MACPayload;
  var devaddr = macpl.rawMacpl.DevAddr;

  var hascmd = macpl.rawMacpl.hasCmd;

  /* some bit set of fctrl*/
  var adr = 1;
  var adrackreq = 0;
  var ack = 0;
  var fpending = 0;
  var foptslen = 0;

  var fcntdown = phyPayload.dbGet.FcntDown;
  var fopts = null;
  var fport = macpl.rawMacpl.FPort;
  var framepayload = '';
  var key = fport === '00' ? phyPayload.dbGet.NwkSKey : phyPayload.dbGet.AppSKey;

  var did = phyPayload.dbGet.Did;
  var promiseReturn;
  var tx = null;
  log.info('into handle data down did = ' + did);
  promiseReturn = mq.consume(did)
    .then(function (res) {
      if (res === null && msgtype === 2 && hascmd === false) {
        return null;
      } else {
        if (res === null && msgtype === 4) {
          msgtype = 5;
          ack = 1;
          if (hascmd === true) {
            var precmd = macpl.rawMacpl.cmd;
            if (precmd.isReq === true) { // 0x02 Link Check Req
              var cid = 0x02;
              var cmd = new MacCommand();
              var pld = {
                Margin: '0x32',
                GwCnt: '0x01',
              };// TODO : ?how to set margin, gwcnt
              framepayload = cmd.generateDlk(cid, pld, log);
              fport = '00';
            }

          }

        } else if (res !== null) {
          res = JSON.parse(res);

          // if data is maccommand
          if (res.isCmd === '1') {
            fport = '00';
            framepayload = res.data;
          } else if (res.isCmd === '2') {
            fopts = new Buffer(res.data, 'hex');
            foptslen = fopts.length;
          } else {
            framepayload = res.data;
          }

          // if msg needs to be confirmed
          if (msgtype === 2) {
            msgtype = 3;
          } else if (msgtype === 4) {
            msgtype = 5;
            ack = 1;
          }

        }

        // generate data of macpayload and txpk
        var m = new MacPayload();
        var mpld =  m.generateDownlink(
          devaddr,
          { 'adr': adr,
            'adrackreq': adrackreq,
            'ack': ack,
            'fpending': fpending,
            'foptslen': foptslen, },
          fcntdown,
          fopts,
          new Buffer(fport, 'hex'),
          new Buffer(framepayload, 'hex'),
          new Buffer(key, 'hex'),
          log);

        var ppld = new PhyPayload();
        var newTmst = mtdt.rawMetadata.tmst + 1000000;

        // can be set by NC
        var newDatr = mtdt.rawMetadata.datr;
        switch (newDatr.substr(0, 3)) {
          case 'SF7':
            newDatr = 'SF11BW125';
            break;
          case 'SF8':
            newDatr = 'SF12BW125';
            break;
          case 'SF9':
          case 'SF1':
            newDatr = 'SF12BW125';
            break;
          default:
            newDatr = 'SF12BW125';
            break;
        }

        key = phyPayload.dbGet.NwkSKey;
        tx = {
          txpk: {
            tmst: newTmst, // '{\'imme\':true' +
            freq: mtdt.rawMetadata.freq,
            rfch: 0,
            powe: 25,
            modu: mtdt.rawMetadata.modu,
            datr: newDatr, //mtdt.rawMetadata.datr,
            codr: mtdt.rawMetadata.codr,
            ipol: false,
            size: ppld.geneResSize(m, '24'),
            data: ppld.geneResPhypayload(msgtype, m, mpld, new Buffer(key, 'hex'), mtdt, log),
          },
        };

        return sqlConn.increaseFcnt(phyPayload.dbGet.DevEUI, { FcntDown: 1, });
      }
    })
    .then(function (res) {
      if (res !== null && 'dataValues' in res) {
        return tx;
      } else if (res === null) {
        return null;
      } else {
        throw new Error('update fcntdown value failed.');
      }

    })
    .catch(function (err) {
      log.error(err).end();
    });

  log.info('<----HANDLEDATADOWN_END---->');

  return promiseReturn;
}

/**handle the downlink message from cloud
 * @param
 * @param
 */
function downlink(topic, message) {
  var log = new Log();
  var mq = this.mq;
  log.info('coming mqtt message');
  log.info('topic: ' + topic.raw);
  log.info('message: ');
  log.info(message).end();
  if (topic.status === 'delta') {
    var deltaObj = message.state.delta;
    log.info(deltaObj);
    console.log('did : ' + topic.did);
    mq.produce(topic.did, JSON.stringify(message.state.delta))
      .then(function (res) {
        log.info('received message from delta topic');
        log.info(topic.did);
        log.info(JSON.stringify(message.state.delta)).end();
      })
      .catch(function (err) {
        log.error(err);
      });
  }

}
/**handle the uplink package
 * @param msg the comming message
 * @param rinfo the remote host informations
 */
function uplink(msg, rinfo) {
  var log = new Log();
  var udpPackage = new UdpPackage(msg, log);//to unpack the comming message
  var ack;//the ack buffer for comming message
  var mqttConnector = this.mqttConnector;
  var sqlConnector = this.sqlConnector;
  var httpConnector = this.httpConnector;
  var mq = this.mq;
  var _this = this;
  var redisConnector = ''; // TODO : configuration
  log.info('                                                   ');
  log.info('---------------------------------------------------');

  // log.debug(this.options);
  log.info('Coming UDP Package ...');
  log.info('Buffer Size : ' + msg.length);

  // udp package unpack
  if (!udpPackage.unpack()) {
    log.end();
    return;
  }

  // return ack to gateway
  ack = udpPackage.getAck();
  udpServer.send(ack, 0, ack.length, rinfo.port, rinfo.address, function (err, bytes) {
    if (err) {
      //FIXME maybe when return ack failed, we need to do something else
      log.error(err).end();
    }

    log.info('<----SEND BACK ACK---->');
  });

  var gwid = udpPackage.package.gatewayID.toString('hex');

  // phypayload unpack
  if (udpPackage.package.identifier === '0') {

    if ('stat' in udpPackage.package.payload) {
      log.info('handle stat');

      // update gateway ip address and port of push data connection
      var did = '';

      // a. check if has did
      sqlConnector.getGatewayInfo(gwid)
        .then(function (data) {

          // b. register did
          if (data.Did === null) {
            var body = {};
            body.product_key = '496c3703768b5236ad95a9e5ecef2247';
            body.mac = gwid;
            body.passcode = '12345678';
            return httpConnector.getdid(body);
          } else {

            // b. get did
            did = data.Did;
            var resdid = { did: did };
            return resdid;
          }
        })
        .then(function (response) {
          if ((response !== null) && ('did' in response)) {

            // c. pub gateway state to cloud
            did = response.did;
            var dataobj = udpPackage.package.payload.stat;
            dataobj.version = udpPackage.package.version;
            var obj = {
              state: {
                reported: dataobj,
                desired: dataobj,
              },
            };
            mqttConnector.pubAdd(`$rlwio/devices/` + did + `/shadow/update`, obj);
          }

          // pub messages to mqtt
          return mqttConnector.pub();
        })
        .then(function () {
          mqttConnector.pubEmpty();
          log.info('pub completed').end();
          var gatewayInfo = {
            Address: ipToNum(rinfo.address),
            PushPort: rinfo.port,
            Did: did,
            Passcode: '12345678',
          };
          return sqlConnector.upsertGatewayInfo(gwid, gatewayInfo);
        })
        .catch(function (err) {
          log.error(err).end();
        });
    }

    if ('rxpk' in udpPackage.package.payload) {
      udpPackage.package.payload.rxpk.forEach(function (rxi) {
        log.info('handle rxpx');

        // decode 'data' in received packet and parse into phypayload and set metadata
        var phyPayload = new PhyPayload();
        var downData = null;
        var gwid = udpPackage.package.gatewayID.toString('hex');
        var dlinkPkg = null;

        // get raw data in 'data'
        phyPayload.getPhypayload(rxi, gwid, log, sqlConnector)
          .then(function (res) {
            log.info('<----PHYPAYLOAD_GETPHYPAYLOAD_END---->');

            if (res !== null) {
              var pro;
              switch (phyPayload.rawPhypl.MType) {
                case 0: /* 000 Join Request */
                  pro = handleJoin(sqlConnector, httpConnector, mqttConnector, phyPayload, log);
                  break;
                case 2: /* 010 Unconfirmed Data Up */
                case 4: /* 100 Confirmed Data Up */
                  handleDataup(mqttConnector, phyPayload, log);
                  pro = handleDatadown(sqlConnector,
                    mq,
                    phyPayload,
                    log);
                  break;
                default:
                  var depromise = new Promise(function (resolve, reject) {
                    return resolve(null);
                  });

                  pro = depromise;
                  break;
              }

              return pro;
            } else {
              throw new Error('Received downlink message or other msgtype.');
            }

          })
          .then(function (downData) {
            if (downData !== null) {

              // udp package pack
              var dlinkpackage = {
                version: '1',
                token: new Buffer('0000', 'hex'),
                identifier: '3',
                gatewayID: udpPackage.package.gatewayID,
                payload: downData,
              };
              log.info(dlinkpackage);
              dlinkPkg = new UdpPackage(dlinkpackage, log);
              if (!dlinkPkg.pack()) { //log.end();
                return;
              }

              return sqlConnector.getGatewayInfo(gwid);
            }

            return null;
          })
          .then(function (ifSendDlk) {
            if (ifSendDlk !== null) {

              //if downlink is allowed
              if ((ifSendDlk.Address === null) | (ifSendDlk.PullPort === null)) {
                log.info('No pull data received from gateway.');
              } else {
                udpServer.send(dlinkPkg.rawData,
                  0,
                  dlinkPkg.rawData.length,
                  ifSendDlk.PullPort,
                  numToIp(ifSendDlk.Address),
                  errHandler);
                log.info('Send back pull response to GW :' +
                  gwid +
                  ' : ' +
                  numToIp(ifSendDlk.Address) +
                  ' : ' +
                  ifSendDlk.PullPort);
              }

            }

            // pub messages to mqtt
            return mqttConnector.pub();
          })
          .then(function () {
            mqttConnector.pubEmpty();
            log.info('pub completed').end();
            return null;
          })
          .catch(function (err) {
            log.error(err).end();
          });
      }); //for (var i = 0; i < udpPackage.package.payload.rxpk.length; i++) {

    }

  } else if (udpPackage.package.identifier === '2') {
    log.end();

    // update gateway ip address and port of pull data connection
    var gatewayInfo = {
      Address: ipToNum(rinfo.address),
      PullPort: rinfo.port,
    };
    sqlConnector.upsertGatewayInfo(gwid, gatewayInfo)
      .catch(function (err) {
        log.error(err);
      });
  }

}

function LoraConnector(options) {
  var _this = this;

  /* properties */
  this.options = options || {};
  _.defaults(this.options, defaultOptions);

  //TODO
}

/**add a new function to its prototype
 * @param name function name
 * @param func function logic
 */
LoraConnector.prototype.method = function (name, func) {

  var _this = this;
  _this.prototype[name] = func;
  return _this;
};

/** start the lora connector
 * @ param options for udp server
 */
LoraConnector.prototype.start = function () {
  var _this = this;
  var options = this.options;
  var log = new Log();
  var mqttConnector = new MqttConnector(_this.options.mqtt);
  _this.mqttConnector = mqttConnector;
  var sqlConnector = new SqlConnector(_this.options.mysql);
  _this.sqlConnector = sqlConnector;
  var httpConnector = new HttpConnector(_this.options.http);
  _this.httpConnector = httpConnector;
  var mq = createMQ({ host: '10.3.242.231', port: '6379' });
  _this.mq = mq;

  // udpServer listening
  udpServer.bind(options.udp.port, options.udp.host);
  log.info('udp server started');
  log.info(options.udp).end();

  // mqttConnector connect
  mqttConnector.connect()
    .then(function () {
      return mqttConnector.listen();
    })
    .then(function () {
      return sqlConnector.getAllDid();
    })
    .then(function (res) {
      var subTopics = [];
      if (res !== null) {
        var dids = res; // ['D42aa5409dad9c09172cb8'];
        dids.forEach(function (did) {
          subTopics.push(`$rlwio/devices/${did}/shadow/update/accepted`);
          subTopics.push(`$rlwio/devices/${did}/shadow/update/rejected`);
          subTopics.push(`$rlwio/devices/${did}/shadow/update/delta`);
          subTopics.push(`$rlwio/devices/${did}/shadow/get/accepted`);
          subTopics.push(`$rlwio/devices/${did}/shadow/get/rejected`);
        });
      }

      return mqttConnector.sub(subTopics);
    })
    .then(function () {
      log.info('sub topics success').end();
      return null;
    })
    .catch(function (err) {
      log.error(err).end();
    });

  // handle the comming udp package
  udpServer.on('message', uplink.bind(_this));

  // mqtt connector listening message
  mqttConnector.on('message', downlink.bind(_this));

};

module.exports = LoraConnector;
