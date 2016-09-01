define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "shims/jQuery/main",
  "app/Visualization/KeyBindings"
], function(
  declare,
  Dialog,
  $,
  KeyBindings
){
  return declare("Help", [Dialog], {
    style: "width: 400pt;",
    title: "Keyboard shortcuts",
    content: '',
    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-event="click:hide">Close</button>' +
      '</div>',

    visualization: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      KeyBindings.register(
        ['Ctrl', 'Alt', 'H'], null, 'General',
        'Show this help dialog', self.displayHelpDialog.bind(self)
      );
    },

    displayHelpDialog: function () {
      var self = this;
      /* Bug workaround for margin/padding calculations */
      $(self.containerNode).css({height: "300pt", overflow: "auto"});

      self.set("content", KeyBindings.toHelp()[0]);
      $(self.containerNode).find("a").click(self.hide.bind(self));
      self.show();
    }
  });
});