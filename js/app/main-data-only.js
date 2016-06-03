require([
  "app/Data/DataManager",
  "app/SpaceTime"
], function (
  DataManager,
  SpaceTime
) {
  data = new DataManager();
  data.init(function () {
    data.events.on({__all__: function () {
     // Catch all events and print them
     console.log("EVENT", arguments);
    }});
    source = data.addSource({type: "TiledBinFormat", args:{url:"/ui_tests/data/testtiles"}});
    console.log("SOURCE ADDED");
    source.load();

    data.zoomTo(new SpaceTime("1969-12-31T00:00:00.000Z,1970-01-15T00:00:00.000Z;-180,-89,180,89"));

    data.events.on({all: function () {
      console.log("All data loaded");
      console.log(data.printTree());
    }});
  });
});

