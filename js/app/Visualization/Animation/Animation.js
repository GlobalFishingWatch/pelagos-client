define([
  "app/Class",
  "app/Events",
  "shims/async/main",
  "app/UrlValues",
  "app/Visualization/Animation/Shader",
  "app/Data/GeoProjection",
  "app/Data/DataView",
  "app/Visualization/Animation/ObjectToTable",
  "shims/jQuery/main"
], function(
  Class,
  Events,
  async,
  UrlValues,
  Shader,
  GeoProjection,
  DataView,
  ObjectToTable,
  $
) {
  var Animation = Class({
    name: "Animation",

    color: "orange",

    initialize: function(manager, args) {
      var self = this;

      self.visible = true;
      self.args = args;
      if (args) $.extend(self, args);
      self.manager = manager;
      self.events = new Events('Visualization.Animation');
      if (self.title === undefined) {
        self.title = self.toString();
      }
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

    draw: function (gl) {
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

    getSelectionInfo: function (type, cb) {
      var self = this;

      if (type !== undefined) return cb("Not implemented", null);

      cb(null,
         {title: self.title,
          description: self.args.description,
          });
    },

    setTitleFromInfo: function (prefix, suffix, cb) {
      var self = this;

      self.getSelectionInfo(undefined, function (err, info) {
        prefix = prefix || "";
        suffix = suffix || "";
        if (info && info.title) {
          self.title = prefix + info.title + suffix;
          self.events.triggerEvent("updated", {});
        }
        if (cb) cb(err, info);
      });
    },

    toString: function () {
      var self = this;
      if (self.source && self.source.args && self.source.args.url) {
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
      args.color = self.color;
      return {
        args: _.extend({}, self.args || {}, args),
        "type": self.name
      };
    }
  });

  Animation.animationClasses = {};

  return Animation;
});
