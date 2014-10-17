/*
  Use google maps Mercator projection to convert from lat, lng to
  x, y coords in the range x:0-256, y:0-256
*/
define(["app/Class"], function (Class) {
  var GeoProjection = Class({name: "GeoProjection"});

  GeoProjection.lonLatInGoogleMercator = function(lonlat) {
    var x = (lonlat.lon + 180) * 256 / 360;
    var y = 128 - Math.log(Math.tan((lonlat.lat + 90) * Math.PI / 360)) * 128 / Math.PI;
    return {x: x, y: y};
  };

  GeoProjection.googleMercatorInLonLat = function(xy) {
    var lat = Math.atan(Math.exp((128 - xy.y) * Math.PI / 128)) * 360 / Math.PI - 90;
    var lng = xy.x * 360 / 256 - 180;
    return {lat: lat, lng: lng};
  };

  GeoProjection.circumferenceOfEarthAtLatitudeInMeters = function(latitude) {
    return Math.cos(latitude * Math.PI/180).toFixed(8) * 40075017;
  };
  
  GeoProjection.circumferenceOfEarthInGoogleMercator = function(zoom) {
    return 256 * Math.pow(2,zoom);
  };

  GeoProjection.metersPerGoogleMercatorAtLatitude = function(latitude, zoom) {
      return (  GeoProjection.circumferenceOfEarthAtLatitudeInMeters(latitude)
              / GeoProjection.circumferenceOfEarthInGoogleMercator(zoom));
  };

  return GeoProjection;
});
