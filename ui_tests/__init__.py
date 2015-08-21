import SimpleHTTPServer
import BaseHTTPServer
import threading
import selenium.webdriver
import os.path
import server

def setup():
    server.open()

def teardown():
    server.close()
    
