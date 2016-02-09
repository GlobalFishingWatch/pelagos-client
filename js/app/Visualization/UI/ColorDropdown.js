define([
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_AttachMixin",
  "dijit/popup",
  "dojox/widget/ColorPicker",
  "dijit/form/DropDownButton",
  "dijit/TooltipDialog"
], function(
   domStyle,
   _Widget,
   _Templated,
   _WidgetsInTemplateMixin,
   _AttachMixin,
   popup,
   ColorPicker,
   DropDownButton,
   TooltipDialog
){
  return dojo.declare("ColorDropdown", [_Widget, _Templated, _WidgetsInTemplateMixin, _AttachMixin], {
    title: 'Color',
    templateString: '<div>' +
                    '  <div data-dojo-type="dijit/form/DropDownButton" data-dojo-attach-point="button">' +
                    '    <span>${title}</span>' +
                    '    <div data-dojo-type="dijit/layout/ContentPane" data-dojo-attach-point="dialog" style="background: white;">' +
                    '      <div data-dojo-type="dojox/widget/ColorPicker" data-dojo-attach-point="picker" data-dojo-attach-event="change: change"></div>' +
                    '    </div>' +
                    '  </div>' +
                    '</div>',
    change: function (color) {
      popup.close(this.dialog);
      domStyle.set(this.button.containerNode, 'backgroundColor', color);
    }
  });
});
