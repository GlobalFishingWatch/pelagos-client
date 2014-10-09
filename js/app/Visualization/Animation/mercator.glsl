/*
  Use google maps Mercator projection to convert from lat, lng to
  x, y coords in the range x:0-256, y:0-256
*/

const float pi = 3.14159265358979323846264338327950;

vec4 lonLatInGoogleMercator(vec2 lonlat) {
  return vec4(
    (lonlat[0] + 180.0) * 256.0 / 360.0,
    128.0 - log(tan((lonlat[1] + 90.0) * pi / 360.0)) * 128.0 / pi,
    0.0,
    1.0);
}

vec2 googleMercatorInLonLat(vec4 xy) {
  return vec2(
    xy[0] * 360.0 / 256.0 - 180.0,
    atan(exp((128.0 - xy[1]) * pi / 128.0)) * 360.0 / pi - 90.0);
}

float circumferenceOfEarthAtLatitudeInMeters(float latitude) {
  return cos(latitude * pi/180.0) * 40075017.0;
}
  
float circumferenceOfEarthInGoogleMercator(float zoom) {
  return 256.0 * pow(2.0, zoom);
}

float metersPerGoogleMercatorAtLatitude(float latitude, float zoom) {
  return (  circumferenceOfEarthAtLatitudeInMeters(latitude)
          / circumferenceOfEarthInGoogleMercator(zoom));
}

/* Convert lonlat to webgl coordinates */

vec4 lonlat2screenspace(vec2 lonlat, mat4 mapMatrix) {
  return mapMatrix * lonLatInGoogleMercator(lonlat);
}

vec4 lonlat2screen(vec2 lonlat, mat4 mapMatrix) {
  vec4 pos = lonlat2screenspace(lonlat, mapMatrix);

  if (pos[0] < -1.0) {
    lonlat[0] += 360.0;
    pos = lonlat2screenspace(lonlat, mapMatrix);
  }
  if (pos[0] > 1.0) {
    lonlat[0] -= 360.0;
    pos = lonlat2screenspace(lonlat, mapMatrix);
  }
  return pos;
}
