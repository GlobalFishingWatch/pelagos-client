# Example code

* http://localhost:8000/index.html?workspace=/ui_tests/data/testtiles/workspace
  * Loads the whole app, including the UI with a test dataset
  * Source: js/app/main.js

* http://localhost:8000/index-visualization-only.html?workspace=/ui_tests/data/testtiles/workspace
  * Loads the whole visualization system, but without the UI
  * Source: js/app/main-visualization-only.js

* http://localhost:8000/index-data-only.html
  * Loads all tiles for the fully zoomed out world. Prints data
    manager events to the console. Lets the user interact with the
    data manager which is available in the variable "data" and the
    source itself through the variable "source".
  * Source: js/app/main-data-only.js

* http://localhost:8000/index-single-data-only.html
  * Loads one tile. Prints all tile events to the console. Lets the
    user interact with the tile through the "tile" variable.
  * Source: js/app/main-single-data-only.js
