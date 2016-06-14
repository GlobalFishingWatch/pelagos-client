if (false) {
  define([], function () {});
}

(function () {
  var def = define;

  if (window.jQuery != undefined) {
    def([], function () { return window.jQuery; });
  } else {

    window.jQueryShimLoader = function (req, callback) {
      delete window.jQueryShimLoader;

      req(["libs/jquery/dist/jquery.min"], function () {
        req.cache.jquery = function () { def("jquery", [], function () { return window.jQuery }); };

        req(["libs/jquery-mousewheel/jquery.mousewheel.min"], function () {
          callback();
        });
      });
    };

    def(["shims/DefineCallback!jQueryShimLoader"], function () {
      return window.jQuery;
    });
  }
})();

