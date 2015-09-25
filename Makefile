LIBS=js/libs

JSDEPS= \
  $(LIBS)/async/lib/async.js \
  $(LIBS)/stacktrace-js/stacktrace.js \
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

prerequisites:
	if ! command -v node >/dev/null 2>&1; then curl -sL https://deb.nodesource.com/setup_0.12 | bash - 2>&1; fi
	if ! command -v google-chrome >/dev/null 2>&1; then wget -q -O - "https://dl-ssl.google.com/linux/linux_signing_key.pub" | apt-key add - 2>&1; echo 'deb http://dl.google.com/linux/chrome/deb/ stable main' >> /etc/apt/sources.list.d/google-chrome.list; fi
	apt-get update 2>&1
	apt-get install -y nodejs unzip openjdk-6-jre xvfb chromium-browser google-chrome-stable libglapi-mesa libosmesa6 mesa-utils python python-dev python-pip git 2>&1
	if ! command -v testem >/dev/null 2>&1; then npm install testem -g 2>&1; fi
	pip install -r requirements.txt 2>&1
	pip install chromedriver_installer --install-option="--chromedriver-version=2.10" 2>&1

clean: clean-js-build clean-dependencies

unit-tests:
	xvfb-run -s "-screen 0 1280x1024x24" testem -l Chromium ci --timeout 60

integration-tests:
	xvfb-run -s "-screen 0 1280x1024x24" nosetests -s -w ui_tests

dev-server:
	ui_tests/server.py

test-server:
	ui_tests/server.py --selenium
