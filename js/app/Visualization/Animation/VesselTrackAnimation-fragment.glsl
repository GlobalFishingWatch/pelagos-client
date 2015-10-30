precision mediump float;

uniform float timefocus;

varying float vWeight;
varying vec4 baseColor;
varying vec4 focusColor;
varying float pointTime;
varying float timeWindowSize;

void main() {
  float factor = min(1.0, (timeWindowSize / 300.) / abs(timefocus - pointTime));

  gl_FragColor = (1.0 - factor) * baseColor + factor * focusColor;
}

