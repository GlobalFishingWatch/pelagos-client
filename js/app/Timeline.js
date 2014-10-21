define(['app/Class', 'app/Events', 'app/Interval', 'jQuery', 'less', 'app/LangExtensions'], function (Class, Events, Interval, $, less) {

  var lessnode = $('<link rel="stylesheet/less" type="text/css" href="' + require.toUrl('app/Timeline.less') + '" />');
  $('head').append(lessnode);
  less.sheets.push(lessnode[0]);
  less.refresh(true);

  var temp = $("<div style='position: absolute; left: 0; top: -1pt; width: 10000pt; height: 1pt' >")
  $("body").append(temp);
  var pixelsPerPt = temp.innerWidth() / 10000;
  temp.remove();

  return Class({
    name: 'Timeline',

    zoomSize: 1.2,
    hiddenContext: 2, // total space, as a multiple of visible size
    context: 25, // visible space on each side of the window (in percentage of visible range)
    stepLabelStyle: "minimal",
    windowLabelStyle: "stepLabel",
    windowStart: new Date('1970-01-01'),
    windowEnd: new Date('1970-01-02'),
    stepZoom: 0.5,
    snapZoomToTickmarks: false,
    minWindowSize: 1000*60*60,
    maxWindowSize: 1000*60*60*24*365,

    backgroundCss: {background: '#ff8888'},
    rangemarks: [
      /* Example ranges. The first one is a white background range
       * below all the other ranges, that hides the styling from
       * backgroundCss.
       *
       * {start:new Date('1969-12-30'), end:new Date('1970-01-10'), css:{background:"#ffffff", 'z-index': 0}},
       * {start:new Date('1970-01-01'), end:new Date('1970-01-04'), css:{background:"#88ff88", opacity: 0.5, 'z-index': 1}},
       * {start:new Date('1970-01-03'), end:new Date('1970-01-07'), css:{background:"#0000ff", opacity: 0.5, 'z-index': 1}}
       */

       {start:new Date('1969-12-30'), end:new Date('1970-01-10'), css:{background:"#999999", 'z-index': 0}},
       {start:new Date('1970-01-01'), end:new Date('1970-01-04'), css:{background:"#88ff88", opacity: 0.5, 'z-index': 1}},
       {start:new Date('1970-01-03'), end:new Date('1970-01-07'), css:{background:"#0000ff", opacity: 0.5, 'z-index': 1}}

    ],

    stepLengths: [
      new Interval({name: 'second', seconds: 1}),
/*
      new Interval({name: 'secfiver', seconds: 5}),
      new Interval({name: 'secquarter', seconds: 15}),
*/
      new Interval({name: 'minute', minutes: 1}),
/*
      new Interval({name: 'fiver', minutes: 5}),
      new Interval({name: 'quarter', minutes: 15}),
*/
      new Interval({name: 'hour', hours: 1}),
//      new Interval({name: 'morning', hours: 3}),
      new Interval({name: 'day', days: 1}),
//      new Interval({name: 'week', days: 7}),
      new Interval({name: 'month', months: 1}),
      new Interval({name: 'year', years: 1}),
      new Interval({name: 'decade', years: 10})
    ],

    initialize: function (args) {
      var self = this;

      $.extend(self, args);

      self.node = $(self.node);

      self.events = new Events('Timeline');

      self.node.addClass('timeline');

      self.node.append(
        "<div class='overlay'>" +
        "  <div class='leftFrame'></div>" +
        "  <div class='window'>" +
        "    <div class='frame'>" +
        "      <div class='startLabel'>&lt; <span></span></div>" +
        "      <div class='lengthLabel'><span></span></div>" +
        "      <div class='endLabel'><span></span> &gt;</div>" +
        "    </div>" +
        "  </div>" +
        "  <div class='rightFrame'></div>" +
        "</div>" +
        "<div class='line-visibility'>" +
        "  <div class='line'>" +
        "    <div class='rangemarks'></div>" +
        "    <div class='tickmarks-container'>" +
        "      <div class='tickmarks top'></div>" +
        "      <div class='tickmarks bottom'></div>" +
        "    </div>" +
        "  </div>" +
        "</div>" +
        "<div class='underlay'>" +
        "  <div class='leftFrame'></div>" +
        "  <div class='window'>" +
        "    <div class='frame'></div>" +
        "  </div>" +
        "  <div class='rightFrame'></div>" +
        "</div>" +
        "<a class='zoomIn'><i class='fa fa-plus-square'></i></a>" +
        "<a class='zoomOut'><i class='fa fa-minus-square'></i></a>"
      );

      self.overlayNode = self.node.find('.overlay');
      self.underlayNode = self.node.find('.underlay');
      self.lineVisibilityNode = self.node.find('.line-visibility');
      self.zoomInNode = self.node.find('.zoomIn');
      self.zoomOutNode = self.node.find('.zoomOut');
      self.leftFrameNode = self.node.find('.leftFrame');
      self.windowNode = self.node.find('.window');
      self.rightFrameNode = self.node.find('.rightFrame');
      self.startLabel = self.node.find('.startLabel span');
      self.lengthLabel = self.node.find('.lengthLabel span');
      self.endLabel = self.node.find('.endLabel span');
      self.lineNode = self.node.find('.line');
      self.rangemarksNode = self.node.find('.rangemarks');
      self.tickmarksNode = self.node.find('.tickmarks');

      self.zoomInNode.click(self.zoomIn.bind(self, undefined));
      self.zoomOutNode.click(self.zoomOut.bind(self, undefined));
      self.zoomInNode.mousedown(function (e) { self.eatEvent(e); });
      self.zoomOutNode.mousedown(function (e) { self.eatEvent(e); });
      self.windowNode.mousedown(self.windowDragStart.bind(self));
      self.node.mousedown(self.dragStart.bind(self, 'moveTimeline'));
      $(document).mousemove(self.drag.bind(self));
      $(document).mouseup(self.dragEnd.bind(self));

      self.node.mousewheel(function(event, delta, deltaX, deltaY) {
        if (deltaY > 0) {
          self.zoomIn(event);
        } else if (deltaY < 0) {
          self.zoomOut(event);
        }
        else
          self.eatEvent(event);
      });

      self.node.attr('unselectable', 'on').css('user-select', 'none').on('selectstart', false);

      self.lineNode.css({'width': self.hiddenContext * 100.0 + '%'});
      self.tickmarksNode.css({"height": (100 / self.tickmarksNode.length) + "%"});

      self.stepLengthsByName = {};
      prev = undefined;
      self.stepLengths.map(function (stepLength) {
        stepLength.prev = prev;
        if (prev) prev.next = stepLength;
        prev = stepLength;
        self.stepLengthsByName[stepLength.name] = stepLength;
      });

      self.leftContext = self.context;
      self.rightContext = self.context;
      self.setRange(self.windowStart, self.windowEnd);
    },

    windowTimesToLabel: function (d) {
      var self = this;
      return self["windowTimesToLabel_" + self.windowLabelStyle](d);
    },

    windowTimesToLabel_fullDate: function (d) {
      return d.toISOString().replace("T", " ").replace("Z", "");
    },

    windowTimesToLabel_stepLabel: function (d) {
      var self = this;

      var iso = d.toISOString().split('Z')[0].replace('T', ' ');

      if (self.stepLength.cmp(self.stepLengthsByName.month) > 0) {
        return iso.split(' ')[0].split('-').slice(0, -1).join('-')
      } else if (self.stepLength.cmp(self.stepLengthsByName.day) > 0) {
        return iso.split(' ')[0]
      } else if (self.stepLength.cmp(self.stepLengthsByName.minute) > 0) {
        return iso.split(':').slice(0, -1).join(':');
      } else if (self.stepLength.cmp(self.stepLengthsByName.second) > 0) {
        return iso.split('.')[0];
      } else {
        return iso;
      }
    },

    pad: function (n, width, z) {
      z = z || '0';
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    },

    intervalToLabel: function (i) {
      var self = this;
      var unitNames = ['year', /* 'week', */ 'day', 'hour', 'minute'];

      res = [];

      unitNames.map(function (unitName) {
        var unit = self.stepLengthsByName[unitName].asMilliseconds;
        var value = Math.floor(i / unit);
        if (value != 0) {
          var s = value.toString() + " " + unitName;
          if (value > 1) s += 's';
          res.push(s);
        }
        i = i % unit;
      });

      if (i > 0) {
        i = i / 1000.0;
        var s = i.toString() + " second";
        if (i > 1) s += 's';
        res.push(s);
      }

      return res.join(", ");
    },

    dateToStepLengthLabel: function (args) {
      var self = this;

      return self["dateToStepLengthLabel_" + self.stepLabelStyle](args);
    },

    dateToStepLengthLabel_minimal: function (args) {
      var self = this;

      var t = [
        args.date.getUTCFullYear(),
        args.date.getUTCMonth(),
        args.date.getUTCDate() - 1,
        args.date.getUTCHours(),
        args.date.getUTCMinutes(),
        args.date.getUTCSeconds(),
        args.date.getUTCMilliseconds()
      ];
      var s = ['', '-', '-', ' ', ':', ':', '.'];
      var l = [4, 2, 2, 2, 2, 2, 3];

      var start = 0;
      if (args.stepLength.cmp(self.stepLengthsByName.second) < 0) {
        start = 6;
      } else if (args.stepLength.cmp(self.stepLengthsByName.minute) < 0) {
        start = 5;
      } else if (args.stepLength.cmp(self.stepLengthsByName.hour) < 0) {
        start = 4;
      } else if (args.stepLength.cmp(self.stepLengthsByName.day) < 0) {
        start = 3;
      } else if (args.stepLength.cmp(self.stepLengthsByName.month) < 0) {
        start = 2;
      } else if (args.stepLength.cmp(self.stepLengthsByName.year) < 0) {
        start = 1;
      }

      t[1] += 1;
      t[2] += 1;

      for (var i = 0; i < t.length; i++) {
        t[i] = self.pad(t[i], l[i]);
      }

      if (args.full) {
        return _.flatten(_.zip(s.slice(0, start+1), t.slice(0, start+1))).join('');
      } else {
        return t[start];
      }
    },

    roundTimeToStepLength: function (d) {
      var self = this;

      return self.stepLength.round(d);
    },

    getNextStepLength: function(stepLength) {
      var self = this;
      if (stepLength.next) return stepLength.next;
      if (stepLength.asMilliseconds >= self.stepLengths.slice(-1)[0].asMilliseconds) {
        return new Interval(Math.pow(10, Math.ceil(Math.log(stepLength / self.stepLengthsByName.year.asMilliseconds, 10))) * self.stepLengthsByName.year.asMilliseconds);
      }
      return self.stepLengths.filter(function (x) {
        return x.cmp(stepLength) > 0;
      })[0];
    },

    getPrevStepLength: function(stepLength) {
      var self = this;
      if (stepLength.prev) return stepLength.prev;
      if (stepLength.asMilliseconds < self.stepLengths[0].asMilliseconds / 10) {
        return new Interval(Math.pow(10, Math.ceil(Math.log(stepLength.asMilliseconds, 10))));
      }
      return self.stepLengths.filter(function (x) {
        return x.cmp(stepLength) <= 0;
      }).slice(-1)[0];
    },

    eatEvent: function (e) {
      if (e == undefined) return;
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    },

    pixelPositionToTime: function (pos) {
      var self = this;

      offset = pos - self.lineVisibilityNode.offset().left;
      return new Date(self.visibleStart.getTime() + self.pixelOffsetToTimeOffset(offset));
    },

    pixelOffsetToTimeOffset: function (offset) {
      var self = this;
      var pixelWidth = self.lineVisibilityNode.innerWidth();
      var percentOffset = 100.0 * offset / pixelWidth;
      return percentOffset * self.visibleContextSize / 100.0;
    },

    zoomOut: function (e) {
      var self = this;
      self.zoom(self.zoomSize, e && self.pixelPositionToTime(e.pageX));
      self.eatEvent(e);
    },

    zoomIn: function (e) {
      var self = this;

      self.zoom(1 / self.zoomSize, e && self.pixelPositionToTime(e.pageX));
      self.eatEvent(e);
    },

    zoom: function (factor, middle) {
      var self = this;

      if (middle == undefined) middle = new Date(self.windowStart.getTime() + self.windowSize / 2);
      var left = 100.0 * (middle - self.windowStart) / self.windowSize;
      var right = 100.0 * (self.windowEnd - middle) / self.windowSize;

      var windowSize = Math.max(1, Math.floor(self.windowSize * factor));

      if (self.maxWindowSize != undefined && self.maxWindowSize < windowSize) {
        windowSize = self.maxWindowSize;
      }
      if (self.minWindowSize != undefined && self.minWindowSize > windowSize) {
        windowSize = self.minWindowSize;
      }

      if (self.snapZoomToTickmarks) {
        if (factor > 1) {
          windowSize = self.getNextStepLength(new Interval({milliseconds: windowSize})).asMilliseconds;
        } else {
          windowSize = self.getPrevStepLength(new Interval({milliseconds: windowSize})).asMilliseconds;
        }
      }

      self.start = undefined;
      self.end = undefined;
      self.setRange(new Date(middle.getTime() - windowSize * left / 100.0), new Date(middle.getTime() + windowSize * right / 100.0));
    },

    setRangeFromOffset: function (offset, type) {
      var self = this;
      self.offset = offset;

      self.visibleStart = new Date(self.start.getTime() + self.offset);
      self.visibleEnd = new Date(self.visibleStart.getTime() + self.visibleContextSize);

      self.windowStart = new Date(self.visibleStart.getTime() + self.visibleContextSize * self.leftContext / 100.0);
      self.windowEnd = new Date(self.windowStart.getTime() + self.windowSize);

      self.updateRange();

      self.events.triggerEvent(type || 'set-range', {start: self.windowStart, end: self.windowEnd});
    },

    setContextFromVisibleContext: function() {
      var self = this;
      self.contextSize = self.visibleContextSize * self.hiddenContext;

      self.start = self.roundTimeToStepLength(new Date(self.visibleStart.getTime() - (self.contextSize - self.visibleContextSize) / 2));
      self.end = new Date(self.start.getTime() + self.contextSize);

      self.offset = self.visibleStart - self.start;

      if (self.dragStartX != undefined) {
        self.dragStartX = self.dragX;
        self.dragStartOffset = self.offset;
      }

      self.recreateRangemarks();
      self.recreateTickmarks();
    },

    recreateRangemarks: function () {
      var self = this;

      var overlaps = function (a, b) {
        return (a.start < b.end && a.end > b.start);
      }

      self.rangemarksNode.css(self.backgroundCss);

      self.rangemarksNode.find('.rangemark').remove();
      self.rangemarks.map(function (rangemark) {
        if (overlaps(rangemark, self)) {
          var start = new Date(Math.max(rangemark.start, self.start));
          var end = new Date(Math.min(rangemark.end, self.end));

          var left = 100.0 * (start - self.start) / (self.end - self.start);
          var width = 100.0 * (end - start) / (self.end - self.start);
          var rangemarkNode = $("<div class='rangemark'>");
          rangemarkNode.css({width: width + '%', left: left + '%'});
          rangemarkNode.css(rangemark.css);
          self.rangemarksNode.append(rangemarkNode);
        }
      });
    },

    calculateStepSize: function (stepStart, stepLength) {
      var self = this;

      var stepEnd = stepLength.round(stepLength.add(stepStart));
      var largeStepEnd = self.getNextStepLength(stepLength).round(stepEnd);
      if (largeStepEnd.getTime() > stepStart.getTime()) stepEnd = largeStepEnd;
      var stepLength = stepEnd - stepStart;

      return {
        stepStart: stepStart,
        stepEnd: stepEnd,
        stepLength: stepLength
      };
    },

    recreateTickmarksLevel: function (tickmarksNode, stepLength, fullLabels) {
      var self = this;

      tickmarksNode.find('.quanta').remove();

      var stepStart = self.start;
      while (stepStart <= self.end) {
        var stepSizeInfo = self.calculateStepSize(stepStart, stepLength);

        var stepNode = $("<div class='quanta'><div class='quanta-label'><span></span></div><div class='debug'></div></div>");
        tickmarksNode.append(stepNode);

        var label = self.dateToStepLengthLabel({
          date: stepStart,
          stepLength: stepLength,
          full: fullLabels
        });
        stepNode.find(".quanta-label span").html(label);
        stepNode.find(".debug ").html(stepStart.toISOString() + " - " + stepSizeInfo.stepEnd.toISOString());

        var stepWidth = 100.0 * stepSizeInfo.stepLength / self.contextSize;
        stepNode.css({'width': stepWidth + '%'});

        var space = stepNode.innerHeight() / pixelsPerPt - 8; // 2 * 4pt padding, see stylesheet
        var labelSize = Math.min(space, 10 + (40 - 10) * stepLength.asMilliseconds / self.visibleContextSize);
        stepNode.find(".quanta-label").css({"font-size": labelSize + "pt", "line-height": labelSize + "pt"});

        stepStart = stepSizeInfo.stepEnd;
      }
    },

    recreateTickmarks: function () {
      var self = this;

      var stepLength = self.stepLength;
      for (var i = 0; i < self.tickmarksNode.length; i++) {
        self.recreateTickmarksLevel($(self.tickmarksNode[i]), stepLength, i == self.tickmarksNode.length - 1);
        stepLength = self.getNextStepLength(stepLength);
      };
    },

    setVisibleContextFromRange: function() {
      var self = this;

      self.visibleContextSize = 100.0 * self.windowSize / (100.0 - self.leftContext - self.rightContext);
      self.windowSize = self.windowEnd - self.windowStart;

      self.visibleStart = new Date(self.windowStart.getTime() - self.visibleContextSize * self.leftContext / 100.0);
      self.visibleEnd = new Date(self.windowEnd.getTime() + self.visibleContextSize * self.rightContext / 100.0);

      if (self.start != undefined) {
        self.offset = self.visibleStart - self.start;
      }
    },

    setRangemarks: function (rangemarks) {
      var self = this;
      self.rangemarks = rangemarks;
      self.recreateRangemarks();
    },

    setRange: function (windowStart, windowEnd, type) {
      var self = this;
      self.windowStart = windowStart;
      self.windowEnd = windowEnd;
      var windowSize = self.windowEnd - self.windowStart
      if (windowSize != self.windowSize) {
        self.start = undefined;
        self.end = undefined;
      }
      self.windowSize = windowSize;

      self.setVisibleContextFromRange();

      self.stepLength = self.getPrevStepLength(new Interval({milliseconds: self.visibleContextSize * self.stepZoom}));

      if (self.start == undefined) {
        self.setContextFromVisibleContext();
      }

      self.updateRange();

      self.events.triggerEvent(type || 'set-range', {start: self.windowStart, end: self.windowEnd});
    },

    updateRange: function () {
      var self = this;

      if (   self.visibleStart <= self.start 
          || self.visibleEnd >= self.end) {
        self.setContextFromVisibleContext();
      }

      self.setWindowSize();

      self.percentOffset = 100.0 * self.hiddenContext * self.offset / self.contextSize;
      self.lineNode.css({'left': -(self.percentOffset) + '%'});
      self.startLabel.html(self.windowTimesToLabel(self.windowStart));
      self.lengthLabel.html(self.intervalToLabel(self.windowEnd - self.windowStart));
      self.endLabel.html(self.windowTimesToLabel(self.windowEnd));
    },

    setWindowSize: function () {
      var self = this;

      var leftContext = 100.0 * (self.windowStart - self.visibleStart) / self.visibleContextSize;
      var rightContext = 100.0 * (self.visibleEnd - self.windowEnd) / self.visibleContextSize;

      var window = 100.0 - leftContext - rightContext;

      self.leftFrameNode.css({
        'width': leftContext + '%'
      });
      self.windowNode.css({
        'width': window + '%'
      });
      self.rightFrameNode.css({
        'width': rightContext + '%'
      });
    },

    windowDragStart: function (e) {
      var self = this;

      var pos = self.windowNode.offset();
      pos.width = self.windowNode.outerWidth();
      pos.right = pos.left + pos.width;
      pos.borderLeft = parseFloat($(".window").css('border-left-width'));
      pos.borderRight = parseFloat($(".window").css('border-right-width'));

      pos.innerLeft = pos.left + pos.borderLeft;
      pos.innerRight = pos.right - pos.borderRight;

      if (e.pageX >= pos.left && e.pageX <= pos.innerLeft) {
        self.dragStart('windowResizeLeft', e);
      } else if (e.pageX >= pos.innerRight && e.pageX <= pos.right) {
        self.dragStart('windowResizeRight', e);
      }
    },

    dragStart: function (type, e) {
      var self = this;
      self.dragType = type;
      self.dragStartX = e.pageX;
      self.dragStartY = e.pageY;
      self['dragStart_' + self.dragType](e);
      self.eatEvent(e);
    },

    drag: function (e) {
      var self = this;

      if (self.dragType == undefined) return;

      self.dragX = e.pageX;
      self.dragY = e.pageY;

      self.dragOffsetX = self.dragStartX - self.dragX;
      self.dragOffsetY = self.dragStartY - self.dragY;
      self.dragTimeOffset = self.pixelOffsetToTimeOffset(self.dragOffsetX);

      self['drag_' + self.dragType](e);

      self.eatEvent(e);
    },

    dragEnd: function (e) {
      var self = this;

      if (self.dragType == undefined) return;
      self['dragEnd_' + self.dragType](e);
      self.dragType = undefined;
      self.eatEvent(e);
    },


    dragStart_windowResizeLeft: function (e) {
      var self = this;
      self.events.triggerEvent('user-update-start', {type:'window-resize-left'});
      self.dragStartWindowStart = self.windowStart;
    },
    drag_windowResizeLeft: function (e) {
      var self = this;
      self.windowStart = new Date(self.dragStartWindowStart.getTime() - self.dragTimeOffset);
      self.updateRange();
    },
    dragEnd_windowResizeLeft: function (e) {
      var self = this;
      self.setRange(self.windowStart, self.windowEnd, 'set-range');
    },

    dragStart_windowResizeRight: function (e) {
      var self = this;
      self.events.triggerEvent('user-update-start', {type:'window-resize-right'});
      self.dragStartWindowEnd = self.windowEnd;
    },
    drag_windowResizeRight: function (e) {
      var self = this;
      self.windowEnd = new Date(self.dragStartWindowEnd.getTime() - self.dragTimeOffset);
      self.updateRange();
    },
    dragEnd_windowResizeRight: function (e) {
      var self = this;
      self.setRange(self.windowStart, self.windowEnd, 'set-range');
    },

    dragStart_moveTimeline: function (e) {
      var self = this;
      self.events.triggerEvent('user-update-start', {type:'move-timeline'});
      self.dragStartOffset = self.offset;
    },
    drag_moveTimeline: function (e) {
      var self = this;
      self.setRangeFromOffset(self.dragStartOffset + self.dragTimeOffset, 'temporary-range');
    },
    dragEnd_moveTimeline: function (e) {
      var self = this;
      self.events.triggerEvent('set-range', {start: self.windowStart, end: self.windowEnd});
    }
  });
});
