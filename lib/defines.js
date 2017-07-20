module.exports = {
  defaults: {
    page: 0,
    count: 20,
    rankCount: 5,
    rankType: 3,
  },
  ERROR: {
    INTERNAL_SERVER_ERROR: {
      code: 500,
      message: 'internal server error',
    },

    //connection errors
    MQTT_CONNECTION_ERROR: {
      code: 1001,
      message: 'failed to connect to mqtt server',
    },

    //udp package errors
    INVALID_UDP_RAW_DATA_FORMAT_ERROR: {
      code: 2001,
      message: 'invalid udp raw data format',
    },
    INVALID_UDP_PACKAGE_DATA_FORMAT_ERROR: {
      code: 2002,
      message: 'invalid udp package data format',
    },
    INVALID_UDP_PROTOCOL_VERSION_ERROR: {
      code: 2003,
      message: 'invalid udp protocol version',
    },
    INVALID_UDP_PROTOCOL_IDENTIFIER_ERROR: {
      code: 2004,
      message: 'invalid udp protocol identifier',
    },
    INVALID_UDP_PROTOCOL_TOKEN_ERROR: {
      code: 2005,
      message: 'invalid udp protocol token',
    },

    //Wrong Options ERROR
  },
};
