var moment = require('moment');
var _ = require('lodash');
var http = require('http');
var events = require('events');
var inherits = require('util').inherits;
var Promise = require('bluebird');
var utils = require('./utils');
var Log = require('./log');

var defaultOptions = {
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
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    },
  },
  provision: {
    option: {
      host: '115.28.69.224',
      port: 3000,
      path: '/v1/device_provision',
      method: 'GET',
      headers: {},
    },
  },
  register: {
    option: {
      host: '115.28.69.224',
      port: 3000,
      path: '/v1/users/register',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    },
    body: {
      'username': 'loratest',
      'password': '123456',
    },
  },
  bind: {
    option: {
      host: '115.28.69.224',
      port: 3000,
      path: '/v1/devices',
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    },
    body: {},
  },
  bindlist: {
    option: {
      host: '115.28.69.224',
      port: 3000,
      path: '/v1/devices',
      method: 'GET',
      headers: {},
      query: {},
    },
  },
  operations: {
    option: {
      host: '115.28.69.224',
      port: 3000,
      path: '/v1/devices/operations?limit=3',
      method: 'GET',
      headers: {},
    },
  },

};

function HttpConnector(options) {
  var _this = this;

  // properties
  this.options = options || {};
  _.defaults(this.options, defaultOptions);

  // log
  this.log = new Log();

  //inherits Emitter's attributes
  events.EventEmitter.call(this);
}

// inherits Emitter's prototype
inherits(HttpConnector, events.EventEmitter);

/**send http request to get did
 * @param body
 */
HttpConnector.prototype.getdid = function (body, callback) {
  var _this = this;
  var log = this.log;
  _this.options.did.body = body;
  console.log(body);
  var bodyString = JSON.stringify(_this.options.did.body);
  _this.options.did.option.headers['Content-Length'] = bodyString.length;

  log.info('Get did.').end();
  var promise = new Promise(function (resolve, reject) {
    var req = http.request(_this.options.did.option, function (res) {
      if (res.statusCode === 201) {
        log.info('Response statusCode : 201.').end();
        res.on('data', function (chunk) {
          var resbody = JSON.parse(chunk.toString());
          return resolve(resbody);
        });
      } else {
        return reject('Get did failed. statusCode : ' + res.statusCode);
      }

    });

    req.write(bodyString);
    req.end();

  }).catch(function (err) {
    log.info(err).end();
  });

  return utils.functionReturn(promise, callback);
};

/**send http request to get token
 * @param body
 */
HttpConnector.prototype.gettoken = function (body, callback) {
  var _this = this;
  var log = this.log;
  _this.options.token.body.username = body.username;
  _this.options.token.body.password = body.password;
  _this.options.token.body.device_type = body.device_type;

  var bodyString = JSON.stringify(_this.options.token.body);
  _this.options.token.option.headers['Content-Length'] = bodyString.length;

  log.info('Get token.').end();
  var promise = new Promise(function (resolve, reject) {
    var req = http.request(_this.options.token.option, function (res) {
      if (res.statusCode === 200) {
        log.info('Response statusCode : 200.').end();
        res.on('data', function (chunk) {
          var resbody = JSON.parse(chunk.toString());
          if ('access_token' in resbody) {
            return resolve(resbody.access_token);
          } else {
            return reject('No access_token in response.');
          }
        });
      } else {
        return reject('Get token failed. statusCode : ' + res.statusCode);
      }

    });

    req.write(bodyString);
    req.end();

  }).catch(function (err) {
    log.info(err).end();
  });

  return utils.functionReturn(promise, callback);
};

/**send http get to get provision
 * @param token
 */
