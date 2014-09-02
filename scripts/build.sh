#! /bin/bash

cd js/libs

wget http://download.dojotoolkit.org/release-1.10.0/dojo-release-1.10.0-src.tar.gz
tar -xvzf dojo-release-1.10.0-src.tar.gz
rm dojo-release-1.10.0-src.tar.gz
(
  cd dojo-release-1.10.0-src/util/buildscripts
  ./build.sh --dojoConfig ../../../../main.profile.js --release
)
