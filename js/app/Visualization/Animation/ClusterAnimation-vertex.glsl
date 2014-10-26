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

  float pixelsPerWebGlX = width / 2.0;
  vec2 lonlat = vec2(_longitude, _latitude);

  gl_Position = lonlat2screen(lonlat, googleMercator2webglMatrix);

  if (_filter > 0.0) {
    gl_PointSize = 0.0;
    vWeight = 0.0;
    baseColor = vec4(0.0, 0.0, 0.0, 0.0);
  } else {
    float ps = 0.005; // In WebGL units

    float webglSigma = latLonDistanceToWebGL(_sigma, lonlat, googleMercator2webglMatrix);

    float radius = ps + 2.5 * webglSigma;
    float areaScale = ps*ps / (radius*radius);

    gl_PointSize = pixelsPerWebGlX * radius;
    if (gl_PointSize > 5.0) {gl_PointSize = 5.0;}

    vWeight = areaScale * _weight;

    if (scaled_selected == 1.0)
        baseColor = vec4(0.0, 0.0, 1.0, 1.0);
    else if (scaled_hover == 1.0)
        baseColor = vec4(1.0, 0.0, 1.0, 1.0);
    else
        baseColor = vec4(1.0, 0.3, 0.1, 1.0);
  }
}

