#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';
#pragma include 'app/Visualization/Animation/rowidx.glsl';

uniform float startTime;
uniform float endTime;
uniform float pointSize;

uniform mat4 googleMercator2webglMatrix;

uniform float tileidx;

varying vec4 baseColor;

void main() {
  mapper();

  gl_Position = lonlat2screen(vec2(_longitude, _latitude), googleMercator2webglMatrix);
  baseColor = rowidxColor(tileidx, rowidx);

  if (_time < startTime || _time > endTime) {
    baseColor = vec4(0, 0, 0, 0);
    gl_PointSize = 0.0;
  } else {
    gl_PointSize = pointSize * _magnitude;
  }
}
