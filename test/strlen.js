var str = new Buffer('12345678', 'hex');

function strlen (buf, i) {
  if (buf[i] === undefined) {
    return i;
  }
  return strlen(buf, i + 1);
}

console.log(strlen(str, 0));
