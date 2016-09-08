/*
  tm = new TiledBinFormat({url:"http://127.0.0.1:8000/tiles"});

  tm.events.on({
      "tile-error": function (data) { console.log("tile-error: " + data.exception + " @ " + data.tile.bounds.toString()); },
      "batch": function (data) { console.log("batch: " + data.tile.bounds.toString()); },
      "full-tile": function (data) { console.log("full-tile: " + data.tile.bounds.toString()); },
      "all": function () { console.log("all"); }
  });
  tm.zoomTo(new Bounds([0, 0, 11.25, 11.25]));
*/

define(["app/Class", "app/Data/Format", "app/Data/BaseTiledFormat", "app/Data/BinFormat"], function(Class, Format, BaseTiledFormat, BinFormat) {
  var TiledBinFormat = Class(BaseTiledFormat, {
    name: "TiledBinFormat",
    withCredentials: false,

    getTileContent: function (tile) {
      var self = this;
      var withCredentials = self.withCredentials;
      if (self.header.tilesWithCredentials !== undefined) {
        withCredentials = self.header.tilesWithCredentials;
      }

      var base = self.getUrl(
        "tile",
        tile.bounds.toString(),
        tile.fallbackLevel);
      var content = new BinFormat({
        url: base + "/" + tile.bounds.toString(),
        withCredentials: withCredentials
      });
      content.setHeaders(self.headers);
      return content;
    },

    toString: function () {
      var self = this;
      return self.name + ": " + self.url;
    },

    toJSON: function () {
      var self = this;
      return {
        "type": self.name,
        args: {
          url: self.url
        }
      }
    }
  });
  Format.formatClasses.TiledBinFormat = TiledBinFormat;

  return TiledBinFormat;
});
