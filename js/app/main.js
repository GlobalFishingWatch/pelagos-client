define([
"require"
], function (
  require
) {
  require([
    "app/Visualization/Visualization",
    "app/Visualization/UI/UIManager",
    "shims/async/main",
    "shims/jQuery/main"
  ], function (
    Visualization,
    UIManager,
    async,
    $
  ) {
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
