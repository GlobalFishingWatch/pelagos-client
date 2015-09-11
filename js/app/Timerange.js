/* Timerange code adapted from Bounds from OpenLayers; Published under
   the 2-clause BSD license. See license.txt in the OpenLayers
   distribution.
  
   A Timerange represents a certain range of time, from a starting
   time to an end time.
   
 */
define(["app/Class"], function(Class) {
  var Timerange = Class({
    name: "Timerange",
    initialize: function () {
      var self = this;

      self.start = null;
      self.end = null;

      self.update.apply(self, arguments);
    },

    clone: function() {
      var self = this;
      return new self.constructor(self);
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
      return self.start.rfcstring() + "," + self.end.rfcstring();
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
      var end = this.contains(range.end, inclusive);

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

    getTimerange: function () { return this; },

    update: function () {
      /* Usages:

         update("START,END")
         update([start, end]);
         update(obj, obj, ...);
       */

      var self = this;

      var updateOne = function (obj) {
        var start = undefined;
        var end = undefined;

        if (obj.length !== undefined) {
          if (typeof(obj) == "string") {
            obj = obj.split(",");
          }
          start = obj[0];
          end = obj[1];
        } else {
          if (obj.getTimerange != undefined) obj = obj.getTimerange();

          if (obj.start !== undefined) {
            start = obj.start;
          }
          if (obj.end !== undefined) {
            end = obj.end;
          }
        }

        if (start) { start = new Date(start); }
        if (end) { end = new Date(end); }

        if (start !== undefined) {
          self.start = start;
        }
        if (end !== undefined) {
          self.end = end;
        }
      };

      for (var i = 0; i < arguments.length; i++) {
        updateOne(arguments[i]);
      }
    },

    toJSON: function () {
      var self = this;
      return {start:self.start.rfcstring(), end:self.end.rfcstring()}
    }
  });
  return Timerange;
});
