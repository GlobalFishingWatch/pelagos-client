define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/UI/Widgets/Timeline/TimeLabel",
  'jQuery',
  'app/LangExtensions'
], function (
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  TimeLabel,
  $
) {
  return declare("PlayControl", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    baseClass: 'PlayControl',
    templateString: '' +
      '<div class="${baseClass}">' +
      '  <div class="share" data-dojo-attach-event="click:share">' +
      '    <i class="fa fa-share-alt"></i>' +
      '  </div>' +
      '  <div class="main">' +
      '    <div class="content">' +
      '      <span class="paused">' +
      '        <div class="play" data-dojo-attach-event="click:play"><i class="fa fa-play"></i></div>' +
      '        <div class="hover-time">..:..:..</div>' +
      '        <div class="hover-date">....-..-..</div>' +
      '      </span>' +
      '      <span class="playing" style="display: none;">' +
      '        <div class="pause" data-dojo-attach-event="click:pause"><i class="fa fa-pause"></i></div>' +
      '        <div class="speed">' +
      '          <span class="less" data-dojo-attach-event="click:decreaseSpeed">-</span>' +
      '          <span class="current">4711</span>' +
      '          <span class="more" data-dojo-attach-event="click:increaseSpeed">+</span>' +
      '        </div>' +
      '        <div class="label">speed</div>' +
      '      </span>' +
      '    </div>' +
      '  </div>' +
      '</div>',

    visualization: null,

    timeLabel: new TimeLabel({}),

    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.visualization.state.events.on({
        paused: self.setPaused.bind(self),
        length: self.setLength.bind(self),
        timeFocus: self.setTimeFocus.bind(self)
      });
      self.setPaused();
      self.setLength();
      self.setTimeFocus();
    },

    setPaused: function (event) {
      var self = this;
      var value = self.visualization.state.getValue("paused");
      $(self.domNode).find(".paused").toggle(value);
      $(self.domNode).find(".playing").toggle(!value);
      $(self.domNode).find(".share").toggle(value);
    },

    setLength: function (event) {
      var self = this;
      var timePerTimeExtent = self.visualization.state.getValue("length");
      var timeExtent = self.visualization.state.getValue("timeExtent")

      var animationTimePerTime = timeExtent / timePerTimeExtent;

      animationTimePerTime = self.timeLabel.formatInterval({interval: animationTimePerTime * 1000});

      $(self.domNode).find(".speed .current").html(
        animationTimePerTime + " : 1s"
      );
    },

    setTimeFocus: function (event) {
      var self = this;

      var value = self.visualization.state.getValue("timeFocus");
      if (value) {
        var datetime = value.toISOString().slice(0, -1).split("T");

        $(self.domNode).find(".hover-date").html(datetime[0]);
        $(self.domNode).find(".hover-time").html(datetime[1]);
      } else {
        $(self.domNode).find(".hover-date").html('....-..-..');
        $(self.domNode).find(".hover-time").html('..:..:..');
      }
    },

    share: function () {
      var self = this;
      self.visualization.ui.saveWorkspace();
    },

    play: function () {
      var self = this;
      self.visualization.state.setValue("paused", false);
    },

    pause: function () {
      var self = this;
      self.visualization.state.setValue("paused", true);
    },

    increaseSpeed: function () {
      var self = this;
      self.visualization.state.setValue("length", self.visualization.state.getValue("length") * 0.5);
    },

    decreaseSpeed: function () {
      var self = this;
      self.visualization.state.setValue("length", self.visualization.state.getValue("length") * 2.0);
    }
  });
});
