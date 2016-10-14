define([
  "dojo/_base/declare",
  "app/CountryCodes",
  "app/Visualization/UI/FilterEditorBase",
  "app/Visualization/UI/Widgets/FlagSelector",
  "app/Paths"
], function(
  declare,
  CountryCodes,
  FilterEditorBase,
  FlagSelector,
  Paths
){
  return declare("FilterEditorFlagSelector", [FilterEditorBase], {
    startup: function () {
      var self = this;
      self.inherited(arguments);

      var selection = self.animation.data_view.selections.selections.active_category;
      var source = self.animation.data_view.source.header.colsByName[self.sourcename];

      self.select = new FlagSelector({
        choices: Object.keys(source.choices),
        onChange: self.handleSelectionChange.bind(self)
      });
      self.addChild(self.select);

      self.choicesById = {};
      for (var name in source.choices) {
        self.choicesById[source.choices[name]] = name;
      }

      self.setSlectValueFromFilter();
    },
    setSlectValueFromFilter: function () {
      var self = this;
      self.select.set("value", self.getFilter().map(function (value) {
        return self.choicesById[value];
      }));
    },
    handleSelectionChange: function () {
      var self = this;
      var source = self.animation.data_view.source.header.colsByName[self.sourcename];
      var success = self.setFilter(
        self.select.get('value').map(function (key) {
          return source.choices[key];
        })
      );
      if (!success) {
        self.setSlectValueFromFilter();
      }
    },

    Display: declare("Display", [FilterEditorBase.prototype.Display], {
      rangeUpdated: function () {
        var self = this;

        var list = self.getItemList();
        var title = self.noFilterTitle;;
        if (list.length > 0) {
          title = list.map(function (item) {
            return '<img src="' + Paths.img + '/flags/png/' + item.name.toLowerCase() + '.png" alt="' + CountryCodes.codeToName[item.name.toUpperCase()] + '" style="margin: 1px; vertical-align: middle;">';
          }).join("");
        }
        self.containerNode.innerHTML = title;
      }
    })
  });
});
