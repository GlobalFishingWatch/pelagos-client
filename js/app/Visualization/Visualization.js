define([
  "app/Class",
  "app/Logging",
  "app/SubscribableDict",
  "app/UrlValues",
  "app/Data/DataManager",
  "app/Events",
  "app/Visualization/Animation/AnimationManager",
  "shims/async/main",
  "shims/jQuery/main",
  "shims/lodash/main",
  "app/Json"
], function(
  Class,
  Logging,
  SubscribableDict,
  UrlValues,
  DataManager,
  Events,
  AnimationManager,
  async,
  $,
  _,
  Json
) {
  /**
   * The main maps / webgl visualization. Will display a map, load a
   * workspace and display its animations over the map inside a given
   * dom node.
   *
   * @example
   *
   * $(document).ready(function () {
   *   visualization = new Visualization('#visualization');
   *   visualization.init(function () {
   *     async.series([
   *       visualization.loadConfiguration.bind(visualization),
   *       visualization.load.bind(visualization, undefined)
   *     ]);
   *   });
   * });
   *
   * @class Visualization/Visualization
   */
  return Class({
    name: "Visualization",
    paramspec: {
      zoom: {default_value: 4, fromurl: UrlValues.intFromUrl, tourl: UrlValues.intToUrl, urlname: "zoom", type: "number"},
      lat: {default_value: 39.3, fromurl: UrlValues.floatFromUrl, tourl: UrlValues.floatToUrl, precision: 100000, urlname: "lat", type: "number"},
      lon: {default_value: -95.8, fromurl: UrlValues.floatFromUrl, tourl: UrlValues.floatToUrl, precision: 100000, urlname: "lon", type: "number"},
      length: {default_value: 10000, fromurl: UrlValues.intFromUrl, tourl: UrlValues.intToUrl, urlname: "length", type: "number"},
      timeExtent: {default_value: 15 * 24 * 60 * 60 * 1000, fromurl: UrlValues.floatFromUrl, tourl: UrlValues.floatToUrl, precision: 1000, urlname: "timeExtent", type: "number"},
      time: {default_value: new Date('1970-01-01'), fromurl: UrlValues.dateFromUrl, tourl: UrlValues.dateToUrl, urlname: "time", type: Date},
      timeFocus: {default_value: new Date('1970-01-01'), fromurl: UrlValues.dateFromUrl, tourl: UrlValues.dateToUrl, urlname: "time", type: Date},
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
    },

    init: function (cb) {
      var self = this;

      self.events = new Events("Visualization");

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

      var root = require.toUrl("app").concat("/../..");
      async.series([
        function (cb) {
          self.data = new DataManager();
          self.data.init(function () {
            headers = UrlValues.getParameter("headers");
            if (headers != undefined) {
              self.data.setHeaders(JSON.parse(headers));
            }
            cb();
          });
        },
        function (cb) {
          self.animations = new AnimationManager(self);
          self.animations.init(cb);
        }
      ],
      function () { cb(self); });
    },

    loadConfiguration: function (cb) {
      /* Willfully ignore load errors here since there might not be
       * any config */
      var self = this;
      var root = require.toUrl("app").concat("/../..");
      self.loadDefaults(root + "/defaultConfig.json", function () {
        self.loadDefaults(root + "/config.json", function () {
          cb();
        });
      });
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

    unmergeDefaults: function (defaults, config) {
      var self = this;

      config = _.clone(config);

      var isObject = function (obj) {
        return obj !== null && typeof(obj) == 'object';
      };

      var unmerge = function(defaults, config) {
        for (var key in defaults) {
          if (isObject(defaults[key]) && isObject(config[key])) {
            config[key] = unmerge(defaults[key], config[key]);
            if (Object.keys(config[key]).length == 0) {
              delete config[key];
            }
          } else {
            delete config[key];
          }
        }
        return config;
      };

      return unmerge(defaults, config);
    },

    toJSON: function () {
      var self = this;
      var ui = {};
      if (self.ui) ui = self.ui.toJSON();
      return {
        state: self.state.values,
        map: self.animations.toJSON(),
        data: self.data.toJSON(),
        ui: ui
      };
    },

    /**
     * Loads a workspace from a given url, or if no url is given from
     * the the url given by the workspace parameter in the page url
     * (e.g. /index.html?workspace=/workspace%3Fid%3Dtest
     *
     * @param url {String}
     * @param cb {Function}
     */
    load: function (url, cb) {
      var self = this;

      if (!url) {
        url = UrlValues.getParameter("workspace");
      }
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

      $.ajax({
        url: url,
        headers: self.data.headers,
        success: function (data) {
          self.loadData(Json.decode(data), cb);
        },
        dataType: 'text'
      }).fail(function(jqXHR, textStatus, errorThrown) {
        self.events.triggerEvent("error", {
          error: errorThrown,
          url: url,
          toString: function () {
            return "Unable to load workspace " + this.url + ": " + this.error.toString();
          }
        });
        /* Load defaults only */
        return self.loadData({}, function () {
          cb(errorThrown);
        });
      });
    },

    loadData: function (data, cb) {
      var self = this;

      data = self.mergeDefaults(self.defaultConfig, data);

      if (data.metadata && data.metadata.urls && data.metadata.urls.save) {
        self.workspaceSaveUrl = data.metadata.urls.save;
      }

      async.series([
        function (cb) {
          if (!data.ui || !self.ui) return cb();
          self.ui.load(data.ui, cb);
        },
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
          if (!data.data) return cb();
          self.data.load(data.data, cb);
        }
      ], cb);
    },

    saveToString: function (indent) {
      var self = this;
      return Json.encode(self.unmergeDefaults(self.defaultConfig, Json.decode(Json.encode(self, "  "))), indent);
    },

    saveWorkspace: function (data, cb) {
      var self = this;

      // FIXME: Use self.data.headers!!
      $.ajax({
        url: self.workspaceSaveUrl,
        method: "POST",
        data:data,
        headers: self.data.headers,
        complete:function (data) {
          data = Json.decode(data.responseText);
          if (!data.urls) data.urls = {};

          if (!data.urls.load) {
            data.urls.load = self.workspaceSaveUrl + "/" + data.id
          }
          if (!data.urls.visualization) {
            data.urls.visualization = window.location.toString().split("?")[0].split("#")[0] + "?workspace=" + data.urls.load;
          }
          cb(data.urls.visualization);
        },
        dataType: 'text',
        contentType: 'application/json'
      });
    },

    /**
     * Saves the current workspace to a JSON file using a POST call to
     * the url given by self.workspaceSaveUrl. This is generally the
     * url of the last loaded workspace, minus any query
     * parameters.
     *
     * @param cb {Function}
     */
    save: function (cb) {
      var self = this;

      self.saveWorkspace(self.saveToString(), cb);
    }
  });
});
