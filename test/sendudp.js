var dgram = require('dgram');
var client = dgram.createSocket('udp4');

// send message
var ack = new Buffer('00112233445566', 'hex');
client.send(ack, 0, ack.length, '4843', '211.68.70.104', function (err, bytes) {
  console.log('send');
  if (err) {
    console.log(err);
  }
});

client.on('message', function(msg, rinfo) {

  // log
  console.log('Buffer Size : ' + msg.length);
  console.log(msg);
  console.log('                                                      ');


});
