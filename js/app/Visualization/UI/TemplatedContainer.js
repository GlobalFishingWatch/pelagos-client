define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container"
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container
){
  return declare("TemplatedContainer", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    templateString: '<div class="${baseClass}">' +
                    '  <div class="${baseClass}Container" data-dojo-attach-point="containerNode"></div>' +
                    '</div>'
  });
});
