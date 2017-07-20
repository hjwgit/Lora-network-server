var HttpConnector = require('../lib/httpConnector');

var httpConnector = new HttpConnector();
/*httpConnector.userRegister().then(function (data) {
  if ('uid' in data) {
    var uid = data.uid;
    console.log('uid');
    console.log(uid);
  }
});*/
var body = {
  'username': 'loratest',
  'password': '123456',
  'device_type': 'user',
};
//var did = 'D68b531881b7f72108d3cf';
//var did = 'De0d29a5d488b733c57906';
//var did = 'Db1daf558d377cb4a169f9';
var did = 'D42aa5409dad9c09172cb8';
/*httpConnector.gettoken(body)
  .then(function (data) {
    console.log(data);
    var token = data;
    return httpConnector.bindDevice(did, token);
  }).then(function (res) {
  console.log(res);
})*/
/*
httpConnector.gettoken(body)
  .then(function (data) {
    console.log(data);
    var token = data;
    var productkey = '0e0f74a7775879619f16d313bfe00ec3';
    return httpConnector.getbindlist(token, productkey);
  }).then(function (res) {
  console.log(res);
})
*/

httpConnector.gettoken(body)
  .then(function (data) {
    console.log(data);
    var token = data;
   // var didlist = 'D68b531881b7f72108d3cf,De0d29a5d488b733c57906,Db1daf558d377cb4a169f9,D42aa5409dad9c09172cb8';

    //return httpConnector.getoperations(token, didlist);
  var did = 'D42aa5409dad9c09172cb8'; //'D68b531881b7f72108d3cf';
    return httpConnector.getoperation(token, did);
  }).then(function (res) {
    for (var i = 0; i < res.length; i++) {
     console.log(res[i]);
      //var pld = res[i].payload.state.reported;
     // if ('data' in pld) {
       // console.log(pld);
     // }
    }

});
