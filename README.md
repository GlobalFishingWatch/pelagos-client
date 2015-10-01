[![Build Status](https://travis-ci.org/SkyTruth/pelagos-client.svg?branch=master)](https://travis-ci.org/SkyTruth/pelagos-client)

![alt text](https://raw.githubusercontent.com/SkyTruth/pelagos-client/master/img/logo.svg "Logo")


# About

Pelagos Client is a stand-alone web application for visualizing large time
series datasets on top of a zoomable world map. A datasets can be provided
either as a single static file, a tree of tile files or by a dynamic tile
generation server with an optional static cache.

Features:

* WebGL data rendering allowing large dataset and fast rendering

* Map pan and zoom

* Timeslider to pan and zoom in time to any time range

* Multiple data layers

* Mouse-over and selection information for objects

* Dynamic data mapping UI

* Data styling using GLSL shader language

* Optional search UI (requires server side query handling code)

# Development environment

## Prerequisites



## Quick virtualized environment setup

You can run all the tests and development files inside a Vagrant
virtualized machine. For that will need:

1. [Vagrant](http://www.vagrantup.com/) to manage the virtualized development
   environment. This requires installing
[VirtualBox](https://www.virtualbox.org/).

1. A vagrant box image that you add with `vagrant box add ubuntu/precise64 http://download.appscale.com/download/AppScale%201.12.0%20VirtualBox%20Image`

Once these are installed you can set up and start the virtual machine:

1. Start the virtualized environment with `vagrant up`. This **will** take a
   while, as the entire development environment is downloaded and configured.

1. SSH into the virtual machine with `vagrant ssh`, jump to the project folder
   at `/vagrant`. You can run any of the project tasks which are run through
   make in this directory.

## Non-virtualized setup (on ubuntu)

To run all the tests etc natively

1. `sudo make prerequisites`

This will install all the prerequisites globally on you machine.

## Running the application

You can start a local development server for the application with `make
dev-server`. The server running inside the virtualized environment is exposed
through ssh tunneling as port 8000 in your host machine, so you can access the
application through
`http://localhost:8000/index.html?workspace=/path/to/workspace`.

Where `/path/to/workspace` is an URL to a JSON file containing a workspace
definition. For more information about this check out [the workspace
schema](https://github.com/SkyTruth/pelagos-client/blob/master/docs/schema.md)

Example data is available in the data branch of this repo. A test workspace is
also generated automatically by the `make dev-server` task.

## Data generation

Data can be generated using the Python library https://github.com/SkyTruth/vectortile

# Build system

## Build

You can build, concatenate and minify all assets through the `make all` task.
This will do the following:

* Download and install external libraries at `js/libs`.

* Compile all visualization and data loading code at `js/app`, minify,
  concatenate and optimize everything using [the dojo build
  system](https://dojotoolkit.org/documentation/tutorials/1.10/build/index.html).
  The output of all this will be at the js-build direcotry.

## Testing

The project contains both automated unit and integration tests.

* Unit tests are run with `make unit-tests`.

* Integration tests are run with `make integration-tests`.

* To develop new tests, run `make test-server`. This starts a server
  like `make dev-server` does, opens a browser connected to a selenium webdriver
and a python command line with a selenium driver in the variable "driver". This
command is not meant to be run inside the vm, as it needs to communicate with
your local chrome instance.
