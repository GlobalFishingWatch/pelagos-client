window.canvasLayerShimLoader = function (require, callback) {
  delete window.canvasLayerShimLoader;

  require(["shims/GoogleMaps/main"], function () {
    require(["app/CanvasLayer"], function () {
      callback();
    });
  });
}


define(["shims/DefineCallback!canvasLayerShimLoader"], function () {
  return CanvasLayer;
});
