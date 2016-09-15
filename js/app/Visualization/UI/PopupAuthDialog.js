define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "app/PopupAuth",
  "shims/jQuery/main"
], function (
  declare,
  TemplatedDialog,
  PopupAuth,
  $
) {
  return declare("PopupAuthDialog", [TemplatedDialog], {
    'class': 'popupAuthDialog',
    style: "width: 50%;",
    title: "Action requires authentication",
    action_name: null,
    visualization: null,
    callback: null,
    authInformation: null,
    contentTemplate: '' +
      '<div data-dojo-type="dijit/layout/ContentPane">' +
      '  ${action_name} requires authentication.' +
      '</div>',

    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <button data-dojo-type="dijit/form/Button" type="submit"  data-dojo-attach-event="click:cancel">Cancel</button>' +
      '  <button data-dojo-type="dijit/form/Button" type="submit"  data-dojo-attach-event="click:authenticate">Authenticate</button>' +
      '</div>',

    cancel: function () {
      var self = this;
      self.callback("Canceled");
      self.destroy();
    },

    authenticate: function () {
      var self = this;

      new PopupAuth(self.authInformation.auth_location, function (args) {
        if (args) {
          if (args.headers != undefined) self.visualization.data.setHeaders(args.headers);
          self.callback(null, args);
        }
      });
      self.destroy();
    }
  });
});
