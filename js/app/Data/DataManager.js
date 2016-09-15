define([
"app/Class",
  "app/Bounds",
  "shims/async/main",
  "shims/lodash/main",
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
  /**
   * The DataManager manages a set of data sources. Each data set is
   * handled by a Format subclass, and identified by a Url.
   *
   * The data manager handles loading subsets of the data from each
   * source based on the current time range and bbox.
   *
   * @example
   *
   * data = new DataManager();
   * data.init(function () {
   *   data.events.on({__all__: function () {
   *    // Catch all events and print them
   *    console.log("EVENT", arguments);
   *   }});
   *   source = data.addSource({type: "TiledBinFormat", args:{url:"/ui_tests/data/testtiles"}});
   *   console.log("SOURCE ADDED");
   *   source.load();
   *
   *   data.zoomTo(new SpaceTime("1969-12-31T00:00:00.000Z,1970-01-15T00:00:00.000Z;-180,-89,180,89"));
   *
   *   data.events.on({all: function () {
   *     console.log("All data loaded");
   *     console.log(data.printTree());
   *   }});
   * });
   *
   * @fires Data/DataManager#add
   * @fires Data/DataManager#remove
   * @fires Data/DataManager#update
   * @fires Data/DataManager#all
   * @class Data/DataManager
   */
  return Class({
    name: "DataManager",
    initialize: function () {
      var self = this;

      self.sources = {};
      self.directories = [];

      /** @member {Events} */
      self.events = new Events("Data.DataManager");
      /** @member {Object} */
      self.header = {colsByName: {}};
      /** @member {SpaceTime} */
      self.bounds = undefined;
    },

    init: function (cb) {
      var self = this;
      self.headers = {};

      cb();
    },

    /**
     * Sets up a new source
     *
     * @param {string} source.type - Data source type, the name of a
     * subclass of Format, e.g. TiledBinFormat or BinFormat.
     *
     * @param {string} source.args.url - Url of the data source file
     * or directory root
     */
    addSource: function (source) {
      var self = this;

      var key = source.type + "|" + source.args.url;
      if (!self.sources[key]) {
        source = {spec:source};
        self.sources[key] = source;
        source.usage = 0;

        var formatClass = Format.formatClasses[source.spec.type];

        source.source = new formatClass(source.spec.args);
        source.source.manager = self;
        source.source.setHeaders(self.headers);
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

    setHeaders: function (headers) {
      var self = this;
      self.headers = headers;
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

    /**
     * Loads data for all sources for some bbox and time range.
     *
     * @param {SpaceTime} bounds
     */
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

    queryDirectories: function (query, offset, limit, cb) {
      var self = this;

      if (offset == undefined) offset = 0;
      if (limit == undefined) limit = 10;

      var res = {
        "entries": [],
        "query": query,
        "total": 0,
        "limit": limit,
        "offset": offset,
        "nextOffset": offset + limit
      };

      async.each(self.directories, function (baseUrl, cb) {
        self.queryDirectory(baseUrl, query, offset, limit, function (err, data) {
          if (err) {
            cb(err);
          } else {
            res.entries = res.entries.concat(data.entries);
            res.total += data.total;
            cb();
          }
        });
      }, function (err) {
        if (err) {
          cb(err);
        } else {
          cb(null, res);
        }
      });
    },

    queryDirectory: function (baseUrl, query, offset, limit, cb) {
      var self = this;

      if (offset == undefined) offset = 0;
      if (limit == undefined) limit = 10;

      var handleRelativeUrls = function (baseUrl, obj) {
        if (obj != null && typeof(obj) == "object") {
          for (var key in obj) {
            if (key.slice(-4) == '_url') {
              obj[key] = UrlValues.realpath(baseUrl, obj[key]);
            } else {
              obj[key] = handleRelativeUrls(baseUrl, obj[key]);
            }
          }
        }
        return obj;
      };

      var url = baseUrl + "?query=" + encodeURIComponent(query) + "&offset=" + offset.toString() + "&limit=" + limit.toString();
      Ajax.get(url, self.headers, function (err, data) {
        if (err) {
          cb(err);
        } else {
          data.entries = data.entries.map(function (animation) {
            return handleRelativeUrls(url, animation);
          });
          cb(null, data);
        }
      });
    },

    /**
     * Prints a summary of the currently loaded data for all sources.
     *
     * Recursively calls the printTree method on each Format instance.
     * For tiled data sources this will print the loaded tiles, the
     * wanted tiles, any tile replacements due to missing tiles (the
     * tile tree has uneven depth) and any tile loading errors.
     */
    printTree: function (args) {
      var self = this;
      args = args || {};
      var indent = args.indent || "";
      var subargs = _.clone(args);
      subargs.indent = indent + '  ';
      return Object.items(self.sources).map(function (item) {
        return indent + item.key + " (Usage: " + item.value.usage + ")" + '\n' + item.value.source.printTree(subargs);
      }).join('\n');
    },

    toJSON: function () {
      var self = this;

      return {
        directories: self.directories
      };
    },

    load: function (data, cb) {
      var self = this;
      self.directories = data.directories || [];
      cb();
    }
  });
});
