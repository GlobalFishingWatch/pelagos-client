define(['app/Class'], function (Class) {
  var Debug = Class({
  });
  Debug.pan = function (time) {
    if (time == undefined) time = 100;

    var lat = 0;
    var lng = 0

    var pan = function () {
      visualization.animations.map.setCenter({lat:lat, lng:lng});
      lng += 1;
      if (lng < 360) {
        setTimeout(pan, time);
      }
    };
    pan();
  }
  return Debug;
});