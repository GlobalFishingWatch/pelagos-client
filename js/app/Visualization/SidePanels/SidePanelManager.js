define([
  "app/Class",
  "app/Visualization/SidePanels/InfoUI",
  "app/Visualization/SidePanels/LoggingUI",
  "app/Visualization/SidePanels/AnimationManagerUI",
  "app/Visualization/SidePanels/DataUI",
  "dijit/layout/AccordionContainer"
], function(Class, InfoUI, LoggingUI, AnimationManagerUI, DataUI, AccordionContainer){
  return Class({
    name: "InfoUI",
    initialize: function (ui) {
      var self = this;

      self.ui = ui;

      self.sidebarContainer = new AccordionContainer({region: 'right', splitter:true});
      if (self.ui.visualization.state.getValue('edit')) {
        self.ui.container.addChild(self.sidebarContainer);
      }    
      self.ui.visualization.state.events.on({'edit': function (data) {
        if (data.new_value) {
          self.ui.container.addChild(self.sidebarContainer);
        } else {
          self.ui.container.removeChild(self.sidebarContainer);
        }
      }});

      self.info = new InfoUI(self);
      self.animations = new AnimationManagerUI(self);
      self.logging = new LoggingUI(self);
      self.data = new DataUI(self);
    }
  });
});

