#! /usr/bin/env python

import code
import _server
import _tileset

_tileset.generate_test_tileset()
http = _server.start()

print "The application is now running."
print "You can access a sample workspace at http://localhost:8000/index.html?workspace=/ui_tests/data/testtiles/workspace"
print "You can exit by entering exit() or Ctrl-D in the REPL below"

console = code.InteractiveConsole(locals=locals())
console.push("import readline")
console.interact()

_server.stop(http)
