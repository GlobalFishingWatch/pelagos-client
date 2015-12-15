define(["app/Class"], function(Class, Events, Logging) {
  /* Simple object and string templating class.

     new ObjectTemplate(template).eval(data);

     Template is any plain javascript object or array, containing
     objects, arrays, numbers, strings, true/false, null, undefined.

     Any {"%": "NAME1.NAME2..NAMEN"} in template is replaced with
     data[NAME1][NAME2]..[NAMEN].

     Any %(NAME1.NAME2..NAMEN)s inside a string inside template is
     replaced likeqwise.
  */

  return Class({
    name: "ObjectTemplate",
    initialize: function(spec) {
      var self = this;
      self.spec = spec;
    },

    eval: function (data) {
      var self = this;

      var evalString = function (str) {
        var replacementsRe = new RegExp('%\\(([^)]*)\\)s', 'g');
        var replacementArgs = {};
        var match;
        while (match = replacementsRe.exec(str)) {
          var value = data;
          match[1].split(".").map(function (item) {
            value = value[item];
          });
          replacementArgs[match[1]] = value;
        };
        for (var key in replacementArgs) {
          str = str.replace(new RegExp('%\\(' +  key + '\\)s', 'g'), replacementArgs[key].toString());
        }
        return str;
      };

      var eval = function (node) {
        if (typeof(node) == "string") {
          return evalString(node);
        } else if (typeof(node) == "object") {
          if (node === null) {
            return node;
          } else if (node.constructor.name == "Array") {
            return node.map(eval);
          } else if (node["%"] != undefined) {
            var res = data;

            node["%"].split(".").map(function (item) {
              res = res[item];
            });

            return res;
          } else {
            var res = {};
            for (var key in node) {
              res[key] = eval(node[key]);
            }
            return res;
          }
        } else {
          return node;
        }
      };

      return eval(self.spec);
    }
  });
});
