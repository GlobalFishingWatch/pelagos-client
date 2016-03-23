define([
  "app/Class",
  "app/Events",
  "app/Data/TileBounds"
], function(
  Class,
  Events,
  TileBounds
) {
  return Class({
    name: "Tile",
    initialize: function(manager, bounds) {
      var self = this;
      self.manager = manager;
      self.bounds = bounds;

      self.fallbackLevel = 0;
      self.retry = 0;
      self.retryTimeout = undefined;
      self.overlaps = [];
      self.replacement = undefined;
      self.replacement_is_known_complete = undefined;
      self.usage = 0;
      self.content = undefined; // An instance of Format

      self.events = new Events("Data.Tile");
      self.destroyed = false;
    },

    setContent: function (content) {
      var self = this;
      self.content = content;
      content.events.on({
        all: self.allLoaded.bind(self)
      });
    },

    verify: function () {
      var self = this;
      var content = self.content;

      var res = {
        real: {
          outside: 0,
          inside: 0
        },
        virtual: {
          outside: 0,
          inside: 0
        },
        total: content.rowcount
      };

      for (var i = 0; i < content.rowcount; i++) {
        var virtname = 'real';
        var inoutname = 'outside';
        if (content.data.virtual && !!content.data.virtual[i]) virtname = 'virtual';
          if (self.bounds.contains(content.data.longitude[i], content.data.latitude[i])) inoutname = 'inside';
        res[virtname][inoutname]++;
      }
      return res;
    },

    findOverlaps: function () {
      var self = this;
      self.overlaps = Object.values(self.manager.tileCache).filter(function (tile) {
        return tile.bounds.intersectsObj(self.bounds, {inclusive: false});
      });
      self.overlaps.map(function (tile) {
        tile.reference();
      });
    },

    removeOverlaps: function () {
      var self = this;
      self.overlaps.map(function (tile) {
        tile.dereference();
      });
      self.overlaps = [];
    },

    allLoaded: function () {
      var self = this;
      Logging.main.log("Data.BaseTiledFormat.Tile.allLOaded", {tile:self.bounds.toString(), toString: function () { return this.tile; }});
      self.removeOverlaps();
    },

    replace: function (replacement, known_complete) {
      var self = this;
      if (replacement) {
        replacement.reference();
        self.removeOverlaps();
      } else {
        self.findOverlaps();
      }
      if (self.replacement) {
        self.replacement.dereference();
      }
      self.replacement = replacement;
      self.replacement_is_known_complete = known_complete;
    },

    reference: function () {
      var self = this;
      self.usage++;
    },

    dereference: function () {
      var self = this;
      self.usage--;
      if (self.usage <= 0) {
        self.destroy();
      }
    },

    load: function () {
      var self = this;
      self.content.load();
    },

    destroy: function () {
      var self = this;
      if (self.destroyed) return;
      self.destroyed = true;
      self.content.destroy();
      self.removeOverlaps();
      if (self.replacement) {
        self.replacement.dereference();
      }
      self.events.triggerEvent("destroy");
    },

    toString: function () {
      var self = this;
      return self.bounds.toString();
    },

    getStatus: function () {
      var self = this;

      if (self.content && self.content.error) {
        return "error";
      } else {
        if (self.content.loadingStarted) {
          if (self.content.allIsLoaded) {
            return "loaded";
          } else {
            return "receiving";
          }
        } else {
          return "pending";
        }
      }
    },

    isWanted: function () {
      var self = this;
     return !!self.manager.wantedTiles[self.bounds.toString()];
    },

    printTree: function (args) {
      var self = this;

      var indent = args.indent || '';
      var depth = args.depth || 0;

      var key = self.bounds.toString();

      if (args.printed === undefined) args.printed = {};
      var again = args.printed[key] || false;
      args.printed[key] = true;

      var flags = [
        "Idx: " + self.idx.toString(),
        "Usage: " + self.usage.toString(),
        "Level: " + TileBounds.zoomLevelForTileBounds(self.bounds)
      ];
      if (self.content && self.content.header) flags.push("Rows: " + self.content.header.length);
      if (self.isWanted()) flags.push("wanted");
      flags.push(self.getStatus());
      if (self.content && self.content.header && self.content.header.tags) flags = flags.concat(self.content.header.tags);

      var res = indent + key + " (" + flags.join(", ") + ")";

      if (args.maxdepth != undefined && depth > args.maxdepth) {
        res += " ...\n";
      } else if (again && !args.expand) {
        res += " (see above)\n";
      } else {
        res += "\n";

        if (self.replacement) {
          if (self.replacement_is_known_complete) {
            res += indent + "  Replaced by known complete ancestor:\n";
          } else {
            res += indent + "  Replaced by nearest ancestor:\n";
          }
          args.depth = depth + 1;
          args.indent = indent + "    ";
          res += self.replacement.printTree(args);
        }

        if (self.overlaps.length) {
          res += indent + "  Overlaps:\n";
          self.overlaps.map(function (overlap) {
            args.depth = depth + 1;
            args.indent = indent + "    ";
            res += overlap.printTree(args);
          });
        }
      }

      return res;
    },

    toJSON: function () {
      var self = this;
      return self.bounds;
    }

  });
});
