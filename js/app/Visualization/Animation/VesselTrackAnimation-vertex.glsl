#pragma include 'attrmapper';
#pragma include 'app/Visualization/Animation/mercator.glsl';

uniform float width;
uniform float height;
uniform float zoom;

uniform mat4 googleMercator2webglMatrix;

varying float vWeight;
varying vec4 baseColor;


void main() {

  vec2 lonlat = vec2(longitude, latitude);

  gl_Position = lonlat2screen(lonlat, googleMercator2webglMatrix);

    gl_PointSize = 10.0;
    vWeight = 1.0;
    baseColor = vec4(1.0, 0.3, 0.3, 1.0);
}

