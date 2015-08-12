import SimpleHTTPServer
import BaseHTTPServer
import threading
import selenium.webdriver

SimpleHTTPServer.SimpleHTTPRequestHandler.protocol_version = "HTTP/1.0"
httpd = BaseHTTPServer.HTTPServer(('', 8000), SimpleHTTPServer.SimpleHTTPRequestHandler)

sa = httpd.socket.getsockname()
print "Serving HTTP on", sa[0], "port", sa[1], "..."

server = threading.Thread(target=httpd.serve_forever).start()

driver = selenium.webdriver.Firefox()
driver.get("http://localhost:8000")

httpd.shutdown()
