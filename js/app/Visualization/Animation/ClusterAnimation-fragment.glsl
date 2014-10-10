precision mediump float;

varying float vWeight;


float fudge(float v) {
  float a = 0.1;
  return v/2.0 - sqrt(4.0*a*a + v*v - 2.0*v + 1.0) / 2.0 + 1.0/2.0;
}

void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);

  if (vWeight == 0.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    float dist = length(gl_PointCoord.xy - vec2(.5,.5));
    dist = 1. - (dist * 2.);
    dist = max(0., dist);

    float c = dist * vWeight;

    gl_FragColor = vec4(
      1.0,
      fudge(0.6*c),
      fudge(0.3*c),
      fudge(c)
    );
  }
}
