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

    uniforms: {},

    initialize: function (source, args) {
      var self = this;

      Format.prototype.initialize.call(self)
      self.source = source;

      self.args = args;
      if (args) _.extend(self, args);

      self.selections = {};

      Object.items(args.selections || {}).map(function (selection) {
        self.addSelectionCategory(selection.key, selection.value);
      });

      Object.items(self.columns).map(function (col) {
        var value = _.cloneDeep(col.value);
        value.name = col.key;
        self.addCol(value);
      });

      self.header.uniforms = _.clone(self.uniforms);
      Object.items(self.header.uniforms).map(function (uniform) {
        uniform.value.name = uniform.key;
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
          e.update = "selection-" + e.update;
          self.events.triggerEvent(e.update, e);
          self.events.triggerEvent("update", e);
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
        self.events.triggerEvent('view-update', e);
        cb();
      });
    },

    changeUniform: function (spec) {
      var self = this;
      spec = _.clone(spec);

      self.header.uniforms[spec.name] = spec;

      var e = {
        update: 'change-uniform',
        name: spec.name,
        json: self.toJSON(),
        header: self.header,
        string: self.toString()
      };
      self.events.triggerEvent(e.update, e);
      self.events.triggerEvent('view-update', e);
    },

    getAvailableColumns: function (cb) {
      var self = this;

      cb(
        null,
        Object.items(
          self.source.header.colsByName
        ).filter(function (item) {
          return !item.value.hidden
        }).map(function (item) {
          return item.key;
        }).concat(
          Object.items(
            self.selections
          ).filter(function (item) {
            return !item.value.hidden
          }).map(function (item) {
            return item.key;
          })
        )
      );
    },

    toJSON: function () {
      var self = this;
      var cols = _.cloneDeep(self.header.colsByName);
      for (var name in cols) {
        delete cols[name].typespec;
      }
      return _.extend({}, self.args, {
        columns: cols,
        uniforms: self.uniforms,
        selections: self.selections
      });
    },

    toString: function () {
      var self = this;

      return self.source.toString();
    }
  });
});
