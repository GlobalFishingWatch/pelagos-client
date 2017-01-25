/*
  tm = new BaseTiledFormat({url:"http://127.0.0.1:8000/tiles"});

  tm.events.on({
      "tile-error": function (data) { console.log("tile-error: " + data.exception + " @ " + data.tile.bounds.toString()); },
      "batch": function (data) { console.log("batch: " + data.tile.bounds.toString()); },
      "full-tile": function (data) { console.log("full-tile: " + data.tile.bounds.toString()); },
      "all": function () { console.log("all"); }
  });
  tm.zoomTo(new Bounds([0, 0, 11.25, 11.25]));
*/

define([
  "app/Class",
  "app/Events",
  "app/LoadingInfo",
  "app/Data/Format",
  "app/Data/Tile",
  "app/Data/TileBounds",
  "app/Data/Pack",
  "app/Logging",
  "app/Data/Ajax",
  "app/Data/EmptyFormat",
  "shims/lodash/main",
  "shims/async/main",
  "shims/jQuery/main",
  "app/PopupAuth",
  "app/LangExtensions"
], function(
  Class,
  Events,
  LoadingInfo,
  Format,
  Tile,
  TileBounds,
  Pack,
  Logging,
  Ajax,
  EmptyFormat,
  _,
  async,
  $,
  PopupAuth
) {
  var BaseTiledFormat = Class(Format, {
    name: "BaseTiledFormat",

    Tile: Tile,
    TileBounds: TileBounds,

    initialize: function() {
      var self = this;
      /* Any tiles we have loaded that we still need (maybe because
       * they are wanted, or no wanted tile for that area has loaded
       * fully yet */
      self.tileCache = {};
      /* The tiles we really want to display. Might not all be loaded yet, or might have replacements... */
      self.wantedTiles = {};
      self.initialZoom = undefined;
      self.tileIdxCounter = 0;
      self.urlAlternative = 0;
      Format.prototype.initialize.apply(self, arguments);
    },

    dataQualityLevel: 3,

    retries: 10,
    retryTimeout: 2000,

    setHeaders: function (headers) {
      var self = this;
      self.headers = headers || {};
    },

    _load: function () {
      var self = this;
      if (self.error) {
        /* Rethrow error, to not confuse code that expects either an
         * error or a load event... */
        self.events.triggerEvent("error", self.error);
        return;
      }

      if (typeof XMLHttpRequest == "undefined") {
        self.handleError({
          toString: function () {
            return "XMLHttpRequest not supported";
          }
        });
        return;
      }

      Ajax.get(self.url + "/header", self.headers, function (err, data) {
        if (err) {
          self.handleError(err);
        } else {
          self.header = data;

          if (self.header.alternatives == undefined) {
            self.header.alternatives = [self.url];
          }

          if (data.colsByName) {
            Object.values(data.colsByName).map(function (col) {
              col.typespec = Pack.typemap.byname[col.type];
            });
            data.colsByName.rowidx = {
              "type": "Int32",
              typespec: Pack.typemap.byname.Int32,
              hidden: true
            };
          }
          var e = {update: "header", header: data};
          self.events.triggerEvent(e.update, e);
          self.events.triggerEvent("update", e);
          self.initialZoomHandled = true;
          if (self.initialZoom) {
            self.zoomTo(self.initialZoom);
          }
        }
      });

      self.events.triggerEvent("load");
    },

    getUrls: function (category) {
      var self = this;
      var urls;
      if (self.header.urls) {
        urls = self.header.urls;
        if (urls[category]) {
          urls = urls[category];
        } else if (urls['default']) {
          urls = urls['default'];
        }
        return urls;
      } else if (self.header.alternatives) {
        return [self.header.alternatives];
      } else {
        return [[self.url]];
      }
    },

    getUrlFallbackLevels: function(category) {
      var self = this;

      return self.getUrls(category).length;
    },

    getUrl: function (category, key, fallbackLevel) {
      var self = this;

      var urls = self.getUrls(category);
      if (fallbackLevel < 0) fallbackLevel += urls.length;
      urls = urls[fallbackLevel];

      if (!urls || urls.length == 0) return undefined;
      if (urls.length == 1) return urls[0];

      var idx;
      if (key) {
        idx = key.hashCode();
      } else {
        idx = ++self.urlAlternative;
      }

      var available = urls.length;
      idx = idx % available;
      if (idx < 0) idx += available;
      return urls[idx];
    },

    getSelectionQuery: function(selection) {
      /* Selection can either be a selection object, or a selection iterator function. */
      var self = this;

      var baseSelectionRow = self.getQuerySelection(self.getUrlQuery()) || [];
      var baseSelection = {};
      baseSelectionRow.map(function (item) {
        baseSelection[item.name] = item.value;
      });

      if (selection.iterate !== undefined) {
        selection = selection.iterate();
      }
      var selectionRow = selection();

      var newSelectionRow = selectionRow.filter(function (item) {
        return baseSelection[item.name] == undefined;
      });
      if (newSelectionRow.length == 0) return;

      return baseSelectionRow.concat(newSelectionRow).filter(function (item) {
        return item.value !== undefined;
      }).map(function (item) {
        return encodeURIComponent(item.name) + "=" + encodeURIComponent(item.value.toString());
      }).join(',');
    },

    getSelectionUrl: function(selection, fallbackLevel) {
      var self = this;

      var query = self.getSelectionQuery(selection);
      if (!query) return;
      return self.getQueryUrl(query, fallbackLevel);
    },

    getQuerySelection: function(query) {
      var self = this;

      if (!query) return;
      return query.split(",").map(function (item) {
        item = item.split("=").map(decodeURIComponent);
        return {name: item[0], value: parseFloat(item[1])};
      });
    },

    getUrlQuery: function(url) {
      /* Returns the query part of a url */
      var self = this;
      if (!url) url = self.url;

      if (url.indexOf("/sub/") == -1) return;
      return url.replace(new RegExp(".*/sub/\([^/]*\)\(/.*\)?"), "$1");
    },

    getQueryUrl: function(query, fallbackLevel) {
      var self = this;

      var baseUrl = self.getUrl("selection-info", query, fallbackLevel);

      if (query === undefined) return baseUrl;

      if (baseUrl.indexOf("/sub/") != -1) {
        baseUrl = baseUrl.replace(new RegExp("/sub/.*"), "/sub/");
      } else {
        baseUrl = baseUrl + "/sub/";
      }

      return baseUrl + query
    },

    getSelectionInfo: function(selection, cb) {
      var self = this;

      var query;
      if (selection !== undefined) {
       query = self.getSelectionQuery(selection); 
      }

      var getSelectionInfo = function (fallbackLevel) {
        var url = self.getQueryUrl(query, fallbackLevel) + "/info";
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        Ajax.setHeaders(request, self.headers);
        LoadingInfo.main.add(url, {request:request});
        request.onreadystatechange = function() {
          if (request.readyState === 4) {
            LoadingInfo.main.remove(url);
            var data = {};
            try {
              data = JSON.parse(request.responseText);
            } catch (e) {
            }

            if (Ajax.isSuccess(request, url)) {
              cb(null, data);
            } else {
              if (request.status == 403) {
                data.level = 'info';
                data.toString = function () {
                  var res = $("<span class='auth_required'><a href='javascript: void(0);'>Log in</a><br /> to view vessel identity<br /> or<br /> <a href='javascript: void(0);'>Sign up</a> for free.");
                  res.find('a').click(function () {
                    new PopupAuth(data.auth_location, function (args) {
                      if (args) {
                        if (args.headers != undefined) self.manager.setHeaders(args.headers);
                        cb(null, null);
                        getSelectionInfo(fallbackLevel);
                      }
                    });
                  });
                  return res;
                };
                cb(data, null);
              } else if (fallbackLevel + 1 < self.getUrlFallbackLevels("selection-info")) {
                getSelectionInfo(fallbackLevel + 1, true);
              } else {
                var e = Ajax.makeError(request, url, "selection information from ");
                e.source = self;
                cb(e, null);
              }
            }
          }
        };
        request.send();
      };

      getSelectionInfo(0, true);
    },

    search: function(query, offset, limit, cb) {
      var self = this;

      var key = {query: query, offset: offset, limit: limit};
      var url = self.getUrl("search", key, -1)
      if (!url) {
        return cb(null, {entries:[]});
      }

      url += "/search?query=" + encodeURIComponent(query);

      if (offset != undefined) {
        url += "&offset=" + offset.toString();
      }
      if (limit != undefined) {
        url += "&limit=" + limit.toString();
      }

      var request = new XMLHttpRequest();
      request.open('GET', url, true);
      Ajax.setHeaders(request, self.headers);
      LoadingInfo.main.add(url, {request: request});
      request.onreadystatechange = function() {
        if (request.readyState === 4) {
          LoadingInfo.main.remove(url);
          if (Ajax.isSuccess(request, url)) {
            var data = JSON.parse(request.responseText);
            cb(null, data);
          } else {
            var e = Ajax.makeError(request, url, "search results from ");
            e.source = self;
            cb(e, null);
          }
        }
      };
      request.send();
    },

    clear: function () {
      var self = this;

      self.wantedTiles = {};
      Object.values(self.tileCache).map(function (tile) {
        tile.destroy();
      });
    },

    zoomTo: function (bounds) {
      var self = this;

      if (self.error) {
        /* Retrow error, to not confuse code that expects either an
         * error or a load event... */
        self.events.triggerEvent("error", self.error);
        return;
      }

      if (!self.headerIsLoaded || !self.initialZoomHandled) {
        /* Don't start loading tiles before we have a header and know
         * what URL alternatives there are. */
        self.initialZoom = bounds;
        return;
      }

      /* Don't keep old tiles when we zoom multiple times in a row
       * or everything gets way too slow... */
      var findOverlaps = self.getLoadingTiles().length == 0;

      var oldBounds = self.bounds;
      self.bounds = bounds;

      if (self.header.temporalExtents == undefined) {
        bounds = bounds.bounds;
      } else {

      }

      var wantedTileBounds = self.TileBounds.tileBounds({
        bounds: bounds,
        dataQualityLevel: self.dataQualityLevel,
        temporalExtents: self.header.temporalExtents,
        temporalExtentsBase: self.header.temporalExtentsBase,
        autoAdjustQuality: self.header.autoAdjustQuality
      });
      var wantedTiles = {};
      var oldWantedTiles = self.wantedTiles;
      var anyNewTiles = false;
      wantedTileBounds.map(function (tilebounds) {
        var key = tilebounds.toString();
        if (oldWantedTiles[key] != undefined) {
          wantedTiles[key] = oldWantedTiles[tilebounds.toString()];
        } else {
          wantedTiles[key] = self.setUpTile(tilebounds, findOverlaps);
          anyNewTiles = true;
        }
        wantedTiles[key].reference();
      });
      self.wantedTiles = wantedTiles;

      Logging.main.log("Data.BaseTiledFormat.zoomTo", {
        oldBounds: oldBounds,
        newBounds: bounds,
        newWantedTiles: Object.keys(wantedTiles),
        oldWantedTiles: Object.keys(oldWantedTiles),
        toString: function () {
          var self = this;
          var newWantedTiles = this.newWantedTiles.filter(function (bbox) {
              return self.oldWantedTiles.indexOf(bbox) == -1
          }).join(", ");
          var oldWantedTiles = this.oldWantedTiles.filter(function (bbox) {
              return self.newWantedTiles.indexOf(bbox) == -1
          }).join(", ");
          var existingWantedTiles = this.newWantedTiles.filter(function (bbox) {
              return self.oldWantedTiles.indexOf(bbox) != -1
          }).join(", ");
          var oldBounds = self.oldBounds != undefined ? self.oldBounds.toString() : "undefined";
          var newBounds = self.newBounds != undefined ? self.newBounds.toString() : "undefined";
          return oldBounds + " -> " + newBounds + ":\n  Added: " + newWantedTiles + "\n  Removed: " + oldWantedTiles + "\n  Kept: " + existingWantedTiles + "\n";
        }
      });

      if (anyNewTiles) {
        self.events.triggerEvent("load");
      }

      Object.items(oldWantedTiles).map(function (item) {
        item.value.dereference();
      });

      LoadingInfo.main.add(self.url);

      async.each(wantedTileBounds, function (tilebounds, cb) {
        tilebounds = tilebounds.toString();
        if (self.wantedTiles[tilebounds]) {
          self.wantedTiles[tilebounds].load();
        }
        cb();
      }, function (err) {
        LoadingInfo.main.remove(self.url);
      });
    },

/*
    getTileContent: function (tile) {
      var self = this;
      return undefined;
    },
*/

    setUpTileContent: function (tile) {
      var self = this;

      if (self.header.maxZoom != undefined && self.TileBounds.zoomLevelForTileBounds(tile.bounds) > self.header.maxZoom) {
        tile.setContent(new EmptyFormat({
          headerTime: false,
          contentTime: false,
          header: {length: 0, colsByName: {}, tags: ["ZOOM_LEVEL_IGNORED"]}
        }));
        self.handleTileError(tile, {
          msg: 'Zoom level not provided by tileset',
          toString: function () { return this.msg; }
        });
        return;
      }
      tile.setContent(self.getTileContent(tile));
      tile.content.events.on({
        "batch": self.handleBatch.bind(self, tile),
        "all": self.handleFullTile.bind(self, tile),
        "error": self.handleTileError.bind(self, tile),
        scope: self
      });
    },

    setUpTile: function (tilebounds, findOverlaps) {
      var self = this;
      var key = tilebounds.toString();

      if (!self.tileCache[key]) {
        var tile = new self.Tile(self, tilebounds);

        tile.idx = self.tileIdxCounter++;
        if (findOverlaps !== false) tile.findOverlaps();

        self.setUpTileContent(tile);

        tile.events.on({
          "destroy": self.handleTileRemoval.bind(self, tile),
          scope: self
        });
        self.tileCache[key] = tile;
      }

      return self.tileCache[key];
    },

    handleTileRemoval: function (tile) {
      var self = this;

      delete self.tileCache[tile.bounds.toString()];
      e = {update: "tile-removal", tile: tile};
      self.events.triggerEvent(e.update, e);
      self.events.triggerEvent("update", e);
    },

    handleBatch: function (tile) {
      var self = this;

      return;
    },

    getLoadingTiles: function () {
      var self = this;
      return Object.values(
        self.tileCache
      ).filter(function (tile) {
        return !tile.content.allIsLoaded && !tile.content.error;
      });
    },

    getErrorTiles: function () {
      var self = this;
      return Object.values(
        self.tileCache
      ).filter(function (tile) {
        return tile.content.error;
      });
    },

    getDoneTiles: function () {
      var self = this;
      return Object.values(
        self.tileCache
      ).filter(function (tile) {
        return tile.content.allIsLoaded;
      });
    },

    getContent: function () {
      var self = this;

      return self.getDoneTiles().filter(function (tile) {
        return !tile.replacement;
      });
    },

    printTree: function (args) {
      var self = this;
      args = args || {};

      args.printed = {};

      var filter = function (tile) { return true; };
      if (args.covers) {
        filter = function (tile) {
          return tile.bounds.containsObj(new self.TileBounds.Bounds(args.covers))
        };
      } else if (args.coveredBy) {
        filter = function (tile) {
          return new self.TileBounds.Bounds(args.coveredBy).containsObj(tile.bounds)
        };
      }

      var indent = args.indent || "";
      var res = "";
      var wantedTiles = Object.values(self.wantedTiles).filter(filter);
      var rows = wantedTiles.map(function (tile) { return tile.content && tile.content.header && tile.content.header.length || 0; }).reduce(function (a, b) { return a + b }, 0);
      var loaded = wantedTiles.map(function (tile) { return tile.content.allIsLoaded ? 1 : 0; }).reduce(function (a, b) { return a + b }, 0);
      var errored = wantedTiles.map(function (tile) { return tile.content.error ? 1 : 0; }).reduce(function (a, b) { return a + b }, 0);
      res += indent + 'Wanted tiles (Rows: ' + rows + ', Loaded: ' + loaded + ', Errors: ' + errored + '):\n'
      res += wantedTiles.map(function (tile) {
        args.indent = indent + "  ";
        args.depth = 0;
        return tile.printTree(args);
      }).join("");

      if (!args.coveredBy && !args.covers) {
        res += indent + 'Forgotten tiles:\n'
        res += Object.values(self.tileCache).filter(function (tile) {
          return !args.printed[tile.bounds.toString()];
        }).map(function (tile) {
          args.indent = indent + "  ";
          args.depth = 0;
          return tile.printTree(args);
        }).join("");
      }

      return res;
    },

    handleAllDone: function (tile) {
      var self = this;
      var allDone = Object.values(
        self.tileCache
      ).map(function (tile) {
        return !tile.retryTimeout && (tile.content.allIsLoaded || tile.content.error);
      }).reduce(function (a, b) {
        return a && b;
      }, true);

      if (allDone) {
        var e = {update: "all", tile: tile};
        self.events.triggerEvent(e.update, e);
        self.events.triggerEvent("update", e);
      }
    },

    handleFullTile: function (tile) {
      var self = this;

      var e;
      e = {update: "full-tile", tile: tile};
      self.events.triggerEvent(e.update, e);
      self.events.triggerEvent("update", e);
      self.handleAllDone(tile);
    },

    handleTileError: function (tile, data) {
      var self = this;
      data.tile = tile;

      if (data.status == 503 && tile.retry < self.retries - 1) {
        console.log("retry " + tile.bounds.toString());
        tile.retryTimeout = setTimeout(function () {
          tile.retryTimeout = undefined;
          tile.retry++;
          self.setUpTileContent(tile);
          tile.content.load();
        }, self.retryTimeout);
      } else if (data.status == 404 && tile.fallbackLevel < self.getUrlFallbackLevels("default") - 1) {
        tile.retry = 0;
        tile.fallbackLevel++;
        self.setUpTileContent(tile);
        tile.content.load();
      } else {
        var bounds;
        if (data.complete_ancestor) {
          bounds = new self.TileBounds.Bounds(data.complete_ancestor);
        } else {
          bounds = self.TileBounds.extendTileBounds(tile.bounds);
        }

        /* There used to be code here to fire a
         * self.handleError(data); for the top-level tile, but that
         * prevents working when there are intermittent tile loading
         * errors. Maybe we should retry all tiles endlessly with
         * greater and greater timeout? */
        self.events.triggerEvent("tile-error", data);

        if (bounds) {
          var replacement = self.setUpTile(bounds);
          tile.replace(replacement, data.complete_ancestor != undefined);
          replacement.content.load();
        } else {
          self.handleAllDone();
        }
      }
    },

    handleError: function (originalEvent) {
      var self = this;
      self.error = {
        original: originalEvent,
        source: self,
        toString: function () {
          var self = this;
          return 'Could not load tileset ' + self.source + ' due to the following error: ' + self.original.toString();
        }
      };
      self.events.triggerEvent("error", self.error);
    },

    toString: function () {
      var self = this;
      return self.name;
    },

    toJSON: function () {
      return {
        "type": self.name
      }
    }
  });
  BaseTiledFormat.DataContainer = Class(Format, {name: "DataContainer"});

  return BaseTiledFormat;
});
