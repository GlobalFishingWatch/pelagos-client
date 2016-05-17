window.jQueryShimLoader = function (require, callback) {
  delete window.jQueryShimLoader;

  require(["libs/jquery/dist/jquery.min"], function () {
    require.cache.jquery = function () { define("jquery", [], function () { return jQuery }); };

    require(["libs/jquery-mousewheel/jquery.mousewheel.min"], function () {
      callback();
    });
  });
};

define(["shims/DefineCallback!jQueryShimLoader"], function () {
  return jQuery;
});
