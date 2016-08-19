LIBS=js/libs

JSDEPS= \
  $(LIBS)/async/lib/async.js \
  $(LIBS)/stacktrace-js/dist/stacktrace-with-polyfills.min.js \
  $(LIBS)/lodash/lodash.js \
  $(LIBS)/jquery/dist/jquery.js \
  $(LIBS)/jquery-mousewheel/jquery.mousewheel.js \
  $(LIBS)/less/dist/less.js \
  $(LIBS)/stats.js/build/stats.min.js \
  $(LIBS)/loggly-jslogger/src/loggly.tracker.js \
  $(LIBS)/cartodb.js/cartodb.js \
  $(LIBS)/cartodb.js/cartodb.mod.torque.js \
  $(LIBS)/clipboard.js/clipboard.min.js

CSSDEPS= \
  $(LIBS)/font-awesome/css/font-awesome.min.css \
  $(LIBS)/cartodb.js/themes/css/cartodb.css


DEPENDENCIES= $(JSDEPS) $(CSSDEPS) \
  $(LIBS)/easyXDM/easyXDM.min.js \
  $(LIBS)/util/buildscripts/build.sh

.PHONY: all prerequisites dependencies js-build clean clean-js-build clean-dependencies clean-integration-tests unit-tests integration-tests dev-server test-server

all: js-build js-docs

dependencies: $(DEPENDENCIES)

node_modules/.bin/bower:
	npm install bower

$(DEPENDENCIES): node_modules/.bin/bower
	node_modules/.bin/bower install
	touch $@

node_modules/.bin/jsdoc:
	npm install jsdoc

js-docs: node_modules/.bin/jsdoc
	node_modules/.bin/jsdoc -a all -p -r -d docs/jsdoc -c jsdoc/jsdoc.json js/app

js-build: dependencies js-build-mkdir js-build/deps.js js-build/deps.css js-build/libs js-build/build-succeded

js-build-mkdir:
	mkdir -p js-build

js-build/build-succeded: dependencies
	cd $(LIBS)/util/buildscripts; ./build.sh --dojoConfig ../../../main.profile.js --release --bin node > build-log || { cat build-log; exit 1; }
	touch $@

js-build/deps.js: $(JSDEPS) js/app/CanvasLayer.js
	for name in $^; do cat $$name; echo; done > $@

js-build/deps.css: $(CSSDEPS)
	cat $^ | sed -e "s+../fonts/fontawesome+../js/libs/font-awesome/fonts/fontawesome+g" > $@

js-build/libs: dependencies
	cp -a js/libs js-build/libs

clean-js-build:
	rm -rf js-build

clean-dependencies:
	rm -rf js/libs

clean-integration-tests:
	rm -rf ui_tests/data/testtiles

clean: clean-js-build clean-dependencies clean-integration-tests

prerequisites:
	curl -sL https://deb.nodesource.com/setup_0.12 | bash -
	apt-get update
	apt-get install -y firefox chromium-browser nodejs unzip openjdk-6-jre xvfb python python-dev python-pip git-core libglapi-mesa libosmesa6 mesa-utils
	npm install -g testem
	pip install --upgrade pip
	pip install -r requirements.txt

unit-tests: dependencies
	xvfb-run -a -s "-ac -screen 0 1280x1024x24" -l $(TESTEM_PATH)testem$(TESTEM_SUFFIX) ci

integration-tests: dependencies
	xvfb-run -a -s "-ac -screen 0 1280x1024x24" -l nosetests -s -w ui_tests

dev-server: dependencies
	ui_tests/server.py

test-server: dependencies
	ui_tests/server.py --selenium
