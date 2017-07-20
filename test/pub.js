var mqtt = require('mqtt');
var _ = require('lodash');
var config = require('./config'); // in current directory
var mqttClient = mqtt.connect(config.mqtt);

var operation = process.argv[2] || config.operation;
var did = process.argv[3] || config.did;
var payload = (process.argv[4] && JSON.stringify(process.argv[4])) || config.payload;

if (!operation || !did || !payload) {
  throw new Error('parameters not enough');
}

var pubTopic = `$rlwio/devices/${did}/shadow/${operation}`;
var subTopic = [
  `$rlwio/devices/${did}/shadow/update/accepted`,
  `$rlwio/devices/${did}/shadow/update/rejected`,
  `$rlwio/devices/${did}/shadow/update/delta`,
  `$rlwio/devices/${did}/shadow/get/accepted`,
  `$rlwio/devices/${did}/shadow/get/rejected`,
];

payload = JSON.stringify(payload);
mqttClient.on('message', function (topic, message) {
  var payload = JSON.parse(message);
  console.log('recv:', JSON.stringify({
    topic: topic,
    payload: payload,
  }, null, 2));
});

/*mqttClient.subscribe(subTopic, function (err, reply) {
  if (err) {
    console.log(err);
  }

});
*/
mqttClient.publish(pubTopic, payload, function (err, reply) {
  console.log('send:', JSON.stringify(JSON.parse(payload), null, 2));
});
