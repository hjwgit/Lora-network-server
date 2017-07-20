var Log = require('./log');

function MetaData() {

  this.rawMetadata = {};
  this.gwid = '';
  this.log = new Log();
}

MetaData.prototype.setall = function (rxpkI, gwid, log) {
  log.info('<----METADATA_SETALL---->');
  var rawMetadata = {
    //time: null,	// UTC time of pkt RX, us precision, ISO 8601 'compact' format
    tmst: null,	// Internal timestamp of 'RX finished' event (32b unsigned)
    chan: null,	// RX central frequency in MHz (unsigned float, Hz precision)
    rfch: null,	// Concentrator 'IF' channel used for RX (unsigned integer)
    freq: null,	// Concentrator 'RF chain' used for RX (unsigned integer)
    stat: null,	// CRC status: 1 = OK, -1 = fail, 0 = no CRC
    modu: null,	// Modulation identifier 'LORA' or 'FSK'
    datr: null,	// LoRa datarate identifier (eg. SF12BW500)
    codr: null,	// LoRa ECC coding rate identifier
    rssi: null,	// RSSI in dBm (signed integer, 1 dB precision)
    lsnr: null,	// Lora SNR ratio in dB (signed float, 0.1 dB precision)
    size: null,	// RF packet payload size in bytes (unsigned integer)
  };
  var rxpkArray = [
    'tmst',
    'chan',
    'rfch',
    'freq',
    'stat',
    'modu',
    'datr',
    'codr',
    'rssi',
    'lsnr',
    'size',
  ];
  for (var i = 0; i < rxpkArray.length; i++) {
    if (rxpkArray[i] in rxpkI) {
      rawMetadata[rxpkArray[i]] = rxpkI[rxpkArray[i]];

      // console.log(rxpkArray[i] + ' : ' + rawMetadata[rxpkArray[i]]);
    }

  }

  this.rawMetadata = rawMetadata;
  this.gwid = gwid;
  log.info('<----METADATA_SETALL_END---->');

};

module.exports = MetaData;
