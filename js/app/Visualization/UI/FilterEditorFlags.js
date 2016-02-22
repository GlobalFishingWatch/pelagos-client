define([
  "dojo/_base/declare",
  "app/Visualization/UI/FilterEditorBase",
  "app/Visualization/UI/Widgets/FlagSelector"
], function(
  declare,
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
    }
  });
});
