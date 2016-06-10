if (false) {
  define([], function () {});
}

(function () {
  var def = define;

  if (window.StackTrace != undefined) {
    def([], function () { return window.StackTrace; });
  } else {
    define([ /* "libs/stacktrace-js/dist/stacktrace-with-polyfills.min.js" */], function (StackTrace) {
      return window.StackTrace;
    });
  }
})();
