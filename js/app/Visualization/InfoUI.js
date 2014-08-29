if (!app.useDojo) {
  define(["app/Class"], function (Class) {
    return Class({name: "InfoUI"});
  });
} else {
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
      initialize: function (visualization) {
        var self = this;

        self.visualization = visualization;

        self.ui = new ContentPane({title: 'Info', content:"<table class='table table-striped table-bordered'><tr><th>No object selected</th></tr></table>", doLayout: false});

        self.visualization.sidePanels.sidebarContainer.addChild(self.ui);
        self.visualization.sidePanels.container.layout();


        self.visualization.animations.events.on({
          'info': self.update.bind(self, "#ffffff"),
          'info-error': self.update.bind(self, "#ff8888"),
        });
      },

      update: function (color, info) {
        var self = this;

        $(self.ui.domNode).html(info.toString());
        $(self.ui.domNode).css({background: color});

        self.visualization.sidePanels.sidebarContainer.selectChild(self.ui, true);
      }
    });
  });
}
