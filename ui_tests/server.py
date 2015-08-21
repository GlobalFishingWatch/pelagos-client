import SimpleHTTPServer
import BaseHTTPServer
import threading
import selenium.webdriver
import os.path

httpds = None
server = None
driver = None

def open():
    global httpd, server, driver

    os.chdir(os.path.join(os.path.dirname(__file__), '..'))

    SimpleHTTPServer.SimpleHTTPRequestHandler.protocol_version = "HTTP/1.0"
    httpd = BaseHTTPServer.HTTPServer(('', 8000), SimpleHTTPServer.SimpleHTTPRequestHandler)

    sa = httpd.socket.getsockname()
    print "Serving HTTP on", sa[0], "port", sa[1], "..."

    server = threading.Thread(target=httpd.serve_forever).start()

    driver = selenium.webdriver.Firefox()
    driver.get("http://localhost:8000")


def close():
    driver.close()
    httpd.shutdown()
    

if __name__ == "__main__":
    open()
