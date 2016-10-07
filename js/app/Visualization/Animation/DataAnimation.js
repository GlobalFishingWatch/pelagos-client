define([
  "app/Class",
  "app/Events",
  "shims/async/main",
  "app/UrlValues",
  "app/Visualization/Animation/Animation",
  "app/Visualization/Animation/GlAnimation",
  "app/Visualization/Animation/Shader",
  "app/Data/GeoProjection",
  "app/Data/DataView",
  "shims/jQuery/main"
], function(
  Class,
  Events,
  async,
  UrlValues,
  Animation,
  GlAnimation,
  Shader,
  GeoProjection,
  DataView,
  $
) {
  var DataAnimation = Class(GlAnimation, {
    name: "DataAnimation",
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
      }
      self.dataUpdates = 0;

      Animation.prototype.initialize.call(self, manager, args);
    },

    destroy: function () {
      var self = this;

      GlAnimation.prototype.destroy.apply(self, arguments);

      if (self.data_view) {
        self.manager.visualization.data.destroyView(self.data_view, self.source);
      }
    },

    initGl: function(cb) {
      var self = this;

      self.source.args.url = UrlValues.realpath(self.manager.visualization.workspaceUrl, self.source.args.url);

      self.manager.visualization.data.createView({
        source: self.source,
        columns: self.columns,
        uniforms: self.uniforms,
        selections: self.selections
      }, function (err, data_view) {
        if (err) return cb(err);

        self.data_view = data_view;

        var handleHeader = function () {
          if (self.data_view.source.header.empty) {
            self.manager.removeAnimation(self);
            return;
          }

          self.data_view.source.events.un({
            "header": handleHeader
          });

          self.initGlPrograms(cb);
        }

        var handleError = function (err) {
          self.handleError(err);
          cb(err);
        }

        self.data_view.source.events.on({
          error: handleError,
          "header": handleHeader
        });
        self.data_view.source.load();
      });
    },

    getProgramContext: function (programName, programSpec) {
      var self = this;
      return {
        attr0: Object.keys(self.data_view.source.header.colsByName)[0],
        attrmapper: Shader.compileMapping(self.data_view)
      };
    },

    initUpdates: function(cb) {
      var self = this;
      self.data_view.source.events.on({
        "update": self.triggerDataUpdate.bind(self)
      });
      self.data_view.selections.events.on({
        "update": self.manager.triggerUpdate.bind(self.manager, {mouseoverChange: false})
      });
      self.data_view.events.on({
        "update": self.manager.triggerUpdate.bind(self.manager)
      });
      self.triggerDataUpdate();
      cb();
    },

    updateDataProgram: function (program) {
      var self = this;

      self.loadDataViewArrayBuffers(program);
    },

    drawProgram: function (program, idx) {
      var self = this;

      if (program.name == "rowidxProgram" && (self.manager.indrag || !self.manager.isPaused()))
        return;

      GlAnimation.prototype.drawProgram.apply(self, arguments);
      var mode = self.getDrawMode(program);

      var tileidx = 0;
      self.data_view.source.getContent().map(function (tile) {
        program.gl.uniform1f(program.uniforms.tileidx, tileidx);
        tileidx++;

        if (!self.bindDataViewArrayBuffers(program, tile.content)) return;

        if (self.separateSeries) {
          // -1 since series contains POINT_COUNT in the last item
          for (var i = 0; i < tile.content.series.length - 1; i++) {
            var start = tile.content.series[i];
            var length = tile.content.series[i+1]-tile.content.series[i];

            if (length > 0 && (mode != program.gl.LINE_STRIP || length > 1)) {
              program.gl.drawArrays(mode, start, length);
            }
          }
        } else {
          program.gl.drawArrays(mode, 0, tile.content.header.length);
        }
        Shader.disableArrays(program);
      });
    },

    loadDataViewArrayBuffers: function (program) {
      var self = this;

      // Note: We never reaload an existing tile.

      program.gl.useProgram(program);

      var dataViewArrayBuffers = program.arrayBuffers;
      program.arrayBuffers = {};

      self.data_view.source.getContent().map(function (tile) {
        if (dataViewArrayBuffers[tile.content.url]) {
          program.arrayBuffers[tile.content.url] = dataViewArrayBuffers[tile.content.url];
        } else {
          program.arrayBuffers[tile.content.url] = {};

          Object.keys(tile.content.header.colsByName).map(function (name) {
            program.arrayBuffers[tile.content.url][name] = program.gl.createBuffer();
            Shader.programLoadArray(program.gl, program.arrayBuffers[tile.content.url][name], tile.content.data[name], program);
          });
        }
      });
    },

    bindDataViewArrayBuffers: function(program, tile) {
      var self = this;
      if (!program.arrayBuffers[tile.url]) return false;
      program.gl.useProgram(program);
      for (var name in program.attributes) {
        Shader.programBindArray(program.gl, program.arrayBuffers[tile.url][name], program, name, 1, program.gl.FLOAT);
      };
      return true;
    },

    setGeneralUniforms: function (program, idx) {
      var self = this;

      GlAnimation.prototype.setGeneralUniforms.apply(self, arguments);

      var time = self.manager.visualization.state.getValue("time");

      if (time == undefined) return;
      time = time.getTime();
      var timeExtent = self.manager.visualization.state.getValue("timeExtent");
      self.data_view.selections.selections.timerange.addDataRange({datetime:time - timeExtent}, {datetime:time}, true, true);

      Shader.setMappingUniforms(program, self.data_view);
    },

    select: function (rowidx, type, replace, event) {
      var self = this;
      self.data_view.selections.addSelectionRange(type, rowidx, rowidx, replace);
      return rowidx;
    },

    search: function (query, offset, limit, cb) {
      var self = this;
      if (self.data_view && self.data_view.source.search) {
        self.data_view.source.search(query, offset, limit, function (err, res) {
          if (err) {
            cb(err, res)
          } else {
            res.entries = res.entries.map(function (item) {
              return {
                data: item,
                animation: self
              }
            });
            cb(err, res);
          }
        });
      } else {
        cb(null, null);
      }
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
  DataAnimation.animationClasses = Animation.animationClasses;

  return DataAnimation;
});
