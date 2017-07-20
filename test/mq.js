var createMQ = require('rejmq');
var mq = createMQ({ host: '10.3.242.231', port: '6379' });

/*mq.produce('1222', 'value2')
  .then(function (res) {
    console.log(res);
  });
*/



mq.consume('1222')
  .then(function (res) {
    console.log(res);
  });
