var con = new Buffer('1111110100005463040200003a622e70', 'hex');
var key = new Buffer('2B7E151628AED2A6ABF7158809CF4F3C', 'hex');
var crypto = require('crypto');
var iv = '';
var decipher = crypto.createDecipheriv('aes-128-ecb', key, iv);
decipher.setAutoPadding(auto_padding=false);
var data = decipher.update(con);

console.log('------------------------data------------------------');
console.log(data);
var cipher = crypto.createCipheriv('aes-128-ecb', key, iv);
var _data = cipher.update(data);
//_data += decipher.final();
//var _data_ = decipher.update(_data);

console.log('-----------------encrypt_this_data------------------');
console.log(_data);
//console.log(_data_);

return;
