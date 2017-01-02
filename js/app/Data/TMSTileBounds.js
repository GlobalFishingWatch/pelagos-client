define([
  "app/Class",
  "app/Events",
  "app/TMSBounds",
  "app/SpaceTime",
  "app/Data/TileBounds",
  "app/Logging",
  "app/LangExtensions"
], function(
  Class,
  Events,
  TMSBounds,
  SpaceTime,
  TileBounds,
  Logging
) {
  var TMSTileBounds = Class(TileBounds.cls, {
    name: "TMSTileBounds",

    Bounds: TMSBounds,

    SpaceTime: Class(SpaceTime, {
      name: "TMSSpaceTime",
      Bounds: TMSBounds
    }),

    TILE_SIZE: 256,

    tileBoundsForRegion: function(args) {
      var self = this;

      var bounds = args.bounds.getBounds();
      bounds = bounds.unwrapDateLine(self.world);

      var dataQualityLevel = args.dataQualityLevel;

      var topLeft = self.project(bounds.top, bounds.left);
      var bottomRight = self.project(bounds.bottom, bounds.right);

      var zoom = Math.floor(Math.min(Math.log2(self.TILE_SIZE / (bottomRight.x - topLeft.x)),
                                     Math.log2(self.TILE_SIZE / (bottomRight.y - topLeft.y)))) + dataQualityLevel;
      var scale = 1 << zoom;

      var left = Math.floor(topLeft.x * scale / self.TILE_SIZE);
      var top = Math.floor(topLeft.y * scale / self.TILE_SIZE);
      var right = Math.ceil(bottomRight.x * scale / self.TILE_SIZE);
      var bottom = Math.ceil(bottomRight.y * scale / self.TILE_SIZE);

      var res = [];
      for (var y = top; y <= bottom; y++) {
        for (var x = left; x <= right; x++) {
          // modulo scale to rewrap dateline
          var coords = [zoom, x % scale, y % scale];
//          coords = self.tmsToGoogle(coords);
          res.push(new TMSBounds(coords));
        }
      }

      return {
        set: res,
        dataQualityLevel: 1
      }
    },

    zoomLevelForTileBounds: function (bounds) {
      var self = this;

      return bounds.getBounds().zoom;
    },


    extendTileBounds: function (obj) {
      var self = this;

      var extended = obj.getBounds().extend();
      if (extended == undefined) return undefined;

      obj = obj.clone();
      obj.update(extended);
      return obj;
    },


    // The mapping between latitude, longitude and pixels is defined by the web
    // mercator projection.
    project: function(lat, lng) {
      var self = this;

      var siny = Math.sin(lat * Math.PI / 180);

      // Truncating to 0.9999 effectively limits latitude to 89.189. This is
      // about a third of a tile past the edge of the world tile.
      siny = Math.min(Math.max(siny, -0.9999), 0.9999);

      return {
        x: self.TILE_SIZE * (0.5 + lng / 360),
        y: self.TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI))
      };
    },

    tmsToGoogle: function(coords) {
      var self = this;

      var zoom = coords[0];
      var x = coords[1];
      var y = coords[2];
      return [zoom, x, Math.pow(2, zoom - 1) - y];
    }
  });

  var res = new TMSTileBounds();
  res.cls = TMSTileBounds;
  return res;
});
