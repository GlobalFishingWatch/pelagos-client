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

      var rows = 20;
      var radiuses = [0.25, 0.5, 1.0, 1.5, 2.0];

      self.rowcount = (rows + rows * rows / 2) * radiuses.length;
      self.header = {
          "tilesetName": "Clustering Test",
          "colsByName": {
            "series":    {"max": 1.0, "min": 0.0, "type": "Float32"},
            "datetime":  {"max": end, "min": start, "type": "Float32"},
            "weight":    {"max": 10 * (rows+1), "min": 0.0, "type": "Float32"},
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

      var i = 0;
      var displacement = 0;

      radiuses.map(function (radius) {
        for (var row = 0; row < rows; row++) {
          self.data.series[i] = 0;
          self.data.datetime[i] = row * (end - start) / rows;
          self.data.weight[i] = 10 * (row + 1);
          self.data.sigma[i] = radius;
          self.data.latitude[i] = row * 90 / rows;
          self.data.longitude[i] = displacement;
          self.data.rowidx[i] = i;
          i++;
        }


        for (var row = 0; row < rows; row++) {
          for (var point = 0; point < row + 1; point++) {
            self.data.series[i] = 0;
            self.data.datetime[i] = row * (end - start) / rows;
            self.data.weight[i] = 10;
            self.data.sigma[i] = 0;
            self.data.latitude[i] = row * 90 / rows;
            self.data.longitude[i] = displacement + 10;
            self.data.rowidx[i] = i;

            if (row > 0) {
              var angle = 2 * Math.PI * point / (row + 1);
              self.data.latitude[i] += Math.sin(angle) * radius;
              self.data.longitude[i] += Math.cos(angle) * radius;
            }

            i++;
          }
        }
        displacement += 30;
      });

      self.updateSeries();
    }
  });
  Format.formatClasses.ClusterTestFormat = ClusterTestFormat;
  return ClusterTestFormat;
});
