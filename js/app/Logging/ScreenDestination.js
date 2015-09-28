define(["app/Class", "app/Logging/Destination"], function(Class, Destination) {
  var print = function () {};
  if (typeof(console) != "undefined" && typeof(console.log) != "undefined") {
    print = console.log.bind(console);
  }

  var ScreenDestination = Class(Destination, {
    name: "ScreenDestination",

    store: function(entry, cb) {
      print(entry.toString());
      cb();
    }
  });
  Destination.destinationClasses.screen = ScreenDestination;

  return ScreenDestination;
});
