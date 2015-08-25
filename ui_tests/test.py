import server
import unittest
import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
import time

class HomeTest(unittest.TestCase):
    def test_home(self):
        driver = server.driver

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
