define([
  "dojo/_base/declare",
  "app/Visualization/UI/FilterEditorBase",
  "dijit/form/MultiSelect",
  "dojo/dom-construct",
  "dijit/form/Button"
], function(
  declare,
  FilterEditorBase,
  MultiSelect,
  domConstruct
){
  return declare("FilterEditor", [FilterEditorBase], {
    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.select = new MultiSelect({
        style: 'min-height: 200px; height: 100%; width: 100%;',
        onChange: self.handleSelectionChange.bind(self)
      });
      self.addChild(self.select);

      var source = self.animation.data_view.source.header.colsByName[self.sourcename];

      var names = Object.keys(source.choices);
      names.sort();
      names.map(function (name) {
        var value = source.choices[name];

        domConstruct.place('<option value="' + value + '">' + name + '</option>', self.select.domNode);
      });
      self.setSlectValueFromFilter();
    },
    setSlectValueFromFilter: function () {
      var self = this;
      var selection = self.animation.data_view.selections.selections.active_category;
      self.select.set("value", selection.data[self.sourcename]);
    },
    handleSelectionChange: function () {
      var self = this;
      var success = self.setFilter(
        self.select.get('value').map(function (x) {
          return parseInt(x);
        })
      );
      if (!success) {
        self.setSlectValueFromFilter();
      }
    }
  });
});
