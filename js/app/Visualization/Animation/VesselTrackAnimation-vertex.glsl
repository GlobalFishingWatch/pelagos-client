#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';

uniform float width;
uniform float height;
uniform float zoom;

uniform mat4 googleMercator2webglMatrix;

varying float vWeight;
varying vec4 baseColor;


void main() {
  mapper();

  vec2 lonlat = vec2(longitude, latitude);

  gl_Position = lonlat2screen(lonlat, googleMercator2webglMatrix);

  if (_filter > 0.0) {
    baseColor = vec4(0, 0, 0, 0);
    gl_PointSize = 0.0;
  } else {
    gl_PointSize = 1.0;
    baseColor = vec4(0.5, 0.5, 1.0, 1.0);
  }
}

