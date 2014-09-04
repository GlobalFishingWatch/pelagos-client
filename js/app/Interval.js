/* Example usage:
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

define(['app/Class', 'lodash', 'app/LangExtensions'], function (Class, _) {
  return Class({
    name: 'Interval',

    keys: ["years", "months", "days", "hours", "minutes", "seconds", "milliseconds"],

    initialize: function (arg1, arg2) {
      var self = this;
      
      self.keys.map(function (key) { self[key] = 0; });

      if (arg2 != undefined) {
        self.asMilliseconds = arg1 - arg2;

        arg1 = self.dateToDict(arg1);
        arg2 = self.dateToDict(arg2);

        self.keys.map(function (key) {
          self[key] = arg1[key] - arg2[key];
        });
      } else {
        _.extend(self, arg1);
        if (self.asMilliseconds == undefined) {
          // Aproximate it :)
          var d = new Date(Date.UTC(1970, 1, 1));
          self.asMilliseconds = self.add(d) - d;
        }
      }
    },

    dateToDict: function (date) {
      return {
        years: date.getUTCFullYear(),
        months: date.getUTCMonth(),
        days: date.getUTCDate() - 1, // Use 0-based counting for modulo to work, but Date uses 1-based counting
        hours: date.getUTCHours(),
        minutes: date.getUTCMinutes(),
        seconds: date.getUTCSeconds(),
        milliseconds: date.getUTCMilliseconds()
      };
    },

    dictToDate: function (dict) {
      return new Date(
        Date.UTC(
          dict.years,
          dict.months,
          dict.days + 1, // We use 0-based counting for modulo to work, but Date uses 1-based counting
          dict.hours,
          dict.minutes,
          dict.seconds,
          dict.milliseconds
        )
      );
    },

    add: function (other) {
      var self = this;

      if (other.constructor == Date) {
        other = self.dateToDict(other);

        self.keys.map(function (key) {
          other[key] += self[key];
        });

        return self.dictToDate(other);
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
        other = self.dateToDict(other);

        self.keys.map(function (key) {
          other[key] -= self[key];
        });
        
        return self.dictToDate(other);
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

    round: function (other) {
      var self = this;

      if (other.constructor == Date) {
        var activeKeys = self.activeKeys();
        var requiresEpochCalc = activeKeys.length != 1 || (activeKeys[0] != 'years' && activeKeys[0] != 'months');

        // FIXME: Handle the case of years and months set; convert years to months first.

        if (requiresEpochCalc) {
          return new Date(other.getTime() - other.getTime() % self.asMilliseconds);
        } else {
          var d = self.dateToDict(other);

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

          return self.dictToDate(d);
        }
      } else {
        throw "Unable to do " + other.constructor.name + " modulo Interval";
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
    }
  });
});
