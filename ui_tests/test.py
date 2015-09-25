import server
import unittest
import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import time
import os.path

class HomeTest(unittest.TestCase):
    maxDiff = None

    def test_home(self):
        driver = server.driver
        try:
            driver.set_window_size(1280, 776)
            driver.get("http://localhost:8000/index.html?workspace=/ui_tests/data/testtiles/workspace")
            time.sleep(5)

            # Shift click is not supported by webdriver right now...
            driver.execute_script("""
              KeyModifiers = require("app/Visualization/KeyModifiers");
              KeyModifiers.active.Shift = true
            """)

            actions = ActionChains(driver)
            actions.move_to_element_with_offset(driver.find_element_by_xpath("//div[@class='animations']/div/div/div[2]"), 639, 55)
            # actions.key_down(Keys.SHIFT)
            actions.click()
            # actions.key_up(Keys.SHIFT)
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

            def verifyHover(x, y, seriesgroup):
                actions = ActionChains(driver)
                actions.move_to_element_with_offset(driver.find_element_by_xpath("//div[@class='animations']/div/div/div[2]"), x, y)
                actions.perform()
                return driver.execute_script("return visualization.animations.animations[0].data_view.selections.selections.hover.data.seriesgroup[0]") == seriesgroup

            def moveTimeslider(offset):
                actions = ActionChains(driver)
                actions.drag_and_drop_by_offset(driver.find_element_by_xpath('//div[@class="main-timeline timeline"]//div[@class="window"]'), offset, 0)
                actions.perform()

            self.assertTrue(verifyHover(756,74,136), "Seriesgroup not present at x,y")
            moveTimeslider(-272)
            self.assertFalse(verifyHover(756,74,136), "Seriesgroup present at x,y when timeslider has moved")

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
