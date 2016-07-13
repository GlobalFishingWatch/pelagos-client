if (false) {
  define([], function () {});
}

(function () {
  var def = define;

  if (window.async != undefined) {
    def([], function () { return window.async; });
  } else {
    def(["libs/async/lib/async"], function (async) {
      return async;
    });
  }
})();

