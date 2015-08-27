import SimpleHTTPServer
import BaseHTTPServer
import threading
import selenium.webdriver
import os.path
import time
import selenium.common.exceptions
import selenium.webdriver.common.desired_capabilities
import datetime

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
    capabilities = selenium.webdriver.common.desired_capabilities.DesiredCapabilities.CHROME
    capabilities['loggingPrefs'] = {'browser': 'ALL'}
    options = selenium.webdriver.ChromeOptions()
    options.arguments.append("--ignore-gpu-blacklist")
    driver = selenium.webdriver.Chrome(desired_capabilities=capabilities, chrome_options=options)


def close():
    for line in driver.get_log("browser"):
        if line['level'] != 'DEBUG':
            print "%s: %s: %s" % (datetime.datetime.utcfromtimestamp(line['timestamp']/1000.0).strftime("%Y-%m-%d %H:%M:%S"), line['level'], line['message'])
    try:
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
    except selenium.common.exceptions.NoSuchElementException:
        return False
    return True


if __name__ == "__main__":
    import code

    open()
    try:
        driver.set_window_size(1280, 776)
        driver.get("http://localhost:8000/index.html?workspace=/ui_tests/data/testtiles/workspace")

        console = code.InteractiveConsole(locals=locals())
        console.push("import readline")
        console.interact()
    finally:
        close()
