#pragma include 'app/Visualization/Animation/mercator.glsl';
attribute vec4 worldCoord;
uniform mat4 googleMercator2webglMatrix;

void main() {
  gl_Position = lonlat2screen(vec2(worldCoord[0], worldCoord[1]), googleMercator2webglMatrix);
  gl_PointSize = 2.0;
}
