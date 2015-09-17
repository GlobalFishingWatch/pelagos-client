#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';
#pragma include 'app/Visualization/Animation/rowidx.glsl';

uniform float pointSize;

uniform mat4 googleMercator2webglMatrix;

uniform float tileidx;
uniform float animationidx;
uniform float width;

varying float vPointSize;
varying float vSigma;
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
    baseColor = rowidxNone;
  } else if (_weight < 0.0) {
    gl_PointSize = 1.0;
    vWeight = _weight;
    baseColor = rowidxColor(animationidx, tileidx, rowidx);
  } else {
    float ps = 0.005; // In WebGL units

    float webglSigma = latLonDistanceToWebGL(_sigma, lonlat, googleMercator2webglMatrix);

    float radius = ps + 2.5 * webglSigma;
    float areaScale = ps*ps / (radius*radius);

    gl_PointSize = pixelsPerWebGlX * radius;
    if (gl_PointSize > 5.0) {gl_PointSize = 5.0;}

    vWeight = areaScale * _weight;

    baseColor = rowidxColor(animationidx, tileidx, rowidx);
  }
}



