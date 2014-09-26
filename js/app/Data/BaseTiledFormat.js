/*
  tm = new BaseTiledFormat({url:"http://127.0.0.1:8000/tiles"});

  tm.events.on({
      "tile-error": function (data) { console.log("tile-error: " + data.exception + " @ " + data.tile.bounds.toBBOX()); },
      "batch": function (data) { console.log("batch: " + data.tile.bounds.toBBOX()); },
      "full-tile": function (data) { console.log("full-tile: " + data.tile.bounds.toBBOX()); },
      "all": function () { console.log("all"); }
  });
  tm.zoomTo(new Bounds(0, 0, 11.25, 11.25));
*/

define(["app/Class", "app/Events", "app/Bounds", "app/Data/Format", "app/Data/Tile", "app/Data/Pack", "app/Logging", "app/Data/Ajax", "lodash", "app/LangExtensions"], function(Class, Events, Bounds, Format, Tile, Pack, Logging, Ajax, _) {
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

    world: new Bounds(-180, -90, 180, 90),

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

      if (typeof XMLHttpRequest != "undefined") {
        var url = self.url + "/header";
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        Ajax.setHeaders(request, self.headers);
        request.onreadystatechange = function() {
          if (request.readyState === 4) {
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
                  typespec: Pack.typemap.byname.Int32
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
              self.handleError(Ajax.makeError(request, url, "header"));
            }
          }
        };
        request.send(null);
      } else {
        self.handleError({
          toString: function () {
            return "XMLHttpRequest not supported";
          }
        });
      }
      self.events.triggerEvent("load");
    },

    getUrl: function (key) {
      var self = this;

      if (self.header.alternatives == undefined) return self.url;

      var alternative;
      if (key) {
        alternative = key.hashCode() % self.header.alternatives.length;
        if (alternative < 0) alternative += self.header.alternatives.length;
      } else {
        self.urlAlternative = (self.urlAlternative + 1) % self.header.alternatives.length;
        alternative = self.urlAlternative;
      }
      return self.header.alternatives[alternative];
    },

    getSelectionInfo: function(selection, cb) {
      var self = this;

      var data = {};
      for (var key in selection.data) {
        data[key] = selection.data[key][0];
      }

      var url = self.getUrl() + "/series";
      var request = new XMLHttpRequest();
      request.open('POST', url, true);
      Ajax.setHeaders(request, self.headers);
      request.onreadystatechange = function() {
        if (request.readyState === 4) {
          if (Ajax.isSuccess(request, url)) {
            var data = JSON.parse(request.responseText);
            cb(null, data);
          } else {
            var e = Ajax.makeError(request, url, "selection information from ");
            e.source = self;
            cb(e, null);
          }
        }
      };
      request.send(JSON.stringify(data));
    },

    tileParamsForRegion: function(bounds) {
      var self = this;
      var origBounds = bounds;
      bounds = bounds.unwrapDateLine(self.world);

      var res = {
        bounds: origBounds,
        unwrappedBounds: bounds,
        width: bounds.getWidth(),
        height: bounds.getHeight(),
        worldwidth: self.world.getWidth(),
        worldheight: self.world.getHeight(),

        toString: function () {
          return "\n" + Object.items(this
            ).filter(function (item) { return item.key != "toString" && item.key != "stack"; }
            ).map(function (item) { return "  " + item.key + "=" + item.value.toString(); }
            ).join("\n") + "\n";
        }
      };

      res.level = Math.ceil(Math.log(res.worldwidth / (res.width/Math.sqrt(self.tilesPerScreen)), 2));
      
      res.tilewidth = res.worldwidth / Math.pow(2, res.level);
      res.tileheight = res.worldheight / Math.pow(2, res.level);

      res.tileleft = res.tilewidth * Math.floor(bounds.left / res.tilewidth);
      res.tileright = res.tilewidth * Math.ceil(bounds.right / res.tilewidth);
      res.tilebottom = res.tileheight * Math.floor(bounds.bottom / res.tileheight);
      res.tiletop = res.tileheight * Math.ceil(bounds.top / res.tileheight);

      res.tilesx = (res.tileright - res.tileleft) / res.tilewidth;
      res.tilesy = (res.tiletop - res.tilebottom) / res.tileheight;

      return res;
    },

    tileBoundsForRegion: function(bounds) {
      /* Returns a list of tile bounds covering a region. */

      var self = this;

      var params = self.tileParamsForRegion(bounds);
      Logging.main.log("Data.BaseTiledFormat.tileBoundsForRegion", params);

      res = [];
      for (var x = 0; x < params.tilesx; x++) {
        for (var y = 0; y < params.tilesy; y++) {
          res.push(new Bounds(
            params.tileleft + x * params.tilewidth,
            params.tilebottom + y * params.tileheight,
            params.tileleft + (x+1) * params.tilewidth,
            params.tilebottom + (y+1) * params.tileheight
          ).rewrapDateLine(self.world));
        }
      }

      return res;
    },

    extendTileBounds: function (bounds) {
     /* Returns the first larger tile bounds enclosing the tile bounds
      * sent in. Note: Parameter bounds must be for a tile, as returned
      * by a previous call to tileBoundsForRegion or
      * extendTileBounds. */

      var self = this;

      var tilewidth = bounds.getWidth() * 2;
      var tileheight = bounds.getHeight() * 2;

      if (tilewidth > self.world.getWidth() || tileheight > self.world.getHeight()) {
        return undefined;
      } 

      var tileleft = tilewidth * Math.floor(bounds.left / tilewidth);
      var tilebottom = tileheight * Math.floor(bounds.bottom / tileheight);

      return new Bounds(tileleft, tilebottom, tileleft + tilewidth, tilebottom + tileheight);
    },

    zoomTo: function (bounds) {
      var self = this;

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

      var oldBounds = self.bounds;
      self.bounds = bounds;

      var wantedTileBounds = self.tileBoundsForRegion(bounds);
      var wantedTiles = {};
      var oldWantedTiles = self.wantedTiles;
      var anyNewTiles = false;
      wantedTileBounds.map(function (tilebounds) {
        var key = tilebounds.toBBOX();
        if (oldWantedTiles[key] != undefined) {
          wantedTiles[key] = oldWantedTiles[tilebounds.toBBOX()];
        } else {
          wantedTiles[key] = self.setUpTile(tilebounds);
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
          var oldBounds = self.oldBounds != undefined ? self.oldBounds.toBBOX() : "undefined";
          var newBounds = self.newBounds != undefined ? self.newBounds.toBBOX() : "undefined";
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
        setTimeout(function () {
          var bbox = tilebounds.toBBOX();
          if (self.wantedTiles[bbox]) {
            self.wantedTiles[bbox].load();
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

    setUpTile: function (tilebounds) {
      var self = this;
      var key = tilebounds.toBBOX();

      if (!self.tileCache[key]) {
        var tile = new Tile(self, tilebounds);

        tile.idx = self.tileIdxCounter++;
        tile.setContent(self.getTileContent(tile));
        tile.findOverlaps();

        tile.content.events.on({
          "batch": self.handleBatch.bind(self, tile),
          "all": self.handleFullTile.bind(self, tile),
          "error": self.handleTileError.bind(self, tile),
          scope: self
        });
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

      delete self.tileCache[tile.bounds.toBBOX()];
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

      return self.getDoneTiles().map(function (tile) {
        return tile.content;
      });
    },

    printTree: function (maxdepth) {
      var self = this;

      var printed = {};

      var printTree = function (indent, depth, tile) {
        depth = depth || 0;

        var key = tile.bounds.toBBOX();

        var again = printed[key] || false;
        printed[key] = true;
        var loaded = tile.content.allIsLoaded ? ", loaded" : "";
        var length = tile.content && tile.content.header ? ", Rows: " + tile.content.header.length : "";
        var wanted = self.wantedTiles[key] ? ", wanted" : "";
        var error = tile.content.error ? ", error" : "";
        var res = indent + key + "(Idx: " + tile.idx.toString() + ", Usage: " + tile.usage.toString() + loaded + length + error + wanted + ")";
        if (maxdepth != undefined && depth > maxdepth) {
          res += " ...\n";
        } else {
          res += "\n";

          if (tile.replacement) {
            res += indent + "  Replaced by:\n";
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

      var res = "";
      res += 'Wanted tiles:\n'
        res += Object.values(self.wantedTiles).map(printTree.bind(self, "  ", 0)).join("\n");
      res += 'Forgotten tiles:\n'

      res += Object.values(self.tileCache).filter(function (tile) {
        return !printed[tile.bounds.toBBOX()];
      }).map(
        printTree.bind(self, "  ", 0)
      ).join("\n");

      return res;
    },

    handleAllDone: function (tile) {
      var self = this;
      var allDone = Object.values(self.tileCache
        ).map(function (tile) { return tile.content.allIsLoaded || tile.content.error; }
        ).reduce(function (a, b) { return a && b; });

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
      var bounds = self.extendTileBounds(tile.bounds);

      if (bounds) {
        var replacement = self.setUpTile(bounds);
        tile.replace(replacement);
        replacement.content.load();

        self.events.triggerEvent("tile-error", data);
      } else {
        if (self.error) {
          /* Do not generate multiple errors just because we tried to
           * load multiple tiles... */
          self.events.triggerEvent("tile-error", data);
        } else {
          self.handleError(data);
        }
      }

      self.handleAllDone();
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
