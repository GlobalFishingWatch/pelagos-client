import SimpleHTTPServer
import BaseHTTPServer
import threading
import selenium.webdriver
import os.path
import server
import generate_test_tileset

def setup():
    generate_test_tileset.generate_tileset(os.path.join(os.path.dirname(__file__), 'data/testtiles'), levels=3)
    server.open()

def teardown():
    server.close()
