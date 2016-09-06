define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "app/Data/BaseTiledFormat",
  "app/Visualization/UI/SidePanels/SidePanelBase",
  "app/Visualization/UI/TemplatedContainer",
  "app/Visualization/UI/DataQualityLevel",
  "shims/jQuery/main"
], function(
  declare,
  domStyle,
  BaseTiledFormat,
  SidePanelBase,
  TemplatedContainer,
  DataQualityLevel,
  $
){
  var DataUI = declare("DataUI", [SidePanelBase], {
    baseClass: 'DataUI',
    title: 'Data',
    advanced: true,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.dataQualityLevel = new DataQualityLevel({
        visualization: self.visualization
      });
      self.addChild(self.dataQualityLevel);

      self.stats = new self.constructor.Stats({
        visualization: self.visualization
      });
      self.addChild(self.stats);

      self.tileList = new self.constructor.TileList({
        visualization: self.visualization
      });
      self.addChild(self.tileList);
    }
  });

  DataUI.Stats = declare("Stats", [TemplatedContainer], {
    visualization: null,
    baseClass: 'Stats',
    startup: function () {
      var self = this;
      self.inherited(arguments);

      $(self.visualization.animations.stats.domElement).css({
        position: 'initial',
        margin: '5pt'
      });
      $(self.containerNode).append(self.visualization.animations.stats.domElement);
    }
  });

  DataUI.TileList = declare("TileList", [TemplatedContainer], {
    templateString: '<pre class="${baseClass}"></pre>',
    visualization: null,
    baseClass: 'TileList',
    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.visualization.data.events.on({
        update: self.update.bind(self)
      });
    },

    update: function () {
      var self = this;
      if (self.updater == undefined) {
        self.updater = setTimeout(function () {
          self.domNode.innerHTML = self.visualization.data.printTree();
          self.updater = undefined;
        });
      }
    }
  });

  return DataUI;
});
