#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';
#pragma include 'app/Visualization/Animation/rowidx.glsl';

uniform float pointSize;
uniform mat4 googleMercator2webglMatrix;

uniform float tileidx;
uniform float animationidx;

varying vec4 baseColor;
varying float fragmentDirection;

void main() {
  mapper();

  gl_Position = lonlat2screen(vec2(_longitude, _latitude), googleMercator2webglMatrix);

  if (_filter > 0.0) {
    gl_PointSize = 0.0;
    baseColor = rowidxNone;
  } else {
    gl_PointSize = 20.0 * _length;
    baseColor = rowidxColor(animationidx, tileidx, rowidx);
    fragmentDirection = _direction;
  }
}
