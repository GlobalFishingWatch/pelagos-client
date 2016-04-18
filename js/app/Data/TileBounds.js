define([
  "app/Class",
  "app/Events",
  "app/Bounds",
  "app/Timerange",
  "app/Logging",
  "app/LangExtensions"
], function(
  Class,
  Events,
  Bounds,
  Timerange,
  Logging
) {
  var TileBounds = Class({name: "TileBounds"});

  TileBounds.world = new Bounds([-180, -90, 180, 90]);

  TileBounds.tileParamsForRegion = function(args) {
    var bounds = args.bounds;
    var tilesPerScreen = args.tilesPerScreen;

    var origBounds = new Bounds(bounds);
    bounds = origBounds.unwrapDateLine(TileBounds.world);

    var res = {
      bounds: origBounds,
      unwrappedBounds: bounds,
      width: bounds.getWidth(),
      height: bounds.getHeight(),
      worldwidth: TileBounds.world.getWidth(),
      worldheight: TileBounds.world.getHeight(),

      toString: function () {
        return "\n" + Object.items(this
          ).filter(function (item) { return item.key != "toString" && item.key != "stack"; }
          ).map(function (item) { return "  " + item.key + "=" + item.value.toString(); }
          ).join("\n") + "\n";
      }
    };

    res.level = Math.ceil(Math.log(res.worldwidth / (res.width/Math.sqrt(tilesPerScreen)), 2));

    res.tilewidth = res.worldwidth / Math.pow(2, res.level);
    res.tileheight = res.worldheight / Math.pow(2, res.level);

    res.tileleft = res.tilewidth * Math.floor(bounds.left / res.tilewidth);
    res.tileright = res.tilewidth * Math.ceil(bounds.right / res.tilewidth);
    res.tilebottom = res.tileheight * Math.floor(bounds.bottom / res.tileheight);
    res.tiletop = res.tileheight * Math.ceil(bounds.top / res.tileheight);

    res.tilesx = (res.tileright - res.tileleft) / res.tilewidth;
    res.tilesy = (res.tiletop - res.tilebottom) / res.tileheight;

    return res;
  };

  TileBounds.tileBoundsForRegion = function(args) {
    /* Returns a list of tile bounds covering a region. */
    var bounds = args.bounds;
    var tilesPerScreen = args.tilesPerScreen;

    var params = TileBounds.tileParamsForRegion(args);
    Logging.main.log("Data.BaseTiledFormat.tileBoundsForRegion", params);

    res = [];
    for (var x = 0; x < params.tilesx; x++) {
      for (var y = 0; y < params.tilesy; y++) {
        res.push(new Bounds([
          params.tileleft + x * params.tilewidth,
          params.tilebottom + y * params.tileheight,
          params.tileleft + (x+1) * params.tilewidth,
          params.tilebottom + (y+1) * params.tileheight
        ]).rewrapDateLine(TileBounds.world));
      }
    }

    return {
      set: res,
      tilesPerScreen: 1,
      params: params
    }
  };

  TileBounds.temporalExtents = 1000 * 60 * 60 * 24 * 30;
  TileBounds.temporalExtentsBase = 0;

  TileBounds.tileParamsForRange = function(args) {
    var temporalExtents = args.temporalExtents || TileBounds.temporalExtents;
    var temporalExtentsBase = args.temporalExtentsBase || TileBounds.temporalExtentsBase;
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
  };

  TileBounds.tileBoundsForRange = function(args) {
    /* Returns a list of tile bounds covering a region. */
    var temporalExtents = args.temporalExtents || TileBounds.temporalExtents;
    var tilesPerScreen = args.tilesPerScreen;

    if (typeof(temporalExtents) == "number") {
      var params = TileBounds.tileParamsForRange(args);
      Logging.main.log("Data.BaseTiledFormat.tileBoundsForRange", params);

      res = [];
      for (var t = params.tilestart; t < params.tileend; t += temporalExtents) {
        res.push(new Timerange([
          new Date(t), new Date(t + temporalExtents)]));
      }

      return {
        set: res,
        tilesPerScreen: Math.ceil(tilesPerScreen / Math.max(1, params.length / temporalExtents)),
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
        tilesPerScreen: Math.ceil(tilesPerScreen / Math.max(1, res.length))
      };
    }
  };

  TileBounds.tileBounds = function(args) {
    var sets = [];
    var bounds = args.bounds;

    var addSet = function(set) {
      args.tilesPerScreen = set.tilesPerScreen;
      sets.push(set.set);
    };

    if (bounds.getTimerange) {
      addSet(TileBounds.tileBoundsForRange(args));
    }
    if (bounds.getBounds) {
      addSet(TileBounds.tileBoundsForRegion(args));
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

    return sets.reduce(flatten, [bounds]);
  };

  TileBounds.extendTileBounds = function (obj) {
   /* Returns the first larger tile bounds enclosing the tile bounds
    * sent in. Note: Parameter bounds must be for a tile, as returned
    * by a previous call to tileBounds or extendTileBounds. */

    bounds = new Bounds(obj);

    if (!TileBounds.world.containsObj(bounds)) {
      return undefined;
    }

    var tilewidth = bounds.getWidth() * 2;
    var tileheight = bounds.getHeight() * 2;

    var tileleft = tilewidth * Math.floor(bounds.left / tilewidth);
    var tilebottom = tileheight * Math.floor(bounds.bottom / tileheight);

    var res = new Bounds([tileleft, tilebottom, tileleft + tilewidth, tilebottom + tileheight]);

    if (TileBounds.world.containsObj(res)) {
      obj = obj.clone();
      obj.update(res);
      return obj;
    } else {
      obj = obj.clone();
      obj.update(TileBounds.world);
      return obj;
    }
  };

  TileBounds.zoomLevelForTileBounds = function (bounds) {
    bounds = bounds.getBounds();
    return Math.max(
      0,
      Math.floor(Math.min(
        Math.log(TileBounds.world.getWidth() / bounds.getWidth(), 2),
        Math.log(TileBounds.world.getHeight() / bounds.getHeight(), 2)))
    );
  };

  return TileBounds;
});
