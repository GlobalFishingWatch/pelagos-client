if (!app.useDojo) {
  define(["app/Class"], function (Class) {
    return Class({name: "InfoUI"});
  });
} else {
  define([
    "app/Class",
    "app/Visualization/SidePanels/InfoUI",
    "app/Visualization/SidePanels/LoggingUI",
    "app/Visualization/SidePanels/AnimationManagerUI",
    "app/Visualization/SidePanels/DataUI"
  ], function(Class, InfoUI, LoggingUI, AnimationManagerUI, DataUI){
    return Class({
      name: "InfoUI",
      initialize: function (visualization) {
        var self = this;

        self.visualization = visualization;

        self.info = new InfoUI(self.visualization);
        self.animations = new AnimationManagerUI(self.visualization);
        self.logging = new LoggingUI(self.visualization);
        self.data = new DataUI(self.visualization);
      }
    });
  });
}

