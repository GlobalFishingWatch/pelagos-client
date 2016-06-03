window.cartodbShimLoader = function (require, callback) {
  delete window.cartodbShimLoader;

  require(["shims/jQuery/main", "shims/Styles"], function ($, Styles) {
    Styles.add("libs/cartodb.js/themes/css/cartodb.css");
    require(["libs/cartodb.js/cartodb"], function () {
      callback();
    });
  });
}

define(["shims/DefineCallback!cartodbShimLoader"], function () {
  return cartodb;
});
