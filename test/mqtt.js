var MqttConnector = require('../lib/mqttConnector');
var Log = require('../lib/log');
var opt = {
  username: 'Dfad85ddb768b12cd791c6',
  password: '12345678',
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
};

/**handle the downlink message from cloud
 * @param
 * @param
 */
function downlink(topic, message) {
  var log = new Log();
  log.info('comming mqtt message');
  log.info('topic: ' + topic.raw);
  log.info('message: ');
  log.info(message).end();
  if (topic.status === 'delta') {
    var deltaObj = message.state.delta;
    log.info(deltaObj);
  }

}
var log = new Log();
var mqttConnector = new MqttConnector(opt);

var subTopics = [];
var dids =['D5e644934c50f00c700ed5'];
dids.forEach(function (did) {
  subTopics.push(`$rlwio/devices/${did}/shadow/update/delta`);
});


// mqttConnector connect
mqttConnector.connect()
  .then(function () {
    return mqttConnector.listen();
  })
  .then(function () {
    return mqttConnector.unsub(subTopics);
  })
  .then(function (res) {
    if (res === true) {
    log.info('unsub topics success 11111').end();
    return  mqttConnector.sub(subTopics);
    }
  }).then(function () {
    log.info('sub topics success 11111').end();
    log.info(mqttConnector.subs).end(); 
    return null;
  })
 // .then(function () {
 //   return mqttConnector.unsub(subTopics);
 // })
  .then(function (res) {
    
    var subTopics = [];
    var dids =['D5e644934c50f00c700ed4'];
    dids.forEach(function (did) {
      subTopics.push(`$rlwio/devices/${did}/shadow/update/delta`);
    });

    return mqttConnector.sub(subTopics);
  }).then(function () {
    log.info('sub topics success 2222222').end();
    log.info(mqttConnector.subs).end();
  })
  .catch(function (err) {
    log.error(err).end();
  });

// mqtt connector listening message
mqttConnector.on('message', downlink.bind());
