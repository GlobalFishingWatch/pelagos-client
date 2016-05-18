define([
  "shims/async/main",
  "shims/jQuery/main",
  "app/Visualization/Visualization"
], function (
  async,
  $,
  Visualization
) {
  $(document).ready(function () {
    visualization = new Visualization('#visualization');
    visualization.init(function () {
      async.series([
        visualization.loadConfiguration.bind(visualization),
        visualization.load.bind(visualization, undefined)
      ]);
    });
  });
});
