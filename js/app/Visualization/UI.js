define(["app/Class", "app/Timeline", "app/Visualization/InfoUI", "app/Visualization/AnimationManagerUI", "async", "jQuery", "app/Visualization/sliders"], function(Class, Timeline, InfoUI, AnimationManagerUI, async, $) {
  return Class({
    name: "UI",
      initialize: function (visualization) {
      var self = this;
      self.visualization = visualization;
    },

    init: function (cb) {
      var self = this;

      async.series([
        self.initLoadSpinner.bind(self),
        self.initLogo.bind(self),
        self.initTimeline.bind(self),
        self.initToggleButtons.bind(self),
        self.initSaveButton.bind(self),
        self.initInfoUI.bind(self),
        self.initAnimationManagerUI.bind(self)
      ], function () { cb(); });
    },

    initLoadSpinner: function(cb) {
      var self = this;

      self.loadingNode = $('<div id="loading"><img src="../../img/Ajax-loader.gif"></div>');
      self.visualization.node.append(self.loadingNode);

      self.visualization.data.events.on({
        load: function () {
          self.loadingNode.fadeIn();
        },
        all: function () {
          self.loadingNode.fadeOut();
        },
        error: function (data) {
          var dialog = $('<div class="modal fade" id="error" tabindex="-1" role="dialog" aria-labelledby="errorLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-header bg-danger text-danger"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 class="modal-title" id="errorLabel">Error</h4></div><div class="modal-body alert"></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div></div></div></div>');
          dialog.find('.modal-body').html(data.toString());
          $('body').append(dialog);
          dialog.modal();
          dialog.on('hidden.bs.modal', function (e) {
            dialog.detach();
          });
        }
      });
      cb();
    },

    initLogo: function(cb) {
      var self = this;

      var logo_img = self.visualization.state.getValue("logoimg");
      var logo_url = self.visualization.state.getValue("logourl");

      if (logo_img) {
        var logo = $("<a class='logo'><img></a>");
        logo.find("img").attr({src:logo_img});
        logo.attr({href:logo_url});
        self.visualization.node.append(logo);
      }
      cb();
    },

    initTimeline: function (cb) {
      var self = this;
      var updating = false;

      self.timelineNode = $('<div class="main-timeline">');
      self.visualization.node.append(self.timelineNode);

      self.timeline = new Timeline({node: self.timelineNode});

      var setRange = function (e) {
        if (updating) return;
        self.visualization.state.setValue("time", e.end);
        self.visualization.state.setValue("timeExtent", e.end - e.start);
      }

      self.timeline.events.on({
        'set-range': setRange,
        'temporary-range': setRange,
        'user-update-start': function (e) {
          self.visualization.state.setValue("paused", true);
        }
      });

      var daySliderUpdateMinMax = function() {
        if (updating) return;

        if (!self.visualization.data.header.colsByName.datetime) return;
        self.timeline.min = new Date(self.visualization.data.header.colsByName.datetime.min);
        self.timeline.max = new Date(self.visualization.data.header.colsByName.datetime.max);

        var rangemarks = self.timeline.rangemarks;
        if (self.timeline.dataRangemark == undefined) {
          self.timeline.dataRangemark = {
            start: self.timeline.min,
            end: self.timeline.max,
            css: {background:"#ffffff", 'z-index': 0},
          };
          rangemarks.push(self.timeline.dataRangemark);
        } else {
          self.timeline.dataRangemark.start = self.timeline.min;
          self.timeline.dataRangemark.end = self.timeline.max;
        }
        self.timeline.setRangemarks(rangemarks);

        daySliderUpdateValue();
      };

      var daySliderUpdateValue = function () {
        if (updating) return;

        var start;
        var end = self.visualization.state.getValue("time");
        var timeExtent = self.visualization.state.getValue("timeExtent");

        var adjusted = false;
        if (end == undefined || timeExtent == undefined) {
          if (self.timeline.max == undefined || self.timeline.min == undefined) return;

          start = self.timeline.min;
          if (timeExtent == undefined) {
            end = self.timeline.max;
          } else {
            end = new Date(start.getTime() + timeExtent);
          }
          adjusted = true;
        } else {
          start = new Date(end.getTime() - timeExtent);

          if (self.timeline.max != undefined && self.timeline.min != undefined) {
            if (end > self.timeline.max) {
              end = self.timeline.max;
              start = new Date(end.getTime() - timeExtent);
              self.visualization.state.setValue("paused", true);
              adjusted = true;
            }
            if (start < self.timeline.min) {
              start = self.timeline.min;
              end = new Date(start.getTime() + timeExtent);
              adjusted = true;
            }
            if (end > self.timeline.max) {
              end = self.timeline.max;
              adjusted = true;
            }
          }
        }

        updating = true;
        if (adjusted) {
          self.visualization.state.setValue("time", end);
          self.visualization.state.setValue("timeExtent", end - start);
        }
        self.timeline.setRange(start, end);
        updating = false;
      };

      self.visualization.state.events.on({
        time: daySliderUpdateValue,
        timeExtent: daySliderUpdateValue
      });
      self.visualization.data.events.on({update: daySliderUpdateMinMax});
      daySliderUpdateValue();
      cb();
    },

    initToggleButtons: function(cb) {
      var self = this;

      self.animateButtonNode = $('<button name="animate-button" id="animate-button" class="btn btn-xs"><input type="hidden"><i class="fa fa-pause"></i></button>');
      self.visualization.node.append(self.animateButtonNode);

      self.animateButtonNode.click(function () {
        val = self.animateButtonNode.find("input").val() == "true";
        self.animateButtonNode.find("input").val(val ? "false" : "true");
        self.animateButtonNode.find("input").trigger("change");
      });
      self.animateButtonNode.find("input").change(function () {
        self.visualization.state.setValue("paused", self.animateButtonNode.find("input").val() == "true");
      });
      function setValue(value) {
        self.animateButtonNode.find("input").val(value ? "true" : "false");
        if (value) {
          self.animateButtonNode.find("i").removeClass("fa-pause").addClass("fa-play");
        } else {
          self.animateButtonNode.find("i").removeClass("fa-play").addClass("fa-pause");
        }
      }
      self.visualization.state.events.on({paused: function (e) { setValue(e.new); }});
      setValue(self.visualization.state.getValue("paused"));

      cb();
    },

    initSaveButton: function(cb) {
      var self = this;

      self.saveButtonNode = $('<button name="save-button" id="save-button" class="btn btn-xs"><input type="hidden"><i class="fa fa-save"></i></button>')
      self.visualization.node.append(self.saveButtonNode);

      self.saveButtonNode.click(function () {
        self.visualization.save(function (url) {
          url = window.location.toString().split("#")[0] + "#workspace=" + escape(url);

          var dialog = $('<div class="modal fade" id="share" tabindex="-1" role="dialog" aria-labelledby="shareLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-header bg-success text-success"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 class="modal-title" id="shareLabel">Workspace saved</h4></div><div class="modal-body alert">Share this link: <input type="text" class="link" style="width: 300pt"></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div></div></div></div>');
          dialog.find('.modal-body .link').val(url);
          $('body').append(dialog);
          dialog.modal();
          dialog.on('hidden.bs.modal', function (e) {
            dialog.detach();
          });
        });
      });

      cb();
    },

    initInfoUI: function (cb) {
      var self = this;

      self.info = new InfoUI(self.visualization);
      cb();
    },

    initAnimationManagerUI: function (cb) {
      var self = this;

      self.animations = new AnimationManagerUI(self.visualization);
      cb();
    }
  });
});
