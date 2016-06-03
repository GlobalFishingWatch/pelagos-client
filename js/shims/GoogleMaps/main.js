googleMapsLoaded = function () {
  classicHelper("http://maps.googleapis.com/maps/api/js?libraries=visualization&sensor=false&callback=googleMapsLoaded", google);
}
define([
  "shims/ClassicHelper!http://maps.googleapis.com/maps/api/js?libraries=visualization&sensor=false&callback=googleMapsLoaded"
], function (
  google
) {
  return google;
});
