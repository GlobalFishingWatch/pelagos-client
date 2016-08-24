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
    contentTemplate: '<div>' + 
                     '  <div>Type the filters below:</div>' +
                     '  <div' +
                     '   data-dojo-type="FilteringMultiSelect"' +
                     '   data-dojo-attach-point="select"' +
                     '   data-dojo-attach-event="onChange:handleSelectionChange"' +
                     '   style="width: 100%;"></div>' +
                     '</div>',
    startup: function () {
      var self = this;
      self.inherited(arguments);

      ['searchAttr', 'labelAttr', 'labelType'].map(function (attr) {
        self.select.set(attr, self.get(attr));
      });
      self.select.set("store", self.getStore());
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
