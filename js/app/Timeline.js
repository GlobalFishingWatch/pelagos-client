define(['app/Class', 'app/Events', 'jQuery', 'less', 'app/LangExtensions'], function (Class, Events, $, less) {

  var lessnode = $('<link rel="stylesheet/less" type="text/css" href="' + require.toUrl('app/Timeline.less') + '" />');
  $('head').append(lessnode);
  less.sheets.push(lessnode[0]);
  less.refresh(true);

  return Class({
    name: 'Timeline',

    zoomSize: 1.2,
    hiddenContext: 2, // total space, as a multiple of visible size
    context: 25, // visible space on each side of the window (in percentage of visible range)
    stepLabelStyle: "fullDate",
    windowLabelStyle: "stepLabel",
    windowStart: new Date('1970-01-01'),
    windowEnd: new Date('1970-01-02'),
    steps: 20,
    snapZoomToTickmarks: true,
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
    ],

    steplengths: {
      second: 1000,
      secfiver: 1000*5,
      secquarter: 1000*15,
      minute: 1000*60,
      fiver: 1000*60*5,
      quarter: 1000*60*15,
      hour: 1000*60*60,
      morning: 1000*60*60*3,
      day: 1000*60*60*24,
      week: 1000*60*60*24*7,
      month: 1000*60*60*24*30,
      year: 1000*60*60*24*365
    },

    mainSteplengths: ["second", "minute", "hour", "day", "week", "month", "year"],

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
        "    <div class='rangemarks'>" +
        "    </div>" +
        "    <div class='tickmarks'>" +
        "    </div>" +
        "  </div>" +
        "</div>" +
        "<a class='zoomIn'><i class='fa fa-plus-square'></i></a>" +
        "<a class='zoomOut'><i class='fa fa-minus-square'></i></a>"
      );

      self.overlayNode = self.node.find('.overlay');
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


      self.zoomInNode.on('touchstart', self.zoomIn.bind(self, undefined));
      self.zoomOutNode.on('touchstart', self.zoomOut.bind(self, undefined));
      self.zoomInNode.on('touchstart', function (e) { self.eatEvent(e); });
      self.zoomOutNode.on('touchstart', function (e) { self.eatEvent(e); });
      self.windowNode.on('touchstart', self.windowDragStart.bind(self));

      self.node.on('touchstart', self.dragStart.bind(self, 'moveTimeline'));
      $(document).on('touchmove', self.drag.bind(self));
      $(document).on('touchend', self.dragEnd.bind(self));

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

      if (self.steplength > self.steplengths.month) {
        return iso.split(' ')[0].split('-').slice(0, -1).join('-')
      } else if (self.steplength > self.steplengths.day) {
        return iso.split(' ')[0]
      } else if (self.steplength > self.steplengths.minute) {
        return iso.split(':').slice(0, -1).join(':');
      } else if (self.steplength > self.steplengths.second) {
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
      var unitNames = ['year', 'week', 'day', 'hour', 'minute'];

      res = [];

      unitNames.map(function (unitName) {
        var unit = self.steplengths[unitName];
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

    dateToSteplengthLabel: function (d) {
      var self = this;

      return self["dateToSteplengthLabel_" + self.stepLabelStyle](d);
    },

    dateToSteplengthLabel_fullDate: function (d) {
      var self = this;

      var iso = d.toISOString().split('Z')[0].replace('T', ' ');

      if (self.steplength >= self.steplengths.month) {
        return iso.split(' ')[0].split('-').slice(0, -1).join('-')
      } else if (self.steplength >= self.steplengths.day) {
        return iso.split(' ')[0]
      } else if (self.steplength >= self.steplengths.minute) {
        var res = iso.split(' ')[1].split(':').slice(0, -1).join(':');
        if (res != '00:00') return res;
        return iso.split(':').slice(0, -1).join(':');
      } else if (self.steplength >= self.steplengths.second) {
        var res = iso.split(' ')[1].split('.')[0];
        if (res != '00:00:00') return res;
        return iso.split('.')[0];
      } else {
        var res = iso.split(' ')[1]
        if (res != '000') return res;
        var res = iso.split(' ')[1]
        if (res != '00:00:00.000') return res;
          return iso;
      }
    },

    dateToSteplengthLabel_fluid: function (d) {
      var self = this;

      var t = [
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate() - 1,
        d.getUTCHours(),
        d.getUTCMinutes(),
        d.getUTCSeconds(),
        d.getUTCMilliseconds()
      ];
      var s = ['', '-', '-', ' ', ':', ':', '.'];
      var l = [4, 2, 2, 2, 2, 2, 3];

      var start = 0;
      if (self.steplength < self.steplengths.second) {
        start = 6;
      } else if (self.steplength < self.steplengths.minute) {
        start = 5;
      } else if (self.steplength < self.steplengths.hour) {
        start = 4;
      } else if (self.steplength < self.steplengths.day) {
        start = 3;
      } else if (self.steplength < self.steplengths.month) {
        start = 2;
      } else if (self.steplength < self.steplengths.year) {
        start = 1;
      }
      var end = start+2;

      while (start > 0 && t[start] == 0) {
        start--;
      }

      t[1] += 1;
      t[2] += 1;

      for (var i = 0; i < t.length; i++) {
        t[i] = self.pad(t[i], l[i]);
      }

      return _.flatten(_.zip(s.slice(start, end), t.slice(start, end))).join('');
   },

    roundTimeToSteplength: function (d) {
      var self = this;

      return new Date(d.getTime() - d.getTime() % self.steplength);
    },

    roundSteplength: function (steplength) {
      var self = this;

      if (steplength < self.steplengths.second / 10) {
        return Math.pow(10, Math.ceil(Math.log(steplength, 10)));
      } else if (steplength > self.steplengths.year) {
        return Math.pow(10, Math.ceil(Math.log(steplength / self.steplengths.year, 10))) * self.steplengths.year;
      }

      return Math.min.apply(Math,
        Object.values(self.steplengths).filter(function (x) {
          return x > steplength;
        })
      );
    },

    stepToSubsteps: function (steplength) {
      var self = this;

      if (steplength <= self.steplengths.second) {
        return 10;
      } else if (steplength > self.steplengths.year) {
        return steplength / (Math.pow(10, Math.ceil(Math.log(steplength / self.steplengths.year, 10)) - 1) * self.steplengths.year);
      }

      return steplength / Math.max.apply(Math,
        Object.values(self.steplengths).filter(function (x) {
          return x < steplength;
        })
      );
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
        var stepLength = self.roundSteplength(windowSize / self.steps);
        if (stepLength >= windowSize) {
          stepLength = stepLength / self.stepToSubsteps(stepLength);
        }
        var steps = windowSize / stepLength;
        
        if (factor > 1) {
          steps = Math.ceil(steps);
        } else {
          steps = Math.floor(steps);
        }
        windowSize = stepLength * steps;
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

      self.start = self.roundTimeToSteplength(new Date(self.visibleStart.getTime() - (self.contextSize - self.visibleContextSize) / 2));
      self.end = new Date(self.start.getTime() + self.contextSize);

      self.offset = self.visibleStart - self.start;

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

    recreateTickmarks: function () {
      var self = this;

      self.tickmarksNode.find('.quanta').remove();

      self.stepCount = 0;
      self.stepsEnd = self.start;
      for (; self.stepsEnd <= self.end; self.stepsEnd = new Date(self.stepsEnd.getTime() + self.steplength)) {
        self.stepCount++;
        var stepNode = $("<div class='quanta'><div class='label'><span></span></div></div>");
        stepNode.find("span").html(self.dateToSteplengthLabel(self.stepsEnd));
        self.tickmarksNode.append(stepNode);
        for (var subPos = 0; subPos < self.substeps - 1; subPos++) {
          self.tickmarksNode.append("<div class='quanta small'></div>");
        }
      }
      self.stepsSize = (self.stepsEnd - self.start) / (self.end - self.start)

      self.stepWidth = 100.0 * self.stepsSize / (self.stepCount * self.substeps);
      self.tickmarksNode.find('.quanta').css({'margin-right': self.stepWidth + '%'});

      if (self.dragStartX != undefined) {
        self.dragStartX = self.dragX;
        self.dragStartOffset = self.offset;
      }
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

      self.steplength = self.roundSteplength(self.visibleContextSize / self.steps);
      self.substeps = self.stepToSubsteps(self.steplength);

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

      var winPos = self.windowNode.offset();
      winPos.width = self.windowNode.outerWidth();
      winPos.right = winPos.left + winPos.width;
      winPos.borderLeft = parseFloat($(".window").css('border-left-width'));
      winPos.borderRight = parseFloat($(".window").css('border-right-width'));

      winPos.innerLeft = winPos.left + winPos.borderLeft;
      winPos.innerRight = winPos.right - winPos.borderRight;

      var pos = self.getEventFirstPosition(e);

      if (pos.pageX >= winPos.left && pos.pageX <= winPos.innerLeft) {
        self.dragStart('windowResizeLeft', e);
      } else if (pos.pageX >= winPos.innerRight && pos.pageX <= winPos.right) {
        self.dragStart('windowResizeRight', e);
      }
    },

    getEventFirstPosition: function (e) {
      e = e.originalEvent || e;
      if (e.touches && e.touches.length > 0) {
        e = e.touches[0];
      }
      return e;
    },

    dragStart: function (type, e) {
      var self = this;
      var pos = self.getEventFirstPosition(e);

      self.dragType = type;
      self.dragStartX = pos.pageX;
      self.dragStartY = pos.pageY;
      self['dragStart_' + self.dragType](e);
      self.eatEvent(e);
    },

    drag: function (e) {
      var self = this;

      if (self.dragType == undefined) return;

      var pos = self.getEventFirstPosition(e);

      self.dragX = pos.pageX;
      self.dragY = pos.pageY;

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
