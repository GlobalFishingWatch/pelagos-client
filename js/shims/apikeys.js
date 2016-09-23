if (false) {
  define(["shims/jQuery/main"], function () {});
}


(function () {
  var def = define;

  window.apikeysLoader = function (req, callback) {
    req(["shims/jQuery/main"], function ($) {
      var root = req.toUrl("shims").concat("/../..");

      $.get(root + "/apikeys.json", function (data) {
        window.apikeys = data;
        callback();
      }, "json");
    });
  };

  def(["shims/DefineCallback!apikeysLoader"], function () {
    return window.apikeys;
  });
})();
