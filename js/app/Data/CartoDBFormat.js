define([
  "app/Class",
  "app/Events",
  "app/Data/Format",
  "app/Data/EmptyFormat",
  "app/Data/Ajax",
  "shims/jQuery/main",
  "shims/async/main"
], function(
  Class,
  Events,
  Format,
  EmptyFormat,
  Ajax,
  $,
  async
) {
  var CartoDBFormat = Class(EmptyFormat, {
    name: "CartoDBFormat",

    getMetadata: function(cb) {
      var self = this;

      var metadata;
      var title;
      async.series([
        function (cb) {
          Ajax.get(self.url, {}, function (err, data) {
            if (err) return cb(err);
            title = data.title;
            metadata = data.description || "";
            cb();
          });
        },
        function (cb) {
          info_link = $(metadata).find("a:contains('info')");
          if (info_link.length > 0) {
            Ajax.get(info_link.attr("href"), {}, function (err, data) {
              if (err) return cb(err);
              metadata = data;
              cb();
            });
          } else {
              metadata = {info: {'description': metadata}};
            cb();
          }
        }
      ], function (err) {
        if (err) return cb(err);
        if (title) metadata.info.title = title;
        cb(null, metadata);
      });
    },

    getSelectionInfo: function(selection, cb) {
      var self = this;

      if (selection !== undefined) return cb("Not implemented", null);
      self.getMetadata(function (err, metadata) {
        if (err) return cb(err);
        cb(null, metadata.info);
      });
    },

    getHeader: function(cb) {
      var self = this;

      self.getMetadata(function (err, metadata) {
        if (err) return cb(err);
        cb(null, metadata.header);
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
