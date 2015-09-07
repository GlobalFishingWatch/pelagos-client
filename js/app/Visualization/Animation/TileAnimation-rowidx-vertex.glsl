#pragma include 'app/Visualization/Animation/rowidx.glsl';

attribute vec4 worldCoord;
uniform mat4 googleMercator2webglMatrix;
uniform float tileidx;
varying vec4 baseColor;

void main() {
  baseColor = rowidxColor(tileidx, 0.);
  gl_Position = googleMercator2webglMatrix * worldCoord;
  gl_PointSize = 2.0;
}
