/* The list of tags was taken from http://stackoverflow.com/a/12270403/5397148 */
define([
  "shims/jQuery/main"
], function(
  $
) {
  if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
    tags = '<meta name="viewport" content="initial-scale=1.0,width=device-width,user-scalable=0" />';
  } else if (navigator.userAgent.match(/(Chrome)/g)) { 
    tags = '<meta name="viewport" content="initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,width=device-width,height=device-height,target-densitydpi=device-dpi,user-scalable=yes" />';
  } else {
    tags = '<meta name="viewport" content="initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,width=device-width,height=device-height,target-densitydpi=device-dpi,user-scalable=yes" />';
  }
  $("head").append(tags);
});
