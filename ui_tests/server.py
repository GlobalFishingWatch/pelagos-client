import SimpleHTTPServer
import BaseHTTPServer
import threading
import selenium.webdriver
import os.path
import time
from selenium.common.exceptions import NoSuchElementException

httpds = None
server = None
driver = None

class HTTPRequestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.0"
    def log_message(self, *arg, **kw):
        pass

def open():
    global httpd, server, driver

    os.chdir(os.path.join(os.path.dirname(__file__), '..'))

    httpd = BaseHTTPServer.HTTPServer(('', 8000), HTTPRequestHandler)

    sa = httpd.socket.getsockname()
    print "Serving HTTP on", sa[0], "port", sa[1], "..."

    server = threading.Thread(target=httpd.serve_forever).start()

    driver = selenium.webdriver.Firefox()


def close():
    try:
        #driver.close()
        driver.quit()
    finally:
        httpd.shutdown()
    


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
    except NoSuchElementException:
        return False
    return True


if __name__ == "__main__":
    open()
    print "Server running..."
