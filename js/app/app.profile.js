profile = {
  basePath: ".",
  resourceTags: {
    amd: function(filename, mid) {
      var specials = {"app/Condition": true,
                      "app/Visualization/AnimationManagerUI": true,
                      "app/Visualization/DataViewUI": true,
                      "app/Visualization/InfoUI": true,
                      "app/Visualization/LoggingUI": true,
                      "app/Visualization/DojoUI": true,
                      "app/Visualization/SidePanels/AnimationManagerUI": true,
                      "app/Visualization/SidePanels/DataUI": true,
                      "app/Visualization/SidePanels/DataViewUI": true,
                      "app/Visualization/SidePanels/InfoUI": true,
                      "app/Visualization/SidePanels/LoggingUI": true,
                      "app/Visualization/SidePanels/SidePanelManager": true
                     };
      if (specials[mid]) return false;
      return /\.js$/.test(filename);
    }
  }
};
