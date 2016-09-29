define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "./TemplatedContainer",
  "dijit/_WidgetBase",
  "dijit/form/Button"
], function(
  declare,
  Dialog,
  TemplatedContainer,
  _WidgetBase
){
  var FilterHandlerMixin = declare("FilterHandlerMixin", null, {
    getItemList: function () {
      var self = this;
      var source = self.animation.data_view.source.header.colsByName[self.sourcename];
      var filterChoices;
      if (self.animation.args.colsByName && self.animation.args.colsByName[self.sourcename] && self.animation.args.colsByName[self.sourcename].choices) {
        filterChoices = self.animation.args.colsByName[self.sourcename].choices;
      }

      var res = [];
      for (var name in source.choices) {
        if (!filterChoices || filterChoices.indexOf(name) != -1) {
          res.push({id: source.choices[name], name: name});
        }
      }

      res.sort(function (a, b) {
        if (a.name < b.name) {
          return -1;
        } else if (a.name == b.name) {
          return 0;
        } else {
          return 1;
        }
      });

      return res;
    },
    getSelectedItemList: function () {
      var self = this;
      var items = self.getItemList();
      var selection = self.animation.data_view.selections.selections[self.selectionname];
      var range = selection.data[self.sourcename];

      return items.filter(function (item) {
        return range.indexOf(item.id) != -1;
      });
    }
  });

  return declare("FilterEditorBase", [TemplatedDialog, FilterHandlerMixin], {
    'class': 'filter-editor-dialog',
    animation: null,
    sourcename: null,
    selectionname: null,
    contentTemplate: '',
    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-event="click: clearFilter">Clear filter</button>' +
      '  <button data-dojo-type="dijit/form/Button" type="button" data-dojo-attach-event="click: filterBySelection">Filter by selection</button>' +
      '</div>',
    _setSelectionnameAttr: function (selectionname) {
      var self = this;
      self._set("selectionname", selectionname);
      self._updateTitle();
    },
    _setAnimationAttr: function (animation) {
      var self = this;
      self._set("animation", animation);
      self._updateTitle();
    },
    _updateTitle: function () {
      var self = this;
      self.set("title", self.animation.title + ": " + self.selectionname);
    },
    clearFilter: function () {
      var self = this;
      self.setFilter([]);
    },
    filterBySelection: function () {
      var self = this;
      self.onCancel();
    },
    getFilter: function () {
      var self = this;
      var selection = self.animation.data_view.selections.selections[self.selectionname];
      var range = selection.data[self.sourcename];

      var value = [];
      if (range.length != 2 || range[0] != Number.NEGATIVE_INFINITY || range[1] != Number.POSITIVE_INFINITY) {
        for (var i = 0; i < range.length; i+=2) {
          value.push(range[i]);
        }
      }
      return value;
    },
    setFilter: function (values) {
      var self = this;
      var selection = self.animation.data_view.selections.selections[self.selectionname];

      if (values.length > selection.max_range_count) {
        alert("You can not select more than " + selection.max_range_count + " flags at the same time.");
        return false;
      }

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
      return true;
    },

  Display: declare("Display", [TemplatedContainer, FilterHandlerMixin], {
    animation: null,
      templateString: '' +
        '<div class="${baseClass}" style="display: inline-block;">' +
        '  <div class="${baseClass}Container" data-dojo-attach-point="containerNode"></div>' +
        '</div>',
      noFilterTitle: 'All',
      sourcename: null,
      selectionname: null,
      startup: function () {
        var self = this;
        self.inherited(arguments);
        var selection = self.animation.data_view.selections.selections[self.selectionname];
        selection.events.on({update: self.rangeUpdated.bind(self)});
        self.rangeUpdated();
      },
      rangeUpdated: function () {
        var self = this;

        var list = self.getSelectedItemList();
        var title = self.noFilterTitle;;
        if (list.length > 0) {
          title = list.map(function (item) { return item.name; }).join(", ");
        }
        self.containerNode.innerHTML = title;
      }
    })
  });
});
