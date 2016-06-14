define([
  "shims/QUnit/main",
  "app/Test"
], function (
  QUnit,
  Test
) {
  $(document).ready(function () {
    apptest = new Test();
    QUnit.start();
  });
});
