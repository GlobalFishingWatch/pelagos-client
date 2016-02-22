define([
  "dojo/_base/declare",
//  "app/Visualization/UI/TemplatedContainer",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "dijit/layout/_ContentPaneResizeMixin"
], function(
  declare,
//  TemplatedContainer,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  _ContentPaneResizeMixin
){
  return declare("SidePanelBase", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container, _ContentPaneResizeMixin], {
    templateString: '<div class="${baseClass}" style="overflow: auto;">' +
                    '  <div class="${baseClass}Container" data-dojo-attach-point="containerNode"></div>' +
                    '</div>'
  });
});
