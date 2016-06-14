define([
  "shims/QUnit/main",
  "app/Test",
], function (
  QUnit,
  Test
) {
  require(["/testem.js"], function () {
    $(document).ready(function () {
      apptest = new Test();
      QUnit.start();
    });
  });
});
