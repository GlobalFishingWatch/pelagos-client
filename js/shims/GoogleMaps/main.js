if (false) {
  define([], function () {});
}


(function () {
  var def = define;

  if (window.google != undefined) {
    def([], function () {
      return window.google;
    });
  } else {
    window.googleMapsLoader = function (req, callback) {
      window.googleMapsLoaded = callback;
      req(["http://maps.googleapis.com/maps/api/js?libraries=visualization&sensor=false&callback=googleMapsLoaded"], function () {});
    }

    def(["shims/DefineCallback!googleMapsLoader"], function () {
      return window.google;
    });
  }
})();
