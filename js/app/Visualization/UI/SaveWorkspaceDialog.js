define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "dijit/layout/BorderContainer",
  "dijit/layout/ContentPane",
  "dijit/form/Button",
  "shims/async/main",
  "shims/jQuery/main",
  "shims/clipboard/main",
  "app/Visualization/KeyBindings"
], function(
  declare,
  Dialog,
  BorderContainer,
  ContentPane,
  Button,
  async,
  $,
  clipboard,
  KeyBindings
){
  return declare("SaveWorkspaceDialog", [Dialog], {
    'class': 'saveWorkspaceDialog',
    style: "width: 50%;",
    title: "Workspace saved",
    "class": 'saveWorkspaceDialog',
    contentTemplate: '' +
      '<div data-dojo-type="dijit/layout/ContentPane">' +
      '  <div class="label">' +
      '    Share this link:' +
      '  </div>' +
      '  <div class="link">' +
      '    <input data-dojo-type="dijit/form/TextBox" type="text" class="link dijit dijitReset dijitInline dijitLeft" style="width: 300pt" data-dojo-attach-point="link">' +
          '<div data-dojo-type="dijit/form/Button" class="copyButton dijit dijitReset dijitInline dijitLeft" data-dojo-attach-event="click:copyLink"><i class="fa fa-copy" aria-hidden="true"></i> COPY</div>' +
      '  </div>' +
      '</div>',

    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <button data-dojo-type="dijit/form/Button" type="submit"  data-dojo-attach-event="click:hide">Close</button>' +
      '</div>',

    visualization: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      /* Ctrl-Alt-S would have been more logical, but doesn't work in
       * some browsers (As soon as Ctrl and S are pressed, it's
       * eaten)
       */
      KeyBindings.register(
        ['Alt', 'S'], null, 'General',
        'Save workspace',
        self.saveWorkspace.bind(self)
      );
    },

    saveWorkspace: function () {
      var self = this;
      self.visualization.save(function (url) {
        self.link.set("value", url);
        self.show();
      });
    },

    copyLink: function () {
      var self = this;
      var url = self.link.get("value");
      clipboard.copy({
        "text/plain": url,
        "text/html": "<a href='" + url + "'>" + self.visualization.state.getValue('title') + "</a>"
      });
    },
  });
});
