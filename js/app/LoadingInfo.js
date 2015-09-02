define(["app/Class", "app/Events"], function(Class, Events) {
  var LoadingInfo = Class({
    name: "LoadingInfo",
    initialize: function (category) {
      var self = this;
      self.category = category || "LoadingInfo";
      self.events = new Events(category);
      self.data = {};
    },

    add: function (key, value) {
      var self = this;
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

  LoadingInfo.default = new LoadingInfo();

  return LoadingInfo;
});
