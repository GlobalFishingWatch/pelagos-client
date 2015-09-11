[![Build Status](https://travis-ci.org/SkyTruth/pelagos-client.svg?branch=master)](https://travis-ci.org/SkyTruth/pelagos-client)

# About

Pelagos Client is a stand-alone web application for visualizing large time series datasets on top of a zoomable world map. A datasets can be provided either as a single static file, a tree of tile files or by a dynamic tile generation server with an optional static cache.

Features:

* WebGL data rendering allowing large dataset and fast rendering
* Map pan and zoom
* Timeslider to pan and zoom in time to any time range
* Multiple data layers
* Mouse-over and selection information for objects
* Dynamic data mapping UI
* Data styling using GLSL shader language
* Optional search UI (requires server side query handling code)

# Build

Run the following from the top-level directory:

    make

# Accessing the app

    http://localhost/index.html?workspace=/path/to/workspace

where /path/to/workspace is an URL to a JSON file containing a workspace definition. For more information about this check out [the workspace schema](https://github.com/SkyTruth/pelagos-client/blob/master/docs/schema.md)

# Libraries

External libraries are placed under `js/libs`. All visualization and data loading code is packaged as RequireJS modules and are located under `js/app`.

# Example data

Example data is available in the data branch of this repo. NOTE: Do not merge between the data branch and the master branch - they are entierly separate.


# Testing

Unit tests:

    sudo npm install testem -g
    xvfb-run -s "-screen 0 1280x1024x24" testem -l Chromium ci --timeout 60

Integration tests:

    pip install -r requirements.txt
    pip install chromedriver_installer --install-option="--chromedriver-version=2.10"
    xvfb-run -s "-screen 0 1280x1024x24" nosetests -s -w ui_tests

To develop new tests, run

    ui_tests/server.py

This opens a browser and a python command line with a selenium driver in the variable "driver".

# Data generation

Data can be generated using the Python library https://github.com/SkyTruth/vectortile
