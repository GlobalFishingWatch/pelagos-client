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
      req(["shims/apikeys"], function (apikeys) {
        window.googleMapsLoaded = callback;
        req(["https://maps.googleapis.com/maps/api/js?libraries=visualization&sensor=false&callback=googleMapsLoaded&key=" + apikeys.GoogleMaps], function () {});
      });
    }

    def(["shims/DefineCallback!googleMapsLoader"], function () {
      return window.google;
    });
  }
})();
