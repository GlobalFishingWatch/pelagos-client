define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "dijit/layout/_ContentPaneResizeMixin"
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  _ContentPaneResizeMixin
){
  return declare("SidePanelBase", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container, _ContentPaneResizeMixin], {
  });
});
