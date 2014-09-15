float extractLow8bits(float v) {
  float leftBits = floor(v / 256.0) * 256.0;
  return floor(v) - leftBits;
}

vec4 rowidxColor(float tileidx, float rowidx) {
  float i = rowidx + 1.0;
  return vec4(
    tileidx / 256.0,
    extractLow8bits(i / 256.0) / 255.0,
    extractLow8bits(i) / 255.0,
    1.0);
}
