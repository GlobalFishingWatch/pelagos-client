require([
  "app/Data/TypedMatrixParser"
], function (
  TypedMatrixParser
) {
  tile = new TypedMatrixParser("http://localhost:8000/ui_tests/data/testtiles/-90,-45,-45,-22.5");
  tile.events.on({__all__: function () { console.log(arguments); }});
  tile.load();
});
