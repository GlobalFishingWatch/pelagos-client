define([
  "dojo/_base/declare",
  "app/CountryCodes",
  "app/Visualization/UI/FilterEditorText",
  "dojo/store/Memory",
  "app/Paths"
], function(
  declare,
  CountryCodes,
  FilterEditorText,
  Memory,
  Paths
){
  return declare("FilterEditor", [FilterEditorText], {
    labelAttr: "label",
    labelType: "html",
    getStore: function () {
      var self = this;

      var data = self.getItemList();
      data.map(function (item) {
        var code = item.name;
        item.name = CountryCodes.codeToName[code.toUpperCase()];
        item.label = '<img src="' + Paths.img + '/flags/png/' + code.toLowerCase() + '.png" style="margin: 1px; vertical-align: middle;"> ' + item.name;
      });
      return new Memory({data: data});
    },
    Display: declare("Display", [FilterEditorText.prototype.Display], {
      rangeUpdated: function () {
        var self = this;

        var list = self.getSelectedItemList();
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
