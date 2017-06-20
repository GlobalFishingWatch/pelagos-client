if (false) {
  define([], function () {});
}

(function () {
  var def = define;

  if (window.ol != undefined) {
    def([], function () { return window.ol; });
  } else {
    def(["libs/bower-ol3/build/ol"], function (ol) {
      return ol;
    });
  }
})();

