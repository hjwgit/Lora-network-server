var Client = require('./index');
var HttpConnector = require('../lib/httpConnector');
var opt = {
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
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
    },
  },
};

var httpConn = new HttpConnector(opt);

var opt = {
  database: 'lora_ns',
  username: 'root',
  password: '650915',
  dialect: 'mysql',
  host: 'localhost',
  port: '3306',
};

var sqlConn = new Client(opt);
var obj = {
  DevEUI: 'airquality000007',
  Did: '',
  Passcode: '12345678',
  DevAddr: '0004635f',
  FcntUp: 0,
  FcntDown: 0,
  AppSKey: '2B7E151628AED2A6ABF7158809CF4F3C',
  NwkSKey: '2B7E151628AED2A6ABF7158809CF4F3C',
  AppNonce: '000000',
};

process.argv.forEach(function (val, index, array) {
  console.log(index + ':' + val);
  if (index === 2) {
    obj.DevEUI = val;
  } else if (index === 3) {
    obj.DevAddr = val;
  }
});

var body = {};
body.product_key = '0e0f74a7775879619f16d313bfe00ec3';
body.mac = obj.DevEUI; // devaddr;
body.passcode = obj.Passcode;
httpConn.getdid(body).then(function (res) {
  if ('did' in res) {
    obj.Did = res.did;
    return sqlConn.upsertDevInfo(obj);
  } else {
    throw new Error('get did failed.');
  }
}).then(function (data) {
  if (data === true) {
    console.log('insert succeed.');
  } else {
    console.log('upsert failed.');
  }
}).catch(function (err) {
  console.log(err);
});

sqlConn.getAllDid(function (err, data) {
  console.log(data);
});

/*
sqlConn.increaseFcnt(obj.DevEUI, {FcnjtUp: 1}, function (err, data) {
  if (err !== null) {
    console.log(err);
  } else {
    console.log(data);
    if ('dataValues' in data) {
      console.log('erer');
    }

  }

// TODO: cannot figure like that

});

sqlConn.createDev(obj, function (err, data) {
  if (err !== null){
    console.log(err);
  }
  else if (data !== null){
    console.log(data);
  }
  else {
    console.log('data == null');
  }
});


sqlConn.getDevInfo('0102030405060708', function (err, data) {
  if (err !== null){
    console.log(err);
  }
  else if (data !== null){
    console.log(data);
  }
  else {
    console.log('data == null');
  }
});


sqlConn.upsertDevInfo(obj, function (err, data) {
  if (err !== null) {
    console.log(err);
  } else if (data === true) {
    console.log('update succeed');
  } else {
    console.log('update failed');
  }

// TODO: cannot figure like that

});



sqlConn.deleteDevInfo('3938383166358816', function (err, data) {
 if (err !== null) {
    console.log(err);
  } else if (data > 0) {
    console.log('delete succeed');
  } else {
    console.log('delete failed');
  }
});


sqlConn.getDeveuiByDevaddr('0026354', function (err, data) {
  if (err !== null){
    console.log(err);
  }
  else if (data !== null){
    console.log(data);
  }
  else {
    console.log('data == null');
  }

});


var upobj = {

  // NwkSKey: '2B7E151628AED2A6ABF7158809CF4F3C',
  // AppSKey: '2B7E151628AED2A6ABF7158809CF4F3C',
  Did: 'D68b531881b7f72108d3cf',
  Passcode: '12345678',
  DevAddr: '0020060c',
  FcntUp: 0,
  FcntDown: 0,
  AppSKey: '2B7E151628AED2A6ABF7158809CF4F3C',
  NwkSKey: '2B7E151628AED2A6ABF7158809CF4F3C',
  AppNonce: '000000',

};


sqlConn.updateDevInfo('airquality000003', upobj, function (err, data) {
if (err !== null){
    console.log(err);
  }
  else if (data > 0){
    console.log('update succeed');
    console.log(data);
  }
  else {
    console.log('update failed');
  }
});


sqlConn.getDevInfo('x0102030405060708')
  .then(dataup)
  .catch(function (err) {
    console.log(err);
  });

function dataup (data) {
  if (data !== null) {
    var key = data.FcntUp;
    console.log('----key----');
    console.log(key);
    console.log('-----------');
  } else {
    console.log('data is null');
  }
}*/
