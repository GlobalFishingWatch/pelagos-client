const float pi = 3.14159265358979323846264338327950;

vec4 sphericalMercator(vec2 lonlat) {
  return vec4(
    (lonlat[0] + 180.0) * 256.0 / 360.0,
    128.0 - log(tan((lonlat[1] + 90.0) * pi / 360.0)) * 128.0 / pi,
    0.0,
    1.0);
}

vec4 lonlat2screenspace(vec2 lonlat, mat4 mapMatrix) {
  return mapMatrix * sphericalMercator(lonlat);
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
