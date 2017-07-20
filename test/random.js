var utils = require('../lib/utils');
var Client = require('../models/index');
var opt = {
  database: 'lora_ns',
  username: 'root',
  password: '650915',
  dialect: 'mysql',
  host: 'localhost',
  port: '3306',
};

var netid = '000001';
var sqlConn = new Client(opt);
sqlConn.setDevAddr().then(function (res) {
console.log(res);
devaddr = ((parseInt(netid, 16) << 25) | (parseInt(res, 16) & 0x01ffffff)).toString(16);
if (devaddr.length % 2 !== 0) {
  devaddr = '0' + devaddr;
}
console.log(devaddr);
});


var appnonce;
var netid = '000001';
var devaddr = '00046354';

//console.log(parseInt(devaddr, 16) & 0x01ffffff);
//console.log(parseInt('000080', 16) & 0x00007f);
