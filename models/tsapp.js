var Client = require('./index');
var opt = {
  database: 'lora_ns',
  username: 'root',
  password: '650915',
  dialect: 'mysql',
  host: 'localhost',
  port: '3306',
};

var sqlConn = new Client(opt);
var info = {
  Address: 1111113,
  PullPort: 1700,
  PushPort: 1900,
  Passcode: '12345678',
};

sqlConn.getGatewayInfo('ffddfeb827eb31e4b2', function (err, data) {
  console.log(data);
});

/*
sqlConn.deleteGatewayInfo('fffeb827eb31e4b3',
  function (err, gw) {
    if (err !== null) {
      console.log(err);
    } else {
      console.log(gw);
    }
  })


sqlConn.upsertGatewayInfo('fffeb827eb31e4b4',info,
  function (err, gw) {
    if (err !== null) {
      console.log(err);
    } else {
      console.log(gw);
    }
  })

/*
sqlConn.createGateway('fffeb827eb31e4b3',
  123,
  1213,
  1214,
  '',
  '12345678',
  function (err, gw) {
    if (err !== null) {
      console.log(err);
    } else {
      console.log(gw);
    }
  })

sqlConn.createApp('0000000000000001',
  '0e0f74a7775879619f16d313bfe00ec3',
  '2B7E151628AED2A6ABF7158809CF4F3C',
  '000001',
  function (err, app) {
    if (err !== null) {
      console.log(err);
    }

  });


sqlConn.upsertAppInfo('0000000000000002',
  'ecad16779cf498659d405c9e88ca96b6',
  '2B7E151628AED2A6ABF7158809CF4F3C',
  '000002',
  function (err, data) {
  if (err !== null) {
    console.log(err);
  } else if (data === true) {
    console.log('update succeed');
  } else {
    console.log('update failed');
  }

// TODO: cannot figure like that

});

var buf = new Buffer('0102030405060708', 'hex');
var str = buf.toString('hex');
sqlConn.getAppInfo(str, function (err, data) {
  if (err !== null){
    console.log(er
  }
  else if (data !== null){
    console.log(data.ProductKey);
    console.log(data.AppKey);
  }
  else {
    console.log('noappkey');
  }
});

sqlConn.deleteAppInfo('c090909090909090', function (err, data) {
  if (err !== null){
    console.log(err);
  }
  else if (data > 0){
    console.log('delete succeed');
  }
  else {
    console.log('delete failed');
  }
});*/
