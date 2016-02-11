define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/UI/FilterEditor",
  "app/Visualization/UI/FilterEditorFlags"
], function(
  declare,
  domStyle,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  FilterEditor,
  FilterEditorFlags
){
  var Filters = declare("Filters", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    baseClass: 'Filters',
    templateString: '<div class="${baseClass}">' +
                    '  <div class="${baseClass}Container" data-dojo-attach-point="containerNode"></div>' +
                    '</div>',
    title: 'Filters',
    startup: function () {
      var self = this;
      self.inherited(arguments);
      var parent = self.getParent();

      self.animationFilters = {};
      parent.visualization.animations.events.on({
        'add': self.addHandler.bind(self),
        'remove': self.removeHandler.bind(self)
      });
    },

    addHandler: function (event) {
      var self = this;
      var animation = event.animation;

      if (Filters.filteredSourceCols(animation).length > 0) {
        self.animationFilters[animation.id] = new Filters.AnimationFilters({
          animation: animation
        });
        self.addChild(self.animationFilters[animation.id]);
      }
    },

    removeHandler: function (event) {
      var self = this;
      var animation = event.animation;

      if (self.animationFilters[animation.id]) {
        self.removeChild(self.animationFilters[animation.id]);
        delete self.animationFilters[animation.id];
      }
    }
  });

  Filters.AnimationFilters = declare("AnimationFilters", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    baseClass: 'Filters-AnimationFilters',
    templateString: '<div class="${baseClass}">' +
                    '  <h2 data-dojo-attach-point="titleNode">${animation.title}</h2>' +
                    '  <table class="${baseClass}Container" data-dojo-attach-point="containerNode" style="width: 100%;"></table>' +
                    '</div>',

    animation: null,

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

  Filters.filteredSourceCols = function (animation) {
    if (!animation.data_view || !animation.data_view.selections.selections.active_category) return [];
    var selection = animation.data_view.selections.selections.active_category;
    if (selection.hidden || selection.sortcols.length == 0) return [];

    return selection.sortcols.filter(function (sourcename) {
      var source = animation.data_view.source.header.colsByName[sourcename];
      return source && source.choices;
    });
  };

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
