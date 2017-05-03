define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "app/Visualization/KeyBindings",
  "dojo/cookie",
  "shims/jQuery/main",
  "dijit/form/Button",
  "dijit/form/CheckBox"
], function(
  declare,
  Dialog,
  KeyBindings,
  cookie,
  $,
  Button,
  CheckBox
){
  return declare("WelcomeMessageDialog", [Dialog], {
    'class': 'welcomeMessageDialog',
    title: "Welcome message",
    content: "",
    url: null,
    style: "max-width: 50%;",

    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <span class="left"><checkbox data-dojo-type="dijit/form/CheckBox" data-dojo-attach-point="dontShowAgain"></checkbox> <label>Please don\'t show this message again</label></span>' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Continue</button>' +
      '</div>',

    startup: function () {
      var self = this;
      self.inherited(arguments);

      KeyBindings.register(
        ['Ctrl', 'Alt', 'W'], null, 'General',
        'Display welcome message',
        function () {
          if (!self.url) return;

          var seen = self.getSeen();
          delete seen[self.url];
          self.setSeen(seen);

          self.show();
        }
      );
    },

    show: function () {
      var self = this;

      if (!self.url) return;

      var seen = self.getSeen();
      if (seen[self.url]) return;

      $.get(self.url, function (html) {
        // Workaround for limitation in jQuery
        html = html
          .replace("<html", "<div data-tag='html'>")
          .replace('</html>', '</div>')
          .replace('<head', '<div data-tag="head"')
          .replace("</head", "</div")
          .replace('<body', '<div data-tag="body"')
          .replace("</body", "</div");
        html = $(html);
        self.set("title", html.find('title').html());
        self.set("content", html.find('*[data-tag="body"]').html());
        Dialog.prototype.show.call(self);
      }, 'text');
    },

    getSeen: function () {
      var self = this;
      var seen = cookie("welcomeMessagesSeen");
      if (!seen) return {};
      return JSON.parse(atob(seen));
    },

    setSeen: function (seen) {
      var self = this;
      cookie("welcomeMessagesSeen", btoa(JSON.stringify(seen)), {expires: 3650, path: '/'});
    },

    onHide: function () {
      var self = this;

      if (self.dontShowAgain.get("value")) {
        var seen = self.getSeen();
        seen[self.url] = true;
        self.setSeen(seen);
      }
    }
  });
});
