define([
  "app/Class",
  "app/Events",
  "app/Bounds",
  "app/Timerange",
  "app/SpaceTime",
  "app/Logging",
  "app/LangExtensions"
], function(
  Class,
  Events,
  Bounds,
  Timerange,
  SpaceTime,
  Logging
) {
  var TileBounds = Class({
    name: "TileBounds",

    Bounds: Bounds,
    Timerange: Timerange,
    SpaceTime: SpaceTime,

    initialize: function () {},

    world: new Bounds([-180, -90, 180, 90]),

    log: function(x, base) {
      return Math.log(x) / Math.log(base);
    },

    tileParamsForRegion: function(args) {
      var self = this;
      var bounds = args.bounds;
      var dataQualityLevel = args.dataQualityLevel;

      var origBounds = new self.Bounds(bounds);
      bounds = origBounds.unwrapDateLine(self.world);

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

      res.level = Math.floor(Math.min(self.log(res.worldheight / res.height, 2),
                                      self.log(res.worldwidth / res.width, 2)) + dataQualityLevel);

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

    tileBoundsForRegion: function(args) {
      /* Returns a list of tile bounds covering a region. */
      var self = this;
      var bounds = args.bounds;

      var params = self.tileParamsForRegion(args);
      Logging.main.log("Data.BaseTiledFormat.tileBoundsForRegion", params);

      res = [];
      for (var x = 0; x < params.tilesx; x++) {
        for (var y = 0; y < params.tilesy; y++) {
          res.push(new self.Bounds([
            params.tileleft + x * params.tilewidth,
            params.tilebottom + y * params.tileheight,
            params.tileleft + (x+1) * params.tilewidth,
            params.tilebottom + (y+1) * params.tileheight
          ]).rewrapDateLine(self.world));
        }
      }

      return {
        set: res,
        dataQualityLevel: 1,
        params: params
      }
    },

    temporalExtents: 1000 * 60 * 60 * 24 * 30,
    temporalExtentsBase: 0,

    tileParamsForRange: function(args) {
      var self = this;
      var temporalExtents = args.temporalExtents || self.temporalExtents;
      var temporalExtentsBase = args.temporalExtentsBase || self.temporalExtentsBase;
      var range = new Timerange(args.bounds);

      var res = {
        range: range,
        length: range.getLength(),

        toString: function () {
          return "\n" + Object.items(this
            ).filter(function (item) { return item.key != "toString" && item.key != "stack"; }
            ).map(function (item) { return "  " + item.key + "=" + item.value.toString(); }
            ).join("\n") + "\n";
        }
      };

      res.tilestart = temporalExtentsBase + Math.floor((range.start.getTime() - temporalExtentsBase) / temporalExtents) * temporalExtents;
      res.tileend = temporalExtentsBase + Math.ceil((range.end.getTime() - temporalExtentsBase) / temporalExtents) * temporalExtents;

      return res;
    },

    tileBoundsForRange: function(args) {
      /* Returns a list of tile bounds covering a region. */
      var self = this;
      var temporalExtents = args.temporalExtents || self.temporalExtents;
      var dataQualityLevel = args.dataQualityLevel;

      if (typeof(temporalExtents) == "number") {
        var params = self.tileParamsForRange(args);
        Logging.main.log("Data.BaseTiledFormat.tileBoundsForRange", params);

        res = [];
        for (var t = params.tilestart; t < params.tileend; t += temporalExtents) {
          res.push(new Timerange([
            new Date(t), new Date(t + temporalExtents)]));
        }

        return {
          set: res,
          dataQualityLevel: dataQualityLevel - Math.round(self.log(Math.max(1, params.length / temporalExtents), 4)),
          params: params
        };
      } else {
        /* temporalExtents is a list of time ranges: [[start,end],...] */

        var range = new Timerange(args.bounds);

        var res = temporalExtents.map(function (tileRange) {
          return new Timerange([new Date(tileRange[0]), new Date(tileRange[1])]);
        }).filter(function (tileRange) {
          return range.intersectsObj(tileRange, {inclusive: false});
        });
        return {
          set: res,
          dataQualityLevel: dataQualityLevel - Math.round(self.log(Math.max(1, res.length), 4))
        };
      }
    },

    /**
     * Calculates the set bounds of tiles that should be loaded.
     *
     * This function can work with either Bounds objects and no temporal
     * tiling (in which case the temporalExtents parameters should not
     * be given), or with SpaceTime objects and temporal tiling.
     *
     * @param {Bounds|SpaceTime} args.bounds - Screen bbox or screen bbox and time range
     * @param {Integer} args.dataQualityLevel - How many zoom levels deeper than one tile filling the whole screen to show
     * @param {Float|Object[]} [args.temporalExtents] - Length of each temporal extent or explicit list of temporal extents, see docs on tileset header for details
     * @param {Float} [args.temporalExtentsBase] - Optional, start of first temporal extent. If not given, 1970-01-01 00:00:00 UTC
     * @returns {Bounds[]|SpaceTime} - List of tile bounds to load or list of tile bounds and time ranges to load
     */
    tileBounds: function(args) {
      var self = this;
      var sets = [];
      var bounds = args.bounds;

      var addSet = function(set) {
        if (args.autoAdjustQuality !== false) {
          args.dataQualityLevel = set.dataQualityLevel;
        }
        sets.push(set.set);
      };

      if (bounds.getTimerange) {
        addSet(self.tileBoundsForRange(args));
      }
      if (bounds.getBounds) {
        addSet(self.tileBoundsForRegion(args));
      }

      var flatten = function(set1, set2) {
        var res = [];
        for (var i1 = 0; i1 < set1.length; i1++) {
          for (var i2 = 0; i2 < set2.length; i2++) {
            var item = set1[i1].clone();
            item.update(set2[i2]);
            res.push(item);
          }
        }
        return res;
      }   

      return sets.reduce(flatten, [new self.SpaceTime()]);
    },

    /**
     * Returns the first larger tile bounds enclosing the tile bounds
     * sent in. This function can work with either Bounds or SpaceTime
     * objects.
     *
     * @param {Bounds|SpaceTime} bounds - Bounds or bounds and time
     * range for a tile, as returned by a previous call to tileBounds or
     * extendTileBounds.
     * @return {Bounds|SpaceTime}
     */
    extendTileBounds: function (obj) {
      var self = this;

      bounds = new self.Bounds(obj);

      if (!self.world.containsObj(bounds)) {
        return undefined;
      }

      var tilewidth = bounds.getWidth() * 2;
      var tileheight = bounds.getHeight() * 2;

      var tileleft = tilewidth * Math.floor(bounds.left / tilewidth);
      var tilebottom = tileheight * Math.floor(bounds.bottom / tileheight);

      var res = new self.Bounds([tileleft, tilebottom, tileleft + tilewidth, tilebottom + tileheight]);

      if (self.world.containsObj(res)) {
        obj = obj.clone();
        obj.update(res);
        return obj;
      } else {
        obj = obj.clone();
        obj.update(self.world);
        return obj;
      }
    },

    /**
     * Calculates a "zoom level", basically the depth in the quad tree,
     * for a set of tile bounds.
     *
     * @param {Bounds|SpaceTime} bounds - Bounds or bounds and time
     * range for a tile, as returned by a previous call to tileBounds or
     * extendTileBounds.
     * @return {Integer}
     */
    zoomLevelForTileBounds: function (bounds) {
      var self = this;
      bounds = bounds.getBounds();
      return Math.max(
        0,
        Math.floor(Math.min(
          Math.log(self.world.getWidth() / bounds.getWidth(), 2),
          Math.log(self.world.getHeight() / bounds.getHeight(), 2)))
      );
    }
  });

  var res = new TileBounds();
  res.cls = TileBounds;

  return res;
});
