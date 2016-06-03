define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "shims/async/main",
  "shims/jQuery/main",
  "app/Visualization/KeyBindings",
  "app/LoadingInfo"
], function(
  declare,
  Dialog,
  async,
  $,
  KeyBindings,
  LoadingInfo
){
  return declare("Performance", [Dialog], {
    style: "width: 50%;",
    title: "Performance",
    "class": 'performance-dialog',
    content: '' +
      '<table class="results"></table>',
    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-event="click:hide" data-dojo-attach-point="closeButton" data-dojo-props="disabled:true">Close</button>' +
      '</div>',

    visualization: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      KeyBindings.register(
        ['Ctrl', 'Alt', 'P'], null, 'General',
        'Performance', self.displayPerformanceDialog.bind(self)
      );
    },

    displayPerformanceDialog: function () {
      var self = this;
      $(self.containerNode).find('.results').html('');
      $(self.containerNode).css({background: "#ffffff"});
      self.closeButton.set("disabled", true);
      self.show();
      async.series([
        self.timeTask.bind(self, 'tileLoading', 3),
        self.timeTask.bind(self, 'cachedTileLoading', 10),
        self.timeTask.bind(self, 'rendering', 500)
      ], function () {
        $(self.containerNode).css({background: "#55ff55"});
        self.closeButton.set("disabled", false);
      });
    },

    timeTask: function (name, count, cb) {
      var self = this;

      var row = $("<tr><th class='name'>" + name + " (" + count.toString() + ")</th><td class='result'>In progress...</td></tr>");
      $(self.containerNode).find('.results').append(row);

      var fns = [];
      if (self[name + '_pre']) {
        row.find('.result').html('Preparing...');
        fns.push(self[name + '_pre'].bind(self));
      }
      fns.push(function (cb) {
        row.find('.result').html('In progress...');
        var start_t = performance.now();
        self[name](count, function () {
          var end_t = performance.now();
          row.find('.result').html(((end_t - start_t) / count / 1000.0).toString() + "s");
          cb();
        });
      });
      if (self[name + '_post']) {
        fns.push(self[name + '_post'].bind(self));
      }
      async.series(fns, cb);
    },

    loadTilesForZomm: function (zoom, cb) {
      var endf = function () {
        LoadingInfo.main.events.un({end: endf});
        cb();
      };
      LoadingInfo.main.events.on({end: endf});
      visualization.animations.map.setZoom(zoom);
    },

    tileLoading: function (count, cb) {
      var self = this;

      var loaded = function () {
        count--;
        if (count >= 0) {
          self.loadTilesForZomm(4 + count, loaded);
        } else {
          cb();
        }
      };
      loaded();
    },

    cachedTileLoading_pre: function (cb) {
      var self = this;
      visualization.animations.map.setZoom(4);
      async.series([
        self.loadTilesForZomm.bind(self, 5),
        self.loadTilesForZomm.bind(self, 4)
      ], cb);
    },

    cachedTileLoading: function (count, cb) {
      var self = this;

      var loaded = function () {
        count--;
        if (count >= 0) {
          self.loadTilesForZomm(4 + (count % 2), loaded);
        } else {
          cb();
        }
      };
      loaded();
    },

    rendering: function (count, cb) {
      var update = visualization.animations.update;
      visualization.animations.update = function () {
        update();
        count--;
        if (count >= 0) {
          visualization.animations.updateNeeded = true;
        } else {
          visualization.animations.update = update;
          cb();
        }
      };
      visualization.animations.updateNeeded = true;
    }

  });
});
