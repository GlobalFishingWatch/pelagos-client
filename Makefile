LIBS=js/libs

DEPENDENCIES=$(LIBS)/async.js $(LIBS)/jquery-1.10.2.min.js $(LIBS)/jquery-1.10.2.min.map $(LIBS)/jquery.mousewheel.js $(LIBS)/less-1.7.4.min.js $(LIBS)/lodash.js $(LIBS)/qunit-1.15.0.js $(LIBS)/qunit-1.15.0.css $(LIBS)/require.js $(LIBS)/stacktrace.js $(LIBS)/loggly.tracker.js $(LIBS)/stats.min.js $(LIBS)/bootstrap-3.2.0-dist $(LIBS)/easyXDM $(LIBS)/font-awesome-4.2.0 $(LIBS)/dojo-release-1.10.0-src

.PHONY: all dependencies clean clean-jsbuild clean-dependencies

all: js-build dependencies

dependencies: $(DEPENDENCIES)

$(LIBS)/async.js:
	wget -O $@ https://raw.githubusercontent.com/caolan/async/master/lib/async.js

$(LIBS)/jquery-1.10.2.min.js:
	wget -O $@ http://code.jquery.com/jquery-1.10.2.min.js

$(LIBS)/jquery-1.10.2.min.map:
	wget -O $@ http://code.jquery.com/jquery-1.10.2.min.map

$(LIBS)/jquery.mousewheel.js:
	wget -O $@ https://raw.githubusercontent.com/brandonaaron/jquery-mousewheel/master/jquery.mousewheel.js

$(LIBS)/less-1.7.4.min.js:
	wget -O $@ https://raw.github.com/less/less.js/master/dist/less-1.7.4.min.js

$(LIBS)/lodash.js:
	wget -O $@ https://raw.github.com/lodash/lodash/2.4.1/dist/lodash.js

$(LIBS)/qunit-1.15.0.js:
	wget -O $@ http://code.jquery.com/qunit/qunit-1.15.0.js

$(LIBS)/qunit-1.15.0.css:
	wget -O $@ http://code.jquery.com/qunit/qunit-1.15.0.css

$(LIBS)/require.js:
	wget -O $@ http://requirejs.org/docs/release/2.1.14/minified/require.js

$(LIBS)/stacktrace.js:
	wget -O $@ https://rawgithub.com/stacktracejs/stacktrace.js/master/stacktrace.js

$(LIBS)/loggly.tracker.js:
	wget -O $@ https://raw.githubusercontent.com/loggly/loggly-jslogger/master/src/loggly.tracker.js

$(LIBS)/stats.min.js:
	wget -O $@ https://raw.githubusercontent.com/mrdoob/stats.js/master/build/stats.min.js


$(LIBS)/bootstrap-3.2.0-dist:
	cd $(LIBS); wget https://github.com/twbs/bootstrap/releases/download/v3.2.0/bootstrap-3.2.0-dist.zip
	cd $(LIBS); unzip bootstrap-3.2.0-dist.zip
	cd $(LIBS); rm bootstrap-3.2.0-dist.zip

$(LIBS)/easyXDM:
	mkdir $(LIBS)/easyXDM
	cd $(LIBS)/easyXDM; wget https://github.com/oyvindkinsey/easyXDM/releases/download/2.4.19/easyXDM-2.4.19.3.zip
	cd $(LIBS)/easyXDM; unzip easyXDM-2.4.19.3.zip
	cd $(LIBS)/easyXDM; rm easyXDM-2.4.19.3.zip

$(LIBS)/font-awesome-4.2.0:
	cd $(LIBS); wget https://fortawesome.github.io/Font-Awesome/assets/font-awesome-4.2.0.zip
	cd $(LIBS); unzip font-awesome-4.2.0.zip
	cd $(LIBS); rm font-awesome-4.2.0.zip

$(LIBS)/dojo-release-1.10.0-src:
	cd $(LIBS); wget http://download.dojotoolkit.org/release-1.10.0/dojo-release-1.10.0-src.tar.gz
	cd $(LIBS); tar -xvzf dojo-release-1.10.0-src.tar.gz
	cd $(LIBS); rm dojo-release-1.10.0-src.tar.gz

js-build: dependencies
	cd $(LIBS)/dojo-release-1.10.0-src/util/buildscripts; ./build.sh --dojoConfig ../../../../main.profile.js --release

clean-jsbuild:
	rm -rf js-build

clean-dependencies:
	rm -rf $(DEPENDENCIES)

clean: clean-jsbuild clean-dependencies
