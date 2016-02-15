define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/UI/SidePanels/AnimationListBase",
  "app/Visualization/UI/FilterEditor",
  "app/Visualization/UI/FilterEditorFlags"
], function(
  declare,
  domStyle,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  AnimationListBase,
  FilterEditor,
  FilterEditorFlags
){
  var Filters = declare("Filters", [AnimationListBase], {
    baseClass: 'Filters',
    title: 'Filters',

    animationFilter: function (animation) {
      var self = this;
      return self.constructor.filteredSourceCols(animation).length > 0;
    }
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
          sourcename: sourcename,
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
      selection.events.on({update: self.rangeUpdated.bind(self)});
      self.rangeUpdated();
    },
    rangeUpdated: function () {
      var self = this;
      var selection = self.animation.data_view.selections.selections.active_category;
      var source = self.animation.data_view.source.header.colsByName[self.sourcename];
      var range = selection.data[self.sourcename];

      var title = 'All';
      if (range.length != 2 || range[0] != Number.NEGATIVE_INFINITY || range[1] != Number.POSITIVE_INFINITY) {
        var choicesById = {};
        for (var name in source.choices) {
          choicesById[source.choices[name]] = name;
        }

        var names = [];
        for (var i = 0; i < range.length; i+=2) {
          names.push(choicesById[range[i]]);
        }
        title = names.join(", ");
      }
      self.selectionNode.innerHTML = title;
    },
    edit: function () {
      var self = this;
      var source = self.animation.data_view.source.header.colsByName[self.sourcename];

      var cls = FilterEditor;
      if (source.choices_type == 'ISO 3166-1 alpha-2') {
        cls = FilterEditorFlags;
      }
      new cls({animation: self.animation, sourcename: self.sourcename}).show();
    }
  });

  return Filters;
});
