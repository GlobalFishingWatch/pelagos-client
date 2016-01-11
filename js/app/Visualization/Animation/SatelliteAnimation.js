define([
  "require",
  "app/Class",
  "app/LoadingInfo",
  "app/Visualization/Animation/ObjectToTable",
  "app/Visualization/Animation/Animation"
], function(
  require,
  Class,
  LoadingInfo,
  ObjectToTable,
  Animation
) {
  var SatelliteAnimation = Class(Animation, {
    name: "SatelliteAnimation",

    columns: {},
    programSpecs: {},

    initialize: function(manager, args) {
      var self = this;

      self.visible = true;
      self.args = args;
      if (args) $.extend(self, args);
      self.manager = manager;
    },

    destroy: function () {
    },

    initGl: function(cb) {
      var self = this;
      self.setVisible(self.visible);
      cb();
    },

    setVisible: function (visible) {
      var self = this;
      Animation.prototype.setVisible.call(self, visible);
      if (visible) {
        self.previousMapType = self.manager.map.getMapTypeId();
        self.manager.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
      } else {
        self.manager.map.setMapTypeId(self.previousMapType == undefined ? google.maps.MapTypeId.ROADMAP : self.previousMapType);
      }
    },

    initUpdates: function(cb) { cb(); },

    draw: function () {},

    select: function (rowidx, type, replace, event) {
    },

    toString: function () {
      var self = this;
      return self.name;
    },

    toJSON: function () {
      var self = this;
      return {
        args: _.extend({}, self.args, {source: self.source, title: self.title, visible: self.visible}),
        "type": self.name
      };
    }
  });
  Animation.animationClasses.SatelliteAnimation = SatelliteAnimation;

  return SatelliteAnimation;
});
