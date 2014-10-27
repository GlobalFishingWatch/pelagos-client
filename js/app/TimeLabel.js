define(['app/Class', 'app/Interval', "lodash"], function (Class, Interval, _) {
  return Class({
    name: 'TimeLabel',

    initialize: function (args) {
      var self = this;

      _.extend(self, args);
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

    // separators: ['', '-', '-', ' ', ':', ':', '.'],
    separators: ['', ' ', ' ', ' ', ':', ':', '.'],

    padWidths: [4, 2, 2, 2, 2, 2, 3],

    fullDates: false,

    intervalUnits: ['year', /* 'week', */ 'day', 'hour', 'minute'],

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

    formatDate: function (args) {
      var self = this;

      var dateList = Interval.dateToList(args.date);
      var index = self.intervalToIndex(args.stepLength);

      dateList[1] += 1;
      dateList[2] += 1;

      for (var i = 0; i < dateList.length; i++) {
        dateList[i] = self.pad(dateList[i], self.padWidths[i]);
      }

      dateList[1] = self.monthNames[dateList[1]];

      var fullDates = self.fullDates;
      if (args.fullDates != undefined) fullDates = args.fullDates;

      if (fullDates) {
        return _.flatten(_.zip(self.separators.slice(0, index.end), dateList.slice(0, index.end))).join('');
      } else {
        return _.flatten(_.zip([""].concat(self.separators.slice(index.start + 1, index.end)), dateList.slice(index.start, index.end))).join('');
      }
    },

    formatInterval: function (args) {
      var self = this;

      res = [];
      var interval = args.interval;

      self.intervalUnits.map(function (unitName) {
        var unit = self.intervals[unitName].asMilliseconds;
        var value = Math.floor(interval / unit);
        if (value != 0) {
          var s = value.toString() + " " + unitName;
          if (value > 1) s += 's';
          res.push(s);
        }
        interval = interval % unit;
      });

      if (interval > 0) {
        interval = interval / 1000.0;
        var s = interval.toString() + " second";
        if (interval > 1) s += 's';
        res.push(s);
      }

      return res.join(", ");
    }
  });
});
