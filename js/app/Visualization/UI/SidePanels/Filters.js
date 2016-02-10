define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
], function(
  declare,
  domStyle,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin
){
  var Filters = declare("Filters", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
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

  Filters.AnimationFilters = declare("AnimationFilters", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    templateString: '<div class="${baseClass}">' +
                    '  <h2 data-dojo-attach-point="titleNode">${animation.title}</h2>' +
                    '  <table class="${baseClass}Container" data-dojo-attach-point="containerNode"></table>' +
                    '</div>',

    animation: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      var selection = self.animation.data_view.selections.selections.active_category;
      var name = "active_category";

      Filters.filteredSourceCols(self.animation).map(function (sourcename) {
        var source = self.animation.data_view.source.header.colsByName[sourcename];

        self.addChild(new Filters.Filter({
          animation: self.animation,
          sourcename: sourcename,
          source: source
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
    templateString: '<tr>' +
                    '  <th>${sourcename}</th>' +
                    '  <td data-dojo-attach-point="selectionNode"></td>' +
                    '  <td><i class="fa fa-cog" data-dojo-attach-point="selectionNode"></i></td>' +
                    '</tr>',
    animation: null,
    sourcename: null,
    source: null,
    startup: function () {
      var self = this;
      self.inherited(arguments);
    }
  });

  return Filters;
});
