attribute vec4 worldCoord;
uniform mat4 googleMercator2webglMatrix;

void main() {
  gl_Position = googleMercator2webglMatrix * worldCoord;
  gl_PointSize = 2.0;
}
