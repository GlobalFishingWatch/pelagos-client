define(['app/UrlValues', 'app/Visualization/Visualization', 'jQuery'], function (UrlValues, Visualization, $) {
  return function () {
    $(document).ready(function () {
      visualization = new Visualization('#visualization');
    });
  };
});
