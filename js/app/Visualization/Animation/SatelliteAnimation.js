define([
  "require",
  "app/Class",
  "app/LoadingInfo",
  "app/Visualization/Animation/Animation"
], function(
  require,
  Class,
  LoadingInfo,
  Animation
) {
  var SatelliteAnimation = Class(Animation, {
    name: "SatelliteAnimation",

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
        self.manager.map.setMapTypeId(google.maps.MapTypeId.HYBRID);
      } else {
        var previous = self.previousMapType != undefined && self.previousMapType != google.maps.MapTypeId.HYBRID;
        self.manager.map.setMapTypeId(previous ? self.previousMapType : google.maps.MapTypeId.ROADMAP);
      }
    }
  });
  Animation.animationClasses.SatelliteAnimation = SatelliteAnimation;

  return SatelliteAnimation;
});
