'use strict';

var fs        = require('fs');
var path      = require('path');
var Sequelize = require('sequelize');
var basename  = path.basename(module.filename);
var env       = process.env.NODE_ENV || 'development';
var Promise = require('bluebird');
var _ = require('lodash');
var utils = require('../lib/utils');
var moment = require('moment');
var async = require('async');

/* an mysql wrapper class */

/*
 *construct function
 *init sequelie & import all model and associate
 */
function Client(opts) {
  var _this = this;
  var db = { };
  var sequelize = new Sequelize(opts.database, opts.username, opts.password, opts);

  //read mysql entity table sync
  fs
    .readdirSync(__dirname + '/entity_table')
    .filter(function (file) {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(function (file) {
      var model = sequelize.import(path.join(__dirname + '/entity_table', file));
      db[model.name] = model;
    });

  //read mysql association table sync
  fs
    .readdirSync(__dirname + '/associations')
    .filter(function (file) {
      return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(function (file) {
      var model = sequelize.import(path.join(__dirname + '/associations', file));
      db[model.name] = model;
    });

  //build association
  Object.keys(db).forEach(function (modelName) {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  //sync model to mysql databse
  db.sequelize = sequelize;
  db.sequelize.sync().then(function (result) {
    //console.log(result);
  });

  this.db = db;
  this.db.Sequelize = Sequelize;
}

/*******************************Hash**********************************/
Client.prototype.createDedup = function (val, callback) {
  var Hash = this.db.Hash;

  var promiseRes = Hash.create({
    Values: val,
  });

  return utils.functionReturn(promiseRes, callback);
};

/** getDedup : check if framepayload is duplicate
 *  @param pld
 *  @param callback
 */
Client.prototype.getDedup = function (pld, callback) {
  var _this = this;
  var Hash = this.db.Hash;
  var promiseRes = Hash.findAll({
    where: {
      Values: pld,
      createdAt: {
        $lt: new Date(),
        $gt: new Date(new Date() - 24 * 60 * 60 * 1000 * 3),
      },
    },
    attributes: ['Values'],
  }).then(function (res) {
    return res.length > 0 ? false : true;
  });

  return utils.functionReturn(promiseRes, callback);
};

/** upsertDedup : insert pld in hash table
 *  @param pld
 *  @param callback
 */
Client.prototype.upsertDedup = function (pld, callback) {
  var _this = this;
  var Hash = this.db.Hash;
  var promiseRes = Hash.upsert({
    Values: pld,
  });

  return utils.functionReturn(promiseRes, callback);
};

/*******************************App************************************/
Client.prototype.createApp = function (appeui, productkey, appkey, netid, callback) {
  var App = this.db.App;

  var promiseRes = App.create({
    AppEUI: appeui,
    ProductKey: productkey,
    AppKey: appkey,
    NetID: netid,
  });

  return utils.functionReturn(promiseRes, callback);
};

/** getAppInfo : get productkey and appkey of some app
 *  @param appeui
 *  @param callback
 */
Client.prototype.getAppInfo = function (appeui, callback) {
  var _this = this;
  var App = this.db.App;
  var promiseRes = App.findOne({
    where: {
      AppEUI: appeui,
    },
    attributes: ['ProductKey', 'AppKey', 'NetID'],
  }).then(function (res) {
    return res !== null ? {
      ProductKey: res.getDataValue('ProductKey'),
      AppKey: res.getDataValue('AppKey'),
      NetID: res.getDataValue('NetID'),
    } : null;
  });

  return utils.functionReturn(promiseRes, callback);
};

/** upsertAppInfo : insert or update all info of some app
 *  @param appeui
 *  @param productkey
 *  @param appkey
 *  @param netid
 *  @param callback
 */
Client.prototype.upsertAppInfo = function (appeui, productkey, appkey, netid, callback) {
  var _this = this;
  var App = this.db.App;
  var promiseRes = App.upsert({
    AppEUI: appeui,
    ProductKey: productkey,
    AppKey: appkey,
    NetID: netid,
  });

  return utils.functionReturn(promiseRes, callback);
};

/** deleteAppInfo : delete one app
 *  @param appeui
 *  @param callback
 */
Client.prototype.deleteAppInfo = function (appeui, callback) {
  var _this = this;
  var App = this.db.App;
  var promiseRes = App.destroy({
    where: {
      AppEUI: appeui,
    },
  }).then(function (res) {
    return res;
  });

  return utils.functionReturn(promiseRes, callback);
};

/*****************************Device**********************************/
Client.prototype.createDev = function (dev, callback) {
  var Device = this.db.Device;
  var promiseRes = Device.create(dev);

  return utils.functionReturn(promiseRes, callback);
};

/** getAllDid
 * @param callback
 */
Client.prototype.getAllDid = function (callback) {
  var _this = this;
  var Device = _this.db.Device;
  var promiseRes = Device
    .findAll({
      attributes: ['Did'],
    })
    .then(function (res) {
      var resArr = [];
      for (var i = 0; i < res.length; i++) {
        resArr.push(res[i].getDataValue('Did'));
      }

      return res !== null ? resArr : null;
    });

  return utils.functionReturn(promiseRes, callback);
};

/** getDevInfo : get all infomation of some app
 *  @param deveui
 *  @param callback
 */
Client.prototype.getDevInfo = function (deveui, callback) {
  var _this = this;
  var Device = this.db.Device;
  var promiseRes = Device.findOne({
    where: {
      DevEUI: deveui,
    },
  }).then(function (res) {
    return res !== null ? {
      Did: res.getDataValue('Did'),
      Passcode: res.getDataValue('Passcode'),
      DevAddr: res.getDataValue('DevAddr'),
      FcntUp: res.getDataValue('FcntUp'),
      FcntDown: res.getDataValue('FcntDown'),
      AppSKey: res.getDataValue('AppSKey'),
      NwkSKey: res.getDataValue('NwkSKey'),
      AppNonce: res.getDataValue('AppNonce'),
    } : null;
  });

  return utils.functionReturn(promiseRes, callback);
};

/** getDevInfoByDevaddr : get all infomation of some app
 *  @param devaddr
 *  @param callback
 */
Client.prototype.getDevInfoByDevaddr = function (devaddr, callback) {
  var _this = this;
  var Device = this.db.Device;
  var promiseRes = Device.findOne({
    where: {
      DevAddr: devaddr,
    },
  }).then(function (res) {
    return res !== null ? {
      Did: res.getDataValue('Did'),
      Passcode: res.getDataValue('Passcode'),
      DevEUI: res.getDataValue('DevEUI'),
      FcntUp: res.getDataValue('FcntUp'),
      FcntDown: res.getDataValue('FcntDown'),
      AppSKey: res.getDataValue('AppSKey'),
      NwkSKey: res.getDataValue('NwkSKey'),
      AppNonce: res.getDataValue('AppNonce'),
    } : null;
  });

  return utils.functionReturn(promiseRes, callback);
};

/** upsertDevInfo : insert or update all info of some device
 *  @param dev
 *  @param callback
 */
Client.prototype.upsertDevInfo = function (dev, callback) {
  var _this = this;
  var Device = this.db.Device;
  var promiseRes = Device
    .findAll({
      where: {
        DevEUI: dev.DevEUI,
      },
    })
    .then(function (res) {
      if (res.length > 0) { //exist this device
        var info = {
          Did: dev.Did,
          Passcode: dev.Passcode,
          DevAddr: dev.DevAddr,
          FcntUp: dev.FcntUp,
          FcntDown: dev.FcntDown,
          AppSKey: dev.AppSKey,
          NwkSKey: dev.NwkSKey,
          AppNonce: dev.AppNonce,
        };
        return Device.update(info,
          {
            where: {
              DevEUI: dev.DevEUI,
            },
          });
      } else {
        return Device.upsert(dev);
      }
    });

  return utils.functionReturn(promiseRes, callback);
};

/** deleteDevInfo : delete one device
 *  @param deveui
 *  @param callback
 */
Client.prototype.deleteDevInfo = function (deveui, callback) {
  var _this = this;
  var Device = this.db.Device;
  var promiseRes = Device.destroy({
    where: {
      DevEUI: deveui,
    },
  }).then(function (res) {
    return res;
  });

  return utils.functionReturn(promiseRes, callback);
};

/** getDeveuiByDevaddr : get deveui by devaddr
 *  @param devaddr
 *  @param callback
 */
Client.prototype.getDeveuiByDevaddr = function (devaddr, callback) {
  var _this = this;
  var Device = this.db.Device;
  var promiseRes = Device.findOne({
    where: {
      DevAddr: devaddr,
    },
    attributes: ['DevEUI'],
  }).then(function (res) {
    return res !== null ? res.getDataValue('DevEUI') : null;
  });

  return utils.functionReturn(promiseRes, callback);
};

/** updateDevInfo : update some info of a device
 *  @param deveui
 *  @param info
 *  @param callback
 */
Client.prototype.updateDevInfo = function (deveui, info, callback) {
  var _this = this;
  var Device = this.db.Device;
  var promiseRes = Device.update(info,
    {
      where: {
        DevEUI: deveui,
      },
    }).then(function (res) {
      return res;
    });

  return utils.functionReturn(promiseRes, callback);
};

/** increase fcnt
 *  @param deveui
 *  @param info
 *  @param callback
 */
Client.prototype.increaseFcnt = function (deveui, info, callback) {
  var _this = this;
  var Device = this.db.Device;
  var promiseRes = Device.findById(deveui)
    .then(function (dev) {
      if (dev === null) {
        throw new Error('No such device by deveui.');
      } else {
        return dev.increment(info);
      }

    })
    .then(function (res) {
      return res;
    });

  return utils.functionReturn(promiseRes, callback);
};

var getRandomHex = function (handler, callback) {
  var _this = handler;
  var Device = _this.db.Device;
  var rd = Math.floor(Math.random() * 33554431).toString(16);
  if (rd.length % 2 !== 0) {
    rd = '0' + rd;
  }

  var promiseRes = Device.findAll({
    where: {
      DevAddr: rd,
    },
  })
    .then(function (res) {
      if (res.length > 0) {
        rd = getRandomHex(_this);
      }

      return rd;
    });

  return utils.functionReturn(promiseRes, callback);
};

/** generate random devaddr
 * @param callback
 */
Client.prototype.setDevAddr = function (callback) {
  var _this = this;
  var Device = _this.db.Device;
  var promiseRes = getRandomHex(_this);

  return utils.functionReturn(promiseRes, callback);
};

/*****************************JoinNonce**********************************/
Client.prototype.createNonce = function (nonce, callback) {
  var JoinNonce = this.db.JoinNonce;
  var promiseRes = JoinNonce.create({
    DevNonce: nonce,
  });

  return utils.functionReturn(promiseRes, callback);
};

/** getDevNonce : check if devnonce exists
 *  @param devnonce
 *  @param callback
 */
Client.prototype.getDevNonce = function (devnonce, callback) {
  var _this = this;
  var JoinNonce = this.db.JoinNonce;
  var promiseRes = JoinNonce.findAll({
    where: {
      DevNonce: devnonce,
      createdAt: {
        $lt: new Date(),
        $gt: new Date(new Date() - 24 * 60 * 60 * 1000 * 3),
      },
    },
    attributes: ['DevNonce'],
  }).then(function (res) {
    return res.length > 0 ? false : true;
  });

  return utils.functionReturn(promiseRes, callback);
};

/** upsertNonce : insert devnonce
 *  @param devnonce
 *  @param callback
 */
Client.prototype.upsertNonce = function (nonce, callback) {
  var _this = this;
  var JoinNonce = this.db.JoinNonce;
  var promiseRes = JoinNonce.upsert({
    DevNonce: nonce,
  });

  return utils.functionReturn(promiseRes, callback);
};

/*****************************App2Device**********************************/
Client.prototype.createApp2Device = function (obj, callback) {
  var App2Device = this.db.App2Device;
  var promiseRes = App2Device.create(obj);

  return utils.functionReturn(promiseRes, callback);
};

/** upsertApp2DevInfo : insert or update all info of table app2device
 *  @param appeui
 *  @param deveui
 *  @param callback
 */
Client.prototype.upsertApp2DevInfo = function (appeui, deveui, callback) {
  var _this = this;
  var App2Dev = this.db.App2Device;
  var promiseRes = App2Dev
    .findAll({
      where: {
        DevEUI: deveui,
      },
      attributes: ['AppEUI'],
    }).then(function (res) {
      if (res.length > 0) { //exist this device
        return App2Dev.update({ AppEUI: appeui, },
          {
            where: {
              DevEUI: deveui,
            },
          });
      } else {
        return App2Dev.upsert({
          AppEUI: appeui,
          DevEUI: deveui,
        });
      }
    });

  return utils.functionReturn(promiseRes, callback);
};

/** deleteApp2DevInfo : delete a relation of app and device
 *  @param appeui
 *  @param deveui
 *  @param callback
 */
Client.prototype.deleteApp2DevInfo = function (appeui, deveui, callback) {
  var _this = this;
  var App2Dev = this.db.App2Device;
  var promiseRes = App2Dev.destroy({
    where: {
      AppEUI: appeui,
      DevEUI: deveui,
    },
  }).then(function (res) {
    return res;
  });

  return utils.functionReturn(promiseRes, callback);
};

/** getAppeuiByDeveui : get appeui by deveui
 *  @param deveui
 *  @param callback
 */
Client.prototype.getAppeuiByDeveui = function (deveui, callback) {
  var _this = this;
  var App2Dev = this.db.App2Device;
  var promiseRes = App2Dev.findOne({
    where: {
      DevEUI: deveui,
    },
    attributes: ['AppEUI'],
  }).then(function (res) {
    return res !== null ? res.getDataValue('AppEUI') : null;
  });

  return utils.functionReturn(promiseRes, callback);
};

/** getAlldevByAppeui : get devices of some app by appeui
 *  @param appeui
 *  @param callback
 */
Client.prototype.getAlldevByAppeui = function (appeui, callback) {
  var _this = this;
  var App2Dev = this.db.App2Device;
  var promiseRes = App2Dev.findAll({
    where: {
      AppEUI: appeui,
    },
    attributes: ['DevEUI'],
  }).then(function (res) {
    var resArr = [];
    for (var i = 0; i < res.length; i++) {
      resArr.push(res[i].getDataValue('DevEUI'));
    }

    return res !== null ? resArr : null;
  });

  return utils.functionReturn(promiseRes, callback);
};

/*******************************Gateway*********************************/
Client.prototype.createGateway = function (gwid, addr, pull, push, did, pwd, callback) {
  var Gateway = this.db.Gateway;

  var promiseRes = Gateway.create({
    GatewayId: gwid,
    Address: addr,
    PullPort: pull,
    PushPort: push,
    Did: did,
    Passcode: pwd,
  });

  return utils.functionReturn(promiseRes, callback);
};

/** getGatewayInfo : get all info of some gateway
 *  @param gatewayid
 *  @param callback
 */
Client.prototype.getGatewayInfo = function (gatewayid, callback) {
  var _this = this;
  var Gateway = _this.db.Gateway;
  var promiseRes = Gateway.findOne({
    where: {
      GatewayID: gatewayid,
    },
  }).then(function (res) {
    return res !== null ? {
      Address: res.getDataValue('Address'),
      PullPort: res.getDataValue('PullPort'),
      PushPort: res.getDataValue('PushPort'),
      Did: res.getDataValue('Did'),
      Passcode: res.getDataValue('Passcode'),
    } : null;
  });

  return utils.functionReturn(promiseRes, callback);
};

/** upsertGatewayInfo : insert or update all info of some gateway
 *  @param gwid
 *  @param info
 *  @param callback
 */
Client.prototype.upsertGatewayInfo = function (gwid, info, callback) {
  var _this = this;
  var Gateway = this.db.Gateway;
  var promiseRes = Gateway
    .findAll({
      where: {
        GatewayId: gwid,
      },
    }).then(function (res) {
      if (res.length > 0) { //exist this gateway
        return Gateway.update(info,
          {
            where: {
              GatewayId: gwid,
            },
          });
      } else {
        info.GatewayId = gwid;
        return Gateway.upsert(info);
      }
    });

  return utils.functionReturn(promiseRes, callback);
};

/** deleteGatewayInfo : delete one gateway
 *  @param gatewayid
 *  @param callback
 */
Client.prototype.deleteGatewayInfo = function (gatewayid, callback) {
  var _this = this;
  var Gateway = this.db.Gateway;
  var promiseRes = Gateway.destroy({
    where: {
      GatewayId: gatewayid,
    },
  }).then(function (res) {
    return res;
  });

  return utils.functionReturn(promiseRes, callback);
};

module.exports = Client;
