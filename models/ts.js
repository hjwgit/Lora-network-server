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

var obj = {
  DevEUI: '3102030405060708',
  AppEUI: '1090909090909090',
};

sqlConn.getDedup('d09de6d28b73ef8cf531261f45844fbd', function (err, data) {
  if (err !== null) {
    console.log(err);
  } else if (data === true) {
    console.log('true');
  } else {
    console.log('false');
  }
});
/*
sqlConn.createNonce('1919', function (err, data) {
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

sqlConn.upsertNonce('1818', function (err, data) {
  if (err !== null) {
    console.log(err);// TODO: cannot figure like that
  } else if (data === true) {
    console.log('update succeed');
  } else {
    console.log('update failed');
  }

});


sqlConn.createApp2Device(obj, function (err, data) {
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

sqlConn.upsertApp2DevInfo(obj.AppEUI, obj.DevEUI, function (err, data) {
   if (err !== null){
    console.log(err);
  }
// TODO: cannot figure like that
  else if (data === true){
    console.log('update succeed');
  }
  else {
    console.log('update failed');
  }

});


sqlConn.getAppeuiByDeveui('3102030405060708', function (err, data) {
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


sqlConn.getAlldevByAppeui('0090909090909090', function (err, data) {
  if (err !== null) {
    console.log(err);
  } else if (data !== null) {
    console.log(data);
  } else {
    console.log('data == null');
  }

});*/
