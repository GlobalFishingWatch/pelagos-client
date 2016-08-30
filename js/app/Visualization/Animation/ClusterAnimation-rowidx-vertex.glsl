#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';
#pragma include 'app/Visualization/Animation/rowidx.glsl';

uniform float tileidx;
uniform float animationidx;

uniform float width;
uniform float zoom;

uniform mat4 googleMercator2webglMatrix;

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
    gl_PointSize = 3.0;
    vWeight = _weight;
    baseColor = rowidxColor(animationidx, tileidx, rowidx);
  } else {
    float ps = 7.0 ; // In pixels

    float pixelSigma = pixelsPerWebGlX * latLonDistanceToWebGL(_sigma, lonlat, googleMercator2webglMatrix);

    float radius = ps + 2.5 * pixelSigma;
    float areaScale = ps*ps / (radius*radius);

    gl_PointSize = radius;
    if (gl_PointSize > 8.0) {gl_PointSize = 8.0;}

    if (zoom >= heatmap_zoom) {
      vWeight = -1.;
      gl_PointSize = gl_PointSize / 2.0;
    } else {
      if (_weight > 1.0)
          _weight = (log(_weight)/log(4.0)) + 1.0;

      vWeight = areaScale * _weight;
    }

    gl_PointSize += 2.0;
    baseColor = rowidxColor(animationidx, tileidx, rowidx);
  }
}



