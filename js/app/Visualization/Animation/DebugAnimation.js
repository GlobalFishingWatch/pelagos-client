define(["require", "app/Class", "app/Visualization/Animation/Shader", "app/Visualization/Animation/Animation"], function(require, Class, Shader, Animation) {
  var DebugAnimation = Class(Animation, {
    name: "DebugAnimation",

    columns: {
      longitude: {type: "Float32", hidden: true, source: {longitude: 1.0}},
      latitude: {type: "Float32", hidden: true, source: {latitude: 1.0}}
    },

    programSpecs: {
      program: {
        context: "gl",
        vertex: "app/Visualization/Animation/DebugAnimation-vertex.glsl",
        fragment: "app/Visualization/Animation/DebugAnimation-fragment.glsl"
      },
      rowidxProgram: {
        context: "rowidxGl",
        vertex: "app/Visualization/Animation/DebugAnimation-rowidx-vertex.glsl",
        fragment: "app/Visualization/Animation/DebugAnimation-rowidx-fragment.glsl"
      }
    },

    getDrawMode: function (program) {
      var self = this;
      return program.gl.POINTS;
    }
  });
  Animation.animationClasses.DebugAnimation = DebugAnimation;

  return DebugAnimation;
});
