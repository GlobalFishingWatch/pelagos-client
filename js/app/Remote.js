define(["app/Class", "socketio"], function(Class, io) {
  return Class({
    name: "Remote",
    initialize: function (visualization) {
      var self = this;
      self.visualization = visualization;
    },

    init: function (cb) {
      var self = this;

      self.inUpdate = false;
      self.socket = io.connect('http://localhost:4711');
      self.socket.on('id', function (data) {
        self.clientId = data.id;
      });
      self.socket.on('msg', function (data) {
        if (data.origin == self.clientId) return;
        if (data.context == 'visualization.state' && data.event == 'set') {
          if (self.visualization.state.spec[data.name].fromurl) {
            data.value = self.visualization.state.spec[data.name].fromurl(data.value);
          }
          self.inUpdate = true;
          self.visualization.state.setValue(data.name, data.value);
          self.inUpdate = false;
        } else {
          console.log(["Unknown event", data]);
        }
      });

      self.visualization.state.events.on({
        set: function (args) {
          if (self.inUpdate) return;
          var e = {
            context:'visualization.state',
            event:'set',
            name: args.name,
            value: args.new_value
          };
          if (self.visualization.state.spec[e.name].tourl) {
            e.value = self.visualization.state.spec[args.name].tourl(e.value)
          }
          self.socket.emit("msg", e);
        }
      });

      cb();
    }
  });
});
