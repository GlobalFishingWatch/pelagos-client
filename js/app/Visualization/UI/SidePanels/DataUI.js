define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "app/Data/BaseTiledFormat",
  "app/Visualization/UI/SidePanels/SidePanelBase",
  "app/Visualization/UI/TemplatedContainer",
  "dijit/form/HorizontalSlider",
  "shims/jQuery/main"
], function(
  declare,
  domStyle,
  BaseTiledFormat,
  SidePanelBase,
  TemplatedContainer,
  HorizontalSlider,
  $
){
  var DataUI = declare("DataUI", [SidePanelBase], {
    baseClass: 'DataUI',
    title: 'Data',
    advanced: true,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.tilesPerScreen = new self.constructor.TilesPerScreen({
        visualization: self.visualization
      });
      self.addChild(self.tilesPerScreen);

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

  DataUI.TilesPerScreen = declare("TilesPerScreen", [TemplatedContainer], {
    baseClass: 'TilesPerScreen',
    templateString: '' +
      '<div class="${baseClass}" style="overflow: auto;">' +
      '  Tiles per screen:' +
      '  <span class="${baseClass}Container" data-dojo-attach-point="containerNode"></span>' +
      '  <span class="value" style="float: right;" data-dojo-attach-point="valueNode"></span>' +
      '</div>',
    visualization: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.addChild(new HorizontalSlider({
        "class": "pull-right",
        value: BaseTiledFormat.prototype.tilesPerScreen,
        minimum: 4,
        maximum: 128,
        intermediateChanges: false,
        style: "width:200px;",
        onChange: self.change.bind(self)
      }));
    },

    change: function (value) {
      var self = this;

      value = Math.round(value);
      self.valueNode.innerHTML = value.toPrecision(3);
      BaseTiledFormat.prototype.tilesPerScreen = value;
      self.visualization.data.zoomTo(self.visualization.data.bounds);
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
