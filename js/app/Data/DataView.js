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

      self.lastUpdate = undefined;
      self.updateInterval = setInterval(self.performUpdate.bind(self), 500);
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
          self.handleUpdate(e);
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

      self.lastUpdate = update;
    },

    updateSeries: function() {
      var self = this;
      var header = self.source.header;
      var data = self.source.data;

      // For convenience we store POINT_COUNT in an element at the end
      // of the array, so that the length of each series is
      // series[i+1]-series[i].
      self.series = new Int32Array(Math.max(2, self.source.seriescount + 1));
      self.series[0] = 0;
      self.series[self.series.length - 1] = header.length;

      self.lastSeries = function () {}; // Value we will never find in the data
      self.seriescount = 0;
      if (data.series) {
        for (var rowidx = 0; rowidx < header.length; rowidx++) {
          var series = data.series[rowidx];
          if (self.lastSeries != series) {
            self.seriescount++;
            self.lastSeries = series;
          }
          self.series[self.seriescount] = rowidx + 1;
        }
      }
      self.seriescount = Math.max(self.seriescount, 1);
    },

    performUpdate: function (update) {
      var self = this;

      if (!self.lastUpdate) return;
      var lastUpdate = self.lastUpdate;
      self.lastUpdate = undefined;

      self.header.length = self.source.header.length;
      self.seriescount = self.source.seriescount;

      self.updateSeries();

      lastUpdate.json = self.toJSON();
      lastUpdate.string = self.toString();
      lastUpdate.header = self.header;

      self.events.triggerEvent(lastUpdate.update, lastUpdate);
      self.events.triggerEvent("update", lastUpdate);
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
      self.events.triggerEvent('update', e);
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

    useData: function (fn) {
      var self = this;
      if (app.worker) {
        app.worker.withDataset('data', fn);
      } else {
        fn(self.data, function () {});
      }
    },

    useSeries: function (fn) {
      var self = this;
      if (app.worker) {
        app.worker.withDataset('series', fn);
      } else {
        fn(self.series || [], function () {});
      }
    },

    useHeader: function (fn) {
      var self = this;
      fn(self.header, function () {});
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