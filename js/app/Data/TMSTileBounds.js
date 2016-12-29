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

      var bounds = args.bounds;

      var dataQualityLevel = args.dataQualityLevel;

      var topLeft = self.project(new google.maps.LatLng(bounds.top, bounds.left));
      var bottomRight = self.project(new google.maps.LatLng(bounds.bottom, bounds.right));

      var zoom = self.zoomLevelForTileBounds(bounds) + dataQualityLevel;
      var scale = 1 << zoom;

      var left = Math.floor(topLeft.x * scale / self.TILE_SIZE);
      var top = Math.floor(topLeft.y * scale / self.TILE_SIZE);
      var right = Math.ceil(bottomRight.x * scale / self.TILE_SIZE);
      var bottom = Math.ceil(bottomRight.y * scale / self.TILE_SIZE);

      var res = [];
      for (var y = bottom; y <= top; y++) {
        for (var x = left; x <= right; x++) {
          var coords = [zoom, x, y];
          coords = self.tmsToGoogle(coords);
          coords = coords.map(function (value) { return value.toString(); }).join(",");
          res.push(coords);
        }
      }
      return res;
    },

    zoomLevelForTileBounds: function (bounds) {
      var self = this;

      return bounds.getBounds().zoom;
    },


    extendTileBounds: function (obj) {
      var self = this;

      return new self.Bounds(obj).extend();
    },


    // The mapping between latitude, longitude and pixels is defined by the web
    // mercator projection.
    project: function(latLng) {
      var self = this;

      var siny = Math.sin(latLng.lat() * Math.PI / 180);

      // Truncating to 0.9999 effectively limits latitude to 89.189. This is
      // about a third of a tile past the edge of the world tile.
      siny = Math.min(Math.max(siny, -0.9999), 0.9999);

      return new google.maps.Point(
          self.TILE_SIZE * (0.5 + latLng.lng() / 360),
          self.TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)));
    },

    tmsToGoogle: function(coords) {
      var self = this;

      var zoom = coords[0];
      var x = coords[1];
      var y = coords[2];
      return [zoom, x, pow(2, zoom - 1) - ty];
    }
  });

  var res = new TMSTileBounds();
  res.cls = TMSTileBounds;
  return res;
});
