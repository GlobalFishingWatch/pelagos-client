#pragma include 'attrmapper';

uniform float startTime;
uniform float endTime;
uniform float pointSize;

uniform mat4 mapMatrix;

varying vec4 baseColor;

const float pi = 3.14159265358979323846264338327950;

void main() {
  attrmapper();

  float x = (_longitude + 180.0) * 256.0 / 360.0;
  float y = 128.0 - log(tan((_latitude + 90.0) * pi / 360.0)) * 128.0 / pi;
  gl_Position = mapMatrix * vec4(x, y, 0.0, 1.0);

  if (_time < startTime || _time > endTime) {
    baseColor = vec4(0, 0, 0, 0);
    gl_PointSize = 0.0;
  } else {
    gl_PointSize = pointSize * _magnitude;
    baseColor = vec4(_red, _green, _blue, _alpha);
  }
}
