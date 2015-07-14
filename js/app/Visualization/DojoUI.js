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

      self.container = new BorderContainer({'class': 'AnimationUI', liveSplitters: true, design: 'sidebar', style: 'padding: 0; margin: 0;'});
      self.animationsContainer = new ContentPane({'class': 'AnimationContainer', region: 'center', style: 'border: none;'});
      self.container.addChild(self.animationsContainer);

      self.visualization.node.append(self.container.domNode);
      self.visualization.node = $(self.animationsContainer.domNode);

      self.container.startup();

      self.sidebarContainer = new AccordionContainer({region: 'right', splitter:true});

      if (self.visualization.state.getValue('edit')) {
        self.container.addChild(self.sidebarContainer);
      }    
      self.visualization.state.events.on({'edit': function (data) {
        if (data.new_value) {
          self.container.addChild(self.sidebarContainer);
        } else {
          self.container.removeChild(self.sidebarContainer);
        }
      }});

    }
  });
});
