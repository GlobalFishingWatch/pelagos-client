precision mediump float;

varying float vWeight;

void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);

  if (vWeight == 0.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    float dist = length(gl_PointCoord.xy - vec2(.5,.5));
    dist = 1. - (dist * 2.);
    dist = max(0., dist);

    float alpha = min(1., dist * sqrt(vWeight));
    if (alpha == 0.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
      float colorscale = dist * dist * vWeight / alpha;
      gl_FragColor = vec4(1. * colorscale, 0.4 * colorscale, 0.2 * colorscale, alpha);
    }
  }
}
