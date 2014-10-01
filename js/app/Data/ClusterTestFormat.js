define(["app/Class", "app/Events", "app/Data/Format", "app/Data/EmptyFormat"], function(Class, Events, Format, EmptyFormat) {
  var ClusterTestFormat = Class(EmptyFormat, {
    name: "ClusterTestFormat",

    headerTime: 1000,
    contentTime: 1000,

    initialize: function() {
      var self = this;
     
      EmptyFormat.prototype.initialize.apply(self, arguments);

      var start = new Date("1970-01-01T00:00:00").getTime();
      var end = new Date("1970-01-20T00:00:00").getTime();

      self.rowcount = 20;
      self.header = {
          "tilesetName": "Clustering Test",
          "colsByName": {
            "series":    {"max": 1.0, "min": 0.0, "type": "Float32"},
            "datetime":  {"max": end, "min": start, "type": "Float32"},
            "weight":    {"max": 10 * (self.rowcount-1), "min": 0.0, "type": "Float32"},
            "sigma":     {"max": 1.0, "min": 0.0, "type": "Float32"},

            "latitude":  {"max": 90.0, "min": 0, "type": "Float32"},
            "longitude": {"max": 90.0, "min": 0, "type": "Float32"},

            "rowidx": {"max": self.rowcount-1, "min": 0, "type": "Float32"},
          },
          "tilesetVersion": "0.1",
          length: self.rowcount
      };

      self.data = {};

      Object.items(self.header.colsByName).map(function (item) {
        self.data[item.key] = new Float32Array(self.rowcount);
      });

      for (var i = 0; i < self.rowcount; i++) {
        self.data.series[i] = 0;
        self.data.datetime[i] = i * (end - start) / self.rowcount;
        self.data.weight[i] = i * 10;
        self.data.sigma[i] = 1;
        self.data.latitude[i] = i * 90 / self.rowcount;
        self.data.longitude[i] = 0;
        self.data.rowidx[i] = i;
      }

      self.updateSeries();
    }
  });
  Format.formatClasses.ClusterTestFormat = ClusterTestFormat;
  return ClusterTestFormat;
});
