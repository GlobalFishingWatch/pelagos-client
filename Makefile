LIBS=js/libs

JSDEPS= \
  $(LIBS)/async/lib/async.js \
  $(LIBS)/stacktrace-js/dist/stacktrace-with-polyfills.min.js \
  $(LIBS)/lodash/lodash.js \
  $(LIBS)/jquery/dist/jquery.js \
  $(LIBS)/jquery-mousewheel/jquery.mousewheel.js \
  $(LIBS)/less/dist/less.js \
  $(LIBS)/stats.js/build/stats.min.js \
  $(LIBS)/loggly-jslogger/src/loggly.tracker.js

CSSDEPS= \
  $(LIBS)/font-awesome/css/font-awesome.min.css

DEPENDENCIES= $(JSDEPS) $(CSSDEPS) \
  $(LIBS)/easyXDM/easyXDM.min.js \
  $(LIBS)/util/buildscripts/build.sh

.PHONY: all prerequisites dependencies js-build clean clean-js-build clean-dependencies unit-tests integration-tests dev-server test-server

all: js-build

dependencies: $(DEPENDENCIES)

node_modules/.bin/bower:
	npm install bower

$(DEPENDENCIES): node_modules/.bin/bower
	node_modules/.bin/bower install
	touch $@

js-build: dependencies js-build-mkdir js-build/deps.js js-build/deps.css js-build/build-succeded

js-build-mkdir:
	mkdir -p js-build

js-build/build-succeded: dependencies
	cd $(LIBS)/util/buildscripts; ./build.sh --dojoConfig ../../../main.profile.js --release --bin node > build-log || { cat build-log; exit 1; }
	touch $@

js-build/deps.js: $(JSDEPS) js/CanvasLayer.js js/dojoconfig.js
	cat $^ > $@

js-build/deps.css: $(CSSDEPS)
	cat $^ | sed -e "s+../fonts/fontawesome+../js/libs/font-awesome/fonts/fontawesome+g" > $@

clean-js-build:
	rm -rf js-build

clean-dependencies:
	rm -rf js/libs

clean: clean-js-build clean-dependencies

prerequisites:
	curl -sL https://deb.nodesource.com/setup_0.12 | bash -
	apt-get update
	apt-get install -y firefox chromium-browser nodejs unzip openjdk-6-jre xvfb python python-dev python-pip git-core libglapi-mesa libosmesa6 mesa-utils
	npm install -g testem
	pip install --upgrade pip
	pip install -r requirements.txt

unit-tests:
	xvfb-run -a -s "-ac -screen 0 1280x1024x24" -l $(TESTEM_PATH)testem$(TESTEM_SUFFIX) ci

integration-tests:
	xvfb-run -a -s "-ac -screen 0 1280x1024x24" -l nosetests -s -w ui_tests

dev-server:
	ui_tests/server.py

test-server:
	ui_tests/server.py --selenium
