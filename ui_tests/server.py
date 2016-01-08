#! /usr/bin/env python

import click
import time
import selenium.common.exceptions
import _server
import _selenium
import _tileset

http = None
driver = None

def open(initialize_selenium = True, port=8000):
    global driver, http

    _tileset.generate_test_tileset()
    http = _server.start(port)

    if initialize_selenium:
        driver = _selenium.start()

def close():
    try:
        if driver is not None:
            _selenium.stop(driver)
    finally:
        _server.stop(http)

def wait_for(cond, max=120):
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

@click.command()
@click.option('-s', '--selenium', is_flag=True)
@click.option('-p', '--port', type=click.INT, default=8000)
def main(selenium, port):
    import code

    open(initialize_selenium=selenium, port=port)

    print "The application is now running."
    print "You can access a sample workspace at http://localhost:%s/index.html?workspace=/ui_tests/data/testtiles/workspace" % port
    print "You can exit by entering exit() or Ctrl-D in the REPL below"

    try:
        if driver is not None:
            driver.set_window_size(1280, 776)
            driver.get("http://localhost:%s/index.html?workspace=/ui_tests/data/testtiles/workspace" % port)

        console = code.InteractiveConsole(locals=globals())
        console.push("import readline")
        console.interact()
    finally:
        close()

if __name__ == "__main__":
    main()
