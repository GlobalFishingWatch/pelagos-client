define(["app/Class", "app/Events"], function(Class, Events) {
  var LoadingInfo = Class({
    name: "LoadingInfo",
    initialize: function (category) {
      var self = this;
      self.category = category || "LoadingInfo";
      self.events = new Events(category);
      self.data = {};
      self.count = 0;
      self.bytes = 0;
    },

    add: function (key, value) {
      var self = this;
      if (value === undefined) {
        value = true;
      }
      self.count++;
      var isFirst = !self.isLoading();
      self.data[key] = value;
      var data = {key:key, value:value};
      self.events.triggerEvent("add", data);
      if (isFirst) {
        self.events.triggerEvent("start", data);
      }
    },

    remove: function (key) {
      var self = this;
      var value = self.data[key];
      delete self.data[key];
      if (value.request) {
        if (value.request.response) {
          if (value.request.response.byteLength) {
            value.bytes = value.request.response.byteLength;
          } else if (value.request.response.length) {
            value.bytes = value.request.response.length;
          } else if (value.request.response.size) {
            value.bytes = value.request.response.size;
          }
        } else if (value.request.responseText) {
            value.bytes = value.request.responseText.length;
        }

        if (value.bytes) {
          self.bytes += value.bytes;
        }
      }
      var data = {key:key, value:value};
      self.events.triggerEvent("remove", data);
      if (!self.isLoading()) {
        self.events.triggerEvent("end", data);
      }
    },

    isLoading: function () {
      var self = this;
      return Object.keys(self.data).length > 0;
    }
  });

  LoadingInfo.main = new LoadingInfo();

  return LoadingInfo;
});
