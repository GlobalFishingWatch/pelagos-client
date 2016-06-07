if (false) {
  define(["shims/GoogleMaps/main", "app/CanvasLayer"], function () {});
}

(function () {
  var def = define;

  if (window.Stats != undefined) {
    def([], function () { return window.Stats; });
  } else {
    def(["libs/stats.js/build/stats.min"], function () {
      return window.Stats;
    });
  }
})();
