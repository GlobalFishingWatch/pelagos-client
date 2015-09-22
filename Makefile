LIBS=js/libs

JSDEPS= \
  $(LIBS)/qunit-1.15.0.js \
  $(LIBS)/async.js \
  $(LIBS)/stacktrace.js \
  $(LIBS)/lodash.js \
  $(LIBS)/jquery-1.10.2.min.js \
  $(LIBS)/jquery.mousewheel.js \
  $(LIBS)/less.min.js \
  $(LIBS)/bootstrap-3.2.0-dist/js/bootstrap.min.js \
  $(LIBS)/stats.min.js \
  $(LIBS)/loggly.tracker.js \
  $(LIBS)/jquery-ui.js

CSSDEPS= \
  $(LIBS)/bootstrap-3.2.0-dist/css/bootstrap.min.css \
  $(LIBS)/font-awesome/css/font-awesome.min.css \
  $(LIBS)/qunit-1.15.0.css \
  $(LIBS)/jquery-ui.css \
  $(LIBS)/dojo-release-1.10.0-src/dijit/themes/claro/claro.css \
  $(LIBS)/dojo-release-1.10.0-src/dojox/layout/resources/FloatingPane.css \
  $(LIBS)/dojo-release-1.10.0-src/dojox/layout/resources/ResizeHandle.css \

DEPENDENCIES= $(JSDEPS) $(CSSDEPS) \
  $(LIBS)/easyXDM/easyXDM.min.js \
  $(LIBS)/dojo-release-1.10.0-src/util/buildscripts/build.sh


.PHONY: all dependencies js-build clean clean-js-build clean-dependencies unit-tests integration-tests dev-server test-server

all: js-build

dependencies: $(DEPENDENCIES)

$(DEPENDENCIES): $(LIBS)/.empty

$(LIBS)/.empty:
	mkdir -p $(LIBS)
	touch $(LIBS)/.empty

$(LIBS)/async.js:
	curl --silent -f -L https://raw.githubusercontent.com/caolan/async/master/lib/async.js -o $@

$(LIBS)/jquery-1.10.2.min.js:
	curl --silent -f -L http://code.jquery.com/jquery-1.10.2.min.js -o $@
	curl --silent -f -L http://code.jquery.com/jquery-1.10.2.min.map -o $(LIBS)/jquery-1.10.2.min.map

$(LIBS)/jquery.mousewheel.js:
	curl --silent -f -L https://raw.githubusercontent.com/brandonaaron/jquery-mousewheel/master/jquery.mousewheel.js -o $@

$(LIBS)/less.min.js:
	curl --silent -f -L https://raw.githubusercontent.com/less/less.js/master/dist/less.min.js -o $@

$(LIBS)/lodash.js:
	curl --silent -f -L https://raw.github.com/lodash/lodash/2.4.1/dist/lodash.js -o $@

$(LIBS)/qunit-1.15.0.js:
	curl --silent -f -L http://code.jquery.com/qunit/qunit-1.15.0.js -o $@

$(LIBS)/qunit-1.15.0.css:
	curl --silent -f -L http://code.jquery.com/qunit/qunit-1.15.0.css -o $@

$(LIBS)/stacktrace.js:
	curl --silent -f -L https://rawgithub.com/stacktracejs/stacktrace.js/stable/stacktrace.js -o $@

$(LIBS)/loggly.tracker.js:
	curl --silent -f -L https://raw.githubusercontent.com/loggly/loggly-jslogger/master/src/loggly.tracker.js -o $@

$(LIBS)/stats.min.js:
	curl --silent -f -L https://raw.githubusercontent.com/mrdoob/stats.js/master/build/stats.min.js -o $@

$(LIBS)/jquery-ui.css:
	curl --silent -f -L http://code.jquery.com/ui/1.10.0/themes/smoothness/jquery-ui.css -o $@

$(LIBS)/jquery-ui.js:
	curl --silent -f -L http://code.jquery.com/ui/1.10.0/jquery-ui.js -o $@


$(LIBS)/bootstrap-3.2.0-dist/js/bootstrap.min.js $(LIBS)/bootstrap-3.2.0-dist/css/bootstrap.min.css:
	cd $(LIBS); curl --silent -f -L -O https://github.com/twbs/bootstrap/releases/download/v3.2.0/bootstrap-3.2.0-dist.zip
	cd $(LIBS); unzip -DD -qq -o bootstrap-3.2.0-dist.zip
	cd $(LIBS); rm bootstrap-3.2.0-dist.zip

$(LIBS)/easyXDM/easyXDM.min.js:
	mkdir -p $(LIBS)/easyXDM
	cd $(LIBS)/easyXDM; curl --silent -f -L -O https://github.com/oyvindkinsey/easyXDM/releases/download/2.4.19/easyXDM-2.4.19.3.zip
	cd $(LIBS)/easyXDM; unzip -DD -qq -o easyXDM-2.4.19.3.zip
	cd $(LIBS)/easyXDM; rm easyXDM-2.4.19.3.zip

$(LIBS)/font-awesome/css/font-awesome.min.css:
	cd $(LIBS); rm -rf font-awesome*
	cd $(LIBS); curl --silent -f -L -O http://fontawesome.io/assets/font-awesome-4.4.0.zip
	cd $(LIBS); unzip -o font-awesome-4.4.0.zip
	cd $(LIBS); rm font-awesome-4.4.0.zip
	cd $(LIBS); mv font-awesome-4.4.0 font-awesome

$(LIBS)/dojo-release-1.10.0-src/dijit/themes/claro/claro.css \
$(LIBS)/dojo-release-1.10.0-src/dojox/layout/resources/FloatingPane.css \
$(LIBS)/dojo-release-1.10.0-src/dojox/layout/resources/ResizeHandle.css \
$(LIBS)/dojo-release-1.10.0-src/util/buildscripts/build.sh:
	cd $(LIBS); curl --silent -f -L -O http://download.dojotoolkit.org/release-1.10.0/dojo-release-1.10.0-src.tar.gz
	cd $(LIBS); tar -xzmf dojo-release-1.10.0-src.tar.gz
	cd $(LIBS); rm dojo-release-1.10.0-src.tar.gz

js-build: dependencies js-build-mkdir js-build/deps.js js-build/deps.css js-build/build-succeded

js-build-mkdir:
	mkdir -p js-build

js-build/build-succeded: $(DEPENDENCIES)
	cd $(LIBS)/dojo-release-1.10.0-src/util/buildscripts; ./build.sh --dojoConfig ../../../../main.profile.js --release --bin node > build-log || { cat build-log; exit 1; }
	touch $@

js-build/deps.js: $(JSDEPS) js/CanvasLayer.js
	cat $^ > $@

js-build/deps.css: $(CSSDEPS)
	cat $^ | sed -e "s+../fonts/fontawesome+../js/libs/font-awesome-4.3.0/fonts/fontawesome+g" > $@

clean-js-build:
	rm -rf js-build

clean-dependencies:
	rm -rf js/libs

clean: clean-js-build clean-dependencies

unit-tests:
	xvfb-run -a -s "-ac -screen 0 1280x1024x24" -l $(TESTEM_PATH)testem$(TESTEM_SUFFIX) ci

integration-tests:
	xvfb-run -a -s "-ac -screen 0 1280x1024x24" -l nosetests -s -w ui_tests

dev-server:
	ui_tests/server.py

test-server:
	ui_tests/server.py --selenium
