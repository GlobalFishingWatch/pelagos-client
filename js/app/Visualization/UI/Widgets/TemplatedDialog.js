define([
  "dojo/_base/declare",
  "dijit/Dialog",
  "dijit/_WidgetsInTemplateMixin"
], function(
  declare,
  Dialog,
  _WidgetsInTemplateMixin
){
  return declare("TemplatedDialog", [Dialog, _WidgetsInTemplateMixin], {});
});
