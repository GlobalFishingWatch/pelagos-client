define([
  "app/Class",
  "app/Events",
  "shims/async/main",
  "app/UrlValues",
  "app/Visualization/Animation/Animation",
  "app/Visualization/Animation/Shader",
  "app/Visualization/Animation/ObjectToTable",
  "app/Data/GeoProjection",
  "app/Data/DataView",
  "shims/lodash/main",
  "shims/jQuery/main"
], function(
  Class,
  Events,
  async,
  UrlValues,
  Animation,
  Shader,
  ObjectToTable,
  GeoProjection,
  DataView,
  _,
  $
) {
  var DataAnimation = Class(Animation, {
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

    setVisible: function (visible) {
      var self = this;
      Animation.prototype.setVisible.call(self, visible);
      self.manager.triggerUpdate();
    },

    destroy: function () {
      var self = this;
      // Destroy all we can explicitly, waiting for GC can take
      // forever, and until then other animations might not get
      // GL resources...
      for (var programname in self.programs) {
        var programs = self.programs[programname];
        for (var i = 0; i < programs.length; i++) {
          var program = programs[i];
          for (var sourcename in program.dataViewArrayBuffers) {
            var source = program.dataViewArrayBuffers[sourcename];
            for (var buffername in source) {
              var buffer = source[buffername];
              program.gl.deleteBuffer(buffer);
            }
          }
          program.gl.deleteProgram(program);
        }
      }
      self.programs = {};

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

    initGlPrograms: function(cb) {
      var self = this;

      self.programs = {};
      async.map(Object.items(self.programSpecs), function (item, cb) {
        var programName = item.key;
        var programSpec = item.value;

        var gls = self.manager[programSpec.context];
        if (!gls.length) gls = [gls];

        async.map(
          gls,
          function (gl, cb) {
            Shader.createShaderProgramFromUrl(
              gl,
              require.toUrl(programSpec.vertex),
              require.toUrl(programSpec.fragment),
              {
                attr0: Object.keys(self.data_view.source.header.colsByName)[0],
                attrmapper: Shader.compileMapping(self.data_view)
              },
              function (program) {
                program.name = programName;
                program.dataViewArrayBuffers = {};
                cb(null, program);
              }
            );
          },
          function (err, programs) {
            if (!err) {
              self.programs[programName] = programs;
            }
            cb(err);
          }
        );
      }, cb);
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

    triggerDataUpdate: function () {
      var self = this;
      if (self.dataUpdateTimeout) return;
      self.dataUpdateTimeout = setTimeout(self.updateData.bind(self), 250);
    },

    updateData: function() {
      var self = this;

      self.dataUpdateTimeout = undefined;
      self.dataUpdates++;

      Object.values(self.programs).map(function (programs) {
        programs.map(self.updateDataProgram.bind(self));
      });

      self.manager.triggerUpdate();
    },

    updateDataProgram: function (program) {
      var self = this;

      self.loadDataViewArrayBuffers(program);
    },

    draw: function (gl) {
      /* If gl is given, only draw on gl, else on all canvases */

      var self = this;
      if (!self.visible) return;

      Object.values(self.programs).map(function (programs) {
        programs.map(function (program, idx) {
          if (gl !== undefined && gl !== program.gl) return;
          self.drawProgram(program, idx);
        });
      });
    },

    setBlendFunc: function(program) {
      var self = this;
      var gl = program.gl;
      var blend = self.programSpecs[program.name].blend;

      if (!blend) {
        if (program.name == "rowidxProgram") {
          blend = {src:"SRC_ALPHA", dst:"ONE_MINUS_SRC_ALPHA"};
        } else {
          blend = {src:"SRC_ALPHA", dst:"ONE"};
        }
      }
      gl.blendFunc(gl[blend.src], gl[blend.dst]);
    },

    drawProgram: function (program, idx) {
      var self = this;

      if (program.name == "rowidxProgram" && (self.manager.indrag || !self.manager.isPaused()))
        return;

      program.gl.useProgram(program);
      self.setBlendFunc(program);

      self.setGeneralUniforms(program);

      var mode = self.getDrawMode(program);

      program.gl.uniform1f(
        program.uniforms.animationidx,
        self.manager.animations.indexOf(self));
      program.gl.uniform1f(program.uniforms.canvasIndex, idx);
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
      for (var name in program.attributes) {
        Shader.programBindArray(program.gl, program.dataViewArrayBuffers[tile.url][name], program, name, 1, program.gl.FLOAT);
      };
      return true;
    },

    setGeneralUniforms: function (program) {
      var self = this;
      var time = self.manager.visualization.state.getValue("time");
      var timeExtent = self.manager.visualization.state.getValue("timeExtent");
      var timeFocus = self.manager.visualization.state.getValue("timeFocus");

      if (time == undefined) return;
      time = time.getTime();

      self.data_view.selections.selections.timerange.addDataRange({datetime:time - timeExtent}, {datetime:time}, true, true);
      program.gl.uniform1f(program.uniforms.timefocus, timeFocus);
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

    getSelectionInfo: function (type, cb) {
      var self = this;
      var dataView = self.data_view;
      var selection;
      if (type !== undefined) selection = dataView.selections.selections[type];

      if (selection && selection.rawInfo) {
        var data = _.clone(selection.data);

        Object.items(dataView.source.header.colsByName).map(function (item) {
          if (item.value.choices) {
            var choices = Object.invert(item.value.choices);
            data[item.key] = data[item.key].map(function (dataValue) {
              return choices[dataValue];
            });
          }
        });

        data.layer = self.title;
        data.toString = function () {
          return ObjectToTable(this);
        };
        cb(null, data);
      } else if (selection && !selection.hasSelectionInfo()) {
        var data = {
          layer: self.title,
          toString: function () {
            return 'There are multiple vessels at this location. Zoom in to see individual points.';
          }
        };
        cb(null, data);
      } else {
        if (type == 'selected' && selection && !selection.rawInfo) {
          self.manager.showSelectionAnimations(self, selection);
        }
        dataView.selections.getSelectionInfo(type, function (err, data) {
          var content;

          if (data) {
            // FIXME: Wait, what? What about ObjectToTable?!?!
            data.toString = function () {
              var content = ["<table class='table table-striped table-bordered'>"];
              if (data.name) {
                var name = data.name;
                if (data.link) {
                  name = "<a target='_new' href='" + data.link + "'>" + name + "</a>";
                }
                content.push("<tr><th colspan='2'>" + name + "</th><tr>");
              }

              Object.keys(data).sort().map(function (key) {
                if (key == 'toString' || key == 'name' || key == 'link') return;
                if (typeof(data[key])=="string" && data[key].indexOf("://") != -1) {
                  content.push("<tr><th colspan='2'><a target='_new' href='" + data[key] +  "'>" + key + "</a></th></tr>");
                } else {
                  content.push("<tr><th>" + key + "</th><td>" + data[key] + "</td></tr>");
                }
              });

              content.push("</table>");

              return content.join('\n');
            };
            cb(null, data);
          } else {
            cb(err, null);
          }
        });

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
