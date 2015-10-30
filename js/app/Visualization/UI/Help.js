define([
  "app/Class",
  "dijit/Dialog",
  "jQuery",
  "app/Visualization/KeyModifiers"
], function(Class, Dialog, $, KeyModifiers){
  return Class({
    name: "Help",
    initialize: function (visualization) {
      var self = this;

      self.visualization = visualization;
      self.animationManager = visualization.animations;

      $(document).on({
        keyup: function (e) {
          if (KeyModifiers.nameById[e.keyCode] == 'H' && KeyModifiers.active.Alt && KeyModifiers.active.Ctrl) {
            self.displayHelpDialog();
          }
        }
      });

      self.dialog = new Dialog({
        style: "width: 400pt;",
        title: "Keyboard shortcuts",
        content: '' +
          '<dl>' +
          '  <dt>CTRL-ALT-F</dt><dd>Search</dd>' +
          '  <dt>CTRL-ALT-E</dt><dd>Toggle between view and edit sidebar (advanced mode)</dd>' +
          '  <dt>CTRL-ALT-H</dt><dd>Show this help dialog</dd>' +
          '  <dt>left click (on map object)</dt><dd>Show object information in the sidebar</dd>' +
          '  <dt>right click</dt><dd>Show object information in a popup</dd>' +
          '  <dt>SHIFT left click</dt><dd>Show raw object information (no server query) in the sidebar</dd>' +
          '  <dt>SHIFT right click</dt><dd>Show raw object information (no server query) in popup</dd>' +
          '</dl>',
        actionBarTemplate: '' +
          '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
          '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Close</button>' +
          '</div>'
      });

      $(self.dialog.closeButton).on('click', function () {
        self.dialog.hide();
      });
      $(self.dialog.searchButton).on('click', function () {
        self.performHelp($(self.dialog.containerNode).find(".query").val());
      });
    },

    displayHelpDialog: function () {
      var self = this;
      self.dialog.show();
    }
  });
});