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

    iterate: function (onlyWithInfo) {
      /* Returns an iterator function. The iterator function returns
       *   [
       *     {name:colname, value:colvalue},
       *     {name:colname, value:colvalue},
       *     ...]
       * It throws an exception {type: "StopIteration"} when there are
       * no more values to iterate over.
       */

      var self = this;

      var context = {selection: self};
      var res = function (peek) {
        var idx = context.idx;

        do {
          var res = context.selection.getValuesFromIdx(idx);
          if (!res) {
            throw {type: "StopIteration"};
          }
        } while (onlyWithInfo && !self.colsHaveSelectionInfo(res.cols))

        if (!peek) {
          context.idx = idx;
        }

        return res.cols;
      }
      res.context = context;
      return res;
    },

    getValuesFromIdx: function (idx) {
      var self = this;
      /* Set idx to undefined to start the iteration.
       * Returns undefined (at end of sequence) or:
       *   {cols: [
       *     {name:colname, value:colvalue},
       *     {name:colname, value:colvalue},
       *     ...],
       *    idx: next_idx}
       *
       * Note: Idx is an opaque data structure that can be safely JSON encoded.
       */

      idx = _.extend({rowidx: 0, offset: 0}, idx);
      var lastname = self.sortcols.slice(-1)[0];

      while (idx.rowidx < self.header.length) {
        var minval = self.data[lastname][idx.rowidx * 2]
        var maxval = self.data[lastname][idx.rowidx * 2 + 1]
        var lastval = minval + idx.offset;

        if (lastval > maxval) {
          idx.rowidx++;
          idx.offset = 0;
          continue;
        }

        idx.offset++;

        return {
          cols: self.sortcols.slice(0, -1).map(function (name) {
                  return {name: name, value: self.data[name][idx.rowidx * 2]};
                }).concat([
                  {name: lastname, value: lastval}
                ]),
          idx: idx
        };
      }

      return undefined;
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

    colsHaveSelectionInfo: function (cols) {
      var self = this;

      /* If any of the sortcols contains only negative values, there
       * is no selection info on the server to be fetched. this is
       * meant to be run on the return value of getValuesFromIdx() or
       * an iterator.
       */

      return _.all(cols, function(col) {
        return (
          col !== undefined 
          && col.value >= 0
        );
      });
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
