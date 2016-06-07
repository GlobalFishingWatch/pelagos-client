window.cartodbShimLoader = function (require, callback) {
  delete window.cartodbShimLoader;

  require(["shims/jQuery/main", "shims/GoogleMaps/main", "shims/Styles"], function ($, google, Styles) {
    Styles.add("libs/cartodb.js/themes/css/cartodb.css");
    require(["libs/cartodb.js/cartodb.uncompressed"], function () {
      cartodb.DEBUG = true;
      callback();
    });
  });
}

define(["shims/DefineCallback!cartodbShimLoader"], function () {
  return cartodb;
});
