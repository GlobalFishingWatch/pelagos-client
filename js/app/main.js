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
      "libs/font-awesome/css/font-awesome.min.css",
      "libs/dojo-theme-flat/CSS/dojo/flat.css",
      "libs/dojox/layout/resources/FloatingPane.css",
      "libs/dojox/layout/resources/ResizeHandle.css",
      {url: "app/style.less", rel:"stylesheet/less"},
    ]);
  }

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
    "shims/Stats/main",
    "shims/Styles",
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
     Stats,
     Styles
  ) {
    app.dependencies.stylesheets.map(Styles.add);

    less.registerStylesheets($("link[rel='stylesheet/less']"));
    less.refresh();

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
