float getBits(float data, float lower, float upper) {
  float upperPow = pow(2., upper + 1.);
  float leftBits = floor(data / upperPow) * upperPow;
  return floor((data - leftBits) / pow(2., lower));
}

vec4 bytesToColor(vec4 bytes) {
  // 1.0 == 255, 0.0 = 0
  return bytes / vec4(255.0, 255.0, 255.0, 1.0);
}

vec4 rowidxColor(float animationidx, float tileidx, float rowidx) {
  /* Bit layout, packed in 3 bytes (r, g, b):
   * 4bits animation id
   * 6bits tile id
   * 14bits row id
   *
   * See js/app/Visualization/Animation/AnimationManager.js:getRowidxAtPos:pixelToId
   */

  return bytesToColor(vec4(
    animationidx * 16. + getBits(tileidx, 2., 5.),
    getBits(tileidx, 0., 1.) * 64. + getBits(rowidx, 8., 13.),
    getBits(rowidx, 0., 7.),
    1.0));
}

vec4 rowidxNone = vec4(1.0, 1.0, 1.0, 1.0);
