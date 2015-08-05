/* SpaceTime code adapted from Bounds from OpenLayers; Published under
 * the 2-clause BSD license. See license.txt in the OpenLayers
 * distribution.
 *
 */
define(["app/Class", "app/Bounds", "app/Timerange"], function(Class, Bounds, Timerange) {
  var SpaceTime = Class({
    name: "SpaceTime",
    initialize: function (timeRange, bounds) {
      var self = this;
      if (timeRange.constructor == SpaceTime) {
        self.timeRange = timeRange.timeRange;
        self.bounds = timeRange.bounds;
      } else if (timeRange.length) {
        if (timeRange.constructor == String) {
          timeRange = timeRange.split(";");
        }
        self.timeRange = new Timerange(timeRange[0]);
        self.bounds = new Bounds(timeRange[1]);
      } else {
        self.timeRange = new Timerange(timeRange);
        self.bounds = new Bounds(bounds);
      }
    },

    clone: function() {
      var self = this;
      return new self.constructor(self.timeRange, self.bounds);
    },

    toArray: function() {
      return [this.timeRange.toArray(), this.bounds.toArray()];
    },

    toString: function () {
      var self = this;
      return self.timeRange.ToString() + ";" + self.toString();
    },

    containsObj:function(spaceTime, partial, inclusive) {
      if (partial == undefined) {
        partial = false;
      }
      if (inclusive == undefined) {
        inclusive = true;
      }
return (   this.timeRange.containsObj(spaceTime.timeRange, partial, inclusive)
        && this.bounds.containsObj(spaceTime.bounds, partial, inclusive));
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
      return (   this.timeRange.intersectsObj(spaceTime.timeRange, options)
              && this.bounds.intersectsObj(spaceTime.bounds, options));
    },

    toJSON: function () {
      var self = this;
      return {timeRange:self.timeRange.rfcstring(), bounds:self.bounds.rfcstring()}
    }
  });
  return Timerange;
});
