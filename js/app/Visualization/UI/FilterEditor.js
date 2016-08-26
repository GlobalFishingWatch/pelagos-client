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
    labelAttr: "name",
    labelType: "text",
    contentTemplate: '<div>' + 
                     '  <div>Type the filters below:</div>' +
                     '  <div' +
                     '   data-dojo-type="FilteringMultiSelect"' +
                     '   data-dojo-attach-point="select"' +
                     '   data-dojo-attach-event="onChange:handleSelectionChange,onFocus:handleFocus"></div>' +
                     '</div>',
    startup: function () {
      var self = this;
      self.inherited(arguments);

      ['searchAttr', 'labelAttr', 'labelType'].map(function (attr) {
        self.select.set(attr, self.get(attr));
      });
      self.select.set("store", self.getStore());
      self.select._select.on("click", self.handleFocus.bind(self));
      self.setSlectValueFromFilter();
    },
    getStore: function () {
      var self = this;
      return new Memory({data: self.getItemList()});
    },
    setSlectValueFromFilter: function () {
      var self = this;
      self.select.set("value", self.getFilter());
    },
    handleFocus: function () {
      var self = this;
      self.select._select.loadAndOpenDropDown();
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
