define([
"require"
], function (
  require
) {
  require([
    "shims/Styles",
    "app/UrlValues",
    "app/Visualization/Visualization",
    "shims/less/main",
    "shims/jQuery/main"
  ], function (
    Styles,
    UrlValues,
    Visualization,
    less,
    $
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

    $(document).ready(function () {
      visualization = new Visualization('#visualization');
    });
  });
});
