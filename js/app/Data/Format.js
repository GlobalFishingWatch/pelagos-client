define(["app/Class", "app/Events", "lodash"], function(Class, Events, _) {
  var Format = Class({
    name: "Format",
    initialize: function(args) {
      var self = this;
      self.header = {length: 0, colsByName: {}};
      self.data = {};
      self.rowcount = 0;
      self.seriescount = 0;
      self.loadingStarted = false;
      self.loadingCanceled = false;
      self.allIsLoaded = false;
      self.events = new Events("Data.Format");
      self.events.on({
        all: function () { self.allIsLoaded = true; },
        load: function () { self.allIsLoaded = false; },
        error: function (exception) { self.error = exception; }
      });
      if (args) _.extend(self, args);
    },

    load: function () {
      var self = this;
      if (self.loadingStarted || self.loadingCanceled) return;
      self.loadingStarted = true;
      self._load();
    },

    setHeaders: function (headers) {
      var self = this;
      self.headers = headers || {};
    },

    destroy: function () {
      var self = this;
      self.loadingCanceled = true;
    },

    updateSeries: function() {
      var self = this;
      var header = self.header;
      var data = self.data;

      // For convenience we store POINT_COUNT in an element at the end
      // of the array, so that the length of each series is
      // series[i+1]-series[i].

      self.seriescount = Math.max(self.seriescount || 0, 1);

      self.series = new Int32Array(Math.max(2, self.seriescount + 1));
      self.series[0] = 0;
      self.series[self.series.length - 1] = header.length;

      self.lastSeries = function () {}; // Value we will never find in the data
      self.seriescount = 0;
      if (data.series) {
        for (var rowidx = 0; rowidx < header.length; rowidx++) {
          var series = data.series[rowidx];
          if (self.lastSeries != series) {
            self.seriescount++;
            self.lastSeries = series;
          }
          self.series[self.seriescount] = rowidx + 1;
        }
      }
    },

    sortcols: ['series', 'datetime'],

    compareRows: function(rowdix, other, otheridx) {
      var self = this;

      function compareTilesByCol(colidx) {
        if (colidx > self.sortcols.length) return 0;
        var col = self.sortcols[colidx];
        if (self.data[col] == undefined || other.data[col] == undefined) {
          // Ignore any sort columns we don't have...
          return compareTilesByCol(colidx + 1);
        } else if (self.data[col][rowdix] < other.data[col][otheridx]) {
          return -1;
        } else if (self.data[col][rowdix] > other.data[col][otheridx]) {
          return 1;
        } else {
          return compareTilesByCol(colidx + 1);
        }
      }
      return compareTilesByCol(0);
    }
  });

  Format.formatClasses = {};

  return Format;
});
