#! /bin/bash

# These are in lib, but should not be there...
# base.js
# CanvasLayer.js
# glutil2d.js
# io.js
# series.js
# TimeMachineCanvasLayer.js

cd js/libs

wget https://raw.githubusercontent.com/caolan/async/master/lib/async.js

wget http://code.jquery.com/jquery-1.10.2.min.js
wget http://code.jquery.com/jquery-1.10.2.min.map

# wget https://raw.githubusercontent.com/brandonaaron/jquery-mousewheel/master/jquery.mousewheel.min.js
wget https://raw.githubusercontent.com/brandonaaron/jquery-mousewheel/master/jquery.mousewheel.js

wget https://github.com/twbs/bootstrap/releases/download/v3.2.0/bootstrap-3.2.0-dist.zip
unzip bootstrap-3.2.0-dist.zip
rm bootstrap-3.2.0-dist.zip

mkdir easyXDM
(
  cd easyXDM
  wget https://github.com/oyvindkinsey/easyXDM/releases/download/2.4.19/easyXDM-2.4.19.3.zip
  unzip easyXDM-2.4.19.3.zip
  rm easyXDM-2.4.19.3.zip
)

wget https://fortawesome.github.io/Font-Awesome/assets/font-awesome-4.2.0.zip
unzip font-awesome-4.2.0.zip
rm font-awesome-4.2.0.zip

wget https://raw.github.com/less/less.js/master/dist/less-1.7.4.min.js
wget https://raw.github.com/lodash/lodash/2.4.1/dist/lodash.js

wget http://code.jquery.com/qunit/qunit-1.15.0.js
wget http://code.jquery.com/qunit/qunit-1.15.0.css

wget http://requirejs.org/docs/release/2.1.14/minified/require.js
wget https://rawgithub.com/stacktracejs/stacktrace.js/master/stacktrace.js

wget https://raw.githubusercontent.com/loggly/loggly-jslogger/master/src/loggly.tracker.js
wget https://raw.githubusercontent.com/mrdoob/stats.js/master/build/stats.min.js

wget http://download.dojotoolkit.org/release-1.10.0/dojo-release-1.10.0-src.tar.gz
tar -xvzf dojo-release-1.10.0-src.tar.gz
rm dojo-release-1.10.0-src.tar.gz
(
  cd dojo-release-1.10.0-src/util/buildscripts
  ./build.sh --dojoConfig ../../../../main.profile.js --release
)
