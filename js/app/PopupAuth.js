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

      var options = {
        directories: 0,
        titlebar: 0,
        toolbar: 0,
        location: 0,
        status: 0,
        menubar: 0,
        scrollbars: "yes",
        resizable: "yes",
        fullscreen: "yes",
        width: screen.width,
        height: screen.height
      };
      options = Object.keys(options).map(function (key) { return key + "=" + options[key].toString(); }).join(",");

      self.window = window.open(login_url, self.id, options);
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
