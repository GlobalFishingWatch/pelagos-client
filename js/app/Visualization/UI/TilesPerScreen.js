define([
  "dojo/_base/declare",
  "app/Data/BaseTiledFormat",
  "app/Visualization/UI/TemplatedContainer",
  "dijit/form/HorizontalSlider",
  "shims/jQuery/main"
], function(
  declare,
  BaseTiledFormat,
  TemplatedContainer,
  HorizontalSlider,
  $
){
  return declare("TilesPerScreen", [TemplatedContainer], {
    baseClass: 'TilesPerScreen',
    templateString: '' +
      '<div class="${baseClass}" style="overflow: auto;">' +
      '  <div>Data resolution:</div>' +
      '  <div><span class="${baseClass}Container" data-dojo-attach-point="containerNode"></span></div>' +
      '  <div><span class="value" data-dojo-attach-point="valueNode"></span> tiles per screen</div>' +
      '</div>',
    visualization: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);
      var value = BaseTiledFormat.prototype.tilesPerScreen;

      self.addChild(new HorizontalSlider({
        "class": "pull-right",
        value: value,
        minimum: 4,
        maximum: 128,
        intermediateChanges: false,
        onChange: self.change.bind(self)
      }));
      self.valueNode.innerHTML = value.toPrecision(3);
    },

    change: function (value) {
      var self = this;

      value = Math.round(value);
      self.valueNode.innerHTML = value.toPrecision(3);
      BaseTiledFormat.prototype.tilesPerScreen = value;
      self.visualization.data.zoomTo(self.visualization.data.bounds);
    }
  });
});
