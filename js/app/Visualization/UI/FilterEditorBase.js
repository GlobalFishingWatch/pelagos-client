define([
  "dojo/_base/declare",
  "dijit/Dialog",
  "dijit/form/Button"
], function(
  declare,
  Dialog
){
  return declare("FilterEditorBase", [Dialog], {
    animation: null,
    sourcename: null,
    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-event="click: clearFilter">Clear filter</button>' +
      '  <button data-dojo-type="dijit/form/Button" type="button" data-dojo-attach-event="click: filterBySelection">Filter by selection</button>' +
      '</div>',
    _setSourcenameAttr: function (sourcename) {
      var self = this;
      self._set("sourcename", sourcename);
      self._updateTitle();
    },
    _setAnimationAttr: function (animation) {
      var self = this;
      self._set("animation", animation);
      self._updateTitle();
    },
    _updateTitle: function () {
      var self = this;
      self.set("title", self.animation.title + ": " + self.sourcename);
    },
    clearFilter: function () {
      var self = this;
      self.setFilter([]);
    },
    filterBySelection: function () {
      var self = this;
      self.onCancel();
    },
    setFilter: function (values) {
      var self = this;
      var selection = self.animation.data_view.selections.selections.active_category;

      selection.clearRanges();
      if (values.length) {
        values.map(function (value) {
          var data = {};
          data[self.sourcename] = value;
          selection.addDataRange(data, data);
        });
      } else {
        var startData = {};
        var endData = {};
        startData[self.sourcename] = Number.NEGATIVE_INFINITY;
        endData[self.sourcename] = Number.POSITIVE_INFINITY;
        selection.addDataRange(startData, endData);
      }
    }
  });
});
