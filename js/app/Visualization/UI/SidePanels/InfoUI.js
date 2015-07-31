define([
  "app/Class",
  "app/Logging",
  "jQuery",
  "dijit/layout/ContentPane",
  "dojo/dom",
  "dojo/parser",
  "dojo/domReady!"
], function(Class, Logging, $, ContentPane){
  return Class({
    name: "InfoUI",
    initialize: function (sidePanels) {
      var self = this;

      self.sidePanels = sidePanels;

      self.ui = new ContentPane({title: 'Info', content:"<table class='table table-striped table-bordered'><tr><th>No object selected</th></tr></table>", doLayout: false});

      self.sidePanels.sidebarContainer.addChild(self.ui);
      self.sidePanels.sidebarContainer.layout();


      self.sidePanels.ui.visualization.animations.events.on({
        'info': self.update.bind(self, "#ffffff"),
        'info-error': self.update.bind(self, "#ff8888")
      });
    },

    update: function (color, info) {
      var self = this;

      $(self.ui.domNode).html(info && info.toString() || '');
      $(self.ui.domNode).css({background: color});

      self.sidePanels.sidebarContainer.selectChild(self.ui, true);
    }
  });
});
