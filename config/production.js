module.exports = {
  log: {
    level: 'debug',
  },
  database: {
    options: {
      host: 'localhost',
      port: 6379 ,
    },
  },
  http: {
    host: 'localhost',
    port: 3000,
    key: null,
    cert: null,
    rejectUnauthorized: false,
  },
  mqtt: {
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

 },
};