HttpConnector.prototype.getprovision = function (token, callback) {
  var _this = this;
  var log = this.log;
  _this.options.provision.option.headers.Authorization = token;

  log.info('Get provision.').end();
  var promise = new Promise(function (resolve, reject) {
    var req = http.get(_this.options.provision.option, function (res) {
      if (res.statusCode === 200) {
        log.info('Response statusCode : 200.').end();
        res.on('data', function (chunk) {
          var resbody = JSON.parse(chunk.toString());
          if (('host' in resbody) && ('port' in resbody)) {
            return resolve(resbody.host + ':' + resbody.port);
          } else {
            return reject('No valid provision in response.');
          }

        });
      } else {
        return reject('Get provision failed. statusCode : ' + res.statusCode);
      }

    });

    req.end();

  }).catch(function (err) {
    log.info(err).end();
  });

  return utils.functionReturn(promise, callback);
};

/**send http request to register user
 * @param body
 */
HttpConnector.prototype.userRegister = function (callback) {
  var _this = this;
  var log = this.log;
  var bodyString = JSON.stringify(_this.options.register.body);
  _this.options.register.option.headers['Content-Length'] = bodyString.length;

  log.info('Register user.').end();
  var promise = new Promise(function (resolve, reject) {
    var req = http.request(_this.options.register.option, function (res) {
      if (res.statusCode === 201) {
        log.info('Response statusCode : 201.').end();
        res.on('data', function (chunk) {
          var resbody = JSON.parse(chunk.toString());
          return resolve(resbody);
        });
      } else {
        return reject('Register user failed. statusCode : ' + res.statusCode);
      }

    });

    req.write(bodyString);
    req.end();

  }).catch(function (err) {
    log.info(err).end();
  });

  return utils.functionReturn(promise, callback);
};

/**send http request to bind device
 * @param body
 */
HttpConnector.prototype.bindDevice = function (did, token,  callback) {
  var _this = this;
  var log = this.log;
  _this.options.bind.body.bind_code = did;
  var bodyString = JSON.stringify(_this.options.bind.body);
  _this.options.bind.option.headers['Content-Length'] = bodyString.length;
  _this.options.bind.option.headers.Authorization = token;

  console.log(bodyString);
  log.info('Bind device.').end();
  var promise = new Promise(function (resolve, reject) {
    var req = http.request(_this.options.bind.option, function (res) {
      if (res.statusCode === 201) {
        log.info('Response statusCode : 201.').end();
        res.on('data', function (chunk) {
          var resbody = JSON.parse(chunk.toString());
          return resolve(resbody);
        });
      } else {
        return reject('Bind device failed. statusCode : ' + res.statusCode);
      }

    });

    req.write(bodyString);
    req.end();

  }).catch(function (err) {
    log.info(err).end();
  });

  return utils.functionReturn(promise, callback);
};

/**send http get to get bind list
 * @param token
 */
HttpConnector.prototype.getbindlist = function (token, productkey, callback) {
  var _this = this;
  var log = this.log;
  _this.options.bindlist.option.headers.Authorization = token;
  _this.options.bindlist.option.query.product_key = productkey;

  log.info('Get device bind list.').end();
  var promise = new Promise(function (resolve, reject) {
    var req = http.get(_this.options.bindlist.option, function (res) {
      if (res.statusCode === 200) {
        log.info('Response statusCode : 200.').end();
        res.on('data', function (chunk) {
          var resbody = JSON.parse(chunk.toString());
          return resolve(resbody);
        });
      } else {
        return reject('Get provision failed. statusCode : ' + res.statusCode);
      }

    });

    req.end();

  }).catch(function (err) {
    log.info(err).end();
  });

  return utils.functionReturn(promise, callback);
};

/**send http get to get device operations of all
 * @param token
 */
HttpConnector.prototype.getoperations = function (token, didlist, callback) {
  var _this = this;
  var log = this.log;
  _this.options.operations.option.headers.Authorization = token;
  _this.options.operations.option.query.did = didlist;
  _this.options.operations.option.query.limit = 10;

  log.info('Get device operations of all.').end();
  var promise = new Promise(function (resolve, reject) {
    var req = http.get(_this.options.operations.option, function (res) {
      if (res.statusCode === 200) {
        log.info('Response statusCode : 200.').end();
        res.on('data', function (chunk) {
          var resbody = JSON.parse(chunk.toString());
          return resolve(resbody);
        });
      } else {
        return reject('Get device operations failed. statusCode : ' + res.statusCode);
      }

    });

    req.end();

  }).catch(function (err) {
    log.info(err).end();
  });

  return utils.functionReturn(promise, callback);
};

