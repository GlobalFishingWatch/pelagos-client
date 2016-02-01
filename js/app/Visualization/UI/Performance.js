define([
  "app/Class",
  "dijit/Dialog",
  "async",
  "jQuery",
  "app/Visualization/KeyBindings",
  "app/LoadingInfo",
], function(
  Class,
  Dialog,
  async,
  $,
  KeyBindings,
  LoadingInfo
){
  return Class({
    name: "Performance",
    initialize: function (visualization) {
      var self = this;

      self.visualization = visualization;
      self.animationManager = visualization.animations;

      KeyBindings.register(
        ['Ctrl', 'Alt', 'P'], null, 'General',
        'Performance', self.displayPerformanceDialog.bind(self)
      );

      self.dialog = new Dialog({
        style: "width: 50%;",
        title: "Performance",
        "class": 'performance-dialog',
        content: '' +
          '<table class="results"></table>',
        actionBarTemplate: '' +
          '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
          '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Close</button>' +
          '</div>'
      });

      $(self.dialog.closeButton).on('click', function () {
        self.dialog.hide();
      });
    },

    displayPerformanceDialog: function () {
      var self = this;
      $(self.dialog.containerNode).find('.results').html('');
      self.dialog.show();
      async.series([
        self.timeTask.bind(self, 'tileLoading'),
      ]);
    },

    timeTask: function (name, cb) {
      var self = this;

      var row = $("<tr><th class='name'>" + name + "</th><td class='result'>In progress...</td></tr>");
      $(self.dialog.containerNode).find('.results').append(row);
      var start_t = performance.now();
      self[name](function () {
        var end_t = performance.now();
        row.find('.result').html(((end_t - start_t) / 1000.0).toString() + "s");
        cb();
      });
    },

    tileLoading: function (cb) {
      var endf = function () {
        LoadingInfo.main.events.un({end: endf});
        cb();
      };
      LoadingInfo.main.events.on({end: endf});
      visualization.animations.map.setZoom(5);
    }

  });
});