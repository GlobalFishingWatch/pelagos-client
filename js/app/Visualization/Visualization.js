define([
  "app/Class",
  "app/Logging",
  "app/SubscribableDict",
  "app/UrlValues",
  "app/Data/DataManager",
  "app/Visualization/Animation/AnimationManager",
  "app/Visualization/UI/UIManager",
  "async",
  "jQuery",
  "lodash",
  "app/Json"
], function(
  Class,
  Logging,
  SubscribableDict,
  UrlValues,
  DataManager,
  AnimationManager,
  UIManager,
  async,
  $,
  _,
  Json
) {
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

      // logging: {default_value: {"screen": {"rules": ["", "-Data.Format.spec-update", "-Data.Format.update", "-Data.Format.col"]}}, fromurl: UrlValues.jsonFromUrl, tourl: UrlValues.jsonToUrl, urlname: "logging", type: "object"},
      logging: {default_value: {"screen": {"rules": []}}, fromurl: UrlValues.jsonFromUrl, tourl: UrlValues.jsonToUrl, urlname: "logging", type: "object"},

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

      self.defaultConfig = {};

      async.series([
        function (cb) {
          self.ui = new UIManager(self);
          self.ui.init1(cb);
        },
        function (cb) {
          self.data = new DataManager(self);
          self.data.init(cb);
        },
        function (cb) {
          self.animations = new AnimationManager(self);
          self.animations.init(cb);
        },
        function (cb) {
          self.ui.init2(cb);
        },
        self.loadDefaults.bind(self, app.dirs.root + "/defaultConfig.json"),
        function (cb) { self.loadDefaults(app.dirs.root + "/config.json", function () { cb(); }); },
        self.load.bind(self, UrlValues.getParameter("workspace"))
      ]);
    },

    loadDefaults: function (url, cb) {
      var self = this;

      $.get(url, function (data) {
        self.defaultConfig = self.mergeDefaults(self.defaultConfig, Json.decode(data));
        cb();
      }, 'text').fail(function(jqXHR, textStatus, errorThrown) {
        cb(errorThrown);
      });
    },

    mergeDefaults: function (defaults, config) {
      var self = this;

      return _.merge({}, defaults, config);
    },

    toJSON: function () {
      var self = this;
      return {
        state: self.state.values,
        map: self.animations,
        ui: self.ui
      };
    },

    load: function (url, cb) {
      var self = this;

      if (!url) {
        /* Load defaults only */
        return self.loadData({}, cb);
      }

      if (url.indexOf("?") >= 0) {
        self.workspaceSaveUrl = url.split("?")[0];
      }
      else {
        self.workspaceSaveUrl = "/workspace";
      }
      self.workspaceUrl = url;

      $.get(url, function (data) {
        self.loadData(data, cb);
      }, 'text').fail(function(jqXHR, textStatus, errorThrown) {
        /* Load defaults only */
        return self.loadData({}, function () {
          cb(errorThrown);
        });
      });
    },

    loadData: function (data, cb) {
      var self = this;

      data = self.mergeDefaults(self.defaultConfig, Json.decode(data));

      async.series([
        function (cb) {
          if (!data.state) return cb();
          for (var name in data.state) {
            self.state.setValue(name, data.state[name]);
          }
          cb();
        },
        function (cb) {
          if (!data.map) return cb();
          self.animations.load(data.map, cb);
        },
        function (cb) {
          if (!data.ui) return cb();
          self.ui.load(data.ui, cb);
        }
      ], cb);
    },

    save: function (cb) {
      var self = this;

      $.post(self.workspaceSaveUrl, Json.encode(self, "  "), function (data) {
        data = Json.decode(data);
        cb(self.workspaceSaveUrl + "/" + data.id);
      }, 'text');
    }
  });
});
