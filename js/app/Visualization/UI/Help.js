define([
  "app/Class",
  "dijit/Dialog",
  "jQuery",
  "app/Visualization/KeyBindings"
], function(Class, Dialog, $, KeyBindings){
  return Class({
    name: "Help",
    initialize: function (visualization) {
      var self = this;

      self.visualization = visualization;
      self.animationManager = visualization.animations;

      KeyBindings.register(
        ['Ctrl', 'Alt', 'H'], null, 'General',
        'Show this help dialog', self.displayHelpDialog.bind(self)
      );

      self.dialog = new Dialog({
        style: "width: 400pt;",
        title: "Keyboard shortcuts",
        content: '',
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

      self.dialog.set("content", KeyBindings.toHelp()[0]);
      self.dialog.show();
    }
  });
});