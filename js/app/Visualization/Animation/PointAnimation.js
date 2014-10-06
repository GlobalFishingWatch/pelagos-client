define(["require", "app/Class", "app/Visualization/Shader", "app/Visualization/Animation/Animation", "jQuery"], function(require, Class, Shader, Animation, $) {
  var PointAnimation = Class(Animation, {
    name: "PointAnimation",

    columns: {
      longitude: {type: "Float32", hidden: true, source: {longitude: 1.0}},
      latitude: {type: "Float32", hidden: true, source: {latitude: 1.0}},
      red: {type: "Float32", source: {score: 0.85, _:-0.1, hover:1.0, selected:1.0}, min: 0.0, max: 1.0},
      green: {type: "Float32", source: {_: 0.3, hover:1.0, selected:1.0}, min: 0.0, max: 1.0},
      blue: { type: "Float32", source: {_: 0.0, hover:1.0, selected:1.0}, min: 0.0, max: 1.0},
      alpha: {type: "Float32", source: {_: 1.0}, min: 0.0, max: 1.0},
      magnitude: {type: "Float32", source: {score: 5, _:2}, min: 0.0, max: 10.0},
      time: {type: "Float32", hidden: true, source: {datetime: 1.0}},
      filter: {type: "Float32", source: {_: null, timerange: -1.0, active_category: -1}}
    },

    selections: $.extend(
      {active_category: {sortcols: ["category"], max_range_count: 3, data: {category: [-1.0/0.0, 1.0/0.0]}, header: {length: 2}}},
      Animation.prototype.selections
    ),

    programSpecs: {
      program: {
        context: "gl",
        vertex: "app/Visualization/Animation/PointAnimation-vertex.glsl",
        fragment: "app/Visualization/Animation/PointAnimation-fragment.glsl"
      },
      rowidxProgram: {
        context: "rowidxGl",
        vertex: "app/Visualization/Animation/PointAnimation-rowidx-vertex.glsl",
        fragment: "app/Visualization/Animation/PointAnimation-rowidx-fragment.glsl"
      }
    },

    drawProgram: function (program) {
      var self = this;

      program.gl.useProgram(program);
      if (program.uniforms.doShade) {
        program.gl.uniform1i(program.uniforms.doShade, 1);
      }
      Animation.prototype.drawProgram.apply(self, arguments);
    },

    getDrawMode: function (program) {
      var self = this;
      return program.gl.POINTS;
    }
  });
  Animation.animationClasses.PointAnimation = PointAnimation;

  return PointAnimation;
});
