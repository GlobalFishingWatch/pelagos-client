define([
  "require",
  "app/Class",
  "app/Visualization/Animation/Shader",
  "app/Visualization/Animation/Animation",
  "app/Visualization/KeyModifiers",
  "app/Visualization/KeyBindings",
  "app/Bounds"
], function(
  require,
  Class,
  Shader,
  Animation,
  KeyModifiers,
  KeyBindings,
  Bounds
) {
  return Class(Animation, {
    name: "BboxSelection",

    columns: {},

    programSpecs: {
      program: {
        context: "gl",
        vertex: "app/Visualization/Animation/BboxSelection-vertex.glsl",
        fragment: "app/Visualization/Animation/BboxSelection-fragment.glsl",
        columns: []
      }
    },

    initGl: function(cb) {
      var self = this;

      self.bounds = undefined;

      var keys = ['Ctrl'];
      KeyBindings.register(
        keys, 'click and drag', 'Map',
        'Select a region'
      );
      var keyPath = KeyBindings.keysToKeyPath(keys);

      $(self.manager.node).mouseDown(function (e) {
        if (KeyBindings.keysToKeyPath(Object.keys(KeyModifiers.active)) == keyPath) {

          lat, lon;
          self.bounds = new Bounds([lon,lat,lon,lat]);
        }
      });

      Animation.prototype.initGl.call(self, function () {
        Object.values(self.programs).map(function (programs) {
          programs.map(function (program) {
            program.pointArrayBuffer = program.gl.createBuffer();
          });
        });

        cb();
      });
    },

    updateSelection: function () {
      var self = this;

      if (!self.bounds) return;

      self.rawLatLonData = new Float32Array(5*2);
      var bounds = self.bounds.getBounds();
      var i = 0;
      [
        {lat: bounds.top, lon: bounds.left},
        {lat: bounds.top, lon: bounds.right},
        {lat: bounds.bottom, lon: bounds.right},
        {lat: bounds.bottom, lon: bounds.left},
        {lat: bounds.top, lon: bounds.left}
      ].map(function (corner) {
        self.rawLatLonData[i++] = corner.lon;
        self.rawLatLonData[i++] = corner.lat;
      });

      Object.values(self.programs).map(function (programs) {
        programs.map(function (program) {
          program.gl.useProgram(program);
          Shader.programLoadArray(program.gl, program.pointArrayBuffer, self.rawLatLonData, program);
        });
      });
    },

    drawProgram: function (program) {
      var self = this;

      if (!self.bounds) return;

      program.gl.useProgram(program);
      program.gl.uniformMatrix4fv(program.uniforms.googleMercator2webglMatrix, false, self.manager.googleMercator2webglMatrix);
      program.gl.uniform1f(
        program.uniforms.animationidx,
        self.manager.animations.indexOf(self));
      Shader.programBindArray(program.gl, program.pointArrayBuffer, program, "worldCoord", 2, program.gl.FLOAT);
      program.gl.drawArrays(program.gl.LINE_STRIP, 0, 5);
    }
  });
});
