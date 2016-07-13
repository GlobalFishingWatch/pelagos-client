define(["app/Class", "app/Events", "app/Data/TypedMatrixParser", "app/Data/Format"], function(Class, Events, TypedMatrixParser, Format) {
  /**
   * Basic Format class for data sources that only consists of one
   * file in TypedMatrix format.
   *
   * @class Data/BinFormat
   * @augments Data/Format
   * @augments Data/TypedMatrixParser
   */
  var BinFormat = Class(TypedMatrixParser, Format, {
    name: "BinFormat",
    initialize: function() {
      var self = this;
     
      Format.prototype.initialize.apply(self, arguments);
      // Header and events will be overwritten, with the same values...
      TypedMatrixParser.prototype.initialize.call(self, self.url);
    },

    getDirectory: function () {
      var self = this;
      return self.url.slice(0, self.url.lastIndexOf("/"));
    },

    zoomTo: function () {
      var self = this;

      self.load();
    },

    headerLoaded: function (data) {
      var self = this;
      self.header = data;
      self.seriescount = self.header.series;

      if (self.header.orientation == 'rowwise') {
        for (var name in self.header.colsByName) {
          var col = self.header.colsByName[name];
          self.data[name] = new (eval(col.typespec.array))(self.header.length);
        }
      }

      Format.prototype.headerLoaded.call(self, data);
      TypedMatrixParser.prototype.headerLoaded.call(self, data);
    },

    colLoaded: function (col, colValues) {
      var self = this;

      self.data[col.name] = colValues;
      TypedMatrixParser.prototype.colLoaded.call(self, col, colValues);
    },

    rowLoaded: function(data) {
      var self = this;

      for (var name in self.header.colsByName) {
        if (name == 'rowidx') continue;
        self.data[name][self.rowcount] = data[name];
        self.header.colsByName[name].min = self.header.colsByName[name].min == undefined ? data[name] : Math.min(self.header.colsByName[name].min, data[name]);
        self.header.colsByName[name].max = self.header.colsByName[name].max == undefined ? data[name] : Math.max(self.header.colsByName[name].max, data[name]);
      }

      self.rowcount++;
      TypedMatrixParser.prototype.rowLoaded.call(self, data);
    },

    allLoaded: function () {
      var self = this;

      self.updateSeries(); // Calculate this incrementally in rowLoaded maybe?

      if (self.header.orientation == 'rowwise') {
        self.header.length = self.rowcount;
      } else {
        self.rowcount = self.header.length;
      }
      TypedMatrixParser.prototype.allLoaded.call(self);
    },

    destroy: function () {
      var self = this;
      this.cancel();
    },

    toJSON: function () {
      return {
        "type": self.name,
        args: {
          url: self.url
        }
      }
    }
  });
  Format.formatClasses.BinFormat = BinFormat;
  return BinFormat;
});
