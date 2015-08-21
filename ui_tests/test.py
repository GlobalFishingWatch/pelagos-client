import server
import unittest

class HomeTest(unittest.TestCase):
    def test_home(self):
        server.driver.get("http://localhost:8000")
