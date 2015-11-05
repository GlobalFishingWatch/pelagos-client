#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';

uniform float width;
uniform float height;
uniform float zoom;

uniform mat4 googleMercator2webglMatrix;

varying float fragment_rowidx;
varying float alpha;

void main() {
  mapper();

  vec2 lonlat = vec2(longitude, latitude);

  gl_Position = lonlat2screen(lonlat, googleMercator2webglMatrix);

  if (_filter > 0.0) {
    alpha = 0.0;
    gl_PointSize = 0.0;
  } else {
    alpha = 1.0;
    gl_PointSize = 3.0;
    fragment_rowidx = rowidx;
  }
}

