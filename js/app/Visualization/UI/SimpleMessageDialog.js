define([
  "dijit/Dialog",
  "jQuery"
], function (
  Dialog,
  $
) {
  return {
    show: function(title, message) {
      var dialog = new Dialog({
        style: "width: 50%;",
        title: title,
        content: message,
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
  };
});
