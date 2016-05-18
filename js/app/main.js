define([
"require"
], function (
  require
) {
  require([
    "shims/Styles",
    "app/Visualization/Visualization",
    "app/Visualization/UI/UIManager",
    "shims/less/main",
    "shims/async/main",
    "shims/jQuery/main"
  ], function (
    Styles,
    Visualization,
    UIManager,
    less,
    async,
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
      visualization.init(function () {
        visualization.ui = new UIManager(visualization);
        async.series([
          visualization.ui.init.bind(visualization.ui),
          visualization.loadConfiguration.bind(visualization),
          visualization.load.bind(visualization, undefined)
        ]);
      });
    });
  });
});
