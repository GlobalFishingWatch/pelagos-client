define([
  "app/Class",
  "app/Events",
  "./TileBounds",
  "shims/lodash/main"
], function(
  Class,
  Events,
  TileBounds,
  _
) {
  return Class({
    name: "Selection",

    sortcols: ["series"],

    max_range_count: 1,

    initialize: function (args) {
      var self = this;
      self.events = new Events("Selection");
      // Yes, first set sortcols (if specified) then clear everything,
      // then set all data (if there is some)
      _.extend(self, args);
      self._clearRanges();
      _.extend(self, args);
    },

    _clearRanges: function () {
      var self = this;
      self.header = {length: 0};
      self.data = {};
      self.sortcols.map(function (col) {
        self.data[col] = [];
      });
    },

    addRange: function(source, startidx, endidx, replace, silent) {
      var self = this;
      var startData, endData;

      if (startidx != undefined && endidx != undefined) {
        var startTile = source.getContent()[startidx[0]];
        var endTile = source.getContent()[endidx[0]];

        if (startTile && endTile) {

          startData = {
            source: source.toString(),
            tile: startTile.printTree({})
          };
          endData = {
            source: source.toString(),
            tile: endTile.printTree({})
          };

          var cols = $.extend({}, startTile.content.data, endTile.content.data);
          self.sortcols.map(function (col) { cols[col] = true; });
          cols = Object.keys(cols);

          cols.map(function (col) {
            if (startTile.content.data[col] != undefined) {
              startData[col] = startTile.content.data[col][startidx[1]];
            } else {
              startData[col] = undefined;
            }
            if (endTile.content.data[col] != undefined) {
              endData[col] = endTile.content.data[col][endidx[1]];
            } else {
              endData[col] = undefined;
            }
          });
        }
      }

      self.addDataRange(startData, endData, replace, silent, {source:source, startidx:startidx, endidx:endidx});
    },

    addDataRange: function(startData, endData, replace, silent, args) {
      var self = this;
      var updated = false;
      if (replace && self.header.length != 0) {
        updated = true;
        self._clearRanges();
      }
      if (startData != undefined && endData != undefined) {
        var overlapIdx = self.checkRangeOverlap(startData, endData);
        if (overlapIdx !== undefined) {
          self.sortcols.map(function (col) {
            if (startData[col] < self.data[col][overlapIdx * 2]) {
              updated = true;
              self.data[col][overlapIdx * 2] = startData[col];
            }
            if (endData[col] > self.data[col][overlapIdx * 2 + 1]) {
              updated = true;
              self.data[col][overlapIdx * 2 + 1] = endData[col];
            }
          });
        } else {
          updated = true;
          var cols = $.extend({}, startData, endData);
          self.sortcols.map(function (col) { cols[col] = true; });
          cols = Object.keys(cols);

          cols.map(function (col) {
            if (self.data[col] == undefined) self.data[col] = [];
            self.data[col].push(startData[col]);
            self.data[col].push(endData[col]);
          });
          self.header.length++;
        }
      }
      if (updated && !silent) {
        args = _.extend({
          update: "add",
          startData:startData,
          endData:endData
        }, args);
        self.events.triggerEvent("update", args);
      }
    },

    checkRangeOverlap: function (startData, endData) {
      // Return idx of range that overlaps
      var self = this;

      for (var rowidx = 0; rowidx < self.header.length; rowidx++) {
        var in_range = true;
        for (var colidx = 0; colidx < self.sortcols.length; colidx++) {
          var col = self.sortcols[colidx];
          in_range = (   in_range
                      && (   (   self.data[col][rowidx * 2] <= startData[col]
                              && self.data[col][rowidx * 2 + 1] >= startData[col])
                          || (   self.data[col][rowidx * 2] <= endData[col]
                              && self.data[col][rowidx * 2 + 1] >= endData[col])));
        }
        if (in_range) {
          return rowidx;
        }
      }
      return undefined;
    },


    checkRow: function (source, rowidx) {
      var self = this;
      for (var i = 0; i < self.header.length; i++) {
        var startcmp = source.compareRows(rowidx, self, i*2);
        var endcmp = source.compareRows(rowidx, self, i*2 + 1);

        if (startcmp >= 0 && endcmp <= 0) {
          return true;
        }
      }
      return false;
    },

    clearRanges: function () {
      var self = this;
      if (self.header.length == 0) return;
      self._clearRanges();
      self.events.triggerEvent("update", {update:"clear"});
    },

    retriggerSelectionEvent: function () {
      var self = this;
      if (self.header.length > 0) {
        var startData = {};
        var endData = {};
        for (var key in self.data) {
          startData[key] = self.data[key][0];
          endData[key] = self.data[key][1];
        }
        self.events.triggerEvent("update", {update: "add", startData:startData, endData:endData});
      }
    },

    hasSelectionInfo: function () {
      var self = this;

      /* If any of the sortcols contains only negative values, there
       * is no selection info on the server to be fetched. */

      return _.all(self.sortcols, function(col) {
        return (
          self.data[col] !== undefined 
          && _.any(self.data[col], function(val) {
            return val >= 0;
          })
        );
      });
    },

    toJSON: function () {
      var self = this;
      return {
        header: self.header,
        data: self.data,
        sortcols: self.sortcols,
        max_range_count: self.max_range_count
      };
    }
  });
});
