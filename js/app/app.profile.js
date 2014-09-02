profile = {
  basePath: ".",
  resourceTags: {
    amd: function(filename, mid) {
      var specials = {"app/Condition": true,
                      "app/Visualization/AnimationManagerUI": true,
                      "app/Visualization/DataViewUI": true,
                      "app/Visualization/InfoUI": true,
                      "app/Visualization/LoggingUI": true,
                      "app/Visualization/SidePanels": true};
      if (specials[mid]) return false;
      return /\.js$/.test(filename);
    }
  }
};
