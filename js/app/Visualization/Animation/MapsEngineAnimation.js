define(["require", "app/Class", "app/Visualization/Shader", "app/Visualization/Animation/Animation"], function(require, Class, Shader, Animation) {
  var MapsEngineAnimation = Class(Animation, {
    name: "MapsEngineAnimation",

    columns: {},
    programSpecs: {},

    initialize: function(manager, args) {
      var self = this;

      self.visible = true;
      if (args) $.extend(self, args);
      self.manager = manager;
    },

    destroy: function () {
      var self = this;
      self.layer.setMap(null);
      // FIXME: DO we need to call destroy or something like that on self.layer?
    },

    initGl: function(gl, cb) {
      var self = this;

      self.layer = new google.maps.visualization.DynamicMapsEngineLayer({layerId:self.source.args.url, suppressInfoWindows:true});
      self.layer.setMap(self.visible ? self.manager.map : null);

      google.maps.event.addListener(self.layer, 'click', self.handleClick.bind(self, 'click'));
      google.maps.event.addListener(self.layer, 'rightclick', self.handleClick.bind(self, 'rightclick'));

      cb();
    },

    /* This is a bit of a hack, working around the normal selection
     * system. But all of this layer is a bit of a hack :) */
    handleClick: function (type, e) {
      var self = this;
      e.getDetails(function(info) {
        if (type == 'rightclick') {
          self.manager.infoPopup.setOptions({
            content: info.infoWindowHtml,
            position: info.latLng,
          });
          self.manager.infoPopup.open(self.manager.map);
        } else {
          info.toString = function () {
            return info.infoWindowHtml;
          }
          self.manager.events.triggerEvent('info', info);
        }
      })
    },

    setVisible: function (visible) {
      var self = this;
      Animation.prototype.setVisible.call(self, visible);
      self.layer.setMap(self.visible ? self.manager.map : null);
    },

    initUpdates: function(cb) { cb(); },

    draw: function () {},

    select: function (x, y, type, replace) {},

    toString: function () {
      var self = this;
      return self.name + ": " + self.source.args.url;
    },

    toJSON: function () {
      var self = this;
      return {
        args: {source: self.source, title: self.title, visible: self.visible},
        type: self.name
      };
    }
  });
  Animation.animationClasses.MapsEngineAnimation = MapsEngineAnimation;

  return MapsEngineAnimation;
});
