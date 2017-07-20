var Mqtt = require('../lib/mqttConnector');
var _ = require('lodash');
var opt = {
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
};


var mqtt = new Mqtt(opt);

mqtt.connect()
  .then(function () {
    return mqtt.listen();
  })
  .then(function () {
    var subTopics = [];
    var dids = ['D5e644934c50f00c700ed5',
       'D68b531881b7f72108d3cf',
 //   '1122D5e644934c50f00c800ed5'
    ];
   dids.forEach(function (did) {
          subTopics.push(`$rlwio/devices/${did}/shadow/update/accepted`);
          subTopics.push(`$rlwio/devices/${did}/shadow/update/rejected`);
          subTopics.push(`$rlwio/devices/${did}/shadow/update/delta`);
          subTopics.push(`$rlwio/devices/${did}/shadow/get/accepted`);
          subTopics.push(`$rlwio/devices/${did}/shadow/get/rejected`);
        });
   return mqtt.sub(subTopics);
  })
  .then(function () {
    console.log('sub topics succeed');
    return null;
  })
  .catch(function (err) {
    console.log(err);
  });

mqtt.on('message', function (topic, message) {
  console.log('           ');
  console.log('coming mqtt message.');
  console.log(topic.raw);
  console.log(message);
  if (topic.status === 'delta') {
    console.log('#$%^*#rwerwerfwrfwerwerwrew%^&');
  }
});

