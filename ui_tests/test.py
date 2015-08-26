import server
import unittest
import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import time
import os.path

class HomeTest(unittest.TestCase):
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
            name = os.path.realpath("ui_tests.test.test_home.png")
            driver.get_screenshot_as_file(name)
            raise
