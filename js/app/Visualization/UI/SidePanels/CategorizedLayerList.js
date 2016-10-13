define([
  "dojo/_base/declare",
  "app/Visualization/UI/SidePanels/SimpleLayerList",
  "shims/jQuery/main"
], function(
  declare,
  SimpleLayerList,
  $
){
  return declare("CategorizedLayerList", [SimpleLayerList], {
    category: undefined,

    startup: function () {
      var self = this;
      self.categoryWidgets = {};
      if (self.category) {
        self.title = self.category;
      }
      if (!self.categoryManager) {
        self.categoryManager = self;
      }
      self.inherited(arguments);

      if (self.category) {
        $(self.titleEditor.domNode).hide();
        $(self.addLayerRow).hide();
      }
    },

    animationFilter: function (animation) {
      var self = this;
      // Treat empty string as undefined
      if (!animation.args.category && !self.category) return true;
      return animation.args.category === self.category;
    },

    addHandler: function (event) {
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

    updateCategoryWidgets: function (dontAdd) {
      var self = this;
      var categories = {};
      self.visualization.animations.animations.map(function (animation) {
        if (animation.args.category) {
          categories[animation.args.category] = true;
        }
      });

      var toDelete = [];
      var updated = false;
      for (var category in self.categoryWidgets) {
        if (!categories[category]) {
          toDelete.push(self.categoryWidgets[category]);
          delete self.categoryWidgets[category];
          updated = true;
        }
      }
      for (var category in categories) {
        if (!self.categoryWidgets[category]) {
          self.categoryWidgets[category] = new (self.constructor)({
            visualization: self.visualization,
            categoryManager: self,
            category: category
          });
          self.categoryWidgets[category].startup();
          if (!dontAdd) {
            self.visualization.animations.animations.map(function (animation) {
              self.categoryWidgets[category].addHandler({animation: animation});
            });
          }
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

        toDelete.map(function (widget) {
          widget.destroyRecursive();
        });
      }
    },

    AnimationWidget: declare("AnimationWidget", SimpleLayerList.prototype.AnimationWidget, {
      updatedHandler: function () {
        var self = this;
        self.inherited(arguments);

        /* Warning: Infinite recursion will happen if this check
         * doesn't match the filtering in
         * CategorizedLayerList.animationFilter(). */
        if (   self.animation.args.category != self.animationList.category
            && (self.animation.args.category || self.animationList.category)) {
            console.log("MOVING", {anim: self.animation.toString(), from:self.animationList.category, to:self.animation.args.category});

          var categoryManager = self.animationList.categoryManager;
          var animation = self.animation;

          self.animationList.removeHandler({animation: animation});
          self.animationList.categoryManager.updateCategoryWidgets(true);
          var newList = categoryManager;
          if (animation.args.category) {
            newList = categoryManager.categoryWidgets[animation.args.category];
          }
          newList.addHandler({animation: animation});
        }
      }
    })
  });
});
