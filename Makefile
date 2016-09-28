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

.PHONY: all prerequisites js-build clean clean-js-build clean-dependencies clean-integration-tests unit-tests integration-tests dev-server test-server

all: js-build js-docs

.INTERMEDIATE: dependencies
dependencies: $(DEPENDENCIES)

node_modules/.bin/bower:
	npm install bower

node_modules/.bin/uglifyjs:
	npm install uglify-js

$(DEPENDENCIES): node_modules/.bin/bower
	node_modules/.bin/bower install
	touch $@

node_modules/.bin/jsdoc:
	npm install jsdoc

js-docs: node_modules/.bin/jsdoc
	node_modules/.bin/jsdoc -a all -p -r -d docs/jsdoc -c jsdoc/jsdoc.json js/app

js-build: js-build/build-succeded

js-dojo-build/build-succeded: dependencies node_modules/.bin/uglifyjs
	cd $(LIBS)/util/buildscripts; ./build.sh --dojoConfig ../../../main.profile.js --release --bin node > build-log || { cat build-log; exit 1; }
	touch $@

js-build/build-succeded: js-dojo-build/build-succeded js-build/deps.js js-build/deps.css
	mkdir -p js-build
	# Filter out all the non-compressed js files
	(cd js-dojo-build; find . -type d) | while read name; do mkdir -p "js-build/$$name"; done
	(cd js-dojo-build; find . -type f \! -name "*.js") | while read name; do cp "js-dojo-build/$$name" "js-build/$$name"; done
	(cd js/libs; find . -type d) | while read name; do mkdir -p "js-build/libs/$$name"; done
	(cd js/libs; find . -type f \! -name "*.js") | while read name; do cp "js/libs/$$name" "js-build/libs/$$name"; done
	cp js-dojo-build/app/app.js.uncompressed.js js-build/app/app.js.uncompressed.js
	cp js-dojo-build/app/nls/app_en-us.js js-build/app/nls/app_en-us.js
	cp js-dojo-build/app/TabletMeta.js js-build/app/TabletMeta.js
	# Minify app.js
	node_modules/.bin/uglifyjs js-build/app/app.js.uncompressed.js --screw-ie8 --keep-fnames --stats -o js-build/app/app.js
	touch $@

js-build/deps.js: $(JSDEPS) js/app/CanvasLayer.js
	mkdir -p js-build
	for name in $^; do cat $$name; echo; done > $@

js-build/deps.css: $(CSSDEPS)
	mkdir -p js-build
	cat $^ | sed -e "s+../fonts/fontawesome+../js-build/libs/font-awesome/fonts/fontawesome+g" > $@

clean-js-build:
	rm -rf js-build js-dojo-build

clean-dependencies:
	rm -rf js/libs

clean-integration-tests:
	rm -rf ui_tests/data/testtiles

clean: clean-js-build clean-dependencies clean-integration-tests

prerequisites:
	curl -sL https://deb.nodesource.com/setup_6.x | bash -
	apt-get update
	apt-get install -y firefox chromium-browser nodejs unzip openjdk-8-jre xvfb python python-dev python-pip git-core libglapi-mesa libosmesa6 mesa-utils
	npm install -g testem
	pip install --upgrade pip
	pip install -r requirements.txt
	pip install chromedriver_installer>=0.0.4 --install-option="--chromedriver-version=2.10"


unit-tests: dependencies
	xvfb-run -a -s "-ac -screen 0 1280x1024x24" -l $(TESTEM_PATH)testem$(TESTEM_SUFFIX) ci

integration-tests: dependencies
	xvfb-run -a -s "-ac -screen 0 1280x1024x24" -l nosetests -s -w ui_tests

dev-server: dependencies
	ui_tests/server.py

test-server: dependencies
	ui_tests/server.py --selenium
