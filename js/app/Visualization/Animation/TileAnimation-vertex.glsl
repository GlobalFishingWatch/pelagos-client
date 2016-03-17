#pragma include 'app/Visualization/Animation/mercator.glsl';
attribute vec4 worldCoord;
uniform mat4 googleMercator2webglMatrix;
uniform float tileidx;
uniform float tileidx_selected;
uniform float tileidx_hover;
uniform float status;
varying vec4 baseColor;

void main() {
  if (tileidx == tileidx_selected) {
    baseColor = vec4(1.0, 1.0, 1.0, 1.);
  } else if (tileidx == tileidx_hover) {
    baseColor = vec4(1.0, 0., 1.0, 1.);
  } else {
   if (status == -1.) { /* error */
     baseColor = vec4(1., 0., 0., 1.);
   } else if (status == 0.) { /* pending */
     baseColor = vec4(0., 0., .5, 1.);
   } else if (status == 1.) { /* receiving */
     baseColor = vec4(0., 0., 1., 1.);
   } else if (status == 2.) { /* loaded */
     baseColor = vec4(0., 1., 0., 1.);
   } else { /* BUG!! */
      baseColor = vec4(0., 0., 0., 1.);
   }
  }
  gl_Position = lonlat2screen(vec2(worldCoord[0], worldCoord[1]), googleMercator2webglMatrix);
  gl_PointSize = 4.0;
}
