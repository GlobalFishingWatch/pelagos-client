if (false) {
  define(["shims/jQuery/main", "shims/GoogleMaps/main", "shims/Styles"], function () {});
}

(function () {
  var def = define;

  if (window.cartodb != undefined) {
    def([], function () { return window.cartodb; });
  } else {
    window.cartodbShimLoader = function (req, callback) {
      delete window.cartodbShimLoader;

      require(["shims/jQuery/main", "shims/GoogleMaps/main", "shims/Styles"], function ($, google, Styles) {
        Styles.add("libs/cartodb.js/themes/css/cartodb.css");
        req(["libs/cartodb.js/cartodb.uncompressed"], function () {
          cartodb.DEBUG = true;
          callback();
        });
      });
    }

    def(["shims/DefineCallback!cartodbShimLoader"], function () {
      return window.cartodb;
    });
  }
})();
