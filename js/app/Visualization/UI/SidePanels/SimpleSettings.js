define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "app/Data/BaseTiledFormat",
  "app/Visualization/UI/SidePanels/SidePanelBase",
  "app/Visualization/UI/TemplatedContainer",
  "app/Visualization/UI/TilesPerScreen",
  "shims/jQuery/main"
], function(
  declare,
  domStyle,
  BaseTiledFormat,
  SidePanelBase,
  TemplatedContainer,
  TilesPerScreen,
  $
){
  return declare("SimpleSettings", [SidePanelBase], {
    baseClass: 'SimpleSettings contentWrapper',
    title: 'Settings',
    advanced: false,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.tilesPerScreen = new TilesPerScreen({
        visualization: self.visualization
      });
      self.addChild(self.tilesPerScreen);
    }
  });
});
