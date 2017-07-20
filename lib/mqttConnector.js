var moment = require('moment');
var _ = require('lodash');
var mqtt = require('mqtt');
var events = require('events');
var inherits = require('util').inherits;
var Promise = require('bluebird');
var CustomError = require('./customError');
var utils = require('./utils');
var Log = require('./log');

var defaultOptions = {
  username: 'loratest',
  password: '123456',
  host: 'localhost',
  port: 1883,
  protocolId: 'MQTT',
  prototocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  keepalive: 120,
  keyPath: null,
  certPath: null,
  rejectUnauthorized: false,

};

function parseTopic(topic) {
  var res = {};
  res.raw = topic;
  res.tokens = topic.split('/');
  res.did = res.tokens[2];
  res.operation = res.tokens[4];
  res.status = res.tokens[5];
  res.toString = function () {
    return res.raw;
  };

  return res;
}

function parsePayload(payload) {
  var res = {};

  try {
    res = JSON.parse(payload) || {};
  } catch (e) {
    console.log('#JSON.parse() error:', e, '' + payload);
    res = {};
  }

  return res;
}

function buildPayload(obj) {
  var res;

  if (typeof obj === 'object') {
    res = JSON.stringify(obj);
  } else if (typeof obj === 'string') {
    res = obj;
  } else {
    throw new Error('buildPayload');
  }

  return res;
}

function MqttConnector(options) {
  var _this = this;

  // properties
  this.options = options || {};
  _.defaults(this.options, defaultOptions);

  // publishes
  this.pubs = [];

  // subscribes
  this.subs = [];

  // log
  this.log = new Log();

  //inherits Emitter's attributes
  events.EventEmitter.call(this);
}

// inherits Emitter's prototype
inherits(MqttConnector, events.EventEmitter);

/**connect to mqtt server
 *
 */
MqttConnector.prototype.connect = function (callback) {
  var _this = this;
  var log = this.log;

  var promise = new Promise(function (resolve, reject) {

    // does not connect twice, despite it can do.
    if (_this.client) {
      log.warn('duplicate connection');
      return resolve();
    }

    /* connect to the MQTT server */
    _this.client = mqtt.connect(_this.options);

    /* bind the mqttClient event to devClient */
    _this.client.on('error', _this.emit.bind(_this, 'error'));
    _this.client.on('close', _this.emit.bind(_this, 'close'));
    _this.client.on('connect', function (connack) {
      if (connack.returnCode !== 0) {
        return reject(new CustomError('MQTT_CONNECTION_ERROR'));
      }

      log.info('mqtt connected');

      return resolve();
    });
  });

  return utils.functionReturn(promise, callback);
};

/** listen 'message' event
 *
 */
MqttConnector.prototype.listen = function (callback) {
  var _this = this;
  var log = this.log;
  var client = this.client;
  var promise = new Promise(function (resolve) {

    client.on('message', function (topic,  message) {
      topic = parseTopic(topic);
      message = parsePayload(message);
      _this.emit('message', topic, message);
    });

    return resolve();
  });

  return utils.functionReturn(promise, callback);
};

/** add a new publish
 * @param topic
 * @param message
 */
MqttConnector.prototype.pubAdd = function (topic, message) {
  this.pubs.push({
    topic: topic,
    message: message,
  });

  return this;
};

/** pub the pubs
 *
 */
MqttConnector.prototype.pub = function () {
  var _this = this;
  var client = this.client;//FIXME same as sub below, maybe wrong usage in mqtt
  var pubs = this.pubs;
  var log = this.log;

  if (!client) {
    log.warn('mqtt not connected');
    return Promise.reject(new CustomError('MQTT_CONNECTION_ERROR'));
  }

  var ops = [];
  pubs.forEach(function (pub) {
    log.info('pub: ' + pub.topic);
    log.info(pub.message).end();
    ops.push(_this.publish(pub.topic, JSON.stringify(pub.message)));
  });

  return Promise.all(ops);

};

/** empty the pubs
 *
 */
MqttConnector.prototype.pubEmpty = function () {
  this.pubs = [];

  return this;
};

/** empty the subs
 *
 */
MqttConnector.prototype.subEmpty = function () {
  this.subs = [];

  return this;
};

/** publish the topic and message
 *
 */
MqttConnector.prototype.publish = function (topic, message) {
  var _this = this;
  var log = this.log;
  var client = this.client;

  var op = new Promise(function (resolve, reject) {
    if (!client) {
      log.warn('mqtt not connected');
      return reject(new CustomError('MQTT_CONNECTION_ERROR'));
    }

    client.publish(topic, message, function (err) {
      if (err) {
        return reject(err);
      }

      return resolve();
    });
  });

  var callback = arguments[arguments.length - 1];
  return utils.functionReturn(op, callback);
};

/** add a new subscribe
 * @param topic
 */
MqttConnector.prototype.subAdd = function (topic) {
  //FIXME topic validation handling
  this.subs.push(topic);
  return this;
};

/** add new subscribes
 * @param topic
 */
MqttConnector.prototype.subsAdd = function (topics) {
  //FIXME error handling
  var _this = this;

  //FIXME concat useless why? this.subs.concat(topics);
  topics.forEach(function (topic) {
    _this.subs.push(topic);
  });

  return this;
};

MqttConnector.prototype.subonetopic = function (topic) {
  var _this = this;
  var client = _this.client;
  var log = _this.log;
  var op = new Promise(function (resolve, reject) {
    if (!client) {
      return reject(new CustomError('MQTT_CONNECTION_ERROR'));
    }

    client.subscribe(topic, function (err, reply) {
      if (err) {
        return reject(new Error('subscribe error'));
      }

  /*    if (reply.length <= 0) {
         return reject(new Error('reply is null'));
      } else if (reply[0].qos !== 0) {
         return reject(new Error('subscribe failed.'));
      } else {
        return resolve();
      }
    });*/
      
      return resolve(reply);
    });

  });

  var callback = arguments[arguments.length - 1];
  return utils.functionReturn(op, callback);

};



/** sub the subs
 *
 */
MqttConnector.prototype.sub = function (topics) {
  var _this = this;
  var client = this.client;//FIXME maybe somer error here, mqtt wrong usage
  var subs = [];
  var log = this.log;


  // subscribe together
  /*  topics.forEach(function (topic) {
    subs.push(topic);
  });

  var op = new Promise(function (resolve, reject) {
    if (!client) {
      return reject(new CustomError('MQTT_CONNECTION_ERROR'));
    }

    // sub topics
    client.subscribe(subs, function (err, granted) {
      if (err) {
        return reject(err);
      }

      return resolve(true);
    });

  });
*/

  var ops = [];
  topics.forEach(function (topic) {
    ops.push(_this.subonetopic(topic));
  });

  var op = new Promise.all(ops).then(function (result) {
    console.log(result);
  });

  var callback = arguments[arguments.length - 1];
  return utils.functionReturn(op, callback);
};

/** unsub the subs
 *
 */
MqttConnector.prototype.unsub = function (topics) {
  var _this = this;
  var unsubs = [];
  var client = this.client;
  var log = this.log;
  topics.forEach(function (topic) {
    unsubs.push(topic);
  });

  var op = new Promise(function (resolve, reject) {
    if (!client) {
      return reject(new CustomError('MQTT_CONNECTION_ERROR'));
    }

    // unsub topics
    client.unsubscribe(unsubs, function (err) {
      if (err) {
        return reject(err);
      }

      return resolve(true);
    });

  });

  var callback = arguments[arguments.length - 1];
  return utils.functionReturn(op, callback);
};

module.exports = MqttConnector;
