module.exports = {
  log: {
    level: 'debug',
  },
  database: {
    options: {
      host: '10.3.242.231',
      port: 6379 ,
    },
  },
  http: {
    host: 'api.ralinwicloud.com',
    port: 3000,
    key: null,
    cert: null,
    rejectUnauthorized: false,
  },
  udp: {
    host: '10.3.242.233',
    port: '1700',
  },
  mqtt: {
    username: 'Ue5a54aa88162b713c98c5a503112d98', // username : loratest
    password: '123456',
    host: 'api.ralinwicloud.com',
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
  mysql: {
    database: 'lora_ns',
    username: 'root',
    password: '650915',
    dialect: 'mysql',
    host: 'localhost',
    port: '3306',
  },
};
