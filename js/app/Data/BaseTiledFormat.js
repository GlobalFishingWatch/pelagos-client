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
  "app/Bounds",
  "app/Data/Format",
  "app/Data/Tile",
  "app/Data/TileBounds",
  "app/Data/Pack",
  "app/Logging",
  "app/Data/Ajax",
  "app/Data/EmptyFormat",
  "lodash",
  "jQuery",
  "app/PopupAuth",
  "app/LangExtensions"
], function(
  Class,
  Events,
  LoadingInfo,
  Bounds,
  Format,
  Tile,
  TileBounds,
  Pack,
  Logging,
  Ajax,
  EmptyFormat,
  _,
  $,
  PopupAuth
) {
  var BaseTiledFormat = Class(Format, {
    name: "BaseTiledFormat",
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

    tilesPerScreen: 16,

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

      var doLoad = function (withCredentials) {
        var url = self.url + "/header";
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.withCredentials = withCredentials;
        Ajax.setHeaders(request, self.headers);
        LoadingInfo.main.add(url, {request: request});
        request.onreadystatechange = function() {
          if (request.readyState === 4) {
            LoadingInfo.main.remove(url);
            if (Ajax.isSuccess(request, url)) {
              var data = JSON.parse(request.responseText);

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
              self.headerIsLoaded = true;
              var e = {update: "header", header: data};
              self.events.triggerEvent(e.update, e);
              self.events.triggerEvent("update", e);
              if (self.initialZoom) {
                self.zoomTo(self.initialZoom);
              }
            } else {
              if (withCredentials) {
                doLoad(false);
              } else {
                self.handleError(Ajax.makeError(request, url, "header"));
              }
            }
          }
        };
        request.send(null);
      };
      doLoad(true);
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

    getSelectionQuery: function(selection, cols) {
      var self = this;

      var url = "";
      if (cols === undefined) {
        cols = selection.sortcols;
      }
      res = [];
      cols.map(function (col) {
        if (selection.data[col][0] == undefined) return;
        res.push(encodeURIComponent(col) + "=" + encodeURIComponent(selection.data[col][0].toString()));
      });
      return res.join(',');
    },

    getSelectionUrl: function(selection, fallbackLevel) {
      var self = this;
      /* FIXME: self.header.infoUsesSelection is a workaround for
         current info database that doesn't contain seriesgroup
         values. This should be removed in the future. */

      var query = self.getSelectionQuery(selection, self.header.infoUsesSelection ? undefined : ['series']);

      var baseUrl = self.getUrl("selection-info", query, fallbackLevel);
      if (baseUrl.indexOf("/sub/") != -1) {
        baseUrl = baseUrl.replace(new RegExp("/sub/\([^/]*\)/.*"), "/sub/$1") + ","
      } else {
        baseUrl = baseUrl + "/sub/";
      }

      return baseUrl + query
    },

    getSelectionInfo: function(selection, cb) {
      var self = this;

      var getSelectionInfo = function (fallbackLevel, withCredentials) {
        var url = self.getSelectionUrl(selection, fallbackLevel) + "/info";
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.withCredentials = withCredentials;
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
                data.toString = function () {
                  var res = $("<span>You are currently not authorized to perform this action. <a href='javascript: void(0);'>Log in</a> to continue.</span>");
                  res.find('a').click(function () {
                    new PopupAuth(data.auth_location, function (success) {
                      if (success) {
                        cb(null, null);
                        getSelectionInfo(fallbackLevel, withCredentials);
                      }
                    });
                  });
                  return res;
                };
                cb(data, null);
              } else if (request.status == 0 && withCredentials) {
                getSelectionInfo(fallbackLevel, false);
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

    search: function(query, cb) {
      var self = this;

      var data = {query: query};
      /* FIXME: JSON encoding is not unambiguous, so using it as a key
       * is not a good idea... */
      data = JSON.stringify(data);
      var url = self.getUrl("search", data, -1) + "/search";

      var request = new XMLHttpRequest();
      request.open('POST', url, true);
      request.withCredentials = true;
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
      request.send(data);
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
        console.log("ZOOM", bounds.toString());

      if (self.error) {
        /* Retrow error, to not confuse code that expects either an
         * error or a load event... */
        self.events.triggerEvent("error", self.error);
        return;
      }

      if (!self.headerIsLoaded) {
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

      var wantedTileBounds = TileBounds.tileBounds(
        bounds,
        self.tilesPerScreen,
        self.header.temporalExtents
      );
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

      wantedTileBounds.map(function (tilebounds) {
        tilebounds = tilebounds.toString();
        setTimeout(function () {
          if (self.wantedTiles[tilebounds]) {
            self.wantedTiles[tilebounds].load();
          }
        }, 0);
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

      if (self.header.maxZoom != undefined && TileBounds.zoomLevelForTileBounds(tile.bounds) > self.header.maxZoom) {
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
        var tile = new Tile(self, tilebounds);

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

      var printed = {};

      var printTree = function (indent, depth, tile) {
        depth = depth || 0;

        var key = tile.bounds.toString();

        var again = printed[key] || false;
        printed[key] = true;

        var flags = [
          "Idx: " + tile.idx.toString(),
          "Usage: " + tile.usage.toString()
        ];
        if (tile.content.loadingStarted) {
          if (tile.content.allIsLoaded) {
            flags.push("loaded");
          } else {
            flags.push("receiving");
          }
        } else {
          flags.push("pending");
        }
        if (tile.content && tile.content.header) flags.push("Rows: " + tile.content.header.length);
        if (self.wantedTiles[key]) flags.push("wanted");
        if (tile.content.error) flags.push("error");
        if (tile.content && tile.content.header && tile.content.header.tags) flags = flags.concat(tile.content.header.tags);

        var res = indent + key + "(" + flags.join(", ") + ")";

        if (args.maxdepth != undefined && depth > args.maxdepth) {
          res += " ...\n";
        } else if (again && !args.expand) {
          res += " (see above)\n";
        } else {
          res += "\n";

          if (tile.replacement) {
            if (tile.replacement_is_known_complete) {
              res += indent + "  Replaced by known complete ancestor:\n";
            } else {
              res += indent + "  Replaced by nearest ancestor:\n";
            }
            res += printTree(indent + "    ", depth+1, tile.replacement);
          }

          if (tile.overlaps.length) {
            res += indent + "  Overlaps:\n";
            tile.overlaps.map(function (overlap) {
              res += printTree(indent + "    ", depth+1, overlap);
            });
          }
        }

        return res;
      }

      var filter = function (tile) { return true; };
      if (args.covers) {
        filter = function (tile) {
          return tile.bounds.containsObj(new Bounds(args.covers))
        };
      } else if (args.coveredBy) {
        filter = function (tile) {
          return new Bounds(args.coveredBy).containsObj(tile.bounds)
        };
      }

      var indent = args.indent || "";
      var res = "";
      var wantedTiles = Object.values(self.wantedTiles).filter(filter);
      var rows = wantedTiles.map(function (tile) { return tile.content && tile.content.header && tile.content.header.length || 0; }).reduce(function (a, b) { return a + b }, 0);
      var loaded = wantedTiles.map(function (tile) { return tile.content.allIsLoaded ? 1 : 0; }).reduce(function (a, b) { return a + b }, 0);
      var errored = wantedTiles.map(function (tile) { return tile.content.error ? 1 : 0; }).reduce(function (a, b) { return a + b }, 0);
      res += indent + 'Wanted tiles (Rows: ' + rows + ', Loaded: ' + loaded + ', Errors: ' + errored + '):\n'
      res += wantedTiles.map(printTree.bind(self, indent + "  ", 0)).join("");

      if (!args.coveredBy && !args.covers) {
        res += indent + 'Forgotten tiles:\n'
        res += Object.values(self.tileCache).filter(function (tile) {
          return !printed[tile.bounds.toString()];
        }).map(
          printTree.bind(self, indent + "  ", 0)
        ).join("");
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
          bounds = new Bounds(data.complete_ancestor);
        } else {
          bounds = TileBounds.extendTileBounds(tile.bounds);
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
