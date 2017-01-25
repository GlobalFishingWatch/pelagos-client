/* Mimicing a very small subset of Events from Openlayers, with one
 * extension: You can listen on all events by registering a handler
 * for __all__. It will be called with the event name as a second
 * argument. */
define(["app/Class", "app/Logging"], function(Class, Logging) {
  Events = Class({
    name: "Events",
    initialize: function (category) {
      var self = this;
      self.handlers = {};
      self.category = category || "AnonymousEvents";
    },
    on: function(args) {
      var self = this;
      for (var name in args) {
        if (name != 'scope') {
          if (!self.handlers[name]) self.handlers[name] = [];
          self.handlers[name].push({handler: args[name], scope: args.scope});
        }
      }
    },
    un: function(args) {
      var self = this;
      for (var name in args) {
        if (name != 'scope' && self.handlers[name]) {
          self.handlers[name] = self.handlers[name].filter(function (item) {
            return item.handler != args[name] || item.scope != args.scope
          });
          if (self.handlers[name].length == 0) delete self.handlers[name];
        }
      }
    },
    triggerEvent: function (event, data) {
      var self = this;
      if (Events.trace) {
        Events.path.push(event);
        console.log(Events.path.join(" / "));
      }
      var start = performance.now();
      Logging.main.log(self.category + "." + event, data);
        if (event == "set-range") {
            console.log("Event is set-range");
      }
      if (self.handlers[event]) {
        self.handlers[event].map(function (handler) {
          handler.handler.call(handler.scope, data, event);
        });
      }
      if (self.handlers.__all__) {
        self.handlers.__all__.map(function (handler) {
          handler.handler.call(handler.scope, data, event);
        });
      }
      var end = performance.now();

      if (end - start > 50) {
          console.log("Timing > 50");
      }
      Events.timings.time += end - start;
      Events.timings.count++;
      if (Events.trace) {
        Events.path.pop();
      }

    }
  });
  Events.trace = true;
  Events.path = [];
  Events.timings = {
      time: 0,
      count: 0
  };
  return Events;
});
