import SimpleHTTPServer
import BaseHTTPServer
import threading
import os.path

class HTTPRequestHandler(SimpleHTTPServer.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.0"
    def log_message(self, *arg, **kw):
        pass

def start(port):
    current_dir = os.path.dirname(__file__)
    root_dir = os.path.join(current_dir, "..")

    os.chdir(root_dir)
    server = BaseHTTPServer.HTTPServer(('', port), HTTPRequestHandler)

    socket_address = server.socket.getsockname()
    print "Serving HTTP on", socket_address[0], ":", socket_address[1], "..."

    threading.Thread(target=server.serve_forever).start()

    return server

def stop(server):
    server.shutdown()

