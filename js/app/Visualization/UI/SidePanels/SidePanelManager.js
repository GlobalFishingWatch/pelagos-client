define([
  "app/Class",
  "app/Visualization/UI/SidePanels/InfoUI",
  "app/Visualization/UI/SidePanels/LoggingUI",
  "app/Visualization/UI/SidePanels/AnimationManagerUI",
  "app/Visualization/UI/SidePanels/DataUI",
  "dijit/layout/AccordionContainer"
], function(Class, InfoUI, LoggingUI, AnimationManagerUI, DataUI, AccordionContainer){
  return Class({
    name: "InfoUI",
    initialize: function (ui) {
      var self = this;

      self.ui = ui;
      self.visualization = self.ui.visualization;
      self.animationManager = self.visualization.animations;

      self.sidebarContainer = new AccordionContainer({region: 'right', splitter:true, style: "width: 30%;"});
      if (self.ui.visualization.state.getValue('edit')) {
        self.ui.container.addChild(self.sidebarContainer);
      }
      self.sidebarContainer.startup();
      self.ui.visualization.state.events.on({'edit': function (data) {
        if (data.new_value) {
          self.ui.container.addChild(self.sidebarContainer);
        } else {
          self.ui.container.removeChild(self.sidebarContainer);
        }
      }});

      self.sidebarContainer.visualization = self.visualization;

      self.info = new InfoUI({visualization: self.visualization});
      self.sidebarContainer.addChild(self.info);
      self.animations = new AnimationManagerUI({visualization: self.visualization});
      self.sidebarContainer.addChild(self.animations);
      self.logging = new LoggingUI({visualization: self.visualization});
      self.sidebarContainer.addChild(self.logging);
      self.data = new DataUI({visualization: self.visualization});
      self.sidebarContainer.addChild(self.data);
      self.sidebarContainer.selectChild(self.animations, false);
    }
  });
});

