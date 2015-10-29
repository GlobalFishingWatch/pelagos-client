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
    maxDiff = None

    def load_helpers(self):
        driver = server.driver
        driver.execute_script("""
          latLng2Point = function(latLng, map) {
            var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
            var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
            var scale = Math.pow(2, map.getZoom());
            var worldPoint = map.getProjection().fromLatLngToPoint(latLng);
            return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale);
          }

          point2LatLng = function(point, map) {
            var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
            var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
            var scale = Math.pow(2, map.getZoom());
            var worldPoint = new google.maps.Point(point.x / scale + bottomLeft.x, point.y / scale + topRight.y);
            return map.getProjection().fromPointToLatLng(worldPoint);
          }
        """)
    
    def latLng2Point(self, latLng):
        driver = server.driver
        return json.loads(driver.execute_script("""
          return JSON.stringify(latLng2Point(new google.maps.LatLng(%(lat)s, %(lng)s), visualization.animations.map));
        """ % latLng))

    def point2LatLng(self, point):
        driver = server.driver
        return json.loads(driver.execute_script("""
          var latLng = point2LatLng(new google.maps.Point(%(x)s, %(y)s), visualization.animations.map);
          return JSON.stringify({lat: latLng.lat(), lng: latLng.lng()});
        """ % point))

    def setAnimation(self, name):
        server.driver.execute_script("""
          visualization.animations.animations.map(function (animation) {
            animation.setVisible(animation.name == '%s');
          });
        """ % name)

    def getHover(self, point, animation):
        actions = ActionChains(server.driver)
        actions.move_to_element_with_offset(server.driver.find_element_by_xpath("//div[@class='animations']/div/div/div[2]"), point['x'], point['y'])
        actions.perform()
        time.sleep(1)
        return server.driver.execute_script("return visualization.animations.animations.filter(function (animation) { return animation.name == '%s'; })[0].data_view.selections.selections.hover.data.seriesgroup[0]" % animation)

    def test_coord_conversion(self):
        driver = server.driver

        driver.set_window_size(1280, 776)
        driver.get("http://localhost:8000/index.html?workspace=/ui_tests/data/testtiles/workspace")
        time.sleep(5)

        self.load_helpers()

        orig = {'x': 10, 'y': 20}
        latLng = self.point2LatLng(orig)
        point = self.latLng2Point(latLng)
        self.assertAlmostEqual(point['x'], orig['x'])
        self.assertAlmostEqual(point['y'], orig['y'])

    def test_home(self):
        driver = server.driver
        try:
            driver.set_window_size(1280, 776)
            driver.get("http://localhost:8000/index.html?workspace=/ui_tests/data/testtiles/workspace")
            time.sleep(5)

            self.setAnimation("ClusterAnimation")

            self.load_helpers()
            point = self.latLng2Point({'lat':22.5, 'lng':0.0})

            # Shift click is not supported by webdriver right now...
            driver.execute_script("""
              KeyModifiers = require("app/Visualization/KeyModifiers");
              KeyModifiers.active.Shift = true
            """)

            actions = ActionChains(driver)
            actions.move_to_element_with_offset(driver.find_element_by_xpath("//div[@class='animations']/div/div/div[2]"), point['x'], point['y'])
            actions.click()
            actions.perform()

            server.wait_for(lambda: not server.is_element_present('//table[@class="vessel_id"]//td[@class="imo"]'))
            self.failUnless(server.is_element_present('//table[@class="vessel_id"]//td[text()="136"]'))
        except:
            name = os.path.realpath("ui_tests.test.test_home.png")
            driver.get_screenshot_as_file(name)
            raise

    def test_timeslider(self):
        driver = server.driver
        try:
            driver.set_window_size(1280, 776)
            driver.get("http://localhost:8000/index.html?workspace=/ui_tests/data/testtiles/workspace")
            time.sleep(5)

            self.setAnimation("ClusterAnimation")

            self.load_helpers()
            point = self.latLng2Point({'lat':22.5, 'lng':0.0})

            def moveTimeslider(offset):
                actions = ActionChains(driver)
                actions.drag_and_drop_by_offset(driver.find_element_by_xpath('//div[@class="main-timeline timeline"]//div[@class="window"]'), offset, 0)
                actions.perform()

            self.assertEqual(self.getHover(point, "ClusterAnimation"), 136, "Seriesgroup not present at x,y")
            moveTimeslider(-272)
            self.assertNotEqual(self.getHover(point, "ClusterAnimation"), 136, "Seriesgroup present at x,y when timeslider has moved")

        except:
            name = os.path.realpath("ui_tests.test.test_timeslider.png")
            driver.get_screenshot_as_file(name)
            raise

    def test_zoom(self):
        driver = server.driver
        try:
            driver.set_window_size(1280, 776)
            driver.get("http://localhost:8000/index.html?workspace=/ui_tests/data/testtiles/workspace")
            time.sleep(5)

            self.setAnimation("ClusterAnimation")

            def get_tiles():
                tiles = driver.execute_script("return Object.keys(visualization.data.sources['TiledBinFormat|/ui_tests/data/testtiles/.'].source.tileCache)")
                tiles.sort()
                return tiles

            self.assertEqual(get_tiles(), [u'-22.5,-11.25,0,0', u'-22.5,-22.5,0,-11.25', u'-22.5,-33.75,0,-22.5', u'-22.5,0,0,11.25', u'-22.5,11.25,0,22.5', u'-22.5,22.5,0,33.75', u'-45,-11.25,-22.5,0', u'-45,-22.5,-22.5,-11.25', u'-45,-22.5,0,0', u'-45,-33.75,-22.5,-22.5', u'-45,-45,0,-22.5', u'-45,0,-22.5,11.25', u'-45,0,0,22.5', u'-45,11.25,-22.5,22.5', u'-45,22.5,-22.5,33.75', u'-45,22.5,0,45', u'-67.5,-11.25,-45,0', u'-67.5,-22.5,-45,-11.25', u'-67.5,-33.75,-45,-22.5', u'-67.5,0,-45,11.25', u'-67.5,11.25,-45,22.5', u'-67.5,22.5,-45,33.75', u'-90,-22.5,-45,0', u'-90,-45,-45,-22.5', u'-90,0,-45,22.5', u'-90,22.5,-45,45', u'0,-11.25,22.5,0', u'0,-22.5,22.5,-11.25', u'0,-22.5,45,0', u'0,-33.75,22.5,-22.5', u'0,-45,45,-22.5', u'0,0,22.5,11.25', u'0,0,45,22.5', u'0,11.25,22.5,22.5', u'0,22.5,22.5,33.75', u'0,22.5,45,45', u'22.5,-11.25,45,0', u'22.5,-22.5,45,-11.25', u'22.5,-33.75,45,-22.5', u'22.5,0,45,11.25', u'22.5,11.25,45,22.5', u'22.5,22.5,45,33.75', u'45,-11.25,67.5,0', u'45,-22.5,67.5,-11.25', u'45,-22.5,90,0', u'45,-33.75,67.5,-22.5', u'45,-45,90,-22.5', u'45,0,67.5,11.25', u'45,0,90,22.5', u'45,11.25,67.5,22.5', u'45,22.5,67.5,33.75', u'45,22.5,90,45'])

            actions = ActionChains(driver)
            actions.click(driver.find_element_by_xpath('//div[@title="Zoom in"]'))
            actions.perform()

            time.sleep(1)
            server.wait_for(lambda: not driver.find_element_by_xpath('//div[@class="loading"]').is_displayed())

            self.assertEqual(get_tiles(), [u'-11.25,-11.25,0,-5.625', u'-11.25,-16.875,0,-11.25', u'-11.25,-5.625,0,0', u'-11.25,0,0,5.625', u'-11.25,11.25,0,16.875', u'-11.25,5.625,0,11.25', u'-22.5,-11.25,-11.25,-5.625', u'-22.5,-11.25,0,0', u'-22.5,-16.875,-11.25,-11.25', u'-22.5,-22.5,0,-11.25', u'-22.5,-5.625,-11.25,0', u'-22.5,0,-11.25,5.625', u'-22.5,0,0,11.25', u'-22.5,11.25,-11.25,16.875', u'-22.5,11.25,0,22.5', u'-22.5,5.625,-11.25,11.25', u'-33.75,-11.25,-22.5,-5.625', u'-33.75,-16.875,-22.5,-11.25', u'-33.75,-5.625,-22.5,0', u'-33.75,0,-22.5,5.625', u'-33.75,11.25,-22.5,16.875', u'-33.75,5.625,-22.5,11.25', u'-45,-11.25,-22.5,0', u'-45,-22.5,-22.5,-11.25', u'-45,-22.5,0,0', u'-45,0,-22.5,11.25', u'-45,0,0,22.5', u'-45,11.25,-22.5,22.5', u'0,-11.25,11.25,-5.625', u'0,-11.25,22.5,0', u'0,-16.875,11.25,-11.25', u'0,-22.5,22.5,-11.25', u'0,-22.5,45,0', u'0,-5.625,11.25,0', u'0,0,11.25,5.625', u'0,0,22.5,11.25', u'0,0,45,22.5', u'0,11.25,11.25,16.875', u'0,11.25,22.5,22.5', u'0,5.625,11.25,11.25', u'11.25,-11.25,22.5,-5.625', u'11.25,-16.875,22.5,-11.25', u'11.25,-5.625,22.5,0', u'11.25,0,22.5,5.625', u'11.25,11.25,22.5,16.875', u'11.25,5.625,22.5,11.25', u'22.5,-11.25,33.75,-5.625', u'22.5,-11.25,45,0', u'22.5,-16.875,33.75,-11.25', u'22.5,-22.5,45,-11.25', u'22.5,-5.625,33.75,0', u'22.5,0,33.75,5.625', u'22.5,0,45,11.25', u'22.5,11.25,33.75,16.875', u'22.5,11.25,45,22.5', u'22.5,5.625,33.75,11.25'])

        except:
            name = os.path.realpath("ui_tests.test.test_zoom.png")
            driver.get_screenshot_as_file(name)
            raise

    def test_arrows(self):
        driver = server.driver

        driver.set_window_size(1280, 776)
        driver.get("http://localhost:8000/index.html?workspace=/ui_tests/data/testtiles/workspace")
        time.sleep(5)

        self.setAnimation("ArrowAnimation")

        server.driver.execute_script("""
          visualization.state.setValue("time", new Date("1970-01-01 00:00:00"))
          visualization.state.setValue("timeExtent", 31*24*60*60*1000)
        """)

        self.load_helpers()

        for coord in [{"lat":0.7031073524364655,"lng":-43.59376},
                      {"lat":0.5273363048114915,"lng":-38.583984375},
                      {"lat":-0.08789059053082421,"lng":-35.5078125},
                      {"lat":-0.615222552406841,"lng":-28.212890625},
                      {"lat":-0.7909904981540058,"lng":-22.060546875},
                      {"lat":-0.615222552406841,"lng":-17.314453125},
                      {"lat":-0.08789059053082421,"lng":-11.6015625},
                      {"lat":0.5273363048114915,"lng":-5.888671875},
                      {"lat":0.6152225524068282,"lng":-1.7578125}]:
            
            point = self.latLng2Point(coord)
            self.assertEqual(self.getHover(point, "ArrowAnimation"), 102)
