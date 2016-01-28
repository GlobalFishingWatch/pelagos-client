/* SpaceTime code adapted from Bounds from OpenLayers; Published under
 * the 2-clause BSD license. See license.txt in the OpenLayers
 * distribution.
 *
 */
define(["app/Class", "app/Bounds", "app/Timerange"], function(Class, Bounds, Timerange) {
  var SpaceTime = Class({
    name: "SpaceTime",
    initialize: function () {
      var self = this;
      self.timerange = null;
      self.bounds = null;

      self.update.apply(self, arguments);
    },

    clone: function() {
      var self = this;
      return new self.constructor(self);
    },

    toArray: function() {
      return [this.timerange.toArray(), this.bounds.toArray()];
    },

    toString: function () {
      var self = this;
      return self.timerange.toString() + ";" + self.bounds.toString();
    },

    containsObj:function(spaceTime, partial, inclusive) {
      if (partial == undefined) {
        partial = false;
      }
      if (inclusive == undefined) {
        inclusive = true;
      }
      return (   this.timerange.containsObj(spaceTime.timerange, partial, inclusive)
              && this.bounds.containsObj(spaceTime.bounds, partial, inclusive));
    },

    intersectsObj:function(spaceTime, options) {
      self = this;
      if (typeof options === "boolean") {
        options =  {inclusive: options};
      }
      options = options || {};
      if (options.inclusive == null) {
        options.inclusive = true;
      }
      return (   this.timerange.intersectsObj(spaceTime.timerange, options)
              && this.bounds.intersectsObj(spaceTime.bounds, options));
    },

    getBounds: function () {
      return this.bounds;
    },

    getTimerange: function () {
      return this.timerange;
    },

    getSpacetime: function () {
      return this;
    },

    update: function () {
      /* Usages:

         update("TIMERANGE;BOUNDS")
         update([TIMERANGE, BOUNDS]);
         update(obj, obj, ...)

         Where obj is a SpaceTime, Timerange or Bounds object or
         {timerange:TIMERANGE, bounds:BOUNDS}.
       */
      var self = this;

      var updateOne = function (obj) {
        var timerange = undefined;
        var bounds = undefined;

        if (obj.length !== undefined) {
          if (typeof(obj) == "string") {
            obj = obj.split(";");
          }
          timerange = obj[0];
          bounds = obj[1];
        } else {
          if (obj.getBounds != undefined) {
            bounds = obj.getBounds();
          } else if (obj.bounds) {
            bounds = obj.bounds;
          }

          if (obj.getTimerange != undefined) {
            timerange = obj.getTimerange();
          } else if (obj.timerange) {
            timerange = obj.timerange;
          }
        }

        if (timerange) timerange = new Timerange(timerange);
        if (bounds) bounds = new Bounds(bounds);

        if (timerange !== undefined) {
          if (timerange === null || self.timerange === null) {
            self.timerange = timerange;
          } else {
            self.timerange.update(timerange);
          }
        }

        if (bounds !== undefined) {
          if (bounds === null || self.bounds === null) {
            self.bounds = bounds;
          } else {
            self.bounds.update(bounds);
          }
        }
      };

      for (var i = 0; i < arguments.length; i++) {
        updateOne(arguments[i]);
      }
    },

    toJSON: function () {
      var self = this;
      return {timerange:self.timerange.rfcstring(), bounds:self.bounds.rfcstring()}
    }
  });

  return SpaceTime;
});
