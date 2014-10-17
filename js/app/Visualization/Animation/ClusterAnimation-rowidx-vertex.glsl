#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';
#pragma include 'app/Visualization/Animation/rowidx.glsl';

uniform float pointSize;

uniform mat4 mapMatrix;

uniform float tileidx;

varying float vPointSize;
varying float vSigma;
varying float vWeight;
varying vec4 baseColor;

void main() {
  mapper();

  gl_Position = lonlat2screen(vec2(_longitude, _latitude), mapMatrix);
  baseColor = rowidxColor(tileidx, rowidx);

  if (_filter > 0.0) {
    gl_PointSize = 0.0;
    vPointSize = 0.0;
    vSigma = 0.0;
    vWeight = 0.0;
    baseColor = vec4(0, 0, 0, 0);
  } else {
    gl_PointSize = sqrt(pointSize * pointSize + pow(_sigma * pointSize * 5., 2.));
    vPointSize = pointSize;
    vSigma = _sigma;
    vWeight = _weight;
  }
}
