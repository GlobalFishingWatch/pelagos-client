define([
  "app/Class",
  "app/Visualization/KeyBindings",
  "shims/lodash/main",
  "shims/jQuery/main"
], function (
  Class,
  KeyBindings,
  _,
  $
) {
  return Class({
    name: "MouseoverDebugger",

    initialize: function (args) {
      var self = this;
      _.extend(self, args);
      self.state = 0;
      self.current = undefined;
      KeyBindings.register(
        ['Ctrl', 'Alt', 'M'], null, 'General',
        'Show the mouseover debugger',
        self.toggle.bind(self)
      );
    },

    startup: function () {},

    toggle: function () {
      var self = this;

      self.state = (self.state + 1) % (self.visualization.animations.rowidxGl.length + 1);
      if (self.current) {
        self.current.detach();
        self.current = undefined;
      }
      if (self.state == 0) return;
      self.current = $(self.visualization.animations.rowidxGl[self.state - 1].canvas);
      $("body").append(self.current);
      self.current.css({position: "absolute", left: 0, top: 0, right: 0, bottom: 0, "z-index": 2, "pointer-events": "none"});
    }
  });
});
