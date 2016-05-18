define([
  "shims/async/main",
  "shims/jQuery/main",
  "app/Visualization/Visualization",
  "app/Visualization/UI/UIManager"
], function (
  async,
  $,
  Visualization,
  UIManager
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
