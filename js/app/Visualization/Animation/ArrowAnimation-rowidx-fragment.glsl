precision mediump float;

varying vec4 baseColor;
varying float fragmentDirection;

void main() {
  // WebGL has 0.0 in upper left corner, we need it in the centre and positive x upwards
  vec2 coord = gl_PointCoord.xy;
  coord[1] = 1.0 - coord[1];
  coord = coord - vec2(.5, .5);

  if (length(coord) <= .5) {
    vec2 arrow = vec2(cos(fragmentDirection), sin(fragmentDirection)); // Unit vector along direction
    float projected_length = dot(coord, arrow);
    if (projected_length >= 0.0) {
      vec2 projected = projected_length * arrow; // No division by length(arrow) as arrow is unitary
      vec2 rejected = coord - projected;
      float dist = length(rejected);

      dist = max(0., 1. - dist*15.);
      if (baseColor[3] * dist < 0.1) {
        gl_FragColor = vec4(0., 0., 0., 0.);
      } else {
        gl_FragColor = vec4(baseColor[0], baseColor[1], baseColor[2], 1.);
      }
    } else {
      gl_FragColor = vec4(0., 0., 0., 0.);
    }
  } else {
    gl_FragColor = vec4(0., 0., 0., 0.);
  }
}
