define(["app/Class", "app/Visualization/Animation/Animation", "app/Visualization/Animation/PointAnimation"], function(Class, Animation, PointAnimation) {
  var LineStripAnimation = Class(PointAnimation, {
    name: "LineStripAnimation",

    separateSeries: true,

    drawProgram: function (program) {
      var self = this;

      program.gl.useProgram(program);
      if (program.uniforms.doShade) {
        program.gl.uniform1i(program.uniforms.doShade, 0);
      }
      Animation.prototype.drawProgram.apply(self, arguments);
    },

    getDrawMode: function (program) {
      var self = this;

      return program.gl.LINE_STRIP;
    }
  });
  Animation.animationClasses.LineStripAnimation = LineStripAnimation;

  return LineStripAnimation;
});

