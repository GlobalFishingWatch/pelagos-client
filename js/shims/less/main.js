if (false) {
  define([], function () {});
}

(function () {
  var def = define;

  if (window.less != undefined) {
    def([], function () { return window.less; });
  } else {
    def(["libs/less/dist/less.min"], function (less) {
      return window.less;
    });
  }
})()
