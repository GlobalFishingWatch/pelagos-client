define([
  "app/Class",
  "app/Events",
  "app/Data/Format",
  "app/Data/EmptyFormat",
  "app/Data/Ajax",
  "shims/async/main"
], function(
  Class,
  Events,
  Format,
  EmptyFormat,
  Ajax,
  async
) {
  var CartoDBFormat = Class(EmptyFormat, {
    name: "CartoDBFormat",

    getSelectionInfo: function(selection, cb) {
      var self = this;

      if (selection !== undefined) return cb("Not implemented", null);

      var info;
      var title;
      async.series([
        function (cb) {
          Ajax.get(self.url, {}, function (err, data) {
            if (err) return cb(err);
            title = data.title;
            info = data.description || "";
            cb();
          });
        },
        function (cb) {
          try {
            info = JSON.parse(info);
            cb();
          } catch (e) {
            if (info.indexOf('://') != -1 && info.indexOf('<') == -1) {
              Ajax.get(info, {}, function (err, data) {
                if (err) return cb(err);
                info = JSON.parse(data);
                cb();
              });
            } else {
              info = {'description': info};
              cb();
            }
          }
        }
      ], function (err) {
        if (err) return cb(err);
        if (title) info.title = title;
        cb(null, info);
      });
    },

    toString: function () {
      var self = this;
      return self.name + ": " + self.url;
    },

    toJSON: function () {
      var self = this;
      return {
        "type": self.name,
        args: {
          url: self.url
        }
      }
    }
  });
  Format.formatClasses.CartoDBFormat = CartoDBFormat;
  return CartoDBFormat;
});
