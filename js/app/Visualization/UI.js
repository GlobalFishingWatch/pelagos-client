define(["app/Class", "app/Timeline", "app/Visualization/SidePanels/SidePanelManager", "app/Visualization/BasicSidebar", "async", "jQuery"], function(Class, Timeline, SidePanelManager, BasicSidebar, async, $) {
  return Class({
    name: "UI",
      initialize: function (visualization) {
      var self = this;
      self.visualization = visualization;
    },

    init: function (cb) {
      var self = this;

      async.series([
        self.initButtons.bind(self),

        self.initLoadSpinner.bind(self),
        self.initLogo.bind(self),
        self.initTimeline.bind(self),
        self.initPlayButton.bind(self),
        self.initLoopButton.bind(self),
        self.initSaveButton.bind(self),
        self.initSidePanels.bind(self)
      ], function () { cb(); });
    },

    initButtons: function (cb) {
      var self = this;
      self.buttonNodes = {};

      var arrowUrl = app.paths.script.slice(0,-1).concat(["img", "arrow.png"]).join("/");
      var playUrl = app.paths.script.slice(0,-1).concat(["img", "gfw", "play.png"]).join("/");
      var shareUrl = app.paths.script.slice(0,-1).concat(["img", "gfw", "share.png"]).join("/");


      self.controlButtonsNode = $(''
        
        
        + '<div class="control_box">'
        + '  <button class="btn btn-default btn-lg" data-name="share"><img src="' + shareUrl + '"></button>'
        + '  <div class="divide"></div>'        
        + '  <button class="btn btn-default btn-lg" data-name="play"><img src="' + playUrl + '"></button>'
        + ''
        + '  <a class="balloon">'
        + '  <!--<button class="btn btn-default btn-lg" data-name="expand"><i class="fa fa-ellipsis-h fa-fw"></i></button>-->'
        + '    <div>'
        + '      <img class="arrow" src="' + arrowUrl + '">'
        + '      <button class="btn btn-default btn-xs" data-name="start"><i class="fa fa-step-backward"></i></button>'
        + '      <button class="btn btn-default btn-xs" data-name="backward"><i class="fa fa-backward"></i></button>'
        + '      <button class="btn btn-default btn-xs" data-name="loop"><i class="fa fa-repeat"></i></button>'
        + '      <button class="btn btn-default btn-xs" data-name="forward"><i class="fa fa-forward"></i></button>'
        + '      <button class="btn btn-default btn-xs" data-name="end"><i class="fa fa-step-forward"></i></button>'
        + '    </div>'
        + '  </a>'
        + '</div>');
      self.visualization.node.append(self.controlButtonsNode);

      self.controlButtonsNode.find(".btn").each(function () {
        var btn = $(this);
        self.buttonNodes[btn.attr("data-name")] = btn;
      });

      self.buttonNodes.start.click(function () {
        self.visualization.state.setValue("time", new Date(self.visualization.data.header.colsByName.datetime.min + self.visualization.state.getValue("timeExtent")));
      });

      self.buttonNodes.backward.click(function () {
        var timeExtent = self.visualization.state.getValue("timeExtent");
        var time = self.visualization.state.getValue("time").getTime();
        var timePerTimeExtent = self.visualization.state.getValue("length");
        var timePerAnimationTime = timePerTimeExtent / timeExtent;

        time -= 1000 / timePerAnimationTime;
        self.visualization.state.setValue("time", new Date(time));
      });

      self.buttonNodes.forward.click(function () {
        var timeExtent = self.visualization.state.getValue("timeExtent");
        var time = self.visualization.state.getValue("time").getTime();
        var timePerTimeExtent = self.visualization.state.getValue("length");
        var timePerAnimationTime = timePerTimeExtent / timeExtent;

        time += 1000 / timePerAnimationTime;
        self.visualization.state.setValue("time", new Date(time));
      });

      self.buttonNodes.end.click(function () {
        self.visualization.state.setValue("time", new Date(self.visualization.data.header.colsByName.datetime.max));
      });


      cb();
    },

    initLoadSpinner: function(cb) {
      var self = this;

      self.loadingNode = $('<div class="loading" style="padding-left: 34px;"><img style="width: 20px;" src="' + app.dirs.img + '/loader/Loader_30x30.gif"></div>');
      self.visualization.animations.map.controls[google.maps.ControlPosition.LEFT_TOP].push(self.loadingNode[0]);

      self.loadingNode.hide();
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

        var min_datetime = new Date(self.visualization.data.header.colsByName.datetime.min);
        var max_datetime = new Date(self.visualization.data.header.colsByName.datetime.max);

        // Do not update if nothing has changed.
        // NB: Comparing Date objects does not work with == so check that the difference is 0 instead
        if ((0 == min_datetime - self.timeline.min) && (0 == max_datetime - self.timeline.max)) return;

        self.timeline.min = min_datetime;
        self.timeline.max = max_datetime;

        var rangemarks = self.timeline.rangemarks;
        if (self.timeline.dataRangemark == undefined) {
          self.timeline.dataRangemark = {
            start: self.timeline.min,
            end: self.timeline.max,
            css: {background:"#ffffff", 'z-index': 0}
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
              if (self.visualization.state.getValue("loop")) {
                start = self.timeline.min;
                end = new Date(start.getTime() + timeExtent);
              } else {
                self.visualization.state.setValue("paused", true);
              }
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

    initPlayButton: function(cb) {
      var self = this;

      self.buttonNodes.play.click(function () {
        val = self.buttonNodes.play.val() == "true";
        self.buttonNodes.play.val(val ? "false" : "true");
        self.buttonNodes.play.trigger("change");
      });
      self.buttonNodes.play.change(function () {
        self.visualization.state.setValue("paused", self.buttonNodes.play.val() == "true");
      });
      function setValue(value) {
        self.buttonNodes.play.val(value ? "true" : "false");
        if (value) {
          self.buttonNodes.play.find("i").removeClass("fa-pause").addClass("fa-play");
        } else {
          self.buttonNodes.play.find("i").removeClass("fa-play").addClass("fa-pause");
        }
      }
      self.visualization.state.events.on({paused: function (e) { setValue(e.new_value); }});
      setValue(self.visualization.state.getValue("paused"));

      cb();
    },

    initLoopButton: function (cb) {
      var self = this;

      self.buttonNodes.loop.click(function () {
        val = self.buttonNodes.loop.val() == "true";
        self.buttonNodes.loop.val(val ? "false" : "true");
        self.buttonNodes.loop.trigger("change");
      });
      self.buttonNodes.loop.change(function () {
        self.visualization.state.setValue("loop", self.buttonNodes.loop.val() == "true");
      });
      function setValue(value) {
        self.buttonNodes.loop.val(value ? "true" : "false");
        if (value) {
          self.buttonNodes.loop.find("i").removeClass("fa-repeat").addClass("fa-long-arrow-right");
        } else {
          self.buttonNodes.loop.find("i").removeClass("fa-long-arrow-right").addClass("fa-repeat");
        }
      }
      self.visualization.state.events.on({loop: function (e) { setValue(e.new_value); }});
      setValue(self.visualization.state.getValue("loop"));
      cb();
    },

    initSaveButton: function(cb) {
      var self = this;

      self.buttonNodes.share.click(function () {
        self.visualization.save(function (url) {
          url = window.location.toString().split("?")[0].split("#")[0] + "?workspace=" + url;

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

    initSidePanels: function (cb) {
      var self = this;

      self.sidePanels = new SidePanelManager(self.visualization);
      self.sideBar = new BasicSidebar(self.visualization);
      cb();
    }
  });
});
