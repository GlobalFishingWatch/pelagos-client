define(['app/Class', 'app/Events', 'app/Visualization/UI/Timeline', 'jQuery', 'less', 'app/LangExtensions'], function (Class, Events, Timeline, $, less) {

  var lessnode = $('<link rel="stylesheet/less" type="text/css" href="' + require.toUrl('app/Visualization/UI/MultiTimeline.less') + '" />');
  $('head').append(lessnode);
  less.sheets.push(lessnode[0]);
  less.refresh(true);

  return Class({
    name: 'MultiTimeline',

    levels: 3,
    windowStart: new Date('1970-01-01'),
    windowEnd: new Date('1970-01-02'),

    Timeline: Timeline,

    updating: false,

    initialize: function (args) {
      var self = this;

      $.extend(self, args);

      self.node = $(self.node);

      self.events = new Events('MultiTimeline');

      self.node.addClass('multi-timeline');

      self.timelines = [];
      for (var level = 0; level < self.levels; level++) {
        var levelNode = $("<div class='timeline'>");
        var height = 100.0 / (self.levels + 1);
        if (level == self.levels - 1) height = height * 2;
        levelNode.css({height: height + '%'});

        if (level == 0) {
          levelNode.addClass('first');
        } else if (level == self.levels - 1) {
          levelNode.addClass('last');
        } else {
          levelNode.addClass('intermediate');
        }
        levelNode.addClass('level-' + level);
        levelNode.addClass('level--' + (self.levels - level));

        var timeline = new self.Timeline({
          node: levelNode,
          context: 10 + 40 * Math.min(0.99, (self.levels - level - 1) / (self.levels - 1)),
        });
        timeline.level = level;
        timeline.events.on({
          'set-range': self.handleSetRange.bind(self, timeline, 'set-range'),
          'temporary-range': self.handleSetRange.bind(self, timeline, 'temporary-range')
        });
        self.timelines.push(timeline);
        self.node.append(levelNode);
      }

      self.setRange(self.windowStart, self.windowEnd);
    },


    handleSetRange: function (timeline, type) {
      var self = this;

      if (self.updating) return;
      self.updating = true;

      self.timelines.map(function (other) {
        if (other.level == timeline.level) return;
        other.setRange(timeline.windowStart, timeline.windowEnd);
      });

      self.updating = false;

      var highest = self.timelines[self.timelines.length - 1];

      self.events.triggerEvent(type || 'set-range', {start: highest.windowStart, end: highest.windowEnd});
    },

    setRange: function (windowStart, windowEnd, type) {
      var self = this;

      var highest = self.timelines[self.timelines.length - 1];
      highest.setRange(windowStart, windowEnd, type);
    },
  });
});
