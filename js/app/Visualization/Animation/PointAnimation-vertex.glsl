#pragma include 'attrmapper';

uniform float startTime;
uniform float endTime;
uniform float pointSize;

uniform mat4 mapMatrix;

varying vec4 baseColor;

const float pi = 3.14159265358979323846264338327950;

vec4 sphericalMercator(vec2 lonlat) {
  return vec4(
    (lonlat[0] + 180.0) * 256.0 / 360.0,
    128.0 - log(tan((lonlat[1] + 90.0) * pi / 360.0)) * 128.0 / pi,
    0.0,
    1.0);
}

vec4 lonlat2screenspace(vec2 lonlat) {
  return mapMatrix * sphericalMercator(lonlat);
}

vec4 lonlat2screen(vec2 lonlat) {
  vec4 pos = lonlat2screenspace(lonlat);

  if (pos[0] < -1.0) {
    lonlat[0] += 360.0;
    pos = lonlat2screenspace(lonlat);
  }
  if (pos[0] > 1.0) {
    lonlat[0] -= 360.0;
    pos = lonlat2screenspace(lonlat);
  }
  return pos;
}

void main() {
  mapper();

  gl_Position = lonlat2screen(vec2(_longitude, _latitude));

  if (_time < startTime || _time > endTime) {
    baseColor = vec4(0, 0, 0, 0);
    gl_PointSize = 0.0;
  } else {
    gl_PointSize = pointSize * _magnitude;
    baseColor = vec4(_red, _green, _blue, _alpha);
  }
}
