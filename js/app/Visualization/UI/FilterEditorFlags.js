define([
  "dojo/_base/declare",
  "app/CountryCodes",
  "app/Visualization/UI/FilterEditor",
    "dojo/store/Memory",
  "app/Visualization/UI/Paths"
], function(
  declare,
  CountryCodes,
  FilterEditor,
  Memory,
  Paths
){
  return declare("FilterEditor", [FilterEditor], {
    labelType: "html",
    getStore: function () {
      var self = this;
      var source = self.animation.data_view.source.header.colsByName[self.sourcename];

      var codes = Object.keys(source.choices);
      codes.sort();
      var data = codes.map(function (code) {
        var value = source.choices[code];
        name = CountryCodes.codeToName[code.toUpperCase()];
        return {
          id: value,
          name: name,
          label: '<img src="' + Paths.img + '/flags/png/' + code.toLowerCase() + '.png" style="margin: 1px; vertical-align: middle;"> ' + name
        };
      });
      return new Memory({data: data});
    },
    Display: declare("Display", [FilterEditor.prototype.Display], {
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
