define([
  "dojo/_base/declare",
  "app/Visualization/UI/SidePanels/SimpleLayerList"
], function(
  declare,
  SimpleLayerList
){
  return declare("CategorizedLayerList", [SimpleLayerList], {
    category: undefined,

    startup: function () {
      var self = this;
      self.categoryWidgets = {};
      if (self.category) {
        self.title = self.category;
      }
      self.inherited(arguments);
    },

    animationFilter: function (animation) {
      var self = this;
      return animation.args.category === self.category;
    },

    addHandler: function (event) {
      var self = this;
      self.inherited(arguments);
      if (self.category === undefined) {
        self.updateCategoryWidgets();
      }
    },

    updatedHandler: function () {
      var self = this;
      self.inherited(arguments);
      if (self.category === undefined) {
        self.updateCategoryWidgets();
      }
    },

    removeHandler: function(event) {
      var self = this;
      self.inherited(arguments);
      if (self.category === undefined) {
        self.updateCategoryWidgets();
      }
    },

    updateCategoryWidgets: function () {
      var self = this;
      var categories = {};
      self.visualization.animations.animations.map(function (animation) {
        if (animation.args.category !== undefined) {
          categories[animation.args.category] = true;
        }
      });

      var updated = false;
      for (var category in self.categoryWidgets) {
        if (!categories[category]) {
          self.categoryWidgets[category].destroyRecursive();
          delete self.categoryWidgets[category];
          updated = true;
        }
      }
      for (var category in categories) {
        if (!self.categoryWidgets[category]) {
          self.categoryWidgets[category] = new (self.constructor)({
            visualization: self.visualization,
            category: category
          });
          self.categoryWidgets[category].startup();
          updated = true;
        }
      }
      if (updated) {
        self.visualization.ui.sideBar.tabs = self.visualization.ui.sideBar.tabs.filter(function (tab) {
          return tab === self || tab.constructor !== self.constructor;
        });

        var categories = Object.keys(self.categoryWidgets);
        categories.sort();

        self.visualization.ui.sideBar.tabs.splice.apply(
          self.visualization.ui.sideBar.tabs,
          [self.visualization.ui.sideBar.tabs.indexOf(self) + 1, 0
          ].concat(categories.map(function (category) {
            return self.categoryWidgets[category];
          }))
        );

        self.visualization.ui.sideBar.setTabs();
      }
    }
  });
});
