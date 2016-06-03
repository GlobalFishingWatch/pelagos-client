define(["libs/loggly-jslogger/src/loggly.tracker.min"], function () {
  if (typeof LogglyTracker == "undefined") {
    return undefined;
  } else {
    return LogglyTracker;
  }
});
