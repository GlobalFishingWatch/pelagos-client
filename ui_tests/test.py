import server
import unittest
import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import time
import os.path
import json

# To capture lat/lons of clicks, the following javascript can be used:

# point2LatLng = function(point, map) {
#   var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
#   var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
#   var scale = Math.pow(2, map.getZoom());
#   var worldPoint = new google.maps.Point(point.x / scale + bottomLeft.x, point.y / scale + topRight.y);
#   return map.getProjection().fromPointToLatLng(worldPoint);
# };
# $("body").click(function (e) {
#   var latLng = point2LatLng(new google.maps.Point(e.pageX, e.pageY), visualization.animations.map);
#   console.log(JSON.stringify({lat: latLng.lat(), lng: latLng.lng()}));
# });


class HomeTest(unittest.TestCase):
    pass
