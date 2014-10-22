precision mediump float;

varying float vPointSize;
varying float vSigma;
varying float vWeight;
varying vec4 baseColor;

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
    float colorscale = dist * dist * weight / alpha;

    if (colorscale < 0.1) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
      gl_FragColor = vec4(baseColor[0], baseColor[1], baseColor[2], 1.0);
    }
  }
}
