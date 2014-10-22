define(["require", "app/Class", "app/Data/GeoProjection", "app/Visualization/Shader", "app/Visualization/Animation/Animation"], function(require, Class, GeoProjection, Shader, Animation) {
  var TileAnimation = Class(Animation, {
    name: "TileAnimation",

    columns: {},

    programSpecs: {
      program: {
        context: "gl",
        vertex: "app/Visualization/Animation/TileAnimation-vertex.glsl",
        fragment: "app/Visualization/Animation/TileAnimation-fragment.glsl",
        columns: []
      }
    },

    initGl: function(gl, cb) {
      var self = this;
      Animation.prototype.initGl.call(self, gl, function () {
        self.pointArrayBuffer = self.gl.createBuffer();

        cb();
      });
    },

    updateData: function() {
      var self = this;
      var tiles = self.data_view.source.getContent();

      self.rawLatLonData = new Float32Array(tiles.length*5*2);
      self.tilecount = tiles.length;

      var i = 0;
      tiles.map(function (tile) {
        var corners = [
          {lat: tile.bounds.top, lon: tile.bounds.left},
          {lat: tile.bounds.top, lon: tile.bounds.right},
          {lat: tile.bounds.bottom, lon: tile.bounds.right},
          {lat: tile.bounds.bottom, lon: tile.bounds.left},
          {lat: tile.bounds.top, lon: tile.bounds.left}];
        corners.map(function (corner) {
          var pixel = GeoProjection.lonLatInGoogleMercator(corner);
          self.rawLatLonData[i++] = pixel.x;
          self.rawLatLonData[i++] = pixel.y;
        });
      });

      self.gl.useProgram(self.programs.program);
      Shader.programLoadArray(self.gl, self.pointArrayBuffer, self.rawLatLonData, self.programs.program);
      Animation.prototype.updateData.call(self);
    },

    draw: function () {
      var self = this;

      self.gl.useProgram(self.programs.program);

      Shader.programBindArray(self.gl, self.pointArrayBuffer, self.programs.program, "worldCoord", 2, self.gl.FLOAT);

      self.gl.uniformMatrix4fv(self.programs.program.uniforms.googleMercator2webglMatrix, false, self.manager.googleMercator2webglMatrix);

      for (var i = 0; i < self.tilecount; i++) {
        self.gl.drawArrays(self.gl.LINE_STRIP, i*5, 5);
      }
    }
  });
  Animation.animationClasses.TileAnimation = TileAnimation;

  return TileAnimation;
});
