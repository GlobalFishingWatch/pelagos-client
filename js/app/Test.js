define(
  [
    "app/Class",
    "shims/QUnit/main",
    "app/Test/Events",
    "app/Test/SubscribableDict",
    "app/Test/Logging",
    "app/Test/Data/TypedMatrixParser",
    "app/Test/Data/BinFormat",
    "app/Test/Data/TiledEmptyFormat",
    "app/Test/Data/DataView"
  ], function(
    Class,
    QUnit,
    Events,
    SubscribableDict,
    Logging,
    TypedMatrixParser,
    BinFormat,
    TiledEmptyFormat,
    DataView
  ) {
  return Class({
    name: "Test",
    initialize: function () {
      var self = this;
      QUnit.config.testTimeout = 10000;

      self.events = new Events();
      self.subscribableDict = new SubscribableDict();
      self.logging = new Logging();
      self.typedMatrixParser = new TypedMatrixParser();
      self.binFormat = new BinFormat();
      self.tiledEmptyFormat = new TiledEmptyFormat();
      self.dataView = new DataView();
    }
  });
});
