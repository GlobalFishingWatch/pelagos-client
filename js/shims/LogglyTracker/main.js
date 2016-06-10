if (false) {
  define([], function () {});
}

(function () {
  var def = define;

  if (window.LogglyTracker != undefined) {
    def([], function () { return window.LogglyTracker; });
  } else {
    def(["libs/loggly-jslogger/src/loggly.tracker.min"], function () {
      return window.LogglyTracker;
    });
  }
})();

