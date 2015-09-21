uniform float canvasIndex;

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
  /* See docs/limits.md */

  if (canvasIndex == 0.) {
    return bytesToColor(vec4(
      getBits(animationidx, 0., 7.),
      getBits(tileidx, 8., 15.),
      getBits(tileidx, 0., 7.),      
      1.0));
  } else if (canvasIndex == 1.0) {
    return bytesToColor(vec4(
      getBits(rowidx, 16., 23.),
      getBits(rowidx, 8., 15.),
      getBits(rowidx, 0., 7.),      
      1.0));
  }
}

vec4 rowidxNone = vec4(1.0, 1.0, 1.0, 1.0);
