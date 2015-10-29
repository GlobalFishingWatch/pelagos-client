precision mediump float;

#pragma include 'app/Visualization/Animation/rowidx.glsl';

uniform float animationidx;
uniform float tileidx;

varying float fragment_rowidx;
varying float alpha;

void main() {
  if (alpha < 0.1) {
    gl_FragColor = rowidxNone;
  } else {
    gl_FragColor = rowidxColor(animationidx, tileidx, floor(fragment_rowidx));
  }
}
