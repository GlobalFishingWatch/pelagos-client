define([
  "shims/QUnit/main",
  "app/Test"
], function (
  QUnit,
  Test
) {
  return function () {
    $(document).ready(function () {
      apptest = new Test();
    });
  };
});
