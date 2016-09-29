[![Build Status](https://travis-ci.org/GlobalFishingWatch/pelagos-client.svg?branch=master)](https://travis-ci.org/GlobalFishingWatch/pelagos-client)

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

## Setup

The site itself does not require any specific server-side components for
hosting; all the application is packaged as a static site and all you need to
do to deploy it is to drop some files on an apache, nginx or any static file
server.

You do need however some development environment prerequisites to build those
static files by downloading all library dependencies, concatenate and minify
scripts, etc. You also need the development environment up and running if you
want to generate test datasets, run the unit or integration tests, etc.

You have 2 options to setup your development environment. You can either use
the preferred virtualized development environment, which requires you to setup
vagrant, or you can install all requirements in your machine.

### Quick virtualized test server

The following steps will get you up and running with a test tileset as quickly as possible:

    vagrant up
    vagrant ssh
    # The following inside the vagrant ssh shell
    cd /vagrant
    make dev-server

Now got to http://localhost:8000/index.html?workspace=/ui_tests/data/testtiles/workspace in your webserver.

The workspace and tileset files you're viewing are located in /ui_tests/data/testtiles/. If you have another dataset you can place it alongside this one and adjust your URL accordingly.

### Virtualized environment

You can build the application assets, run all the tests and start a development
server inside a Vagrant virtualized machine. This is the preferred way of
setting up your development environment, as no dependencies will be installed
in your machine, and no configuration is needed. For that will need:

1. [Vagrant](http://www.vagrantup.com/) to manage the virtualized development
   environment. This requires installing
[VirtualBox](https://www.virtualbox.org/) as well. If you are using ubuntu,
don't install it from the standard Debian repositories, as it is an outdated
version incompatible with our vagrantfile. Use the [official
packages](https://www.vagrantup.com/downloads.html) instead.

Once these are installed you can set up and start the virtual machine:

1. Start the virtualized environment with `vagrant up`. This **will** take a
   while, as the entire development environment is downloaded and configured.

1. SSH into the virtual machine with `vagrant ssh` and jump to the project
   folder with `cd /vagrant`.

Any of the tasks described here, such as `make dev-sever` or `make all` are
meant to be run inside the virtual machine at the `/vagrant` directory.

### Non-virtualized setup (on ubuntu)

If you want to instead run everything on your local machine, you will need to
install a couple of libraries and other prerequisites.  You can do that by
running `sudo make prerequisites`. Take a look at the makefile in this project
to see exactly what is installed and how before running this task as it will install software packages globally on your machine.

## Running the application

You can start a local development server for the application with `make
dev-server`. Remember to run the command inside the ssh session if you are
using the virtualized environment. Once the server is up, You can access the
application through
`http://localhost:8000/index.html?workspace=/path/to/workspace`.

`/path/to/workspace` is an URL to a JSON file containing a workspace
definition. For more information about this check out [the workspace
schema](https://github.com/SkyTruth/pelagos-client/blob/master/docs/schema.md)

Example data is available in the `data` branch of this repo. A test workspace
is also generated automatically by the `make dev-server` task, check out the
output from the task, as it prints the exact url where this test workspace is
available.

Data can also be generated using the
[vectortile](https://github.com/SkyTruth/vectortile) Python library if you want
to build your own custom workspace.

# Build system

## Downloading dependencies

You can download external libraries that the visualization depends on into `js/libs` using the `make dependencies` task.

## Build

You don't need to build (minify) the application to run it, but it speeds it up greatly by minimizing download time. You can download all dependencies and do this through the `make all` task.
This will do the following:

* Download and install external libraries as per `make dependencies`.

* Compile all visualization and data loading code in the `js` directory. It will minify,
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
command does not work in a virualized vagrant environment, as it needs to communicate with
your local chrome instance.
