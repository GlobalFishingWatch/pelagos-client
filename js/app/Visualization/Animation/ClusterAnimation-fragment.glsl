precision mediump float;

varying float vPointSize;
varying float vSigma;
varying float vWeight;

void main() {
  if (vPointSize == 0.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    float weight = vWeight;
    float area_scale = (vPointSize * vPointSize) / (vPointSize * vPointSize + pow(vSigma * vPointSize * 5., 2.));

    weight *= area_scale;

    float dist = length(gl_PointCoord.xy - vec2(.5,.5));
    dist = 1. - (dist * 2.);
    dist = max(0., dist);
    float alpha = min(1., dist * sqrt(weight));
    if (alpha == 0.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
      float colorscale = dist * dist * weight / alpha;
      gl_FragColor = vec4(1. * colorscale, 0.4 * colorscale, 0.2 * colorscale, alpha);
    }
  }
}
