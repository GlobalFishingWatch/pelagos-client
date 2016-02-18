define([
  "app/Class",
  "app/Visualization/Animation/DataAnimation",
  "app/Visualization/Animation/PointAnimation"
], function(
  Class,
  DataAnimation,
  PointAnimation
) {
  var LineAnimation = Class(PointAnimation, {
    name: "LineAnimation",

    separateSeries: true,

    drawProgram: function (program) {
      var self = this;

      program.gl.useProgram(program);
      if (program.uniforms.doShade) {
        program.gl.uniform1i(program.uniforms.doShade, 0);
      }
      DataAnimation.prototype.drawProgram.apply(self, arguments);
    },

    getDrawMode: function (program) {
      var self = this;

      return program.gl.LINES;
    }
  });
  DataAnimation.animationClasses.LineAnimation = LineAnimation;

  return LineAnimation;
});

