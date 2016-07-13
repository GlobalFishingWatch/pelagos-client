if (false) {
  define([], function () {});
}

(function () {
  var def = define;
  var req = require;

  if (window.StackTrace != undefined) {
    def([], function () { return window.StackTrace; });
  } else {
    window.stacktraceShimLoader = function (req, callback) {
      delete window.stacktraceShimLoader;

      req(["shims/jQuery/main"], function($) {
        $.get(req.toUrl("libs/stacktrace-js/dist/stacktrace-with-polyfills.min.js"), function (script) {
          var tmp = {require: window.require, define: window.define, module: window.module};
          delete window.require;
          delete window.define;
          delete window.module;

          // Evaluate in the global scope, see http://stackoverflow.com/questions/9107240/1-evalthis-vs-evalthis-in-javascript
          (1, eval)(script);

          window.define = tmp.define;
          window.require = tmp.require;
          window.module = tmp.module;

          callback(window.StackTrace);
        }, 'text');
      });
    };

    def(["shims/DefineCallback!stacktraceShimLoader"], function (StackTrace) {
      return StackTrace;
    });
  }
})();
