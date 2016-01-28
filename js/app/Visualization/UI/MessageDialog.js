define([
  "dijit/Dialog",
  "jQuery"
], function(
  Dialog,
  $
) {
  return {
    show: function(title, message, cb) {
      var dialog = new Dialog({
        style: "width: 50%",
        title: title,
        content: message,
        actionBarTemplate: '' +
          '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
          '  <button data-dojo-type="dijit/form/Button" type="button" data-dojo-attach-point="acceptButton">Accept</button>' +
          '</div>'
      });
      $(dialog.acceptButton).on("click", function() {
        dialog.hide();
        if (cb) { cb(); }
      });

      dialog.show();
    }
  };
});

