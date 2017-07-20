module.exports = {
  'mqtt': {
    'username': 'Ue5a54aa88162b713c98c5a503112d98', //username : loratest
    'password': '123456',
    'host': 'api.ralinwicloud.com', //'115.28.69.224',
  //   'host': '115.28.69.224',
    'port': 1883,
    'protocolId': 'MQTT',
    'prototocolVersion': 4,
    'clean': true,
    'reconnectPeriod': 1000,
    'keepalive': 120,
  },
  'operation': 'update',
  'did': 'D68b531881b7f72108d3cf',  //'D5e644934c50f00c700ed5',
//'D68b531881b7f72108d3cf', //   
  'payload': {
    'state': {
      'desired': {
      //'isCmd': '0',
      //'data': '0300ffff7f',
      // 'data': '0400',
      // 'data': '0500001000',
      //  'data': '06',
      //    'data': '070c00010077',
      // 'data': '0803',
         'data':  '010258003c001e000000000000000000',// '010078003c001e000000000000000000',
      },
     // 'reported': {
       // 'data': '11ffff02580078000000000000000000',
     // },
    },
  },
};
