define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "shims/jQuery/main",
  "app/Json",
  "app/Visualization/KeyBindings",
  "app/Visualization/UI/LoaderIcon",
  "dijit/form/Button"
], function(
  declare,
  Dialog,
  $,
  Json,
  KeyBindings,
  LoaderIcon
){
  return declare("WorkspaceEditor", [Dialog], {
    title: "Workspace editor",
    "class": 'workspace-editor-dialog',
    contentTemplate: '' +
      '<textarea data-dojo-attach-point="workspaceTextNode" style="width: 100%; height: 100%;"></textarea>',
    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <button data-dojo-type="dijit/form/Button" data-dojo-attach-event="click:hide">Close</button>' +
      '  <button data-dojo-type="dijit/form/Button" data-dojo-attach-event="click:apply">Apply</button>' +
      '  <button data-dojo-type="dijit/form/Button" data-dojo-attach-event="click:save">Save</button>' +
      '</div>',

    visualization: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      KeyBindings.register(
        ['Ctrl', 'Alt', 'R'], null, 'General',
        'Workspace editor', self.show.bind(self)
      );
    },

    show: function () {
      var self = this;
      $(self.workspaceTextNode).val(self.visualization.saveToString(2));
      Dialog.prototype.show.apply(self, arguments);
    },

    apply: function () {
      var self = this;

      self.hide();
      self.visualization.loadData(Json.decode($(self.workspaceTextNode).val()), function () {
      });
    },

    save: function () {
      var self = this;

      self.hide();
      self.visualization.ui.saveWorkspace.link.set("value", "");
      $(self.visualization.ui.saveWorkspace.containerNode).find('.save-loading').show();
      self.visualization.ui.saveWorkspace.show();

      self.visualization.saveWorkspace($(self.workspaceTextNode).val(), function (url) {
        self.visualization.ui.saveWorkspace.link.set("value", url);
        $(self.visualization.ui.saveWorkspace.containerNode).find('.save-loading').hide();
      });
    }
  });
});
