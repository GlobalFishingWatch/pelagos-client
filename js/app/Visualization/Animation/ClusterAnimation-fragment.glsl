precision mediump float;

varying float vWeight;
varying vec4 baseColor;


float fudge(float v) {
  float a = 0.1;
  return v/2.0 - sqrt(4.0*a*a + v*v - 2.0*v + 1.0) / 2.0 + 1.0/2.0;
}

void main() {
  gl_FragColor = baseColor;

  if (vWeight >= 0.0) {
    float dist = length(gl_PointCoord.xy - vec2(.5,.5));
    dist = 1. - ((dist - 0.1) * 2.5);
    dist = min(1.0,max(0., dist));

    float c = dist * vWeight;

    gl_FragColor = vec4(
      fudge(c * baseColor[0]),
      fudge(c * baseColor[1]),
      fudge(c * baseColor[2]),
      c * baseColor[3]
    );
  } else if (vWeight < 0.0) {
    float dist = length(gl_PointCoord.xy - vec2(.5,.5));
    dist = 1. - (dist * 2.);
    if (dist > 0.0) {
      gl_FragColor = baseColor;
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
  }
}

