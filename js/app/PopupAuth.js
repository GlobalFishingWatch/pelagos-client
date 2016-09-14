define([
  "app/Class"
], function(
  Class
) {

  var PopupAuth = Class({
    name: "PopupAuth",

    initialize: function (login_url, cb) {
      var self = this;

      self.cb = cb;

      self.id = 'pelagos-client-auth-' + self.guuid()
      PopupAuth.open_dialogs[self.id] = self;

      self.window = window.open(login_url, self.id, 'directories=0,titlebar=0,toolbar=0,location=0,status=0,menubar=0,scrollbars=no,resizable=no,width=400,height=350');
    },

    done: function (args) {
      var self = this;
      if (args == undefined) args = true;
      delete PopupAuth.open_dialogs[self.id];
      self.cb(args);
    },

    guuid: function () {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = crypto.getRandomValues(new Uint8Array(1))[0]%16|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(16);
      });
    }
  });
  PopupAuth.open_dialogs = {};

    window.popup_auth_done = function (window_name, args) {
    PopupAuth.open_dialogs[window_name].done(args);
  };

  return PopupAuth;
});
