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
    initialize: function (sidePanels) {
      var self = this;

      self.sidePanels = sidePanels;

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
          self.sidePanels.ui.visualization.data.zoomTo(self.sidePanels.ui.visualization.data.bounds);
        }
      }));
      $(widget.domNode).append("<span class='value' style='float: right;'>");
      $(widget.domNode).find('.value').html(BaseTiledFormat.prototype.tilesPerScreen);
      self.ui.addChild(widget);

      $(self.sidePanels.ui.visualization.animations.stats.domElement).css({
        position: 'initial',
        margin: '5pt'
      });
      $(self.ui.domNode).append(self.sidePanels.ui.visualization.animations.stats.domElement);

      $(self.ui.domNode).append("<pre class='source-stats'>");

      self.sidePanels.sidebarContainer.addChild(self.ui);
      self.sidePanels.sidebarContainer.layout();

      var updater = undefined;
      self,visualization.data.events.on({
        update: function () {
          if (updater == undefined) {
            updater = setTimeout(function () {
              $(self.ui.domNode).find('.source-stats').text(self.sidePanels.ui.visualization.data.printTree());
              updater = undefined;
            });
          }
        }
      });
    }
  });
});
