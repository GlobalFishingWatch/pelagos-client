precision mediump float;

varying float vWeight;
varying vec4 baseColor;


float fudge(float v) {
  float a = 0.1;
  return v/2.0 - sqrt(4.0*a*a + v*v - 2.0*v + 1.0) / 2.0 + 1.0/2.0;
}

void main() {
  gl_FragColor = baseColor;

}

