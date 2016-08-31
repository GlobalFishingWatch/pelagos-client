define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/UI/SidePanels/AnimationListBase",
  "app/Visualization/UI/FilterEditor",
  "app/Visualization/UI/FilterViewer"
], function(
  declare,
  domStyle,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  AnimationListBase,
  FilterEditor,
  FilterViewer
){
  var Filters = declare("Filters", [AnimationListBase], {
    baseClass: 'Filters',
    title: 'Filters',

    animationFilter: function (animation) {
      var self = this;
      return FilterViewer.filteredSelections(animation).length > 0;
    },

    EmptyWidget: declare("EmptyWidget", [AnimationListBase.prototype.EmptyWidget], {
      baseClass: 'Filters-EmptyWidget',
      templateString: '' +
        '<div class="${baseClass}" style="padding: 8px;">' +
        '  <em>The current workspace has no filterable animations.<em>' +
        '</div>'
    })
  });

  Filters.AnimationWidget = declare("AnimationFilters", [AnimationListBase.AnimationWidget], {
    baseClass: 'Filters-AnimationFilters',

    startup: function () {
      var self = this;
      self.inherited(arguments);
      FilterViewer.filteredSelections(self.animation).map(function (selection_name) {
        self.addChild(new Filters.Filter({
          animation: self.animation,
          selection_name: selection_name
        }));
      });
    }
  });

  Filters.Filter = declare("Filter", [FilterViewer], {
    templateString: '<tr>' +
                    '  <th class="${baseClass}-sourcename" data-dojo-attach-point="sourceNameNode"></th>' +
                    '  <td class="${baseClass}-selection" data-dojo-attach-point="selectionNode"></td>' +
                    '  <td class="${baseClass}-actions"><i class="fa fa-cog" data-dojo-attach-event="click:edit"></i></td>' +
                    '</tr>'
  });

  return Filters;
});
