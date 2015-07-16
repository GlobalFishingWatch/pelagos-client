define(["QUnit", 'app/Test'], function (QUnit, Test) {
  return function () {
    require(['/testem.js'], function (testem) {
      $(document).ready(function () {
        apptest = new Test();
      });
    });
  };
});
