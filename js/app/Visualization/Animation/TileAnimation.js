define([
  "require",
  "app/Class",
  "app/Visualization/Animation/Shader",
  "app/Visualization/Animation/DataAnimation",
  "./ObjectToTable"
], function(
  require,
  Class,
  Shader,
  DataAnimation,
  ObjectToTable
) {
  var TileAnimation = Class(DataAnimation, {
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

    initGl: function(cb) {
      var self = this;

      self.selections = {
        hover: -1,
        selected: -1};

      DataAnimation.prototype.initGl.call(self, function () {
        Object.values(self.programs).map(function (programs) {
          programs.map(function (program) {
            program.pointArrayBuffer = program.gl.createBuffer();
          });
        });

        cb();
      });
    },

    updateData: function() {
      var self = this;
      self.tiles = Object.values(
        self.data_view.source.tileCache
      );

      self.rawLatLonData = new Float32Array(self.tiles.length*5*2);
      self.tilecount = self.tiles.length;

      var i = 0;
      self.tiles.map(function (tile) {
        var bounds = tile.bounds.getBounds();
        var height = bounds.top - bounds.bottom;
        var width = bounds.right - bounds.left;
        var marginy = height / 50;
        var marginx = width / 50;

        var corners = [
          {lat: bounds.top - marginy, lon: bounds.left + marginx},
          {lat: bounds.top - marginy, lon: bounds.right - marginx},
          {lat: bounds.bottom + marginy, lon: bounds.right - marginx},
          {lat: bounds.bottom + marginy, lon: bounds.left + marginx},
          {lat: bounds.top - marginy, lon: bounds.left + marginx}];
        corners.map(function (corner) {
          self.rawLatLonData[i++] = corner.lon;
          self.rawLatLonData[i++] = corner.lat;
        });
      });

      Object.values(self.programs).map(function (programs) {
        programs.map(function (program) {
          program.gl.useProgram(program);
          Shader.programLoadArray(program.gl, program.pointArrayBuffer, self.rawLatLonData, program);
        });
      });
      DataAnimation.prototype.updateData.call(self);
    },

    drawProgram: function (program) {
      var self = this;

      program.gl.useProgram(program);
      Shader.programBindArray(program.gl, program.pointArrayBuffer, program, "worldCoord", 2, program.gl.FLOAT);
      program.gl.uniformMatrix4fv(program.uniforms.googleMercator2webglMatrix, false, self.manager.googleMercator2webglMatrix);

      program.gl.uniform1f(
        program.uniforms.animationidx,
        self.manager.animations.indexOf(self));

      for (var i = 0; i < self.tilecount; i++) {

        program.gl.uniform1f(program.uniforms.tileidx_selected, self.selections.selected);
        program.gl.uniform1f(program.uniforms.tileidx_hover, self.selections.hover);
        program.gl.uniform1f(program.uniforms.tileidx, i);
        program.gl.uniform1f(
          program.uniforms.status,
          {
            error: -1,
            pending: 0,
            receiving: 1,
            loaded: 2
          }[self.tiles[i].getStatus()]
        );

        program.gl.drawArrays(program.gl.LINE_STRIP, i*5, 5);
      }
    },

    select: function (rowidx, type, replace, event) {
      var self = this;
      var tileidx = rowidx ? rowidx[0] : -1;

      self.selections[type] = tileidx;

      if (tileidx != -1) {
        var data = {
          tile: self.tiles[tileidx].printTree({}),
          toString: function () {
            return ObjectToTable(this);
          }
        };

        if (event.pageX != undefined) {
          var offset = self.manager.node.offset();
          x = event.pageX - offset.left;
          y = event.pageY - offset.top;
        } else {
          x = event.pixel.x;
          y = event.pixel.y;
        }

        var latlng = self.manager.map.getProjection().fromPointToLatLng(new google.maps.Point(x, y));

        var selectionData = {
          latitude: latlng[0],
          longitude: latlng[1]
        };

        if (type != 'hover') {
          self.manager.handleInfo(self, type, undefined, data, selectionData);
        }
        self.manager.triggerUpdate();
        return true;
      }
      self.manager.triggerUpdate();
      return false;
    }
  });
  DataAnimation.animationClasses.TileAnimation = TileAnimation;

  return TileAnimation;
});
