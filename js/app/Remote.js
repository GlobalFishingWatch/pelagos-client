define(["app/Class", "socketio", "async"], function(Class, io, async) {
  return Class({
    name: "Remote",
    initialize: function (visualization) {
      var self = this;
      self.visualization = visualization;
    },

    init: function (cb) {
      var self = this;

      self.inUpdate = false;


      async.series([
        self.initSocketIO.bind(self),
        self.init_visualization_state.bind(self)
      ], cb);
    },

    initSocketIO: function (cb) {
      var self = this;

      self.socket = io.connect('http://localhost:4711');
      self.socket.on('id', function (data) {
        self.clientId = data.id;
      });
      self.socket.on('msg', function (data) {
        if (data.origin == self.clientId) return;

        var method = self['handle_' + data.event];
        if (method) {
          method.bind(self)(data);
        } else {
          console.log(["Unknown event", data]);
        }
      });
      self.pendingUpdates = {};
      cb();
    },

    addUpdate: function(event, name, value) {
      var self = this;

      if (self.inUpdate) return;

      var key = event + "_" + name;
      var is_new = !self.pendingUpdates[key];

      var e = {
        event: event,
        name: name,
        value: value
      };
      self.pendingUpdates[key] = e;
      if (is_new) {
        setTimeout(function () {
          self.socket.emit("msg", self.pendingUpdates[key]);
          delete self.pendingUpdates[key];
        }, 200);
      }
    },

    init_visualization_state: function (cb) {
      var self = this;

      self.visualization_state_updates = {};

      self.visualization.state.events.on({
        set: function (args) {
          var name = args.name;
          var value = args.new_value;
          var spec = self.visualization.state.spec[args.name];

          if (spec && spec.tourl) {
            value = spec.tourl(value);
          }

          self.addUpdate('visualization_state_set', name, value);
        }
      });

      cb();
    },

    handle_visualization_state_set: function (data) {
      var self = this;
      if (self.visualization.state.spec[data.name] && self.visualization.state.spec[data.name].fromurl) {
        data.value = self.visualization.state.spec[data.name].fromurl(data.value);
      }
      self.inUpdate = true;
      self.visualization.state.setValue(data.name, data.value);
      self.inUpdate = false;
    }

  });
});
