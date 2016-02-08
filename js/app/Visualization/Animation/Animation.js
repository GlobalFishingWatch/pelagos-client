define([
  "app/Class",
  "app/Events",
  "async",
  "app/UrlValues",
  "app/Visualization/Animation/Shader",
  "app/Data/GeoProjection",
  "app/Data/DataView",
  "jQuery"
], function(
  Class,
  Events,
  async,
  UrlValues,
  Shader,
  GeoProjection,
  DataView,
  $
) {
  var Animation = Class({
    name: "Animation",

    initialize: function(manager, args) {
      var self = this;

      self.visible = true;
      self.args = args;
      if (args) $.extend(self, args);
      self.manager = manager;
      self.events = new Events('Visualization.Animation');
    },

    setVisible: function (visible) {
      var self = this;
      self.visible = visible;
    },

    handleError: function (error) {
      var self = this;
      self.manager.removeAnimation(self);
    },

    destroy: function () {
      var self = this;
    },

    initGl: function(cb) {
      var self = this;
      cb();
    },

    initUpdates: function(cb) {
      var self = this;
      cb();
    },

    triggerDataUpdate: function () {
      var self = this;
    },

    draw: function () {
      var self = this;
    },

    select: function (rowidx, type, replace, event) {
      var self = this;
      return rowidx;
    },

    search: function (query, offset, limit, cb) {
      var self = this;
      cb(null, null);
    },

    toString: function () {
      var self = this;
      if (self.source.args.url) {
        return self.name + ": " + self.source.args.url;
      } else {
        return self.name;
      }
    },

    toJSON: function () {
      var self = this;
      var args = {};
      args.title = self.title;
      args.visible = self.visible;
      args.source = self.source;
      return {
        args: _.extend({}, self.args, args),
        "type": self.name
      };
    }
  });

  Animation.animationClasses = {};

  return Animation;
});