var getlist = function (handler, reporteds, token, did, startts, endts, callback) {
  var _this = handler;
  var log = _this.log;
  log.info(reporteds).end();
  _this.options.operations.option.path = '/v1/devices/' + did + '/operations';

  //  _this.options.operations.option.query.limit = 300;
  _this.options.operations.option.query.startts = startts;
  if (startts + 3600 < endts) {
    _this.options.operations.option.query.endts = startts + 3600;
  } else {
    _this.options.operations.option.query.endts = endts;
  }

  _this.options.operations.option.headers.Authorization = token;

  log.info(startts);
  log.info(startts + 3600).end();
  log.info('Get device operations of a device.').end();
  var promise = new Promise(function (resolve, reject) {
    var req = http.get(_this.options.operations.option, function (res) {
      if (res.statusCode === 200) {
        log.info('Response statusCode : 200.').end();
        res.on('data', function (chunk) {
          log.info(chunk.toString()).end();
          var resbody = JSON.parse(chunk.toString());
          log.info(resbody).end();
          var his = resbody;
          for (var i = 0; i < his.length; i++) {
            if (his[i].operation === 'update') {
              var pld = his[i].payload;
              if (('reported' in pld.state) && ('data' in pld.state.reported)) {
                var reported = his[i].payload.state.reported;
                var tmst = his[i].timestamp;
                reported.date = moment.unix(tmst).format();
                reporteds.push(reported);
              }

            }

          }

          if (endts - startts > 3600) {
            reporteds = getlist(handler, reporteds, token, did, startts + 3600, endts, callback);
          }

          return resolve(reporteds);
        });
      } else {
        return reject('Get device operations failed. statusCode : ' + res.statusCode);
      }

    });

    req.end();

  }).catch(function (err) {
    log.info(err).end();
  });

  return utils.functionReturn(promise, callback);

};

/**send http get to get device operations of all
 * @param token
 */
HttpConnector.prototype.getoperation = function (token, did, limit, startts, endts, callback) {
  var _this = this;
  var log = this.log;
  var qs = require('querystring');
  var query = {
    limit: limit,
    order: 'desc',
    startts: startts,
    endts: endts,
  };
  var content = qs.stringify(query);
  _this.options.operations.option.path = '/v1/devices/' + did + '/operations?' + content;

  _this.options.operations.option.headers.Authorization = token;
  log.info('Get device operations of a device.').end();
  var promise = new Promise(function (resolve, reject) {
    var req = http.get(_this.options.operations.option, function (res) {
      if (res.statusCode === 200) {
        log.info('Response statusCode : 200.').end();
        var chunks = [];
        var size = 0;
        var resbody = {};
        res.on('data', function (chunk) {
          chunks.push(chunk);
          size += chunk.length;
        });

        res.on('end', function () {
          if (chunks.length === 0) {
            resbody = {};
          } else if (chunks.length === 1) {
            resbody = chunks[0].toString();
          } else {
            var data = new Buffer(size);
            for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
              var chunk = chunks[i];
              chunk.copy(data, pos);
              pos += chunk.length;
            }

            resbody = data.toString();
          }

          // var resbody = JSON.parse(chunk.toString());
          log.info(resbody).end();
          return resolve(JSON.parse(resbody));

        });

      } else {
        return reject('Get device operations failed. statusCode : ' + res.statusCode);
      }

    });

    req.end();

  }).catch(function (err) {
    log.info(err).end();
  });

  return utils.functionReturn(promise, callback);
};

module.exports = HttpConnector;
