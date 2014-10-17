#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';

uniform float startTime;
uniform float endTime;
uniform float pointSize;

uniform mat4 mapMatrix;

varying float vPointSize;
varying float vSigma;
varying float vWeight;

void main() {
  mapper();

  gl_Position = lonlat2screen(vec2(_longitude, _latitude), mapMatrix);

  if (_filter > 0.0) {
    gl_PointSize = 0.0;
    vPointSize = 0.0;
    vSigma = 0.0;
    vWeight = 0.0;
  } else {
    gl_PointSize = sqrt(pointSize * pointSize + pow(_sigma * pointSize * 5., 2.));
    vPointSize = pointSize;
    vSigma = _sigma;
    vWeight = _weight;
  }
}
