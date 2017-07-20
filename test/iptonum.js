function ipToNum(ip) {
  var num = 0;
  ip = ip.split('.');
  num = Number(ip[0]) * 256 * 256 * 256 +
    Number(ip[1]) * 256 * 256 +
    Number(ip[2]) * 256 + Number(ip[3]);
  num = num >>> 0;
  return num;
}

function numToIp(num) {
      var str;
      var tt = new Array();
      tt[0] = (num >>> 24) >>> 0;
      tt[1] = ((num << 8) >>> 24) >>> 0;
      tt[2] = (num << 16) >>> 24;
      tt[3] = (num << 24) >>> 24;
      str = String(tt[0]) + '.' +
    String(tt[1]) + '.' +
    String(tt[2]) + '.' +
    String(tt[3]);
      return str;
}

var addr = '10.110.150.141';
var num = ipToNum(addr);
console.log(num);
console.log(numToIp(num));
