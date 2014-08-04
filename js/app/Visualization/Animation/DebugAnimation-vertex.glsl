attribute vec4 point;
uniform mat4 mapMatrix;

const float pi = 3.14159265358979323846264338327950;

void main() {
  float x = (point[0] + 180.0) * 256.0 / 360.0;
  float y = 128.0 - log(tan((point[1] + 90.0) * pi / 360.0)) * 128.0 / pi;

  gl_Position = mapMatrix * vec4(x, y, 0.0, 1.0);
  gl_PointSize = 2.0;
}
