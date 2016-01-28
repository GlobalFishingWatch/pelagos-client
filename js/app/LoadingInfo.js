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
      if (value && value.request) {
        var response = undefined;
        var responseText = undefined;

        response = value.request.response;
        // Not undefined, but throws an exception if accessed when responseType is not text...
        try {
          responseText = value.request.responseText;
        } catch (e) {}

        if (response) {
          if (response.byteLength) {
            value.bytes = response.byteLength;
          } else if (response.length) {
            value.bytes = response.length;
          } else if (response.size) {
            value.bytes = response.size;
          }
        } else if (responseText) {
            value.bytes = responseText.length;
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
