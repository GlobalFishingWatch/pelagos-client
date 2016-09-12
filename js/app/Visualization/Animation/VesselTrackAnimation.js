define([
  "app/Class",
  "app/Visualization/Animation/DataAnimation"
], function(
  Class,
  DataAnimation
) {
  var VesselTrackAnimation = Class(DataAnimation, {
    name: "VesselTrackAnimation",

    separateSeries: true,

    columns: {
      longitude: {type: "Float32", hidden: true, source: {longitude: 1.0}},
      latitude: {type: "Float32", hidden: true, source: {latitude: 1.0}},

      sigma: {type: "Float32", source: {sigma: 1}, min: 0.0, max: 1.0},
      weight: {type: "Float32", source: {weight: 1}, min: 0.0, max: 1.0},

      time: {type: "Float32", hidden: true, source: {datetime: 1.0}},

      filter: {type: "Float32", source: {_: null, timerange: -1.0, active_category: -1.0}}
    },

    uniforms: {
      high_red: {value: 0.9, min:0.0, max: 1.0},
      high_green: {value: 0.6, min:0.0, max: 1.0},
      high_blue: {value: 0.4, min:0.0, max: 1.0},
      high_alpha: {value: 1.0, min:0.0, max: 1.0},

      low_red: {value: 0.4, min:0.0, max: 1.0},
      low_green: {value: 0.6, min:0.0, max: 1.0},
      low_blue: {value: 0.9, min:0.0, max: 1.0},
      low_alpha: {value: 1.0, min:0.0, max: 1.0},

      focus_red: {value: 1.0, min:0.0, max: 1.0},
      focus_green: {value: 1.0, min:0.0, max: 1.0},
      focus_blue: {value: 1.0, min:0.0, max: 1.0}
    },

    selections: $.extend(
      {active_category: {sortcols: ["category"], max_range_count: 3, data: {category: [-1.0/0.0, 1.0/0.0]}, header: {length: 2}}},
      DataAnimation.prototype.selections
    ),

    programSpecs: {
      program: {
        context: "gl",
        vertex: "app/Visualization/Animation/VesselTrackAnimation-vertex.glsl",
        fragment: "app/Visualization/Animation/VesselTrackAnimation-fragment.glsl",
        blend: {src:"SRC_ALPHA", dst:"ONE_MINUS_SRC_ALPHA"}
      },
      rowidxProgram: {
        context: "rowidxGl",
        vertex: "app/Visualization/Animation/VesselTrackAnimation-rowidx-vertex.glsl",
        fragment: "app/Visualization/Animation/VesselTrackAnimation-rowidx-fragment.glsl"
      }
    },

    drawProgram: function (program) {
      var self = this;

      program.gl.useProgram(program);
      program.gl.lineWidth(2.5);
      DataAnimation.prototype.drawProgram.apply(self, arguments);
    },

    getDrawMode: function (program) {
      var self = this;
      return program.gl.LINE_STRIP;
    }
  });

  DataAnimation.animationClasses.VesselTrackAnimation = VesselTrackAnimation;

  return VesselTrackAnimation;
});
