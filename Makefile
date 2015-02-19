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
  $(LIBS)/CanvasLayer.js \
  $(LIBS)/stats.min.js \
  $(LIBS)/loggly.tracker.js \
  $(LIBS)/jquery-ui.js

CSSDEPS= \
  $(LIBS)/bootstrap-3.2.0-dist/css/bootstrap.min.css \
  $(LIBS)/font-awesome-4.3.0/css/font-awesome.min.css \
  $(LIBS)/qunit-1.15.0.css \
  $(LIBS)/jquery-ui.css \
  $(LIBS)/dojo-release-1.10.0-src/dijit/themes/claro/claro.css \
  $(LIBS)/dojo-release-1.10.0-src/dojox/layout/resources/FloatingPane.css \
  $(LIBS)/dojo-release-1.10.0-src/dojox/layout/resources/ResizeHandle.css

DEPENDENCIES= $(JSDEPS) $(CSSDEPS) \
  $(LIBS)/require.js \
  $(LIBS)/easyXDM/easyXDM.min.js \
  $(LIBS)/dojo-release-1.10.0-src/util/buildscripts/build.sh


.PHONY: all dependencies js-build clean clean-js-build clean-dependencies

all: js-build

dependencies: $(DEPENDENCIES)

$(LIBS)/async.js:
	curl -f -L https://raw.githubusercontent.com/caolan/async/master/lib/async.js -o $@

$(LIBS)/jquery-1.10.2.min.js:
	curl -f -L http://code.jquery.com/jquery-1.10.2.min.js -o $@
	curl -f -L http://code.jquery.com/jquery-1.10.2.min.map -o $(LIBS)/jquery-1.10.2.min.map

$(LIBS)/jquery.mousewheel.js:
	curl -f -L https://raw.githubusercontent.com/brandonaaron/jquery-mousewheel/master/jquery.mousewheel.js -o $@

$(LIBS)/less.min.js:
	curl -f -L https://raw.githubusercontent.com/less/less.js/master/dist/less.min.js -o $@

$(LIBS)/lodash.js:
	curl -f -L https://raw.github.com/lodash/lodash/2.4.1/dist/lodash.js -o $@

$(LIBS)/qunit-1.15.0.js:
	curl -f -L http://code.jquery.com/qunit/qunit-1.15.0.js -o $@

$(LIBS)/qunit-1.15.0.css:
	curl -f -L http://code.jquery.com/qunit/qunit-1.15.0.css -o $@

$(LIBS)/require.js:
	curl -f -L http://requirejs.org/docs/release/2.1.14/minified/require.js -o $@

$(LIBS)/stacktrace.js:
	curl -f -L https://rawgithub.com/stacktracejs/stacktrace.js/stable/stacktrace.js -o $@

$(LIBS)/loggly.tracker.js:
	curl -f -L https://raw.githubusercontent.com/loggly/loggly-jslogger/master/src/loggly.tracker.js -o $@

$(LIBS)/stats.min.js:
	curl -f -L https://raw.githubusercontent.com/mrdoob/stats.js/master/build/stats.min.js -o $@

$(LIBS)/jquery-ui.css:
	curl -f -L http://code.jquery.com/ui/1.10.0/themes/smoothness/jquery-ui.css -o $@

$(LIBS)/jquery-ui.js:
	curl -f -L http://code.jquery.com/ui/1.10.0/jquery-ui.js -o $@


$(LIBS)/bootstrap-3.2.0-dist/js/bootstrap.min.js $(LIBS)/bootstrap-3.2.0-dist/css/bootstrap.min.css:
	cd $(LIBS); curl -f -L -O https://github.com/twbs/bootstrap/releases/download/v3.2.0/bootstrap-3.2.0-dist.zip
	cd $(LIBS); unzip -o bootstrap-3.2.0-dist.zip
	cd $(LIBS); rm bootstrap-3.2.0-dist.zip

$(LIBS)/easyXDM/easyXDM.min.js:
	mkdir -p $(LIBS)/easyXDM
	cd $(LIBS)/easyXDM; curl -f -L -O https://github.com/oyvindkinsey/easyXDM/releases/download/2.4.19/easyXDM-2.4.19.3.zip
	cd $(LIBS)/easyXDM; unzip -o easyXDM-2.4.19.3.zip
	cd $(LIBS)/easyXDM; rm easyXDM-2.4.19.3.zip

$(LIBS)/font-awesome-4.3.0/css/font-awesome.min.css:
	cd $(LIBS); curl -f -L -O http://fontawesome.io/assets/font-awesome-4.3.0.zip
	cd $(LIBS); unzip -o font-awesome-4.3.0.zip
	cd $(LIBS); rm font-awesome-4.3.0.zip

$(LIBS)/dojo-release-1.10.0-src/dijit/themes/claro/claro.css \
$(LIBS)/dojo-release-1.10.0-src/dojox/layout/resources/FloatingPane.css \
$(LIBS)/dojo-release-1.10.0-src/dojox/layout/resources/ResizeHandle.css \
$(LIBS)/dojo-release-1.10.0-src/util/buildscripts/build.sh:
	cd $(LIBS); curl -f -L -O http://download.dojotoolkit.org/release-1.10.0/dojo-release-1.10.0-src.tar.gz
	cd $(LIBS); tar -xvzf dojo-release-1.10.0-src.tar.gz
	cd $(LIBS); rm dojo-release-1.10.0-src.tar.gz

js-build: dependencies js-build-mkdir js-build/deps.js js-build/deps.css js-build/build-succeded

js-build-mkdir:
	mkdir -p js-build

$(LIBS)/dojo-release-1.10.0-src/dijit/themes/claro/claro.css \
$(LIBS)/dojo-release-1.10.0-src/dojox/layout/resources/FloatingPane.css \
$(LIBS)/dojo-release-1.10.0-src/dojox/layout/resources/ResizeHandle.css \
js-build/build-succeded: $(DEPENDENCIES)
	cd $(LIBS)/dojo-release-1.10.0-src/util/buildscripts; ./build.sh --dojoConfig ../../../../main.profile.js --release
	touch $@

js-build/deps.js: $(JSDEPS)
	cat $^ > $@

js-build/deps.css: $(CSSDEPS)
	cat $^ > $@

clean-js-build:
	rm -rf js-build

clean-dependencies:
	rm -rf $(DEPENDENCIES)

clean: clean-js-build clean-dependencies
