#! /usr/bin/env python
import code
import server

server.open()

try:
    driver = server.driver
    driver.set_window_size(1280, 776)
    driver.get("http://localhost:8000/index.html?workspace=/ui_tests/data/testtiles/workspace")

    console = code.InteractiveConsole(locals=locals())
    console.push("import readline")
    console.interact()
finally:
    server.close()
