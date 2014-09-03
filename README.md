# Build

Run the following from teh top-level directory:

    scripts/build.sh

# Apps
Apps are available in the apps directory. To invoke an app, access an url like this:

    http://localhost/apps/vectorvisual/index.html#workspace=/path/to/workspace

where /path/to/workspace is an URL to a JSON file containing a workspace definition.

# Libraries

External libraries are placed under `js/libs`. All visualization and data loading code is packaged as RequireJS modules and are located under `js/app`.

# Example data

Example data is available in the data branch of this repo. NOTE: Do not merge between the data branch and the master branch - they are entierly separate.
