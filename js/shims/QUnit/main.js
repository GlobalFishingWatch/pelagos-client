if (false) {
  define(["shims/Styles"], function () {});
}

(function () {
  var def = define;

  if (window.QUnit != undefined) {
    def([], function () { return window.QUnit; });
  } else {
    def(["libs/qunit/qunit/qunit", "shims/Styles"], function (q, Styles) {
      Styles.add("libs/qunit/qunit/qunit.css");
      return window.QUnit;
    });
  }
})();
