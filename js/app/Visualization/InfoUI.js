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

        self.ui = new ContentPane({title: 'Info', content:"Nanananana", doLayout: false});

        self.visualization.sidePanels.sidebarContainer.addChild(self.ui);
        self.visualization.sidePanels.container.layout();


        self.visualization.animations.events.on({
          'info-selected': self.update.bind(self),
          'error': self.error.bind(self),
        });
      },

      update: function (info) {
        var self = this;

        var table = $("<table>");
        for (var key in data) {
          if (typeof(data[key])=="string" && data[key].indexOf("://") != -1) {
            table.append("<tr><td colsan='2'><a href='" + data[key] +  "'>" + key + "</a></td></tr>");
          } else {
            table.append("<tr><td>" + key + "</td><td>" + data[key] + "</td></tr>");
          }
        }
        $(self.ui.domNode).html(table);
      },

      error: function (info) {
        $(self.ui.domNode).html(info.toString());
      }
    });
  });
}
