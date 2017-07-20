var dgram = require('dgram');
var udpServer = dgram.createSocket('udp4');

udpServer.bind('4843', '10.3.242.233');
udpServer.on('message', function(msg, rinfo) {

  // log
  console.log('Buffer Size : ' + msg.length);
  console.log(msg);
  console.log('                                                      ');

  // return ack
  var ack = new Buffer('01020304', 'hex');
  udpServer.send(ack, 0, ack.length, rinfo.port, rinfo.address, function (err, bytes) {
    if (err) {
      console.log(err);
    }
  });

});
