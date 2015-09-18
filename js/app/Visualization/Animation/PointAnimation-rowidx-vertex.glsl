#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';
#pragma include 'app/Visualization/Animation/rowidx.glsl';

uniform float pointSize;

uniform mat4 googleMercator2webglMatrix;

uniform float tileidx;
uniform float animationidx;

varying vec4 baseColor;

void main() {
  mapper();

  gl_Position = lonlat2screen(vec2(_longitude, _latitude), googleMercator2webglMatrix);
  baseColor = rowidxColor(animationidx, tileidx, rowidx);

  if (_filter > 0.0) {
    baseColor = rowidxNone;
    gl_PointSize = 0.0;
  } else {
    gl_PointSize = pointSize * _magnitude;
  }
}
