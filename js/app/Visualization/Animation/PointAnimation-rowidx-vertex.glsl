#pragma include 'attrmapper';

uniform float startTime;
uniform float endTime;
uniform float pointSize;

uniform mat4 mapMatrix;

uniform float tileidx;

varying vec4 baseColor;

const float pi = 3.14159265358979323846264338327950;

float extractLow8bits(float v) {
  float leftBits = floor(v / 256.0) * 256.0;
  return floor(v) - leftBits;
}

vec4 rowidxColor() {
  float i = rowidx + 1.0;
  return vec4(
    tileidx / 256.0,
    extractLow8bits(i / 256.0) / 255.0,
    extractLow8bits(i) / 255.0,
    1.0);
}

void main() {
  mapper();

  float x = (_longitude + 180.0) * 256.0 / 360.0;
  float y = 128.0 - log(tan((_latitude + 90.0) * pi / 360.0)) * 128.0 / pi;
  gl_Position = mapMatrix * vec4(x, y, 0.0, 1.0);

  baseColor = rowidxColor();

  if (_time < startTime || _time > endTime) {
    baseColor = vec4(0, 0, 0, 0);
    gl_PointSize = 0.0;
  } else {
    gl_PointSize = pointSize * _magnitude;
  }
}
