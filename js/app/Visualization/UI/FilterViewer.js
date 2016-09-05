define([
  "dojo/_base/declare",
  "dojo/html",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/UI/SidePanels/AnimationListBase",
  "app/Visualization/UI/FilterEditor"
], function(
  declare,
  html,
  domStyle,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  AnimationListBase,
  FilterEditor
){
  var FilterViewer = declare("FilterViewer", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    baseClass: 'Filters-Filter',
    templateString: '<div>' +
                    '  <span class="${baseClass}-sourcename" data-dojo-attach-point="sourceNameNode"></span>:' +
                    '  <span class="${baseClass}-selection" data-dojo-attach-point="selectionNode"></span>' +
                    '  <span class="${baseClass}-actions"><i class="fa fa-cog" data-dojo-attach-event="click:edit"></i></span>' +
                    '</div>',
    animation: null,
    selection_name: null,
    startup: function () {
      var self = this;
      self.inherited(arguments);
      self.display = new (
        FilterEditor.getEditorClass(
          self.animation.data_view, self.getSourceName()
        ).prototype.Display
      )({
        animation: self.animation,
        sourcename: self.getSourceName()
      });
      self.display.placeAt(self.selectionNode);
      self.display.startup();
      html.set(self.sourceNameNode, self.getSourceName());
    },
    getSelection: function () {
      var self = this;
      return self.animation.data_view.selections.selections[self.selection_name];
    },
    getSourceName: function () {
      var self = this;
      return self.getSelection().sortcols[0];
    },
    edit: function () {
      var self = this;
      new (
        FilterEditor.getEditorClass(self.animation.data_view, self.getSourceName())
      )({
        animation: self.animation,
        sourcename: self.getSourceName()
      }).show();
    }
  });

  FilterViewer.filteredSelections = function (animation) {
    return Object.items(
      animation.data_view.selections.selections
    ).filter(function (item) {
      var selection = item.value;
      var selection_name = item.key;
      return (   !selection.hidden
              && selection.sortcols.length == 1
              && selection.sortcols[0]
              && animation.data_view.source.header.colsByName[selection.sortcols[0]].choices);
    }).map(function (item) {
      return item.key;
    });
  };

  return FilterViewer;
});
