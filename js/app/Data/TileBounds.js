define(["app/Class", "app/Events", "app/Bounds", "app/Timerange", "app/SpaceTime", "app/Data/Format", "app/Data/Tile", "app/Data/Pack", "app/Logging", "app/Data/Ajax", "lodash", "app/LangExtensions"], function(Class, Events, Bounds, Timerange, SpaceTime, Format, Tile, Pack, Logging, Ajax, _) {
  var TileBounds = Class({name: "TileBounds"});

  TileBounds.world = new Bounds([-180, -90, 180, 90]);

  TileBounds.tileParamsForRegion = function(bounds, tilesPerScreen) {
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
  },

  TileBounds.tileBoundsForRegion = function(bounds, tilesPerScreen) {
    /* Returns a list of tile bounds covering a region. */

    var params = TileBounds.tileParamsForRegion(bounds, tilesPerScreen);
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

    return res;
  },

  TileBounds.tileParamsForRange = function(range) {
    var range = new Timerange(range);

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

    res.tilestart = new Date(range.start.getFullYear(), range.start.getMonth(), 1);
    res.tileend = new Date(range.end.getFullYear(), range.end.getMonth() + 1, 1);

    return res;
  },


  TileBounds.tileBoundsForRange = function(bounds, tilesPerScreen) {
    /* Returns a list of tile bounds covering a region. */

    var params = TileBounds.tileParamsForRange(bounds, tilesPerScreen);
    Logging.main.log("Data.BaseTiledFormat.tileBoundsForRange", params);

    res = [];
    for (var t = params.tilestart; t < params.tileend; t = new Date(t.getFullYear(), t.getMonth() + 1, 1)) {
      res.push(new Timerange([
        t, new Date(t.getFullYear(), t.getMonth() + 1, 1)]));
    }

    return res;
  },

  TileBounds.tileBounds = function(bounds, tilesPerScreen) {
    var sets = [];

    var addSet = function(set) {
      tilesPerScreen = Math.ceil(tilesPerScreen / set.length);
      sets.push(set);
    };

    if (bounds.getTimerange) {
      addSet(TileBounds.tileBoundsForRange(bounds, tilesPerScreen));
    }
    if (bounds.getBounds) {
      addSet(TileBounds.tileBoundsForRegion(bounds, tilesPerScreen));
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
  },

  TileBounds.extendTileBounds = function (obj) {
   /* Returns the first larger tile bounds enclosing the tile bounds
    * sent in. Note: Parameter bounds must be for a tile, as returned
    * by a previous call to tileBounds or extendTileBounds. */

    bounds = new Bounds(obj);

    var tilewidth = bounds.getWidth() * 2;
    var tileheight = bounds.getHeight() * 2;

    var tileleft = tilewidth * Math.floor(bounds.left / tilewidth);
    var tilebottom = tileheight * Math.floor(bounds.bottom / tileheight);

    var res = new Bounds(tileleft, tilebottom, tileleft + tilewidth, tilebottom + tileheight);

    if (TileBounds.world.containsObj(res)) {
      obj = new obj.clone();
      obj.update(res);
      return res;
    } else {
      return undefined;
    }
  }

  return TileBounds;
});
