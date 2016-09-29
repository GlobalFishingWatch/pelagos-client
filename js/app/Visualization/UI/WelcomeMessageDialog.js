define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "dojo/cookie",
  "shims/jQuery/main",
  "dijit/form/Button",
  "dijit/form/CheckBox"
], function(
  declare,
  Dialog,
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
      '  <span style="float: left;"><checkbox data-dojo-type="dijit/form/CheckBox" data-dojo-attach-point="dontShowAgain"></checkbox> <label>Don\'t show this message again</label></span>' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Close</button>' +
      '</div>',

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
      cookie("welcomeMessagesSeen", btoa(JSON.stringify(seen)), {});
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
