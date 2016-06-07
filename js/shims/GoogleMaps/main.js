window.googleMapsLoader = function (require, callback) {
  window.googleMapsLoaded = callback;
  require(["http://maps.googleapis.com/maps/api/js?libraries=visualization&sensor=false&callback=googleMapsLoaded"], function () {});
}

define(["shims/DefineCallback!googleMapsLoader"], function () {
  return google;
});
