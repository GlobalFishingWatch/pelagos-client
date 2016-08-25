define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "./TemplatedContainer",
  "dijit/form/Button"
], function(
  declare,
  Dialog,
  TemplatedContainer
){
  return declare("FilterEditorBase", [TemplatedDialog], {
    'class': 'filter-editor-dialog',
    animation: null,
    sourcename: null,
    contentTemplate: '',
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
    getFilter: function () {
      var self = this;
      var selection = self.animation.data_view.selections.selections.active_category;
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
      var selection = self.animation.data_view.selections.selections.active_category;

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

    Display: declare("Display", [TemplatedContainer], {
      templateString: '' +
        '<div class="${baseClass}" style="display: inline-block;">' +
        '  <div class="${baseClass}Container" data-dojo-attach-point="containerNode"></div>' +
        '</div>',
      noFilterTitle: 'All',
      animation: null,
      sourcename: null,
      startup: function () {
        var self = this;
        self.inherited(arguments);
        var selection = self.animation.data_view.selections.selections.active_category;
        selection.events.on({update: self.rangeUpdated.bind(self)});
        self.rangeUpdated();
      },
      getItemList: function () {
        var self = this;
        var selection = self.animation.data_view.selections.selections.active_category;
        var source = self.animation.data_view.source.header.colsByName[self.sourcename];
        var range = selection.data[self.sourcename];
        var filterChoices;
        if (self.animation.args.colsByName && self.animation.args.colsByName[self.sourcename] && self.animation.args.colsByName[self.sourcename].choices) {
          filterChoices = self.animation.args.colsByName[self.sourcename].choices;
        }

        var title = 'All';
        if (range.length != 2 || range[0] != Number.NEGATIVE_INFINITY || range[1] != Number.POSITIVE_INFINITY) {
          var choicesById = {};
          for (var name in source.choices) {
            if (!filterChoices || filterChoices.findIndex(name)) {
              choicesById[source.choices[name]] = name;
            }
          }

          var res = [];
          for (var i = 0; i < range.length; i+=2) {
            res.push({name: choicesById[range[i]], id:range[i]});
          }
          return res;
        }
        return [];
      },
      rangeUpdated: function () {
        var self = this;

        var list = self.getItemList();
        var title = self.noFilterTitle;;
        if (list.length > 0) {
          title = list.map(function (item) { return item.name; }).join(", ");
        }
        self.containerNode.innerHTML = title;
      }
    })
  });
});
