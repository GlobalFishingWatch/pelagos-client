#pragma include 'app/Visualization/Animation/mercator.glsl';
attribute vec4 worldCoord;
uniform mat4 googleMercator2webglMatrix;
uniform float tileidx;
uniform float tileidx_selected;
uniform float tileidx_hover;
varying vec4 baseColor;

void main() {
  if (tileidx == tileidx_selected) {
    baseColor = vec4(1.0, 1.0, 1.0, 1.);
  } else if (tileidx == tileidx_hover) {
    baseColor = vec4(1.0, 0., 1.0, 1.);
  } else {
    baseColor = vec4(0., 0., 0., 1.);
  }
  gl_Position = lonlat2screen(vec2(worldCoord[0], worldCoord[1]), googleMercator2webglMatrix);
  gl_PointSize = 2.0;
}
