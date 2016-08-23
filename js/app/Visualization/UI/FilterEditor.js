define([
  "dojo/_base/declare",
  "app/Visualization/UI/FilterEditorBase",
  "./Widgets/FilteringMultiSelect",
  "dojo/store/Memory"
], function(
  declare,
  FilterEditorBase,
  FilteringMultiSelect,
  Memory
){
  return declare("FilterEditor", [FilterEditorBase], {
    searchAttr: "name",
    labelAttr: "label",
    labelType: "text",
    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.select = new FilteringMultiSelect({
          value: [],
          store: self.getStore(),
          searchAttr: self.get("searchAttr"),
          labelAttr: self.get("labelAttr"),
          labelType: self.get("labelType"),
          style: 'width: 100%;',
          onChange: self.handleSelectionChange.bind(self)
      });
      self.addChild(self.select);
      self.setSlectValueFromFilter();
    },
    getStore: function () {
      var self = this;
      var source = self.animation.data_view.source.header.colsByName[self.sourcename];

      var names = Object.keys(source.choices);
      names.sort();
      var data = names.map(function (name) {
        var value = source.choices[name];
        return {id: value, name: name, label: name};
      });
      return new Memory({data: data});
    },
    setSlectValueFromFilter: function () {
      var self = this;
      self.select.set("value", self.getFilter());
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
