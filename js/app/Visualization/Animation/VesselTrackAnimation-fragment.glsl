precision mediump float;

varying float vWeight;
varying vec4 baseColor;
uniform float timefocus;
varying float pointTime;

uniform selectionmap_timerange_from_datetime_0_lower;
uniform selectionmap_timerange_from_datetime_0_upper;

void main() {
  float windowSize = selectionmap_timerange_from_datetime_0_upper - selectionmap_timerange_from_datetime_0_lower;
  var factor = (windowSize / 100.) / abs(timefocus - pointTime)

  gl_FragColor = vec4(
    max(1., baseColor[0]*factor),
    max(1., baseColor[1]*factor),
    max(1., baseColor[2]*factor),
    baseColor[3]);
}

