define([
], function(
){
  var root = require.toUrl("app").concat("/../../img");

  if (navigator.appName == 'Microsoft Internet Explorer' || /MSIE/i.test(navigator.userAgent) || /Edge/i.test(navigator.userAgent)) {
    return root.concat("/loader/spinner.min.gif");
  } else {
    return root.concat("/loader/spinner.min.svg");
  }
});
