define([
"app/Class",
  "app/Bounds",
  "async",
  "lodash",
  "app/UrlValues",
  "app/Data/Ajax",
  "app/Events",
  "app/Data/Format",
  "app/Data/DataView",
  "app/Logging",
  "app/Data/TiledBinFormat",
  "app/Data/BinFormat",
  "app/Data/EmptyFormat",
  "app/Data/TiledEmptyFormat",
  "app/Data/ClusterTestFormat"
], function(
  Class,
  Bounds,
  async,
  _,
  UrlValues,
  Ajax,
  Events,
  Format,
  DataView,
  Logging
) {
  return Class({
    name: "DataManager",
    initialize: function () {
      var self = this;

      self.sources = {};
      self.directories = {};
      self.events = new Events("Data.DataManager");
      self.header = {colsByName: {}};
      self.bounds = undefined;
    },

    init: function (cb) {
      var self = this;

      cb();
    },

    addSource: function (source) {
      var self = this;

      var key = source.type + "|" + source.args.url;
      if (!self.sources[key]) {
        source = {spec:source};
        self.sources[key] = source;
        source.usage = 0;

        var formatClass = Format.formatClasses[source.spec.type];

        source.source = new formatClass(source.spec.args);
        source.source.events.on({
          error: self.handleError.bind(self, source),
          "tile-error": self.handleTileError.bind(self, source),
          "info-error": self.handleInfoError.bind(self, source),
          header: self.handleHeader.bind(self, source.source),
          load: self.handleLoad.bind(self, source.source),
          update: self.handleUpdate.bind(self, source.source)
        });
      }
      self.sources[key].usage++;
      self.events.triggerEvent("add", self.sources[key]);

      if (self.bounds != undefined) {
        self.sources[key].source.zoomTo(self.bounds);
      }

      return self.sources[key].source;
    },

    setHeaders: function (headers, cb) {
      var self = this;
      for (var key in self.sources) {
        self.sources[key].source.setHeaders(headers);
      }
    },

    removeSource: function (source) {
      var self = this;
      var key = source.type + "|" + source.args.url;
      source = self.sources[key];
      if (source == undefined) return;

      source.usage--;
      if (source.usage == 0) {
        delete self.sources[key];
        source.source.destroy();
      }
      self.updateHeader();
      self.events.triggerEvent("remove", source);
    },

    listSources: function (cb) {
      var self = this;
      cb(Object.values(self.sources).map(function (source) { return source.spec; }));
    },

    listSourceTypes: function (cb) {
      var self = this;
      cb(Object.keys(Format.formatClasses));
    },

    createView: function(view, cb) {
      var self = this;
      cb(null, new DataView(
        self.addSource(view.source),
        {
          columns: view.columns,
          uniforms: view.uniforms,
          selections: view.selections
        }
      ));
    },

    destroyView: function(view, sourceSpec) {
      var self = this;
      if (view.source && sourceSpec) {
        self.removeSource(sourceSpec)
      }
    },

    zoomTo: function (bounds) {
      var self = this;
      if (bounds.length > 0) bounds = new Bounds(bounds);

      Logging.main.log("Data.DataManager.zoomTo", {
        bbox: bounds.toString(),
        sources: Object.keys(self.sources)
      });
      self.bounds = bounds;
      Object.values(self.sources).map (function (source) {
        source.source.zoomTo(bounds);
      });
    },

    updateHeader: function () {
      var self = this;
      self.header = {colsByName: {}};

      Object.values(self.sources).map(function (source) {
        Object.items(source.source.header.colsByName).map(function (item) {
          if (!self.header.colsByName[item.key]) {
            self.header.colsByName[item.key] = _.clone(item.value);
          } else {
            if (item.value.min != undefined) {
              self.header.colsByName[item.key].min = Math.min(
                self.header.colsByName[item.key].min, item.value.min);
            }
            if (item.value.max != undefined) {
              self.header.colsByName[item.key].max = Math.max(
                self.header.colsByName[item.key].max, item.value.max);
            }
          }
        });
      });
      self.events.triggerEvent("header", self.header);
    },

    handleError: function (source, error) {
      var self = this;
      error.source = source.source;
      self.events.triggerEvent("error", error);
      self.removeSource(source.spec);
      if (self.getAllLoaded()) {
        var update = {update: 'all'};
        self.events.triggerEvent(update.update, update);
        self.events.triggerEvent("update", update);
      }
    },

    handleTileError: function (source, error) {
      var self = this;
      error.source = source;
      self.events.triggerEvent("tile-error", error);
    },

    handleInfoError: function (source, error) {
      var self = this;
      error.source = source;
      self.events.triggerEvent("error", error);
    },

    handleHeader: function (source, header) {
      var self = this;
      var directory;
      if (source.getDirectory) {
        directory = source.getDirectory();
      }
      if (directory && !self.directories[directory]) {
        self.directories[directory] = false;
      }
      header.source = source;
      self.updateHeader();
    },

    handleLoad: function (source) {
      var self = this;
      self.events.triggerEvent("load", {source: source});
    },

    getAllLoaded: function() {
      var self = this;
      return Object.values(self.sources
        ).map(function (source) { return source.source.allIsLoaded || source.source.error; }
        ).reduce(function (a, b) { return a && b; }, true);
    },

    handleUpdate: function (source, update) {
      var self = this;
      update = _.clone(update);
      update.source = source;
      self.updateHeader();
      if (update.update == "all") {
        if (!self.getAllLoaded()) {
          update.update = 'all-source';
        }
      }
      self.events.triggerEvent(update.update, update);
      self.events.triggerEvent("update", update);
    },

    listAvailableSources: function (cb) {
      var self = this;

      var sources = {};

      async.each(Object.keys(self.directories), function (url, cb) {
        Ajax.get(url, {}, function (err, data) {
          if (err) {
            cb(err);
          } else {
            for (var name in data) {
              for (var key in data[name]) {
                if (key.slice(-4) == '_url') {
                  data[name][key] = UrlValues.realpath(url, data[name][key]);
                }
              }
            }
            _.assign(sources, data);
            cb();
          }
        });
      }, function (err) {
          if (err) {
            cb(err);
          } else {
            cb(null, sources);
          }
      });
    },

    listAvailableSourceAnimations: function (source, cb) {
      Ajax.get(source.workspace_url, {}, function (err, data) {
        if (err) {
          cb(err);
        } else {
          cb(null, data.map.animations.filter(function (animation) {
            if (animation.is_main != undefined) {
              return animation.is_main;
            }
            try {
              return animation.args.source.args.url == source.tile_url
            } catch (err) {
              return false;
            }
          }));
        }
      });
    },

    printTree: function (args) {
      var self = this;
      args = args || {};
      var indent = args.indent || "";
      var subargs = _.clone(args);
      subargs.indent = indent + '  ';
      return Object.items(self.sources).map(function (item) {
        return indent + item.key + " (Usage: " + item.value.usage + ")" + '\n' + item.value.source.printTree(subargs);
      }).join('\n');
    }
  });
});
