window.cartodbShimLoader = function (require, callback) {
  delete window.cartodbShimLoader;

  require(["shims/jQuery/main"], function () {
    require(["libs/cartodb.js/cartodb"], function () {
      callback();
    });
  });
}

define(["shims/DefineCallback!cartodbShimLoader"], function () {
  return cartodb;
});
