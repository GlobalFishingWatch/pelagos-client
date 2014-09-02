(function () {
  app.webworker = typeof importScripts != "undefined";

  if (!app.name) {
    if (app.webworker) {
      app.name = 'Webworker';
    } else {
      app.name = 'Main';
    }
  }

  app.paths = app.paths || {};

  if (app.webworker) {
    app.paths.script = location.toString().split("/").slice(0, -1);
  } else {
    app.paths.page = window.location.pathname.split("/").slice(0, -1);
    app.paths.script = document.querySelector('script[src$="deps.js"]').getAttribute('src').split("/").slice(0, -1);
    if (app.paths.script[0] != "") {
      app.paths.script = app.paths.page.concat(app.paths.script);
    }
  }

  app.paths.build = app.paths.script.slice(0, -1).concat(['js-build']);
  app.paths.lib = app.paths.script.concat(['libs']);
  if (app.useBuild) {
    app.paths.shim = app.paths.build;
    app.paths.app = app.paths.build.concat(['app']);
    app.paths.dojo = app.paths.build;
  } else {
    app.paths.shim = app.paths.script.concat("shims");
    app.paths.app = app.paths.script.concat(['app']);
    app.paths.dojo = app.paths.lib.concat(['dojo-release-1.10.0-src']);
  }

  app.dirs = app.dirs || {};
  for (var name in app.paths) {
    app.dirs[name] = app.paths[name].join("/");
  }

  app.dependencies = app.dependencies || {};
  app.dependencies.stylesheets = app.dependencies.stylesheets || [];
  app.dependencies.scripts = app.dependencies.scripts || [];
  app.packages = app.packages || [];

  app.dependencies.stylesheets = app.dependencies.stylesheets.concat([
    app.dirs.lib + "/bootstrap.min.css",
    app.dirs.lib + "/font-awesome-4.0.3/css/font-awesome.min.css",
    app.dirs.lib + "/qunit-1.14.0.css",

    {url: app.dirs.script + "/../style.less", rel:"stylesheet/less"}
  ]);
  if (app.useDojo) {
    app.dependencies.stylesheets = app.dependencies.stylesheets.concat([
      app.dirs.dojo + "/dijit/themes/claro/claro.css",

      app.dirs.dojo + "/dojox/layout/resources/FloatingPane.css",
      app.dirs.dojo + "/dojox/layout/resources/ResizeHandle.css"
    ]);
  }
  app.dependencies.scripts = app.dependencies.scripts.concat([
    app.dirs.lib + "/qunit-1.14.0.js",
    app.dirs.lib + "/async.js",
    app.dirs.lib + "/stacktrace.js",
  ]);
  if (!app.webworker) {
    app.dependencies.scripts = app.dependencies.scripts.concat([
      {url: "http://maps.googleapis.com/maps/api/js?libraries=visualization&sensor=false&callback=googleMapsLoaded", handleCb: function (tag, cb) { googleMapsLoaded = cb; }},
      app.dirs.lib + "/lodash.js",
      app.dirs.lib + "/jquery-1.10.2.min.js",
      app.dirs.lib + "/jquery.mousewheel.js",
      app.dirs.lib + "/less-1.6.2.min.js",
      app.dirs.lib + "/bootstrap.min.js",
      app.dirs.lib + "/CanvasLayer.js",
      app.dirs.lib + "/stats.min.js",
      app.dirs.lib + "/loggly.tracker.js"
    ]);
  }

  app.packages = app.packages.concat([
    {name: 'bootstrap', location: app.paths.shim.concat(['bootstrap']).join('/')},
    {name: 'CanvasLayer', location: app.paths.shim.concat(['CanvasLayer']).join('/')},
    {name: 'Stats', location: app.paths.shim.concat(['Stats']).join('/')},
    {name: 'QUnit', location: app.paths.shim.concat(['QUnit']).join('/')},
    {name: 'jQuery', location: app.paths.shim.concat(['jQuery']).join('/')},
    {name: 'less', location: app.paths.shim.concat(['less']).join('/')},
    {name: 'async', location: app.paths.shim.concat(['async']).join('/')},
    {name: 'stacktrace', location: app.paths.shim.concat(['stacktrace']).join('/')},
    {name: 'LogglyTracker', location: app.paths.shim.concat(['LogglyTracker']).join('/')},
    {name: 'lodash', location: app.paths.shim.concat(['lodash']).join('/')},
    {name: 'app', location:app.dirs.app, main: 'main'}
  ]);

  if (app.useDojo) {
    app.dependencies.scripts.push(app.dirs.script + "/dojoconfig.js");
    app.dependencies.scripts.push(app.dirs.dojo + "/dojo/dojo.js");
  } else {
    app.dependencies.scripts.push(app.dirs.lib + "/require.js");
    app.dependencies.scripts.push(app.dirs.script + "/requirejsconfig.js");
  }


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

  if (app.useBuild) {
    var realMain = main;
    main = function () {
      require(["app/app"], function (mainModule) {
        realMain();
      });
    }
  }

  if (app.webworker) {
    asyncmap(app.dependencies.scripts, addImportScript, main);
  } else {
    app.dependencies.stylesheets.map(addHeadStylesheet);
    asyncmap(app.dependencies.scripts, addHeadScript, main);
  }
})();
