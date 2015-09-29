precision mediump float;

#define M_PI 3.1415926535897932384626433832795

varying vec4 baseColor;
varying float fragmentDirection;

void main() {
  float direction = fragmentDirection / 360.0 * 2.0 * M_PI;  
  vec2 coord = gl_PointCoord.xy - vec2(.5, .5);

  if (length(coord) <= .5) {
    float dist = abs((coord[0] - (coord[1] / cos(direction))) / sqrt(2.0));
    dist = max(0., 1. - dist*10.);
    gl_FragColor = vec4(baseColor[0], baseColor[1], baseColor[2], baseColor[3] * dist);
  } else {
    gl_FragColor = vec4(0., 0., 0., 0.);
  }
}
