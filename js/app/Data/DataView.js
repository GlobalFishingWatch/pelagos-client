define(["app/Class", "app/Data/Format", "app/Data/Selection", "app/Data/Pack", "app/Data/GeoProjection", "lodash"], function(Class, Format, Selection, Pack, GeoProjection, _) {
  return Class(Format, {
    name: "DataView",

    /* This specification can be overridden by a parameter to the
     * constructor.
     *
     * After initialization, self.header.colsByName will contain this
     * information, plus:
     *
     * For each column = self.header.colsByNam.COLUMNNAME:
     *   column.typespec = Pack.typemap.byname[column.type]
     *   For each item index i:
     *     column.items[i].index = i
     *     column.itemsByName[column.items[i].name] = column.items[i]
     */

    columns: {},

    initialize: function (source, args) {
      var self = this;

      Format.prototype.initialize.call(self)
      self.source = source;

      if (args) _.extend(self, args);

      self.selections = {};

      self.source.events.on({
        update: self.handleUpdate,
        error: self.handleError,
        scope: self
      });

      Object.items(self.columns).map(function (col) {
        var value = _.cloneDeep(col.value);
        value.name = col.key;
        self.addCol(value);
      });

      if (args.selections) {
        Object.items(args.selections).map(function (selection) {
          self.addSelectionCategory(selection.key, selection.value);
        });
      } else {
        self.addSelectionCategory("selected");
        self.addSelectionCategory("info");
        self.addSelectionCategory("hover");
      }
/*
      self.lastUpdate = undefined;
      self.updateInterval = setInterval(self.performUpdate.bind(self), 500);
*/
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
          e.update = "selection-" + e.update;
          self.events.triggerEvent(e.update, e);
          self.events.triggerEvent("view-update", e);
        }
      });
    },

    addSelectionRange: function (type, startidx, endidx, replace) {
      var self = this;
      if (!self.selections[type]) return;
      self.selections[type].addRange(self.source, startidx, endidx, replace);
      self.events.triggerEvent('spec-update', {json: self.toJSON(), string: self.toString()});
    },

    getSelectionInfo: function (name, cb) {
      var self = this;
      self.source.getSelectionInfo(self.selections[name], cb);
    },

    handleUpdate: function (update) {
      var self = this;

      self.header.length = self.source.header.length;
      self.seriescount = self.source.seriescount;

      update.json = self.toJSON();
      update.string = self.toString();
      update.header = self.header;

      self.events.triggerEvent(update.update, update);
      self.events.triggerEvent("update", update);
    },

    handleError: function (error) {
      var self = this;
      self.events.triggerEvent("error", error);
    },

    _changeCol: function(update, spec) {
      var self = this;
      spec = _.clone(spec);
      spec.typespec = Pack.typemap.byname[spec.type];

      self.header.colsByName[spec.name] = spec;

      var e = {
        update: update,
        name: spec.name,
        json: self.toJSON(),
        header: self.header,
        string: self.toString()
      };
      self.events.triggerEvent(e.update, e);
      self.events.triggerEvent('view-update', e);
    },

    addCol: function(spec) {
      var self = this;
      self._changeCol("add-col", spec);
    },

    changeCol: function(spec) {
      var self = this;
      self._changeCol("change-col", spec);
    },

    removeCol: function(name) {
      var self = this;

      self.useData(function (data, cb) {
        delete self.header.colsByName[name];
        delete data[name];

        var e = {
          update: 'remove-col',
          name: spec.name,
          json: self.toJSON,
          header: self.header,
          string: self.toString()
        };
        self.events.triggerEvent(e.update, e);
        self.events.triggerEvent('update', e);
        cb();
      });
    },

    getAvailableColumns: function (cb) {
      var self = this;

      cb(
        null,
        Object.keys(self.source.header.colsByName).concat(
          Object.keys(self.selections)));
    },

    load: function () {
      var self = this;
      self.source.load();
    },

    toJSON: function () {
      var self = this;
      var cols = _.cloneDeep(self.header.colsByName);
      for (var name in cols) {
        delete cols[name].typespec;
      }
      return {
        columns: cols,
        selections: self.selections
      };
    },

    toString: function () {
      var self = this;

      return self.source.toString();
    }
  });
});