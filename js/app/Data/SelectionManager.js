define([
  "app/Class",
  "app/Events",
  "app/Data/Selection",
  "shims/lodash/main"
], function(
  Class,
  Events,
  Selection,
  _
) {
  return Class({
    name: "SelectionManager",

    initialize: function (source, args) {
      var self = this;

      self.events = new Events("Data.Format");

      self.source = source;

      self.args = args;
      if (args) _.extend(self, args);

      self.selections = {};

      Object.items(args.selections || {}).map(function (selection) {
        self.addSelectionCategory(selection.key, selection.value);
      });
    },

    addSelectionCategory: function (name, args) {
      var self = this;
      args = _.clone(args || {});
      if (!args.sortcols) args.sortcols = self.source.sortcols.slice(0, 1);
      self.selections[name] = new Selection(args);
      self.selections[name].events.on({
        update: function (e) {
          e = _.clone(e);
          e.category = name;
          self.events.triggerEvent(e.update, e);
          self.events.triggerEvent("update", e);
        }
      });
    },

    addSelectionRange: function (type, startidx, endidx, replace) {
      var self = this;
      if (!self.selections[type]) return;
      self.selections[type].addRange(self.source, startidx, endidx, replace);
      self.events.triggerEvent('update', {update: 'range', category: type});
    },

    retriggerSelectionEvents: function () {
      var self = this;
      Object.values(self.selections).map(function (selection) {
        selection.retriggerSelectionEvent();
      });
    },

    getSelectionInfo: function (name, cb) {
      var self = this;
      if (self.source.getSelectionInfo) {
        self.source.getSelectionInfo(self.selections[name], cb);
      } else {
        cb("No selection information available for " + self.source.toString());
      }
    },

    toJSON: function () {
      var self = this;
      var res = {};
      for (var key in self.selections) {
        res[key] = self.selections[key].toJSON();
      }
      return res;
    }

  });
});

