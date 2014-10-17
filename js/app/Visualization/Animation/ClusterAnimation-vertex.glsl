#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';

uniform float width;
uniform float height;
uniform float zoom;

uniform mat4 googleMercator2webglMatrix;

varying float vWeight;

float latLonDistanceToWebGL(float distance, vec2 lonlat, mat4 googleMercator2webglMatrix) {
  return length(lonlat2screenspace(vec2(lonlat[0], lonlat[1] + distance),
                                   googleMercator2webglMatrix)
                - lonlat2screenspace(lonlat,
                                     googleMercator2webglMatrix));
}

void main() {
  mapper();

  float pixelsPerWebGlX = width / 2.0;
  vec2 lonlat = vec2(_longitude, _latitude);

  gl_Position = lonlat2screen(lonlat, googleMercator2webglMatrix);

  if (_filter > 0.0) {
    gl_PointSize = 0.0;
    vWeight = 0.0;
  } else {
    float ps = 0.5;
    // float radius = ps + _sigma;
    float radius = ps + 2.5 * _sigma;
    float areaScale = ps*ps / (radius*radius);

    gl_PointSize = pixelsPerWebGlX * latLonDistanceToWebGL(radius, lonlat, googleMercator2webglMatrix);

    vWeight = areaScale * _weight;
  }
}
