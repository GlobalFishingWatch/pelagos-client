define([
  "app/Class",
  "app/Logging/Destination",
  "shims/LogglyTracker/main"
], function(
  Class,
  Destination,
  LogglyTracker
) {
  var LogglyDestination = Class(Destination, {
    name: "LogglyDestination",

    initialize: function () {
      var self = this;
      Destination.prototype.initialize.apply(self, arguments);
      self.loggly = new LogglyTracker();
      self.loggly.push({'logglyKey': self.key});
    },

      store: function(entry, cb) {
      var self = this;
      self.loggly.push(entry);
      cb(); // No way to get completion from loggly API
    }
  });
  Destination.destinationClasses.loggly = LogglyDestination;

  return LogglyDestination;
});
