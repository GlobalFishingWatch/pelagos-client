define([
  "require",
  "app/Class",
  "app/Visualization/Animation/DataAnimation",
  "jQuery"
], function(
  require,
  Class,
  DataAnimation,
  $
) {
  var ArrowAnimation = Class(DataAnimation, {
    name: "ArrowAnimation",

    columns: {
      longitude: {type: "Float32", hidden: true, source: {longitude: 1.0}},
      latitude: {type: "Float32", hidden: true, source: {latitude: 1.0}},

      red: {type: "Float32", source: {score: 0.85, _:-0.1, hover:1.0, selected:1.0}, min: 0.0, max: 1.0},
      green: {type: "Float32", source: {_: 0.3, hover:1.0, selected:1.0}, min: 0.0, max: 1.0},
      blue: { type: "Float32", source: {_: 0.0, hover:1.0, selected:1.0}, min: 0.0, max: 1.0},
      alpha: {type: "Float32", source: {_: 1.0}, min: 0.0, max: 1.0},

      length: {type: "Float32", source: {_: 1.0}, min: 0.0, max: 1.0},
      direction: {type: "Float32", source: {cog: 1.0}, min: 0.0, max: 1.0},

      time: {type: "Float32", hidden: true, source: {datetime: 1.0}},
      filter: {type: "Float32", source: {_: null, timerange: -1.0, active_category: -1.0}}
    },

    selections: $.extend(
      {active_category: {sortcols: ["category"], max_range_count: 3, data: {category: [-1.0/0.0, 1.0/0.0]}, header: {length: 2}}},
      DataAnimation.prototype.selections
    ),

    programSpecs: {
      program: {
        context: "gl",
        vertex: "app/Visualization/Animation/ArrowAnimation-vertex.glsl",
        fragment: "app/Visualization/Animation/ArrowAnimation-fragment.glsl",
        blend: {src:"SRC_ALPHA", dst:"ONE_MINUS_SRC_ALPHA"}
      },
      rowidxProgram: {
        context: "rowidxGl",
        vertex: "app/Visualization/Animation/ArrowAnimation-rowidx-vertex.glsl",
        fragment: "app/Visualization/Animation/ArrowAnimation-rowidx-fragment.glsl"
      }
    },

    getDrawMode: function (program) {
      var self = this;
      return program.gl.POINTS;
    }
  });
  DataAnimation.animationClasses.ArrowAnimation = ArrowAnimation;

  return ArrowAnimation;
});
