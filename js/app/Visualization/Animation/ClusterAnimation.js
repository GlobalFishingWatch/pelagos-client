define(["require", "app/Class", "app/Visualization/Animation/Shader", "app/Visualization/Animation/Animation"], function(require, Class, Shader, Animation) {
  var ClusterAnimation = Class(Animation, {
    name: "ClusterAnimation",

    columns: {
      longitude: {type: "Float32", hidden: true, source: {longitude: 1.0}},
      latitude: {type: "Float32", hidden: true, source: {latitude: 1.0}},

      sigma: {type: "Float32", source: {sigma: 1, hover: 0.01, selected: 0.01}, min: 0.0, max: 1.0},
      weight: {type: "Float32", source: {weight: 1, hover: 100, selected: 100}, min: 0.0, max: 1.0},

      time: {type: "Float32", hidden: true, source: {datetime: 1.0}},

      filter: {type: "Float32", source: {_: null, timerange: -1.0, active_category: -1.0}},

      selected: {type: "Float32", hidden: true, source: {selected: 1.0}},
      hover: {type: "Float32", hidden: true, source: {hover: 1.0}}
    },

    uniforms: {
      red: {value: 1.0, min:0.0, max: 1.0},
      green: {value: 0.6, min:0.0, max: 1.0},
      blue: {value: 0.4, min:0.0, max: 1.0},

      selected_red: {value: 1.0, min:0.0, max: 1.0},
      selected_green: {value: 1.0, min:0.0, max: 1.0},
      selected_blue: {value: 1.0, min:0.0, max: 1.0},

      hover_red: {value: 0.4, min:0.0, max: 1.0},
      hover_green: {value: 0.6, min:0.0, max: 1.0},
      hover_blue: {value: 1.0, min:0.0, max: 1.0}
    },

    selections: $.extend(
      {active_category: {sortcols: ["category"], max_range_count: 3, data: {category: [-1.0/0.0, 1.0/0.0]}, header: {length: 2}}},
      Animation.prototype.selections
    ),

    programSpecs: {
      program: {
        context: "gl",
        vertex: "app/Visualization/Animation/ClusterAnimation-vertex.glsl",
        fragment: "app/Visualization/Animation/ClusterAnimation-fragment.glsl"
      },
      rowidxProgram: {
        context: "rowidxGl",
        vertex: "app/Visualization/Animation/ClusterAnimation-rowidx-vertex.glsl",
        fragment: "app/Visualization/Animation/ClusterAnimation-rowidx-fragment.glsl"
      }
    },

    getDrawMode: function (program) {
      var self = this;
      return program.gl.POINTS;
    }
  });
  Animation.animationClasses.ClusterAnimation = ClusterAnimation;

  return ClusterAnimation;
});
