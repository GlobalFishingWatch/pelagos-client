#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';
#pragma include 'app/Visualization/Animation/rowidx.glsl';

uniform mat4 googleMercator2webglMatrix;
uniform float tileidx;
varying vec4 baseColor;

void main() {
  mapper();
  gl_Position = lonlat2screen(vec2(_longitude, _latitude), googleMercator2webglMatrix);
  gl_PointSize = 2.0;
  baseColor = rowidxColor(tileidx, rowidx);
}
