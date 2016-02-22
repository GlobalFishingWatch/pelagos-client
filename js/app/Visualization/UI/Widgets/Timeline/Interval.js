/* Example usage:

   An Interval represents a certain amount of time. This time can be
   represented either absolutely, as a number of milliseconds, or
   relatively, as a number of years, months, weeks, days, etc. The
   difference is mostly relevant for months, where adding a month to a
   certain date gives different values for different dates (all months
   do not have the same length).

   Interval = require("app/Interval");

   month = new Interval(new Date(Date.UTC(2013, 2, 1)), new Date(Date.UTC(2013, 1, 1)));
   console.log("Month: " + month.toString());

   week = new Interval(new Date(Date.UTC(2013, 2, 8)), new Date(Date.UTC(2013, 2, 1)));
   console.log("Week: " + week.toString());

   d = new Date(Date.UTC(2013, 3, 23));
   console.log("2013-04-23: " + d.toUTCString());

   console.log("2013-04-23 + 1 month: " + month.add(d).toUTCString());
   console.log("2013-04-23 + 1 week: " + week.add(d).toUTCString());
   console.log("Month - week: " + week.subtractFrom(month).toString());
*/

define([
  "dojo/_base/declare"
], function (
  declare
) {
  var Interval = declare("TimeLabel", [], {
    keys: ["years", "months", "days", "hours", "minutes", "seconds", "milliseconds"],

    constructor: function (arg1, arg2) {
      var self = this;
      
      self.keys.map(function (key) { self[key] = 0; });

      if (arg2 != undefined) {
        self.asMilliseconds = arg1 - arg2;

        arg1 = Interval.dateToDict(arg1);
        arg2 = Interval.dateToDict(arg2);

        self.keys.map(function (key) {
          self[key] = arg1[key] - arg2[key];
        });
      } else {
        for (var key in arg1) {
          self[key] = arg1[key];
        }
        if (self.asMilliseconds == undefined) {
          // Aproximate it :)
          var d = new Date(Date.UTC(1970, 1, 1));
          self.asMilliseconds = self.add(d) - d;
        }
      }
    },

    add: function (other) {
      var self = this;

      if (other.constructor == Date) {
        other = Interval.dateToDict(other);

        self.keys.map(function (key) {
          other[key] += self[key];
        });

        return Interval.dictToDate(other);
      } else if (other.constructor = self.constructor) {
        other = new self.constructor(other);
        
        self.keys.map(function (key) {
          other[key] += self[key];
        });
        other.asMilliseconds += self.asMilliseconds;

        return other;
      } else {
        throw "Unable to add Interval to " + other.constructor.name;
      }
    },

    // Interval - Self
    // Date - Self
    subtractFrom: function (other) {
      var self = this;

      if (other.constructor == Date) {
        other = Interval.dateToDict(other);

        self.keys.map(function (key) {
          other[key] -= self[key];
        });
        
        return Interval.dictToDate(other);
      } else if (other.constructor = self.constructor) {
        other = new self.constructor(other);
        
        self.keys.map(function (key) {
          other[key] -= self[key];
        });
        other.asMilliseconds -= self.asMilliseconds;

        return other;
      } else {
        throw "Unable to subtract Interval from " + other.constructor.name;
      }
    },

    activeKeys: function () {
      var self = this;

      return self.keys.filter(function (key) { return self[key] != 0});
    },

    divide: function (other) {
      var self = this;

      if (other.constructor != Date) {
        throw "Unable to do " + other.constructor.name + " / Interval";
      }

      var activeKeys = self.activeKeys();
      var requiresEpochCalc = activeKeys.length != 1 || (activeKeys[0] != 'years' && activeKeys[0] != 'months');

      // FIXME: Handle the case of years and months set; convert years to months first.

      if (requiresEpochCalc) {
        return other.getTime() / self.asMilliseconds;
      } else {
        var d = Interval.dateToDict(other);

        var res;
        self.keys.map(function (key) {
          if (res != undefined || self[key] == 0) return;
          res = d[key] / self[key];
        });
        return res;
      }
    },

    round: function (other) {
      var self = this;

      if (other.constructor != Date) {
        throw "Unable to do " + other.constructor.name + " modulo Interval";
      }

      var activeKeys = self.activeKeys();
      var requiresEpochCalc = activeKeys.length != 1 || (activeKeys[0] != 'years' && activeKeys[0] != 'months');

      // FIXME: Handle the case of years and months set; convert years to months first.

      if (requiresEpochCalc) {
        other = other.getTime();
        var offset = other % self.asMilliseconds;
        if (other < 0 && offset != 0) offset += self.asMilliseconds; // Handle dates < 1970-01-01 correctly
        return new Date(other - offset);
      } else {
        var d = Interval.dateToDict(other);

        var filtered = false;
        self.keys.map(function (key) {
          if (filtered) {
            d[key] = 0;
          } else {
            if (self[key] == 0) return;
            d[key] -= d[key] % self[key];
            filtered = true;
          }
        });

        return Interval.dictToDate(d);
      }
    },

    cmp: function (other) {
      var self = this;

      return self.asMilliseconds - other.asMilliseconds;
    },

    toString: function () {
      var self = this;

      return self.keys.filter(function (key) {
        return self[key] != 0;
      }).map(function (key) {
        return self[key].toString() + " " + key;
      }).join(", ");
    },

    toJSON: function () {
      var self = this;
      var res = {"__jsonclass__":["Interval"]};
      self.keys.map(function (key) {
        res[key] = self[key];
      });
      return res;
    }
  });


  Interval.dateToDict = function (date) {
    return {
      years: date.getUTCFullYear(),
      months: date.getUTCMonth(),
      days: date.getUTCDate() - 1, // Use 0-based counting for modulo to work, but Date uses 1-based counting
      hours: date.getUTCHours(),
      minutes: date.getUTCMinutes(),
      seconds: date.getUTCSeconds(),
      milliseconds: date.getUTCMilliseconds()
    };
  };

  Interval.dictToDate = function (dict) {
    // Hack adound limitation in Safari 
    var seconds = Math.floor(dict.milliseconds / 1000.0);
    var milliseconds = dict.milliseconds % 1000.0;

    return new Date(
      Date.UTC(
        dict.years,
        dict.months,
        dict.days + 1, // We use 0-based counting for modulo to work, but Date uses 1-based counting
        dict.hours,
        dict.minutes,
        dict.seconds + seconds,
        milliseconds
      )
    );
  };

  Interval.dateToList = function (date) {
    date = Interval.dateToDict(date);
    return [date.years, date.months, date.days, date.hours, date.minutes, date.seconds, date.milliseconds];
  };

  Interval.listToDate = function (date) {
    return Interval.dictToDate({
      years: date[0],
      months: date[1],
      days: date[2],
      hours: date[3],
      minutes: date[4],
      seconds: date[5],
      milliseconds: date[6]
    });
  };

  return Interval;
});
