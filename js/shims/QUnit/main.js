if (false) {
  define([], function () {});
}

(function () {
  var def = define;

  if (window.QUnit != undefined) {
    def([], function () { return window.QUnit; });
  } else {
    def(["libs/qunit/qunit/qunit"], function () {
      return window.QUnit;
    });
  }
})();
