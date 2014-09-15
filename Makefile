LIBS=js/libs

DEPENDENCIES=$(LIBS)/async.js $(LIBS)/jquery-1.10.2.min.js $(LIBS)/jquery-1.10.2.min.map $(LIBS)/jquery.mousewheel.js $(LIBS)/less-1.7.4.min.js $(LIBS)/lodash.js $(LIBS)/qunit-1.15.0.js $(LIBS)/qunit-1.15.0.css $(LIBS)/require.js $(LIBS)/stacktrace.js $(LIBS)/loggly.tracker.js $(LIBS)/stats.min.js $(LIBS)/bootstrap-3.2.0-dist $(LIBS)/easyXDM $(LIBS)/font-awesome-4.2.0 $(LIBS)/dojo-release-1.10.0-src

.PHONY: all dependencies clean clean-jsbuild clean-dependencies

all: js-build dependencies

dependencies: $(DEPENDENCIES)

$(LIBS)/async.js:
	curl -L https://raw.githubusercontent.com/caolan/async/master/lib/async.js > $@

$(LIBS)/jquery-1.10.2.min.js:
	curl -L http://code.jquery.com/jquery-1.10.2.min.js > $@

$(LIBS)/jquery-1.10.2.min.map:
	curl -L http://code.jquery.com/jquery-1.10.2.min.map > $@

$(LIBS)/jquery.mousewheel.js:
	curl -L https://raw.githubusercontent.com/brandonaaron/jquery-mousewheel/master/jquery.mousewheel.js > $@

$(LIBS)/less-1.7.4.min.js:
	curl -L https://raw.github.com/less/less.js/master/dist/less-1.7.4.min.js > $@

$(LIBS)/lodash.js:
	curl -L https://raw.github.com/lodash/lodash/2.4.1/dist/lodash.js > $@

$(LIBS)/qunit-1.15.0.js:
	curl -L http://code.jquery.com/qunit/qunit-1.15.0.js > $@

$(LIBS)/qunit-1.15.0.css:
	curl -L http://code.jquery.com/qunit/qunit-1.15.0.css > $@

$(LIBS)/require.js:
	curl -L http://requirejs.org/docs/release/2.1.14/minified/require.js > $@

$(LIBS)/stacktrace.js:
	curl -L https://rawgithub.com/stacktracejs/stacktrace.js/master/stacktrace.js > $@

$(LIBS)/loggly.tracker.js:
	curl -L https://raw.githubusercontent.com/loggly/loggly-jslogger/master/src/loggly.tracker.js > $@

$(LIBS)/stats.min.js:
	curl -L https://raw.githubusercontent.com/mrdoob/stats.js/master/build/stats.min.js > $@


$(LIBS)/bootstrap-3.2.0-dist:
	cd $(LIBS); curl -L -O https://github.com/twbs/bootstrap/releases/download/v3.2.0/bootstrap-3.2.0-dist.zip
	cd $(LIBS); unzip -o bootstrap-3.2.0-dist.zip
	cd $(LIBS); rm bootstrap-3.2.0-dist.zip

$(LIBS)/easyXDM:
	mkdir $(LIBS)/easyXDM
	cd $(LIBS)/easyXDM; curl -L -O https://github.com/oyvindkinsey/easyXDM/releases/download/2.4.19/easyXDM-2.4.19.3.zip
	cd $(LIBS)/easyXDM; unzip -o easyXDM-2.4.19.3.zip
	cd $(LIBS)/easyXDM; rm easyXDM-2.4.19.3.zip

$(LIBS)/font-awesome-4.2.0:
	cd $(LIBS); curl -L -O https://fortawesome.github.io/Font-Awesome/assets/font-awesome-4.2.0.zip
	cd $(LIBS); unzip -o font-awesome-4.2.0.zip
	cd $(LIBS); rm font-awesome-4.2.0.zip

$(LIBS)/dojo-release-1.10.0-src:
	cd $(LIBS); curl -L -O http://download.dojotoolkit.org/release-1.10.0/dojo-release-1.10.0-src.tar.gz
	cd $(LIBS); tar -xvzf dojo-release-1.10.0-src.tar.gz
	cd $(LIBS); rm dojo-release-1.10.0-src.tar.gz

js-build: $(DEPENDENCIES)
	cd $(LIBS)/dojo-release-1.10.0-src/util/buildscripts; ./build.sh --dojoConfig ../../../../main.profile.js --release

clean-jsbuild:
	rm -rf js-build

clean-dependencies:
	rm -rf $(DEPENDENCIES)

clean: clean-jsbuild clean-dependencies
