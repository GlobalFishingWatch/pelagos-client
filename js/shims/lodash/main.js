if (false) {
  define([], function () {});
}

(function () {
  var def = define;

  if (window._ != undefined) {
    def([], function () { return window._; });
  } else {
    def(["libs/lodash/lodash.min"], function (_) {
      return _;
    });
  }
})();
