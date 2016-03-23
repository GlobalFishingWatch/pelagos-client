define([
  "dojo/_base/declare",
  './Interval'
], function (
  declare,
  Interval
) {
  return declare("TimeLabel", [], {
    constructor: function (args) {
      var self = this;

      for (var key in args) {
        self[key] = args[key];
      }
    },

    intervals: {
      second: new Interval({name: 'second', seconds: 1}),
      minute: new Interval({name: 'minute', minutes: 1}),
      hour: new Interval({name: 'hour', hours: 1}),
      day: new Interval({name: 'day', days: 1}),
      week: new Interval({name: 'week', days: 7}),
      month: new Interval({name: 'month', months: 1}),
      year: new Interval({name: 'year', years: 1}),
      decade: new Interval({name: 'decade', years: 10})
    },

    monthNames: {
      '01': 'JAN',
      '02': 'FEB',
      '03': 'MAR',
      '04': 'APR',
      '05': 'MAY',
      '06': 'JUN',
      '07': 'JUL',
      '08': 'AUG',
      '09': 'SEP',
      '10': 'OCT',
      '11': 'NOV',
      '12': 'DEC'
    },

    // separators: ['-', '-', ' ', ':', ':', '.'],
    separators: [' ', ' ', ' ', ':', ':', '.'],

    reverseDates: true,

    padWidths: [4, 2, 2, 2, 2, 2, 3],

    fullDates: false,
    includeDatePrefix: false,
    neverJustHours: false,

    intervalUnits: ['year', /* 'week', */ 'day', 'hour' /*, 'minute' */],
    intervalPrecision: 2,
    intervalPrecisionLimit: 3,

    pad: function (n, width, z) {
      z = z || '0';
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },

    intervalToIndex: function (interval) {
      var self = this;

      if (interval.cmp(self.intervals.second) < 0) {
        return {start: 6, end: 7};
      } else if (interval.cmp(self.intervals.minute) < 0) {
        return {start: 5, end: 6};
      } else if (interval.cmp(self.intervals.hour) < 0) {
        return {start: 4, end: 5};
      } else if (interval.cmp(self.intervals.day) < 0) {
        return {start: 3, end: 4};
      } else if (interval.cmp(self.intervals.week) < 0) {
        return {start: 2, end: 3};
      } else if (interval.cmp(self.intervals.month) < 0) {
        return {start: 1, end: 3};
      } else if (interval.cmp(self.intervals.year) < 0) {
        return {start: 1, end: 2};
      } else {
        return {start: 0, end: 1};
      }
    },

    stepLengthIndex: function (args) {
      var self = this;
      var index = self.intervalToIndex(args.stepLength);

      if (self.fullDates) index.end = Math.max(index.end, 3);
      if (self.neverJustHours && index.end == 4) index.end = 5;

      var includeDatePrefix = self.includeDatePrefix;
      if (args.includeDatePrefix != undefined) includeDatePrefix = args.includeDatePrefix;

      if (includeDatePrefix) {
        index.start = 0;
      }

      return index;
    },

    floorDate: function (args) {
      var self = this;

      var index = self.stepLengthIndex(args);

      return Interval.listToDate(
        [].concat(
          Interval.dateToList(args.date).slice(0, index.end),
          [0, 0, 0, 0, 0, 0, 0].slice(index.end)));
    },

    formatDate: function (args) {
      var self = this;

      var dateList = Interval.dateToList(args.date);
      var index = self.stepLengthIndex(args);

      dateList[1] += 1;
      dateList[2] += 1;

      for (var i = 0; i < dateList.length; i++) {
        dateList[i] = self.pad(dateList[i], self.padWidths[i]);
      }

      dateList[1] = self.monthNames[dateList[1]];

      var resDateList = dateList.slice(index.start, index.end);
      var separators = self.separators.slice(index.start, index.end - 1);

      if (self.reverseDates) {
        var dateLength = 3 - index.start;
        if (dateLength > 0) {
          resDateList = [].concat(
            resDateList.slice(0, dateLength).reverse(),
            resDateList.slice(dateLength)
          );
        }
      }

      separators = [""].concat(separators);

      var res = [];
      for (var i = 0; i < resDateList.length; i++) {
        res.push(separators[i]);
        res.push(resDateList[i]);
      }
      return res.join('');
    },

    formatInterval: function (args) {
      var self = this;

      res = [];
      var interval = args.interval;

      self.intervalUnits.map(function (unitName) {
        var value;
        if (unitName == 'second') {
          value = interval / 1000.0;
          interval = 0;
        } else {
          var unit = self.intervals[unitName].asMilliseconds;
          value = Math.floor(interval / unit);
          interval = interval % unit;
        }
        res.push({
          value: value,
          name: unitName
        });
      });

      var prefix = 0;
      for (; prefix < res.length; prefix++) {
        if (res[prefix].value != 0) break;
      }
      res = res.slice(prefix);

      if (self.intervalPrecision != undefined) {
        res = res.slice(0, self.intervalPrecision);
      }

      res = res.filter(function (item) { return item.value > 0; });

      if (self.intervalPrecisionLimit != undefined) {
        if (res.length > 1 && (res.length > 2 || res[res.length-2].value >= self.intervalPrecisionLimit)) res = res.slice(0, res.length-1);
      }

      res = res.map(function (item) { return item.value.toString() + " " + item.name + (item.value > 1 ? 's' : ''); });
      return res.join(", ");
    }
  });
});
