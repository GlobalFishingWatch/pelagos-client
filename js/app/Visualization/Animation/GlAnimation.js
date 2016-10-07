define([
  "app/Class",
  "app/Events",
  "shims/async/main",
  "app/UrlValues",
  "app/Visualization/Animation/Animation",
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
  Shader,
  GeoProjection,
  DataView,
  $
) {
  return Class(Animation, {
    name: "GlAnimation",

    programSpecs: {},

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
          for (var sourcename in program.arrayBuffers) {
            var source = program.arrayBuffers[sourcename];
            for (var buffername in source) {
              var buffer = source[buffername];
              program.gl.deleteBuffer(buffer);
            }
          }
          program.gl.deleteProgram(program);
        }
      }
      self.programs = {};
    },

    initGl: function(cb) {
      var self = this;
      self.initGlPrograms(cb);
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
              self.getProgramContext(programName, programSpec),
              function (program) {
                program.name = programName;
                program.arrayBuffers = {};
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

    getProgramContext: function (programName, programSpec) {
      var self = this;
      return {};
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

      self.setGeneralUniforms(program, idx);
    },

    setGeneralUniforms: function (program, idx) {
      var self = this;

      program.gl.uniform1f(
        program.uniforms.animationidx,
        self.manager.animations.indexOf(self));
      program.gl.uniform1f(program.uniforms.canvasIndex, idx);
      program.gl.uniformMatrix4fv(
        program.uniforms.googleMercator2webglMatrix,
        false,
        self.manager.googleMercator2webglMatrix);

      var timeFocus = self.manager.visualization.state.getValue("timeFocus");
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
    }
  });
});
