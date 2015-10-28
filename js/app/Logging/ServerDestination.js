define(["app/Class", "app/Logging/Destination", "app/Json"], function(Class, Destination, Json) {
  var ServerDestination = Class(Destination, {
    name: "ServerDestination",

    initialize: function () {
      var self = this;
      Destination.prototype.initialize.apply(self, arguments);
    },

      store: function(entry, cb) {
      var self = this;

      var request = new XMLHttpRequest();
      request.open('POST', self.url, true);
      request.onreadystatechange = function() {
        if (request.readyState === 4) {
          var err = undefined;
          if (request.status != 200) err = request.status;
          cb(err);
        }
      };
      request.send(Json.encode(entry, "  "));
    }
  });
  Destination.destinationClasses.server = ServerDestination;

  return ServerDestination;
});
