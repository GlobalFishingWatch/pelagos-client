define(["app/Class", "QUnit", "app/Test/BaseTest", "app/Data/BinFormat", "app/Data/DataView"], function(Class, QUnit, BaseTest, BinFormat, DataView) {
  return Class(BaseTest, {
    name: "DataView",

    "Select rows": function (cb) {
      QUnit.expect(3);

      p = new BinFormat({url:require.toUrl("app/Test/Data/foo.bin")});
      p.sortcols = ['foo'];
      dv = new DataView(p, {
        columns: {
          foo: {type: "Int32", items: [{name: "foo", source: {foo: 1}}]},
          bar: {type: "Int32", items: [{name: "bar", source: {bar: 1}}]}},
        selections: {
          selected: {type: "Int32", items: [{name: "selected", source: {selected: 1}}]}
        }});
      dv.events.on({
        all: function () {
          dv.selections.selected.addRange(p, [0, 1], [0, 1]);

          QUnit.equal(dv.selections.selected.checkRow(p, 0), false, "Unselected row 0 is not selected according to checkRow()");
          QUnit.equal(dv.selections.selected.checkRow(p, 1), true, "Selected row 1 is selected according to checkRow()");
          QUnit.equal(dv.selections.selected.checkRow(p, 2), false, "Unselected row 2 is not selected according to checkRow()");

          cb();
        },
        error: function (e) {
          QUnit.ok(false, e.toString());
          cb();
        }
      });

      p.load();
    }
  });
});
