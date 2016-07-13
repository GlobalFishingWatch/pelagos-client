profile = {
  basePath: ".",
  resourceTags: {
    amd: function(filename, mid) {
      var specials = {
                      // "app/Condition": true,
                      "app/CanvasLayer": true
/*
,

                      "app/Visualization/UI/Timeline.js": true,
                      "app/Visualization/UI/BasicSidebar": true,
                      "app/Visualization/UI/SidePanels/AnimationManagerUI": true,
                      "app/Visualization/UI/SidePanels/DataUI": true,
                      "app/Visualization/UI/SidePanels/DataViewUI": true,
                      "app/Visualization/UI/SidePanels/InfoUI": true,
                      "app/Visualization/UI/SidePanels/LoggingUI": true,
                      "app/Visualization/UI/SidePanels/SidePanelManager": true
*/
                     };
      if (specials[mid]) return false;
      return /\.js$/.test(filename);
    }
  }
};
