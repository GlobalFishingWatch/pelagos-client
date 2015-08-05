/* Timerange code adapted from Bounds from OpenLayers; Published under
 * the 2-clause BSD license. See license.txt in the OpenLayers
 * distribution.
 *
 */
define(["app/Class"], function(Class) {
  var Timerange = Class({
    name: "Timerange",
    initialize: function (start, end) {
      var self = this;
      if (start.constructor == Timerange) {
        self.start = start.start;
        self.end = start.end;
      } else if (start.length) {
        if (start.constructor == String) {
          start = start.split(",");
        }
        self.start = new Date(start[0]);
        self.end = new Date(start[1]);
      } else {
        self.start = new Date(start);
        self.end = new Date(end);
      }
    },

    clone: function() {
      var self = this;
      return new self.constructor(self.start, self.end);
    },

    getLength: function () {
      var self = this;
      return self.end - self.start;
    },

    toArray: function() {
      return [this.start, this.end];
    },

    toString: function () {
      var self = this;
      return self.start.rfcstring() + "," + self.rfcstring();
    },

    contains: function(t, inclusive) {
      if (inclusive == undefined) {
        inclusive = true;
      }

      if (inclusive) {
        return (t >= this.start) && (t <= this.end);
      } else {
        return (t > this.start) && (t < this.end);
      }
    },

    containsObj:function(range, partial, inclusive) {
      if (partial == null) {
        partial = false;
      }
      if (inclusive == null) {
        inclusive = true;
      }
      var start  = this.contains(range.start, inclusive);
      var end = this.contains(range.end, bounds.bottom, inclusive);

      return (partial) ? (start || end)
                       : (start && end);
    },

    intersectsObj:function(range, options) {
      self = this;
      if (typeof options === "boolean") {
        options =  {inclusive: options};
      }
      options = options || {};
      if (options.inclusive == null) {
        options.inclusive = true;
      }
      var intersects = false;
      var mightTouch = (
        self.start == range.end ||
        self.end == range.start
      );

      // if the two bounds only touch at an edge, and inclusive is false,
      // then the bounds don't *really* intersect.
      if (options.inclusive || !mightTouch) {
        // otherwise, if one of the boundaries even partially contains another,
        // inclusive of the edges, then they do intersect.
        var inStart = (
          ((range.start >= self.start) && (range.start <= self.end)) ||
          ((self.start >= range.start) && (self.start <= range.end))
        );
        var inEnd = (
          ((range.end >= self.start) && (range.end <= self.end)) ||
          ((self.end >= range.start) && (self.end <= range.end))
        );
        intersects = (inStart || inEnd);
      }
      return intersects;
    },

    toJSON: function () {
      var self = this;
      return {start:self.start.rfcstring(), end:self.end.rfcstring()}
    }
  });
  return Timerange;
});
