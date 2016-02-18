define([
  'app/Class',
  'app/Events',
  'app/Interval',
  'app/Visualization/UI/TimeLabel',
  'app/Visualization/UI/DateTimeDropdown',
  'jQuery',
  'less',
  'app/LangExtensions'
], function (
  Class,
  Events,
  Interval,
  TimeLabel,
  DateTimeDropdown,
  $,
  less
) {
  var lessnode = $('<link rel="stylesheet/less" type="text/css" href="' + require.toUrl('app/Visualization/UI/Timeline.less') + '" />');
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
    windowStart: new Date('1970-01-01'),
    windowEnd: new Date('1970-01-02'),
    stepZoom: 0.5,
    snapZoomToTickmarks: false,
    minWindowSize: 1000*60*60,
    maxWindowSize: 1000*60*60*24*365*2,
    splitTickmarksOnLargerUnitBoundaries: false,
    showRightLabelAtWidth: undefined,
    showCenterLabelAtWidth: undefined,

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

       {start:new Date('1969-12-30'), end:new Date('1970-01-10'), css:{background:"#ffffff", 'z-index': 0}}
/*
       {start:new Date('1970-01-01'), end:new Date('1970-01-04'), css:{background:"#88ff88", opacity: 0.5, 'z-index': 1}},
       {start:new Date('1970-01-03'), end:new Date('1970-01-07'), css:{background:"#0000ff", opacity: 0.5, 'z-index': 1}}
*/

    ],

    stepLengths: [
      new Interval({name: 'millisecond', milliseconds: 1}),
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
      new Interval({name: 'week', days: 7}),
      new Interval({name: 'month', months: 1}),
      new Interval({name: 'year', years: 1}),
      new Interval({name: 'decade', years: 10})
    ],

    windowTimeLabels: new TimeLabel({
      includeDatePrefix: true,
      fullDates: true,
      neverJustHours: true
    }),

    tickmarkLabels: new TimeLabel({
      includeDatePrefix: false
    }),

    windowLengLabels: new TimeLabel({}),
    windowLengHoverLabels: new TimeLabel({
      intervalUnits: ['year', 'week', 'day', 'hour', 'minute', 'second'],
      intervalPrecision: undefined,
      intervalPrecisionLimit: undefined
    }),


    /**** External API ****/

    initialize: function (args) {
      var self = this;

      $.extend(self, args);

      self.node = $(self.node);

      self.events = new Events('Timeline');

      self.node.addClass('timeline');

      /* Note about the one quanta in each tickmarks bar: This is just
       * to be able to measure its height to calculate the font size
       * for quanta labels, before we have any real qantas. */

      self.node.append(
        "<div class='overlay'>" +
        "  <div class='leftFrame'></div>" +
        "  <div class='window'>" +
        "    <div class='frame'>" +
        "      <div class='startLabel'><span></span></div>" +
        "      <div class='lengthLabel'><span></span></div>" +
        "      <div class='endLabel'><span></span></div>" +
        "    </div>" +
        "  </div>" +
        "  <div class='rightFrame'></div>" +
        "</div>" +
        "<div class='line-visibility'>" +
        "  <div class='line'>" +
        "    <div class='rangemarks'></div>" +
        "    <div class='tickmarks-container'>" +
        "      <div class='tickmarks top'><div class='quanta'><div class='frame'><div class='quanta-label'>&nbsp;</div></div></div></div>" +
        "      <div class='tickmarks bottom'><div class='quanta'><div class='frame'><div class='quanta-label'>&nbsp;</div></div></div></div>" +
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
        "<div class='zoom'>" +
        "  <a class='zoomIn'><img src='" + app.dirs.img + "/smaller_increments.png'> more increments</a>" +
        "  <a class='zoomOut'><img src='" + app.dirs.img + "/larger_increments.png'> fewer increments</a>" +
        "</div>"
      );

      self.overlayNode = self.node.find('.overlay');
      self.underlayNode = self.node.find('.underlay');
      self.lineVisibilityNode = self.node.find('.line-visibility');
      self.zoomInNode = self.node.find('.zoomIn');
      self.zoomOutNode = self.node.find('.zoomOut');
      self.leftFrameNode = self.node.find('.leftFrame');
      self.windowNode = self.node.find('.window');
      self.windowFrameNode = self.node.find('.window .frame');
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
      $(document).mousemove(self.move.bind(self));
      $(document).mouseup(self.dragEnd.bind(self));


      self.zoomInNode.on('touchstart', self.zoomIn.bind(self, undefined));
      self.zoomOutNode.on('touchstart', self.zoomOut.bind(self, undefined));
      self.zoomInNode.on('touchstart', function (e) { self.eatEvent(e); });
      self.zoomOutNode.on('touchstart', function (e) { self.eatEvent(e); });
      self.windowNode.on('touchstart', self.windowDragStart.bind(self));

      self.node.on('touchstart', self.dragStart.bind(self, 'moveTimeline'));
      $(document).on('touchmove', self.move.bind(self));
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
      self.lastHoverTime = undefined;


      self.startInput = new DateTimeDropdown({style: "display: none"});
      self.startInput.placeAt(self.node.find('.startLabel')[0]);

      self.node.find('.startLabel').mousedown(function (e) { self.eatEvent(e); });
      self.node.find('.startLabel').mousedown(function (e) { self.eatEvent(e); });

      self.node.find('.startLabel').click(function (e) {
        self.startLabel.hide();
        self.startInput.set("value", self.windowStart);
        $(self.startInput.domNode).show();
        $(self.startInput.domNode).focus();
      });
      $(self.startInput.domNode).find("input").blur(function (e) {
        self.startLabel.show();
        $(self.startInput.domNode).hide();
      });
    },

    setRangeFromOffset: function (offset, type) {
      // Type is the type of the event to generate
      var self = this;
      self.offset = offset;

      self.visibleStart = new Date(self.start.getTime() + self.offset);
      self.visibleEnd = new Date(self.visibleStart.getTime() + self.visibleContextSize);

      self.windowStart = new Date(self.visibleStart.getTime() + self.visibleContextSize * self.leftContext / 100.0);
      self.windowEnd = new Date(self.windowStart.getTime() + self.windowSize);

      self.updateRange();

      self.events.triggerEvent(type || 'set-range', {start: self.windowStart, end: self.windowEnd});
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


    /**** Step size calculations ****/

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

    calculateStepSize: function (stepStart, stepLength) {
      var self = this;

      var info = {
        stepStart: stepStart,
        stepLength: stepLength
      };

      info.stepEnd = stepLength.round(stepLength.add(info.stepStart));

      if (self.splitTickmarksOnLargerUnitBoundaries) {
        info.largeStepLength = self.getNextStepLength(info.stepLength);
        info.largeStepEnd = info.largeStepLength.round(info.stepEnd);
        if (info.largeStepEnd.getTime() > info.stepStart.getTime()) info.stepEnd = info.largeStepEnd;
      }

      info.stepLengthMs = info.stepEnd - info.stepStart;
      info.count = info.stepLength.divide(info.stepStart);

      return info;
    },


    /**** Time/pixel coordinate transforms ****/

    pixelPositionToTime: function (pos) {
      var self = this;

      offset = pos - self.lineVisibilityNode.offset().left;
      return new Date(self.visibleStart.getTime() + self.pixelOffsetToTimeOffset(offset));
    },

    pixelOffsetToTimeOffset: function (offset, visibleContextSize) {
      var self = this;
      var pixelWidth = self.lineVisibilityNode.innerWidth();
      var percentOffset = 100.0 * offset / pixelWidth;
      if (visibleContextSize == undefined) visibleContextSize = self.visibleContextSize;
      return percentOffset * visibleContextSize / 100.0;
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


    /**** Screen update ****/

    updateRange: function () {
      var self = this;

      if (   self.visibleStart <= self.start 
          || self.visibleEnd >= self.end) {
        self.setContextFromVisibleContext();
      }

      self.setWindowSize();

      self.percentOffset = 100.0 * self.hiddenContext * self.offset / self.contextSize;
      self.lineNode.css({'left': -(self.percentOffset) + '%'});
      self.startLabel.html(self.windowTimeLabels.formatDate({
        date: self.windowStart,
        stepLength: self.stepLength
      }));
      self.startLabel.attr({title: self.windowStart.rfcstring().replace("T", " ")});
      self.lengthLabel.html(self.windowLengLabels.formatInterval({
        interval: (  self.windowTimeLabels.floorDate({date: self.windowEnd, stepLength:self.stepLength})
                   - self.windowTimeLabels.floorDate({date: self.windowStart, stepLength:self.stepLength}))
      }));
      self.lengthLabel.attr({title: self.windowLengHoverLabels.formatInterval({
        interval: self.windowEnd - self.windowStart
      })});
      self.endLabel.html(self.windowTimeLabels.formatDate({
        date: self.windowEnd,
        stepLength: self.stepLength
      }));
      self.endLabel.attr({title: self.windowEnd.rfcstring().replace("T", " ")});
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

    recreateTickmarksLevel: function (tickmarksNode, stepLength, fullLabels) {
      var self = this;

      var space = tickmarksNode.find(".quanta-label").innerHeight() / pixelsPerPt;
      tickmarksNode.find('.quanta').remove();

      var stepStart = self.start;

      var h = [];
      while (stepStart <= self.end) {
        var stepSizeInfo = self.calculateStepSize(stepStart, stepLength);
        if (stepSizeInfo.stepEnd == undefined) throw "ERROR";

        var label = self.tickmarkLabels.formatDate({
          date: stepStart,
          stepLength: stepLength,
          includeDatePrefix: fullLabels
        });
        var stepWidth = 100.0 * stepSizeInfo.stepLengthMs / self.contextSize;
        var labelSize = Math.min(space, 10 + (40 - 10) * stepLength.asMilliseconds / self.visibleContextSize);

        var showRightLabel = self.showRightLabelAtWidth != undefined && stepWidth > self.showRightLabelAtWidth / self.hiddenContext;
        var showCenterLabel = self.showCenterLabelAtWidth != undefined && stepWidth > self.showCenterLabelAtWidth / self.hiddenContext;

        h.push("<div class='quanta ");
        h.push(stepSizeInfo.count % 2 == 0 ? 'even' : 'odd');
        h.push(  "' style='width:"); h.push(stepWidth); h.push("%'>");
        h.push(  "<div class='frame'>");
        h.push(    "<div class='quanta-label'>");
        h.push(      "<span class='left' style='font-size:");
        h.push(        labelSize);
        h.push(        "pt; line-height:");
        h.push(        labelSize);
        h.push(        "pt;'>");
        h.push(        label);
        h.push(      "</span>");
        if (showRightLabel) {
          h.push(    "<span class='right' style='font-size:");
          h.push(      labelSize);
          h.push(      "pt; line-height:");
          h.push(      labelSize);
          h.push(      "pt;'>");
          h.push(      label);
          h.push(    "</span>");
        }
        if (showCenterLabel) {
          h.push(    "<span class='center' style='font-size:");
          h.push(      labelSize);
          h.push(      "pt; line-height:");
          h.push(      labelSize);
          h.push(      "pt;'>");
          h.push(      label);
          h.push(    "</span>");
        }
        h.push(      "&nbsp;");
        h.push(    "</div>");
        h.push(    "<div class='debug'>"); h.push(JSON.stringify(stepSizeInfo)); h.push("</div>");
        h.push(  "</div>");
        h.push("</div>");

        stepStart = stepSizeInfo.stepEnd;
      }
      tickmarksNode.append(h.join(""));

      if (self.dragData != undefined) {
        self.dragData.startPositions = self.dragData.currentPositions;

        self.dragData.timeOffset = self.offset;
        self.dragData.range = {};
        self.dragData.range.windowStart = self.windowStart;
        self.dragData.range.windowEnd = self.windowEnd;
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

    setRangemarks: function (rangemarks) {
      var self = this;
      self.rangemarks = rangemarks;
      self.recreateRangemarks();
    },


    /**** Utility functions for event handling ****/

    getEventPositions: function (e) {
      var event = e.originalEvent || e;
      var res = {};
      if (event.touches && event.touches.length > 0) {
        for (var i = 0; i < event.touches.length; i++) {
          res[event.touches[i].identifier.toString()] = event.touches[i];
        };
      } else {
        event.identifier = "pointer";
        res[event.identifier] = event;
      }

      if (e.ctrlKey && e.altKey && e.shiftKey) {
        console.log("Multi-touch test mode enabled.");
        var offsets = $(".window").offset();
        var left = {identifier: "left", pageX: offsets.left - 1, pageY: offsets.top + 1};
        res[left.identifier] = left;
      }

      return res;
    },

    getFirstPosition: function (positions) {
      for (var key in positions) {
        return positions[key];
      }
    },

    getXorder: function (positions) {
      return Object.values(
        positions
      ).sort(function (a, b) {
        return a.pageX - b.pageX;
      }).map(function (pos) {
        return pos.identifier.toString();
      });
    },

    eatEvent: function (e) {
      if (e == undefined) return;
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    },


    /**** Input event handling ****/

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

    move: function (e) {
      var self = this;
      if (self.dragData != undefined) {
        self.drag(e);
      } else {
        var pos = self.getFirstPosition(self.getEventPositions(e));
        var coords = self.node.offset();
        coords.right = coords.left + self.node.outerWidth();
        coords.bottom = coords.top + self.node.outerHeight();
        if (   coords.left <= pos.pageX && pos.pageX <= coords.right
            && coords.top <= pos.pageY && pos.pageY <= coords.bottom) {
          self.lastHoverTime = self.pixelPositionToTime(pos.pageX);
          self.events.triggerEvent('hover', {time: self.lastHoverTime});
        }
      }
    },

    dragStart: function (type, e) {
      var self = this;

      self.dragData = {};
      self.dragData.type = type;
      self.dragData.startPositions = self.getEventPositions(e);
      for (var id in self.dragData.startPositions) {
        self.dragData.startPositions[id].time = self.pixelPositionToTime(self.dragData.startPositions[id].pageX);
      }

      self.dragData.startVisibleContextSize = self.visibleContextSize;
      self['dragStart_' + self.dragData.type](e);
      self.eatEvent(e);
    },

    drag: function (e) {
      var self = this;

      self.dragData.currentPositions = self.getEventPositions(e);
      self.dragData.offsets = {};
      for (var id in self.dragData.currentPositions) {
        if (self.dragData.startPositions[id] == undefined) continue;
        var offsets = {
          x: self.dragData.startPositions[id].pageX - self.dragData.currentPositions[id].pageX,
          y: self.dragData.startPositions[id].pageY - self.dragData.currentPositions[id].pageY
        };
        offsets.time = self.pixelOffsetToTimeOffset(offsets.x, self.dragData.startVisibleContextSize);
        self.dragData.offsets[id] = offsets;
      }

      self['drag_' + self.dragData.type](e);

      self.eatEvent(e);
    },

    dragEnd: function (e) {
      var self = this;

      if (self.dragData == undefined) return;
      self['dragEnd_' + self.dragData.type](e);
      self.dragData = undefined;
      self.eatEvent(e);
    },

    windowDragStart: function (e) {
      var self = this;

      var winPos = self.windowNode.offset();
      winPos.right = winPos.left + self.windowNode.outerWidth();

      winPos.innerLeft = self.windowFrameNode.offset().left;
      winPos.innerRight = winPos.innerLeft + self.windowFrameNode.outerWidth();

      var pos = self.getFirstPosition(self.getEventPositions(e));

      if (pos.pageX >= winPos.left && pos.pageX <= winPos.innerLeft) {
        self.dragStart('windowResizeLeft', e);
      } else if (pos.pageX >= winPos.innerRight && pos.pageX <= winPos.right) {
        self.dragStart('windowResizeRight', e);
      }
    },

    dragStart_windowResizeLeft: function (e) {
      var self = this;
      self.events.triggerEvent('user-update-start', {type:'window-resize-left'});
      self.dragStartWindowStart = self.windowStart;
    },
    drag_windowResizeLeft: function (e) {
      var self = this;
      self.windowStart = new Date(
        Math.min(
          Math.max(
            self.dragStartWindowStart.getTime() - self.getFirstPosition(self.dragData.offsets).time,
            self.visibleStart.getTime()),
          self.windowEnd.getTime() - self.minWindowSize));
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
        
      self.windowEnd = new Date(
        Math.max(
          Math.min(
            self.dragStartWindowEnd.getTime() - self.getFirstPosition(self.dragData.offsets).time,
            self.visibleEnd.getTime()),
          self.windowStart.getTime() + self.minWindowSize));
      self.updateRange();
    },
    dragEnd_windowResizeRight: function (e) {
      var self = this;
      self.setRange(self.windowStart, self.windowEnd, 'set-range');
    },

    dragStart_moveTimeline: function (e) {
      var self = this;
      var touchesNr = Object.values(self.dragData.startPositions).length;

      if (touchesNr == 1) {
        self.dragData.type = "moveTimeline_pointer";
      } else if (touchesNr > 1) {
        self.dragData.type = "moveTimeline_multiTouch";
      }
      self['dragStart_' + self.dragData.type](e);
    },

    dragStart_moveTimeline_pointer: function (e) {
      var self = this;
      self.dragData.timeOffset = self.offset;
      self.dragData.range = {};
      self.dragData.range.windowStart = self.windowStart;
      self.dragData.range.windowEnd = self.windowEnd;
      self.dragData.range.windowSize = self.windowSize;

      self.dragData.startXorder = self.getXorder(self.dragData.startPositions);

      self.events.triggerEvent('user-update-start', {type:'move-timeline'});
    },
    drag_moveTimeline_pointer: function (e) {
      var self = this;

      self.setRangeFromOffset(self.dragData.timeOffset + self.dragData.offsets[self.dragData.startXorder[0]].time, 'temporary-range');
    },
    dragEnd_moveTimeline_pointer: function (e) {
      var self = this;
      self.events.triggerEvent('set-range', {start: self.windowStart, end: self.windowEnd});
    },

    dragStart_moveTimeline_multiTouch: function (e) {
      var self = this;

      self.dragData.startXorder = self.getXorder(self.dragData.startPositions);

      var left = self.dragData.startXorder[0];
      var right = self.dragData.startXorder[1];

      self.dragData.timeLeft = self.dragData.startPositions[left].time.getTime();
      self.dragData.timeRight = self.dragData.startPositions[right].time.getTime();
      self.dragData.timeWidth = self.dragData.timeRight - self.dragData.timeLeft;

      self.events.triggerEvent('user-update-start', {type:'move-timeline'});
    },
    drag_moveTimeline_multiTouch: function (e) {
      var self = this;

      var now = performance.now();

      if (now - self.lastUpdate < 300) return;
      self.lastUpdate = now;

      var left = self.dragData.startXorder[0];
      var right = self.dragData.startXorder[1];

      var pixelLeft = self.dragData.currentPositions[left].pageX;
      var pixelRight = self.dragData.currentPositions[right].pageX;
      var pixelWidth = pixelRight - pixelLeft;

      var timePerPixel = self.dragData.timeWidth / pixelWidth;

      var windowPixelLeft = self.windowNode.offset().left;
      var windowPixelRight = windowPixelLeft + self.windowNode.outerWidth();

      var windowTimeLeft = self.dragData.timeLeft - (pixelLeft - windowPixelLeft) * timePerPixel;
      var windowTimeRight = self.dragData.timeRight + (windowPixelRight - pixelRight) * timePerPixel;

      if (windowTimeRight - windowTimeLeft < self.minWindowSize) {
        windowTimeRight = windowTimeLeft + self.minWindowSize;
      }

      self.setRange(
        new Date(windowTimeLeft),
        new Date(windowTimeRight),
        'temporary-range'
      );
    },
    dragEnd_moveTimeline_multiTouch: function (e) {
      var self = this;
      self.events.triggerEvent('set-range', {start: self.windowStart, end: self.windowEnd});
    }
  });
});
