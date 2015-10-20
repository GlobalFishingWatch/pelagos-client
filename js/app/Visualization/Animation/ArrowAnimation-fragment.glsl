precision mediump float;

varying vec4 baseColor;
varying float fragmentDirection;

void main() {
  vec2 coord = gl_PointCoord.xy - vec2(.5, .5);

  if (length(coord) <= .5) {
    vec2 arrow = vec2(cos(fragmentDirection), sin(fragmentDirection)); // Unit vector along direction
    float projected_length = dot(coord, arrow);
    if (projected_length >= 0.0) {
      vec2 projected = projected_length * arrow; // No division by length(arrow) as arrow is unitary
      vec2 rejected = coord - projected;
      float dist = length(rejected);

      dist = max(0., 1. - dist*15.);
      gl_FragColor = vec4(baseColor[0], baseColor[1], baseColor[2], baseColor[3] * dist);
    } else {
    gl_FragColor = vec4(0., 0., 0., 0.);
    }
  } else {
    gl_FragColor = vec4(0., 0., 0., 0.);
  }
}
