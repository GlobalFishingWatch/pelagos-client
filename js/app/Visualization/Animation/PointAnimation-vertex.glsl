#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';

uniform float startTime;
uniform float endTime;
uniform float pointSize;

uniform mat4 mapMatrix;

varying vec4 baseColor;

void main() {
  mapper();

  gl_Position = lonlat2screen(vec2(_longitude, _latitude), mapMatrix);

  if (_filter > 0.0) {
    baseColor = vec4(0, 0, 0, 0);
    gl_PointSize = 0.0;
  } else {
    gl_PointSize = pointSize * _magnitude;
    baseColor = vec4(_red, _green, _blue, _alpha);
  }
}
