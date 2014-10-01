if (!app.useDojo) {
  define(["app/Class"], function (Class) {
    return Class({name: "DataUI"});
  });
} else {
  define([
    "app/Class",
    "app/Logging",
    "app/Data/BaseTiledFormat",
    "jQuery",
    "dijit/Fieldset",
    "dijit/form/HorizontalSlider",
    "dojox/layout/FloatingPane",
    "dijit/layout/ContentPane",
    "dijit/Menu",
    "dijit/MenuItem",
    "dijit/popup",
    "dojo/dom",
    "dojo/parser",
    "dojo/domReady!"
  ], function(Class, Logging, BaseTiledFormat, $, Fieldset, HorizontalSlider, FloatingPane, ContentPane, Menu, MenuItem, popup){
    return Class({
      name: "DataUI",
      initialize: function (visualization) {
        var self = this;

        self.visualization = visualization;

        self.ui = new ContentPane({title: "Data"});


        var widget = new ContentPane({
          content: "Tiles per screen",
          style: "padding-top: 0; padding-bottom: 8px;"
        });
        widget.addChild(new HorizontalSlider({
          "class": "pull-right",
          value: BaseTiledFormat.prototype.tilesPerScreen,
          minimum: 4,
          maximum: 128,
          intermediateChanges: false,
          style: "width:200px;",
          onChange: function (value) {
            value = Math.round(value);
            $(widget.domNode).find('.value').html(value.toPrecision(3));
            BaseTiledFormat.prototype.tilesPerScreen = value;
            self.visualization.data.zoomTo(self.visualization.data.bounds);
          }
        }));
        $(widget.domNode).append("<span class='value' style='float: right;'>");
        $(widget.domNode).find('.value').html(BaseTiledFormat.prototype.tilesPerScreen);
        self.ui.addChild(widget);

        self.visualization.dojoUI.sidebarContainer.addChild(self.ui);
        self.visualization.dojoUI.container.layout();
      }
    });
  });
}
