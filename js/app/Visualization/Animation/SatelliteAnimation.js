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
        self.manager.map.setMapTypeId(self.previousMapType == undefined ? google.maps.MapTypeId.ROADMAP : self.previousMapType);
      }
    }
  });
  Animation.animationClasses.SatelliteAnimation = SatelliteAnimation;

  return SatelliteAnimation;
});
