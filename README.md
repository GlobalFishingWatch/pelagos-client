[![Build Status](https://travis-ci.org/SkyTruth/pelagos-client.svg?branch=master)](https://travis-ci.org/SkyTruth/pelagos-client)

# Build

Run the following from teh top-level directory:

    make

# Accessing the app

    http://localhost/index.html?workspace=/path/to/workspace

where /path/to/workspace is an URL to a JSON file containing a workspace definition. For more information about this check out [the workspace schema](https://github.com/SkyTruth/data-visualization-tools/blob/master/docs/schema.md)

# Libraries

External libraries are placed under `js/libs`. All visualization and data loading code is packaged as RequireJS modules and are located under `js/app`.

# Example data

Example data is available in the data branch of this repo. NOTE: Do not merge between the data branch and the master branch - they are entierly separate.


# Testing

    sudo npm install testem -g
    xvfb-run testem -l Chromium ci
