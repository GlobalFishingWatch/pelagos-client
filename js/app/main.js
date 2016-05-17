define([
"require"
], function (
  require
) {
  app = {};

  app.paths = app.paths || {};

  var mainUrl = require.toUrl(".");
  app.paths.script = mainUrl.split("/").slice(0, -1);
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

  if (app.useBuild) {
    app.dependencies.stylesheets = app.dependencies.stylesheets.concat([
      "$(build)s/deps.css",
      "$(lib)s/dojo-theme-flat/CSS/dojo/flat.css",
      {url: "$(script)s/../style.less", rel:"stylesheet/less"}
    ]);
  } else {
    app.dependencies.stylesheets = app.dependencies.stylesheets.concat([
      "$(lib)s/font-awesome/css/font-awesome.min.css",
      "$(lib)s/dojo-theme-flat/CSS/dojo/flat.css",
      "$(lib)s/cartodb.js/themes/css/cartodb.css",
      "$(lib)s/dojox/layout/resources/FloatingPane.css",
      "$(lib)s/dojox/layout/resources/ResizeHandle.css",
      {url: "$(script)s/../style.less", rel:"stylesheet/less"},
    ]);
  }

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


  /* Code to load the above dependencies */

  function addHeadStylesheet(stylesheet) {
    if (typeof(stylesheet) == "string") stylesheet = {url: stylesheet};
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.rel = stylesheet.rel || 'stylesheet';
    link.type = stylesheet.type || 'text/css';
    link.href = stylesheet.url;
    head.appendChild(link);
  }

  app.dependencies.stylesheets.map(addHeadStylesheet);
  require([
    "shims/GoogleMaps/main",
    "shims/async/main",
    "shims/CanvasLayer/main",
    "shims/cartodb/main",
    "shims/jQuery/main",
    "shims/less/main",
    "shims/lodash/main",
    "shims/LogglyTracker/main",
    "shims/QUnit/main",
    "shims/stacktrace/main",
    "shims/Stats/main"
  ], function (
     GoogleMaps,
     async,
     CanvasLayer,
     cartodb,
     jQuery,
     less,
     lodash,
     LogglyTracker,
     QUnit,
     stacktrace,
     Stats
  ) {
    require([
      "app/UrlValues",
      "app/Visualization/Visualization",
      "shims/jQuery/main"
    ], function (
      UrlValues,
      Visualization,
      $
    ) {
      $(document).ready(function () {
        visualization = new Visualization('#visualization');
      });
    });
  });
});
