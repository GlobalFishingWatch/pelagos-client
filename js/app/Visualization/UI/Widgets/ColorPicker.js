define([
  "dojo/_base/declare",
  "dojox/widget/ColorPicker"
], function(
  declare,
  ColorPicker
){
  // Bug workarounds / monkey patches for ColorPicker on mobile devices

  return declare("ColorPicker", [ColorPicker], {
    _setHuePoint: function(evt){
      evt.layerY -= this.hueNode.getBoundingClientRect().top;
      evt.layerX -= this.hueNode.getBoundingClientRect().left;
      return ColorPicker.prototype._setHuePoint.call(this, evt);
    },
    _setPoint: function(evt){
      evt.layerY -= this.colorUnderlay.getBoundingClientRect().top;
      evt.layerX -= this.colorUnderlay.getBoundingClientRect().left;
      return ColorPicker.prototype._setPoint.call(this, evt);
    }
  });
});
