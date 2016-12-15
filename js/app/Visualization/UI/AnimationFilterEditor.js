define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/UI/FilterViewer",
  "shims/jQuery/main"
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  FilterViewer,
  $
){
  return declare("AnimationFilterEditor", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    baseClass: 'AnimationFilterEditor',
    animation: null,
    templateString: '<div data-dojo-attach-point="containerNode"></div>',
    startup: function () {
      var self = this;
      self.inherited(arguments);

      var selections = self.animation.data_view.selections.filteredSelections();
      selections.map(function (selection_name) {
        self.addChild(new FilterViewer({
          animation: self.animation,
          selection_name: selection_name
        }));
      });
    }
  });
});
