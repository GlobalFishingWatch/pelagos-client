define([
  "app/Class",
  "dijit/Dialog",
  "app/LoadingInfo",
  "app/UrlValues",
  "app/Visualization/KeyModifiers",
  "app/Visualization/UI/Timeline",
  "app/Visualization/UI/SidePanels/SidePanelManager",
  "app/Visualization/UI/BasicSidebar",
  "app/Visualization/UI/Search",
  "app/ObjectTemplate",
  "dijit/layout/BorderContainer",
  "dijit/layout/ContentPane",
  "async",
  "jQuery"],
function (
  Class,
  Dialog,
  LoadingInfo,
  UrlValues,
  KeyModifiers,
  Timeline,
  SidePanelManager,
  BasicSidebar,
  Search,
  ObjectTemplate,
  BorderContainer,
  ContentPane,
  async,
  $) {
  return Class({
    name: "UI",
    initialize: function (visualization) {
      var self = this;
      self.visualization = visualization;
    },

    init1: function (cb) {
      var self = this;

      var self = this;

      self.container = new BorderContainer({'class': 'AnimationUI', liveSplitters: true, design: 'sidebar', style: 'padding: 0; margin: 0;'});
      self.animationsContainer = new ContentPane({'class': 'AnimationContainer', region: 'center', style: 'border: none; overflow: hidden;'});
      self.container.addChild(self.animationsContainer);

      self.visualization.node.append(self.container.domNode);
      self.visualization.node = $(self.animationsContainer.domNode);

      self.container.startup();

      cb();
    },

    init2: function (cb) {
      var self = this;

      async.series([
        self.initButtons.bind(self),
        self.initLoadSpinner.bind(self),
        self.initLogo.bind(self),
        self.initTimeline.bind(self),
        self.initPlayButton.bind(self),
        self.initLoopButton.bind(self),
        self.initSaveButton.bind(self),
        self.initSidePanels.bind(self),
        self.initSearch.bind(self)
      ], function () { cb(); });
    },

    initButtons: function (cb) {
      var self = this;
      self.buttonNodes = {};


      self.controlButtonsNode = $(new ObjectTemplate(''
        + '<div class="control_box">'
        + '  <button class="btn btn-default btn-lg" data-name="share"><img src="%(img)s/buttons/share.png"></button>'
        + '  <div class="divide"></div>'        
        + '  <button class="btn btn-default btn-lg" data-name="play"><img class="paused" src="%(img)s/buttons/play.png"><img class="playing" src="%(img)s/buttons/pause.png"></button>'
        + ''
        + '  <a class="balloon">'
        + '  <!--<button class="btn btn-default btn-lg" data-name="expand"><i class="fa fa-ellipsis-h fa-fw"></i></button>-->'
        + '    <div>'
        + '      <img class="arrow" src="%(img)s/buttons/arrow.png">'
        + '      <button class="btn btn-default btn-xs" data-name="start"><i class="fa fa-step-backward"></i></button>'
        + '      <button class="btn btn-default btn-xs" data-name="backward"><i class="fa fa-backward"></i></button>'
        + '      <button class="btn btn-default btn-xs" data-name="loop"><i class="fa fa-repeat"></i></button>'
        + '      <button class="btn btn-default btn-xs" data-name="forward"><i class="fa fa-forward"></i></button>'
        + '      <button class="btn btn-default btn-xs" data-name="end"><i class="fa fa-step-forward"></i></button>'
        + '    </div>'
        + '  </a>'
        + '</div>').eval(app.dirs));
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

      self.loadingNode = $('<div class="loading"><img style="width: 20px;" src="' + app.dirs.img + '/loader/spinner.min.svg"></div>');
      self.visualization.animations.map.controls[google.maps.ControlPosition.LEFT_TOP].push(self.loadingNode[0]);

      self.loadingNode.hide();
      LoadingInfo.main.events.on({
        start: function () {
          self.loadingNode.fadeIn();
        },
        end: function () {
          self.loadingNode.fadeOut();
        }
      });
      self.visualization.data.events.on({
        error: function (data) {
          var dialog = new Dialog({
              style: "width: 50%;",
            title: "Error",
            content: data.toString(),
            actionBarTemplate: '' +
              '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
              '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Close</button>' +
              '</div>'
          });
          $(dialog.closeButton).on('click', function () {
            dialog.hide();
          });
          dialog.show();
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
        var timeExtent = e.end - e.start;

        if (timeExtent < self.visualization.state.getValue("timeExtent")) {
          self.visualization.state.setValue("timeExtent", timeExtent);
          self.visualization.state.setValue("time", e.end);
        } else {
          self.visualization.state.setValue("time", e.end);
          self.visualization.state.setValue("timeExtent", timeExtent);
        }
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
              if (!self.visualization.state.getValue("paused") && self.visualization.state.getValue("loop")) {
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
          self.buttonNodes.play.find(".playing").hide();
          self.buttonNodes.play.find(".paused").show();
        } else {
          self.buttonNodes.play.find(".playing").show();
          self.buttonNodes.play.find(".paused").hide();
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

          var dialog = new Dialog({
            style: "width: 50%;",
            title: "Workspace saved",
            content: '' +
              'Share this link: <input type="text" class="link" style="width: 300pt">',
            actionBarTemplate: '' +
              '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
              '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Close</button>' +
              '</div>'
          });
          $(dialog.containerNode).find("input").val(url);
          $(dialog.closeButton).on('click', function () {
            dialog.hide();
          });
          dialog.show();
        });
      });

      cb();
    },

    initSidePanels: function (cb) {
      var self = this;

      $(document).on({
        keyup: function (e) {
          if (KeyModifiers.nameById[e.keyCode] == 'E' && KeyModifiers.active.Alt && KeyModifiers.active.Ctrl) {
            self.visualization.state.setValue('edit', !self.visualization.state.getValue('edit'));
          }
        }
      });

      self.sidePanels = new SidePanelManager(self);
      self.sideBar = new BasicSidebar(self.visualization);
      cb();
    },

    initSearch: function (cb) {
      var self = this;

      self.search = new Search(self.visualization);
      cb();
    },

    toJSON: function () {
      var self = this;
      return {
        sideBar: self.sideBar
      };
    },

    load: function (data, cb) {
      var self = this;
      self.sideBar.load(data && data.sideBar, cb);
    }
  });
});
