define(["require", "app/Class", "app/Data/GeoProjection", "app/Visualization/Animation/Shader", "app/Visualization/Animation/Animation"], function(require, Class, GeoProjection, Shader, Animation) {
  var TileAnimation = Class(Animation, {
    name: "TileAnimation",

    columns: {},

    programSpecs: {
      program: {
        context: "gl",
        vertex: "app/Visualization/Animation/TileAnimation-vertex.glsl",
        fragment: "app/Visualization/Animation/TileAnimation-fragment.glsl",
        columns: []
      },
      rowidxProgram: {
        context: "rowidxGl",
        vertex: "app/Visualization/Animation/TileAnimation-rowidx-vertex.glsl",
        fragment: "app/Visualization/Animation/TileAnimation-rowidx-fragment.glsl"
      }
    },

    initGl: function(gl, cb) {
      var self = this;
      Animation.prototype.initGl.call(self, gl, function () {
        Object.values(self.programs).map(function (program) {
          program.pointArrayBuffer = program.gl.createBuffer();
        });

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
      Object.values(self.programs).map(function (program) {
        Shader.programLoadArray(program.gl, program.pointArrayBuffer, self.rawLatLonData, program);
      });
      Animation.prototype.updateData.call(self);
    },

    drawProgram: function (program) {
      var self = this;

      program.gl.useProgram(program);
      Shader.programBindArray(program.gl, program.pointArrayBuffer, program, "worldCoord", 2, program.gl.FLOAT);
      program.gl.uniformMatrix4fv(program.uniforms.googleMercator2webglMatrix, false, self.manager.googleMercator2webglMatrix);

      for (var i = 0; i < self.tilecount; i++) {
        program.gl.uniform1f(program.uniforms.tileidx, i);
        program.gl.drawArrays(program.gl.LINE_STRIP, i*5, 5);
      }
    },


/*
    select: function (x, y, type, replace) {
      var self = this;
      var rowidx = self.getRowidxAtPos(x, y);

      console.log(rowidx);
    },
*/
  });
  Animation.animationClasses.TileAnimation = TileAnimation;

  return TileAnimation;
});
