define(['app/Class'], function (Class) {
  return Class({
    name: 'Fps',

    windowSize: 10,

    initialize: function () {
      var self = this;

      self.frames = [];
      self.fps = 0;
      self.start = undefined;
    },

    begin: function () {
      var self = this;
      self.start = performance.now();
    },

    end: function () {
      var self = this;
      if (self.start === undefined) return;
      self.frames.push(performance.now() - self.start);
      while (self.frames.length > self.windowSize) self.frames.shift();
      if (self.frames.length > 0) {
        self.fps = 1000.0 * self.frames.length / (self.frames.reduce(function (a, b) { return a + b; }, 0));
      } else {
        self.fps = 0;
      }
      self.start = undefined;
    }
  });
});