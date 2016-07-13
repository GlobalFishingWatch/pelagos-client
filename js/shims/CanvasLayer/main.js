if (false) {
  define(["shims/GoogleMaps/main", "app/CanvasLayer"], function () {});
}

(function () {
  var def = define;

  if (window.CanvasLayer != undefined) {
    def([], function () { return window.CanvasLayer; });
  } else {
    window.canvasLayerShimLoader = function (req, callback) {
      delete window.canvasLayerShimLoader;

      req(["shims/GoogleMaps/main"], function () {
        req(["app/CanvasLayer"], function () {
          callback();
        });
      });
    }


    def(["shims/DefineCallback!canvasLayerShimLoader"], function () {
      return CanvasLayer;
    });
  }
})();
