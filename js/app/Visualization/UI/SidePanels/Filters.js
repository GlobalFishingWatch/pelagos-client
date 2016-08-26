define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/UI/SidePanels/AnimationListBase",
  "app/Visualization/UI/FilterEditor"
], function(
  declare,
  domStyle,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  AnimationListBase,
  FilterEditor
){
  var Filters = declare("Filters", [AnimationListBase], {
    baseClass: 'Filters',
    title: 'Filters',

    animationFilter: function (animation) {
      var self = this;
      return self.constructor.filteredSourceCols(animation).length > 0;
    },

    EmptyWidget: declare("EmptyWidget", [AnimationListBase.prototype.EmptyWidget], {
      baseClass: 'Filters-EmptyWidget',
      templateString: '' +
        '<div class="${baseClass}" style="padding: 8px;">' +
        '  <em>The current workspace has no filterable animations.<em>' +
        '</div>'
    })
  });

  Filters.filteredSourceCols = function (animation) {
    if (!animation.data_view || !animation.data_view.selections.selections.active_category) return [];
    var selection = animation.data_view.selections.selections.active_category;
    if (selection.hidden || selection.sortcols.length == 0) return [];

    return selection.sortcols.filter(function (sourcename) {
      var source = animation.data_view.source.header.colsByName[sourcename];
      return source && source.choices;
    });
  };

  Filters.AnimationWidget = declare("AnimationFilters", [AnimationListBase.AnimationWidget], {
    baseClass: 'Filters-AnimationFilters',

    startup: function () {
      var self = this;
      self.inherited(arguments);
      Filters.filteredSourceCols(self.animation).map(function (sourcename) {
        self.addChild(new Filters.Filter({
          animation: self.animation,
          sourcename: sourcename
        }));
      });
    }
  });

  Filters.Filter = declare("Filter", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    baseClass: 'Filters-Filter',
    templateString: '<tr>' +
                    '  <th class="${baseClass}-sourcename">${sourcename}</th>' +
                    '  <td class="${baseClass}-selection" data-dojo-attach-point="selectionNode"></td>' +
                    '  <td class="${baseClass}-actions"><i class="fa fa-cog" data-dojo-attach-event="click:edit"></i></td>' +
                    '</tr>',
    animation: null,
    sourcename: null,
    startup: function () {
      var self = this;
      self.inherited(arguments);
      var selection = self.animation.data_view.selections.selections.active_category;
      self.display = new (
        FilterEditor.getEditorClass(
          self.animation.data_view, self.sourcename
        ).prototype.Display
      )({
        animation: self.animation,
        sourcename: self.sourcename
      });
      self.display.placeAt(self.selectionNode);
      self.display.startup();
    },
    edit: function () {
      var self = this;
      new (
        FilterEditor.getEditorClass(self.animation.data_view, self.sourcename)
      )({
        animation: self.animation,
        sourcename: self.sourcename
      }).show();
    }
  });

  return Filters;
});
