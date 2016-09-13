#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';

uniform float width;
uniform float height;
uniform float zoom;

uniform mat4 googleMercator2webglMatrix;

varying vec4 baseColor;
varying vec4 focusColor;
varying float pointTime;
varying float timeWindowSize;

void main() {
  mapper();

  timeWindowSize = selectionmap_timerange_from_datetime_0_upper - selectionmap_timerange_from_datetime_0_lower;

  vec2 lonlat = vec2(longitude, latitude);

  gl_Position = lonlat2screen(lonlat, googleMercator2webglMatrix);
  pointTime = _time;

  if (_filter > 0.0) {
    baseColor = vec4(0, 0, 0, 0);
    focusColor = vec4(0, 0, 0, 0);
    gl_PointSize = 0.0;
  } else {
    gl_PointSize = 3.0;

    if (_weight > 0.0) {
      baseColor = vec4(high_red, high_green, high_blue, high_alpha);
    } else {
      baseColor = vec4(low_red, low_green, low_blue, low_alpha);
    }
    focusColor = vec4(focus_red, focus_green, focus_blue, 1.0);
  }
}

