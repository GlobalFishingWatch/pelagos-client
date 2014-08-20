if (!app.useDojo) {
  define(["app/Class"], function (Class) {
    return Class({name: "SidePanels"});
  });
} else {
  define([
    "app/Class",
    "app/Logging",
    "jQuery",
    "dijit/layout/BorderContainer",
    "dijit/layout/AccordionContainer",
    "dijit/layout/ContentPane",
    "dojo/dom",
    "dojo/parser",
    "dojo/domReady!"
  ], function(Class, Logging, $, BorderContainer, AccordionContainer, ContentPane){
    return Class({
      name: "SidePanels",
      initialize: function (visualization) {
        var self = this;

        self.visualization = visualization;

        self.container = new BorderContainer({class: 'AnimationUI', liveSplitters: true, design: 'sidebar'});
        self.animationsContainer = new ContentPane({class: 'AnimationContainer', region: 'center'});
        self.container.addChild(self.animationsContainer);

        self.sidebarContainer = new AccordionContainer({region: 'right', splitter:true});
        self.container.addChild(self.sidebarContainer);

        self.visualization.node.append(self.container.domNode);
        self.visualization.node = $(self.animationsContainer.domNode);

        self.container.startup();
      }
    });
  });
}
