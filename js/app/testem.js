define(["QUnit", '/testem.js', 'app/Test'], function (QUnit, testem, Test) {
  return function () {
    $(document).ready(function () {
      apptest = new Test();
    });
  };
});
