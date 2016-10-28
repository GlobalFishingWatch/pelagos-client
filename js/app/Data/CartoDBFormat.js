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

    _load: function () {
      var self = this;

      self.getMetadata(function (err, metadata) {
        if (metadata.header) self.header = metadata.header;
        if (metadata.info) self.info = metadata.info;
        self.headerLoaded();
      });
    },

    getMetadata: function(cb) {
      var self = this;

      function toPelagosMetadata(data) {
        return {
          info: {
            description: data.description,
            title: data.title,
          },
        };
      };

      async.waterfall([
        function(cb) {
          Ajax.get(self.url, {}, cb);
        },

        function(data, cb) {
          var metadataLink = $(data.description).find("a:contains('Metadata')");
          if (metadataLink.length > 0) {
            Ajax.get(metadataLink.attr('href'), {}, cb);
          } else {
            async.nextTick(function() {
              cb(null, toPelagosMetadata(data));
            });
          }
        },

      ], cb);
    },

    getSelectionInfo: function(selection, cb) {
      var self = this;

      if (selection !== undefined) return cb("Not implemented", null);
      cb(null, self.info);
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
