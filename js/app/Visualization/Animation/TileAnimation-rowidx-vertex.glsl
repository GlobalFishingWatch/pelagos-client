#pragma include 'app/Visualization/Animation/mercator.glsl';
#pragma include 'app/Visualization/Animation/rowidx.glsl';

attribute vec4 worldCoord;
uniform mat4 googleMercator2webglMatrix;
uniform float tileidx;
varying vec4 baseColor;

void main() {
  baseColor = rowidxColor(tileidx, 0.);
  gl_Position = lonlat2screen(vec2(worldCoord[0], worldCoord[1]), googleMercator2webglMatrix);
  gl_PointSize = 2.0;
}
