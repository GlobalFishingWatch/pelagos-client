#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';

uniform float pointSize;
uniform mat4 googleMercator2webglMatrix;

varying vec4 baseColor;
varying float fragmentDirection;

void main() {
  mapper();

  gl_Position = lonlat2screen(vec2(_longitude, _latitude), googleMercator2webglMatrix);

  if (_filter > 0.0) {
    gl_PointSize = 0.0;
    baseColor = vec4(0, 0, 0, 0);
  } else {
    gl_PointSize = 40.0 * _length;
    baseColor = vec4(_red, _green, _blue, _alpha);
    fragmentDirection = (360.0 + 90.0 - _direction) / 360.0 * 2.0 * pi;
  }
}
