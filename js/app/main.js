define([
"require"
], function (
  require
) {
  app = {};
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
    var stylesheets = [
      "libs/font-awesome/css/font-awesome.min.css",
      "libs/dojo-theme-flat/CSS/dojo/flat.css",
      "libs/dojox/layout/resources/FloatingPane.css",
      "libs/dojox/layout/resources/ResizeHandle.css",
      {url: "app/style.less", rel:"stylesheet/less"},
    ];

    stylesheets.map(Styles.add);

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
