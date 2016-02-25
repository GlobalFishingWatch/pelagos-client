define([
  "dojo/_base/declare",
  "app/CountryCodes",
  "app/Visualization/UI/FilterEditorBase",
  "app/Visualization/UI/Widgets/FlagSelector"
], function(
  declare,
  CountryCodes,
  FilterEditorBase,
  FlagSelector
){
  return declare("FilterEditorFlags", [FilterEditorBase], {
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

      var range = selection.data[self.sourcename];

      var value = [];
      if (range.length != 2 || range[0] != Number.NEGATIVE_INFINITY || range[1] != Number.POSITIVE_INFINITY) {
        var choicesById = {};
        for (var name in source.choices) {
          choicesById[source.choices[name]] = name;
        }

        for (var i = 0; i < range.length; i+=2) {
          value.push(choicesById[range[i]]);
        }
      }

      self.select.set("value", value);
    },
    handleSelectionChange: function () {
      var self = this;
      var source = self.animation.data_view.source.header.colsByName[self.sourcename];
      self.setFilter(
        self.select.get('value').map(function (key) {
          return source.choices[key];
        })
      );
    },

    Display: declare("Display", [FilterEditorBase.prototype.Display], {
      rangeUpdated: function () {
        var self = this;

        var list = self.getItemList();
        var title = self.noFilterTitle;;
        if (list.length > 0) {
          title = list.map(function (item) {
            return '<img src="' + app.dirs.img + '/flags/png/' + item.name.toLowerCase() + '.png" alt="' + CountryCodes.codeToName[item.name.toUpperCase()] + '" style="margin: 1px; vertical-align: middle;">';
          }).join("");
        }
        self.containerNode.innerHTML = title;
      }
    })
  });
});
