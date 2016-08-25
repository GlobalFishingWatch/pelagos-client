if (false) {
  define([], function () {});
}

(function () {
  var def = define;

  if (window.clipboard != undefined) {
    def([], function () { return window.clipboard; });
  } else {
    def(["libs/clipboard.js/clipboard.min"], function (clipboard) {
      return clipboard;
    });
  }
})();
