define(["app/Class", "async", "app/Visualization/Shader", "app/Data/GeoProjection", "app/Data/DataView", "jQuery"], function(Class, async, Shader, GeoProjection, DataView, $) {
  var Animation = Class({
    name: "Animation",
    columns: {},
    uniforms: {},
    selections: {
      selected: null,
      info: null,
      hover: null,
      timerange: {sortcols: ["datetime"]}
    },

    programSpecs: {},
    separateSeries: false,

    initialize: function(manager, args) {
      var self = this;

      self.visible = true;
      self.args = args || {};
      if (args) {
        args = $.extend({}, args);
        if (args.columns) {
          $.extend(self.columns, args.columns);
          delete args.columns;
        }
        if (args.uniforms) {
          $.extend(self.uniforms, args.uniforms);
          delete args.uniforms;
        }
        if (args.selections) {
          $.extend(self.selections, args.selections);
          delete args.selections;
        }
        $.extend(self, args);
      }
      self.manager = manager;
      self.dataUpdates = 0;
    },

    setVisible: function (visible) {
      var self = this;
      self.visible = visible;
      self.manager.triggerUpdate();
    },

    handleError: function (error) {
      var self = this;
      self.manager.removeAnimation(self);
    },

    destroy: function () {
      var self = this;
      $(self.rowidxCanvas).remove();
    },

    initGl: function(gl, cb) {
      var self = this;

      self.manager.visualization.data.createView({
        source: self.source,
        columns: self.columns,
        uniforms: self.uniforms,
        selections: self.selections
      }, function (err, data_view) {
        if (err) throw err; // FIXME: Make cb handle cb(err);
        self.data_view = data_view;

        var handleHeader = function () {
          self.gl = gl;

          self.data_view.events.un({
            "header": handleHeader
          });

          self.rowidxCanvas = document.createElement('canvas');

          rowidxCanvas = $(self.rowidxCanvas);
          self.rowidxGl = self.rowidxCanvas.getContext('experimental-webgl', {preserveDrawingBuffer: true});
          self.rowidxGl.enable(self.rowidxGl.BLEND);
          self.rowidxGl.blendFunc(self.rowidxGl.SRC_ALPHA, self.rowidxGl.ONE_MINUS_SRC_ALPHA);
          self.rowidxGl.lineWidth(1.0);

          self.initGlPrograms(cb);
        }

        self.data_view.source.events.on({
          error: self.handleError.bind(self),
          "header": handleHeader
        });
        self.data_view.source.load();
      });
    },

    initGlPrograms: function(cb) {
      var self = this;

      self.programs = {};
      async.map(Object.items(self.programSpecs), function (item, cb) {
        Shader.createShaderProgramFromUrl(
          self[item.value.context],
          require.toUrl(item.value.vertex),
          require.toUrl(item.value.fragment),
          {
            attr0: Object.keys(self.data_view.source.header.colsByName)[0],
            attrmapper: Shader.compileMapping(self.data_view)
          },
          function (program) {
            program.name = item.key;
            program.dataViewArrayBuffers = {};
            self.programs[item.key] = program;
            cb();
          }
        );
      }, cb);
    },

    initUpdates: function(cb) {
      var self = this;
      self.data_view.source.events.on({
        "update": self.triggerDataUpdate.bind(self)
      });
      self.data_view.events.on({
        "update": self.manager.triggerUpdate.bind(self.manager)
      });
      self.triggerDataUpdate();
      cb();
    },

    triggerDataUpdate: function () {
      var self = this;
      if (self.dataUpdateTimeout) return;
      self.dataUpdateTimeout = setTimeout(self.updateData.bind(self), 250);
    },

    updateData: function() {
      var self = this;

      self.dataUpdateTimeout = undefined;
      self.dataUpdates++;

      Object.values(self.programs).map(self.updateDataProgram.bind(self));

      self.manager.triggerUpdate();
    },

    updateDataProgram: function (program) {
      var self = this;

      self.loadDataViewArrayBuffers(program);
    },

    draw: function () {
      var self = this;
      if (!self.visible) return;

      var width = self.manager.canvasLayer.canvas.width;
      var height = self.manager.canvasLayer.canvas.height;
      self.rowidxCanvas.width = width;
      self.rowidxCanvas.height = height;

      self.rowidxGl.viewport(0, 0, width, height);
      self.rowidxGl.clear(self.rowidxGl.COLOR_BUFFER_BIT);

      Object.values(self.programs).map(self.drawProgram.bind(self));
    },

    drawProgram: function (program) {
      var self = this;

      if (program.name == "rowidxProgram" && !self.manager.isPaused())
        return;

      program.gl.useProgram(program);

      self.setGeneralUniforms(program);

      var mode = self.getDrawMode(program);

      var tileidx = 0;
      self.data_view.source.getContent().map(function (tile) {
        program.gl.uniform1f(program.uniforms.tileidx, tileidx);
        tileidx++;

        if (!self.bindDataViewArrayBuffers(program, tile.content)) return;

        if (self.separateSeries) {
          // -1 since series contains POINT_COUNT in the last item
          for (var i = 0; i < tile.content.series.length - 1; i++) {
            if (tile.content.series[i+1]-tile.content.series[i] > 0) {
              program.gl.drawArrays(
                mode,
                tile.content.series[i],
                tile.content.series[i+1]-tile.content.series[i]
              );
            }
          }
        } else {
          program.gl.drawArrays(mode, 0, tile.content.header.length);
        }
      });
    },

    loadDataViewArrayBuffers: function (program) {
      var self = this;

      // Note: We never reaload an existing tile.

      program.gl.useProgram(program);

      var dataViewArrayBuffers = program.dataViewArrayBuffers;
      program.dataViewArrayBuffers = {};

      self.data_view.source.getContent().map(function (tile) {
        if (dataViewArrayBuffers[tile.content.url]) {
          program.dataViewArrayBuffers[tile.content.url] = dataViewArrayBuffers[tile.content.url];
        } else {
          program.dataViewArrayBuffers[tile.content.url] = {};

          Object.keys(tile.content.header.colsByName).map(function (name) {
            program.dataViewArrayBuffers[tile.content.url][name] = program.gl.createBuffer();
            Shader.programLoadArray(program.gl, program.dataViewArrayBuffers[tile.content.url][name], tile.content.data[name], program);
          });
        }
      });
    },

    bindDataViewArrayBuffers: function(program, tile) {
      var self = this;
      if (!program.dataViewArrayBuffers[tile.url]) return false;
      program.gl.useProgram(program);
      for (var name in program.dataViewArrayBuffers[tile.url]) {
        Shader.programBindArray(program.gl, program.dataViewArrayBuffers[tile.url][name], program, name, 1, program.gl.FLOAT);
      };
      return true;
    },

    setGeneralUniforms: function (program) {
      var self = this;
      var time = self.manager.visualization.state.getValue("time");
      var timeExtent = self.manager.visualization.state.getValue("timeExtent");

      if (time == undefined) return;
      time = time.getTime();

      self.data_view.selections.timerange.addDataRange({datetime:time - timeExtent}, {datetime:time}, true, true);
      program.gl.uniform1f(program.uniforms.zoom, self.manager.map.zoom);
      program.gl.uniform1f(program.uniforms.width, self.manager.canvasLayer.canvas.width);
      program.gl.uniform1f(program.uniforms.height, self.manager.canvasLayer.canvas.height);

      // pointSize range [5,20], 21 zoom levels
      var pointSize = Math.max(
        Math.floor( ((20-5) * (self.manager.map.zoom - 0) / (21 - 0)) + 5 ),
        ((self.manager.visualization.state.getValue("resolution") || 1000)
         / GeoProjection.metersPerGoogleMercatorAtLatitude(
             self.manager.map.getCenter().lat(),
             self.manager.map.zoom)));

      program.gl.uniform1f(program.uniforms.pointSize, pointSize*1.0);
      program.gl.uniformMatrix4fv(program.uniforms.googleMercator2webglMatrix, false, self.manager.googleMercator2webglMatrix);

      Shader.setMappingUniforms(program, self.data_view);
    },

    /* Uses the rowidxGl canvas to get a source data rowid from a
     * pixel x/y position. Rowidx is encoded into RGB (in that order),
     * with 1 added to the rowidx. 0 encodes no row drawn on that
     * pixel. */
    getRowidxAtPos: function (x, y, radius) {
      var self = this;

      /* Canvas coordinates are upside down for some reason... */
      y = self.manager.canvasLayer.canvas.height - y;

      if (radius == undefined) radius = 4;

      var size = radius * 2 + 1;

      var data = new Uint8Array(4*size*size);
      self.rowidxGl.readPixels(x-radius, y-radius, size, size, self.rowidxGl.RGBA, self.rowidxGl.UNSIGNED_BYTE, data);

      var pixelToId = function (offset) {
        var tileidx = data[offset];
        var rowidx = ((data[offset+1] << 8) | data[offset+2]) - 1;
        if (rowidx == -1) return undefined;
        return [tileidx, rowidx];
      }

      var rowIdx = [];
      for (var i = 0; i < size*size; i++) {
        rowIdx.push(pixelToId(i * 4));
      }

      var last = undefined;
      var lastradius = 0;
      for (var oy = 0; oy < size; oy++) {
        for (var ox = 0; ox < size; ox++) {
          var r = Math.sqrt(Math.pow(Math.abs(ox - size + 0.5), 2) + Math.pow(Math.abs(oy - size + 0.5), 2))
          if (rowIdx[oy*size+ox] != undefined && (r <= lastradius || last == undefined)) {
            last = rowIdx[oy*size+ox];
            lastradius = r;
          }
        }
      }

      return last;
    },

    select: function (x, y, type, replace) {
      var self = this;
      var rowidx = self.getRowidxAtPos(x, y);
      self.data_view.addSelectionRange(type, rowidx, rowidx, replace);
      return rowidx;
    },

    search: function (query, cb) {
      var self = this;
      if (self.data_view && self.data_view.source.search) {
        self.data_view.source.search(query, function (err, res) {
          if (err) {
            cb(err, res)
          } else {
            cb(
              err,
              res.map(function (item) {
                item.animation = self;
                return item;
              })
            );
          }
        });
      } else {
        cb(null, []);
      }
    },

    toString: function () {
      var self = this;
      return self.name + ": " + self.data_view;
    },

    toJSON: function () {
      var self = this;
      var args = self.data_view.toJSON();
      args.title = self.title;
      args.visible = self.visible;
      args.source = self.source;
      return {
        args: _.extend({}, self.args, args),
        "type": self.name
      };
    }
  });

  Animation.animationClasses = {};

  return Animation;
});
