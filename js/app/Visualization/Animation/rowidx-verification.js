function fromBin(s) {
  var res = 0;
  for (var i = 0; i < s.length; i++) {
    res = res << 1;
    res += s[i] == '1' ? 1 : 0;
  }
  return res;
}

function toBin(n) {
  res = "";
  while (n) {
    res = ((n & 1) ? '1' : '0') + res;
    n = n>>1;
  }
  return res;
}

function getBits(data, lower, upper) {
  var upperPow = Math.pow(2, upper + 1);
  var leftBits = Math.floor(data / upperPow) * upperPow;
  return Math.floor((data - leftBits) / Math.pow(2, lower));
}
