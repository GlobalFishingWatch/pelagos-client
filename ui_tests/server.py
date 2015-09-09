import time
import selenium.common.exceptions
import _server
import _selenium
import _tileset

http = None
driver = None

def open():
    global driver, http

    _tileset.generate_test_tileset()
    http = _server.start()
    driver = _selenium.start()

def close():
    try:
        _selenium.stop(driver)
    finally:
        _server.stop(http)

def wait_for(cond, max=60):
    for i in range(max):
        try:
            if cond():
                break
        except Exception, e:
            pass
        time.sleep(1)
    else:
        raise Exception("time out")


def wait_for_load():
    wait_for(lambda: driver.find_element_by_xpath('//div[@class="loading"]').is_displayed())
    wait_for(lambda: not driver.find_element_by_xpath('//div[@class="loading"]').is_displayed())

def is_element_present(what):
    try:
        driver.find_element_by_xpath(what)
    except selenium.common.exceptions.NoSuchElementException:
        return False
    return True

