(function () {
  if (!app.name) {
    app.name = 'Main';
  }

  app.paths = app.paths || {};

  app.paths.page = window.location.pathname.split("/").slice(0, -1);
  var depsUrl = document.querySelector('script[src$="deps.js"]').getAttribute('src');
  app.paths.script = depsUrl.split("/").slice(0, -1);
  if (app.paths.script[0] != "" && depsUrl.indexOf('://') == -1) {
    app.paths.script = app.paths.page.concat(app.paths.script);
  }
  app.paths.root = app.paths.script.slice(0, -1);

  app.paths.build = app.paths.root.concat(['js-build']);
  app.paths.lib = app.paths.script.concat(['libs']);
  app.paths.img = app.paths.root.concat(['img']);
  if (app.useBuild) {
    app.paths.shim = app.paths.build;
    app.paths.app = app.paths.build.concat(['app']);
  } else {
    app.paths.shim = app.paths.script.concat("shims");
    app.paths.app = app.paths.script.concat(['app']);
  }

  if (navigator.appName == 'Microsoft Internet Explorer' || /MSIE/i.test(navigator.userAgent) || /Edge/i.test(navigator.userAgent)) {
    app.paths.loader = app.paths.img.concat(["loader", "spinner.min.gif"]);
  } else {
    app.paths.loader = app.paths.img.concat(["loader", "spinner.min.svg"]);
  }

  app.dirs = app.dirs || {};
  for (var name in app.paths) {
    app.dirs[name] = app.paths[name].join("/");
  }

  app.dependencies = app.dependencies || {};
  app.dependencies.stylesheets = app.dependencies.stylesheets || [];
  app.dependencies.scripts = app.dependencies.scripts || [];
  app.packages = app.packages || [];

  if (app.useBuild) {
    app.dependencies.stylesheets = app.dependencies.stylesheets.concat([
      "$(build)s/deps.css",
      "$(lib)s/dojo-theme-flat/CSS/dojo/flat.css",
      {url: "$(script)s/../style.less", rel:"stylesheet/less"}
    ]);
    app.dependencies.scripts = app.dependencies.scripts.concat([
      {url: "http://maps.googleapis.com/maps/api/js?libraries=visualization&sensor=false&callback=googleMapsLoaded", handleCb: function (tag, cb) { googleMapsLoaded = cb; }},
        "$(build)s/deps.js",
      "$(build)s/app/app.js"
    ]);
  } else {
    app.dependencies.stylesheets = app.dependencies.stylesheets.concat([
      "$(lib)s/font-awesome/css/font-awesome.min.css",
      "$(lib)s/dojo-theme-flat/CSS/dojo/flat.css",
      "$(lib)s/dojox/layout/resources/FloatingPane.css",
      "$(lib)s/dojox/layout/resources/ResizeHandle.css",
      {url: "$(script)s/../style.less", rel:"stylesheet/less"},
    ]);
    app.dependencies.scripts = app.dependencies.scripts.concat([
      "$(lib)s/async/lib/async.js",
      "$(lib)s/stacktrace-js/dist/stacktrace-with-polyfills.min.js",
      "$(lib)s/lodash/lodash.min.js ",
      {url: "http://maps.googleapis.com/maps/api/js?libraries=visualization&sensor=false&callback=googleMapsLoaded", handleCb: function (tag, cb) { googleMapsLoaded = cb; }},
      "$(lib)s/jquery/dist/jquery.min.js",
      "$(lib)s/jquery-mousewheel/jquery.mousewheel.min.js",
      "$(lib)s/less/dist/less.min.js",
      "$(script)s/CanvasLayer.js", /* This should be a lib, but it's version hacked by CMU... */
      "$(lib)s/stats.js/build/stats.min.js",
      "$(lib)s/cartodb.js/cartodb.js",
      "$(lib)s/loggly-jslogger/src/loggly.tracker.min.js",
      "$(script)s/dojoconfig.js",
      "$(lib)s/dojo/dojo.js"
    ]);
  }

  app.packages = app.packages.concat([
    {name: 'CanvasLayer', location: '$(shim)s/CanvasLayer'},
    {name: 'Stats', location: '$(shim)s/Stats'},
    {name: 'jQuery', location: '$(shim)s/jQuery'},
    {name: 'less', location: '$(shim)s/less'},
    {name: 'async', location: '$(shim)s/async'},
    {name: 'stacktrace', location: '$(shim)s/stacktrace'},
    {name: 'LogglyTracker', location: '$(shim)s/LogglyTracker'},
    {name: 'lodash', location: '$(shim)s/lodash'},
    {name: "cartodb", location: "$(shim)s/cartodb"},
    {name: 'app', location:'$(app)s', main: 'main'}
  ]);

  /* Expand path variables */
  var replacePathVars = function(s) {
    for (var varName in app.dirs) {
      s = s.replace("$(" + varName +")s", app.dirs[varName]);
    }
    return s;
  }

  for (var depType in app.dependencies) {
    app.dependencies[depType] = app.dependencies[depType].map(function (item) {
      if (typeof(item) == 'string') {
        return replacePathVars(item)
      } else {
        item.url = replacePathVars(item.url);
        return item;
      }
    });
  }
  app.packages.map(function (pkg) {
    pkg.location = replacePathVars(pkg.location);
  });


  /* Code to load the above dependencies */

  function asyncmap (lst, fn, cb) {
    var res = [];
    var asyncmap = function (lst, fn, i) {
      if (i >= lst.length) {
        cb(null, res);
      } else {
        fn(lst[i], function (err, value) {
          if (err) {
            cb(err);
          } else {
            res.push(value);
            asyncmap(lst, fn, i+1);
          }
        });
      }
    }
    asyncmap(lst, fn, 0);
  }

  function addHeadScript(script, cb) {
    if (typeof(script) == "string") script = {url: script};
    var head = document.getElementsByTagName('head')[0];
    var tag = document.createElement('script');
    tag.type = script.type || 'text/javascript';
    tag.src = script.url;
    if (script.handleCb) {
      script.handleCb(tag, cb);
    } else {
      tag.onload = function () { cb(); };
    }
    head.appendChild(tag);
  }

  function addImportScript(script, cb) {
    if (typeof(script) == "string") script = {url: script};
    self.importScripts(script.url);
    if (script.handleCb) {
      var tag = {onload: cb};
      script.handleCb(tag, cb);
      tag.onload();
    } else {
      cb();
    }
  }

  function addHeadStylesheet(stylesheet) {
    if (typeof(stylesheet) == "string") stylesheet = {url: stylesheet};
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.rel = stylesheet.rel || 'stylesheet';
    link.type = stylesheet.type || 'text/css';
    link.href = stylesheet.url;
    head.appendChild(link);
  }

  var main = app.main;
  if (app.mainModule) {
    main = function () {
     require([app.mainModule], function (mainModule) {
       new mainModule();
     });
    }
  }
  app.dependencies.stylesheets.map(addHeadStylesheet);
  asyncmap(app.dependencies.scripts, addHeadScript, main);
})();
