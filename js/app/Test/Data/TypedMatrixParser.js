define([
  "app/Class",
  "shims/QUnit/main",
  "app/Test/BaseTest",
  "app/Data/TypedMatrixParser",
  "app/Data/TypedMatrixGenerator"
], function(
  Class,
  QUnit,
  BaseTest,
  TypedMatrixParser,
  TypedMatrixGenerator
) {
  return Class(BaseTest, {
    name: "TypedMatrixParser",

/*
    This does not work, as property ordering in the json header is non-deterministic :(

    "Generate data": function (cb) {
      QUnit.expect(1);

      var cols = {foo: new Int32Array(3), bar: new Int32Array(3)};
      cols.foo[0] = 4;
      cols.foo[1] = 5;
      cols.foo[2] = 6;
      cols.bar[0] = 8;
      cols.bar[1] = 9;
      cols.bar[2] = 10;
      var g = new TypedMatrixGenerator({test: 4711, colsByName: {foo: {gazonk: 3}}}, cols);

      var data = g.asBin();
      $.get(require.toUrl("Test/Data/foo.bin"), function (filedata) {
        QUnit.equal(data, filedata, "Generated data matches stored good data");
        cb();
      });
    },
*/

    "Parse generated data": function (cb) {
      QUnit.expect(5);

      var p = new TypedMatrixParser(require.toUrl("app/Test/Data/foo.bin"));
      p.events.on({
        header: function (data) {
          QUnit.equal(data.test, 4711, "Support for extra header values");
          QUnit.equal(data.colsByName.foo.gazonk, 3, "Support for extra column attributes");
          QUnit.equal(data.colsByName.foo.max, 6, "Support for column min/max values");
        },
        col: function (data) {
          if (data.column.name == "foo") {
            QUnit.equal(data.values[2], 6, "First value matches");
          }
        },
        all: function () {
          QUnit.ok(true, "Parsed data");
          cb();
        },
        error: function (e) {
          QUnit.ok(false, e.toString());
          cb();
        }
      });

      p._load();
    }
  });
});
