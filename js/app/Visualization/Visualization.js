define(["app/Class", "app/Logging", "app/SubscribableDict", "app/UrlValues", "app/Data/DataManager", "app/Visualization/Animation/AnimationManager", "app/Visualization/DojoUI", "app/Visualization/UI", "async", "jQuery", "app/Json"], function(Class, Logging, SubscribableDict, UrlValues, DataManager, AnimationManager, DojoUI, UI, async, $, Json) {
  return Class({
    name: "Visualization",
    paramspec: {
      zoom: {default_value: 4, fromurl: UrlValues.intFromUrl, tourl: UrlValues.intToUrl, urlname: "zoom", type: "number"},
      lat: {default_value: 39.3, fromurl: UrlValues.floatFromUrl, tourl: UrlValues.floatToUrl, precision: 100000, urlname: "lat", type: "number"},
      lon: {default_value: -95.8, fromurl: UrlValues.floatFromUrl, tourl: UrlValues.floatToUrl, precision: 100000, urlname: "lon", type: "number"},
      length: {default_value: 10000, fromurl: UrlValues.intFromUrl, tourl: UrlValues.intToUrl, urlname: "length", type: "number"},
      timeExtent: {default_value: 15 * 24 * 60 * 60 * 1000, fromurl: UrlValues.floatFromUrl, tourl: UrlValues.floatToUrl, precision: 1000, urlname: "timeExtent", type: "number"},
      time: {fromurl: UrlValues.dateFromUrl, tourl: UrlValues.dateToUrl, urlname: "time", type: Date},
      animations: {default_value: ["point"], fromurl: UrlValues.stringArrayFromUrl, tourl: UrlValues.stringArrayToUrl, urlname: "animations", type: Array},
      paused: {default_value: true, fromurl: UrlValues.boolFromUrl, tourl: UrlValues.boolToUrl, urlname: "paused", type: "boolean"},
      loop: {default_value: true, fromurl: UrlValues.boolFromUrl, tourl: UrlValues.boolToUrl, urlname: "loop", type: "boolean"},
      format: {urlname: "format", default_value: "tiledbin", type: "string"},
      source: {urlname: "source", type: "string"},
      nowebgl: {urlname: "nowebgl", type: "string"},
      logoimg: {urlname: "logoimg", type: "string"},
      logourl: {urlname: "logourl", type: "string"},

      logging: {default_value: {}, fromurl: UrlValues.jsonFromUrl, tourl: UrlValues.jsonToUrl, urlname: "logging", type: "object"},

      // httpHeaders: {default_value: {"X-Client-Cache": "true"}}

      timeresolution: {default_value: 60*60*24*1000}
    },

    initialize: function (node) {
      var self = this;

      self.node = $(node);

      self.state = new SubscribableDict(self.paramspec);

      self.state.events.on({
        logging: function () {
          Logging.main.setRules(self.state.getValue("logging"));
        }
      });
      Logging.main.setRules(self.state.getValue("logging"));

      self.state.events.on({
        title: function () {
          document.title = self.state.getValue('title');
        }
      });

      self.dojoUI = new DojoUI(self);
      self.data = new DataManager(self);
      self.animations = new AnimationManager(self);
      self.ui = new UI(self);

      async.series([
        self.data.init.bind(self.data),
        self.animations.init.bind(self.animations),
        self.ui.init.bind(self.ui),
        function (cb) {
          self.load(UrlValues.getParameter("workspace"), cb);
        }
      ]);
    },

    toJSON: function () {
      var self = this;
      return {
        state: self.state.values,
        map: self.animations
      };
    },

    load: function (url, cb) {
      var self = this;

      if (!url) return cb();

      if (url.indexOf("?") >= 0) {
        self.workspaceUrl = url.split("?")[0];
      }
      else {
        self.workspaceUrl = "/workspace";
      }

      $.get(url, function (data) {
        data = Json.decode(data);
        if (data.state == undefined) {
          cb();
        } else {
          for (var name in data.state) {
            self.state.setValue(name, data.state[name]);
          }
          self.animations.load(data.map, cb);
        }
      }, 'text');
    },

    save: function (cb) {
      var self = this;

      $.post(self.workspaceUrl, Json.encode(self, "  "), function (data) {
        data = Json.decode(data);
        cb(self.workspaceUrl + "/" + data.id);
      }, 'text');
    }
  });
});
