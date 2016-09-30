define([
], function(
){
  var app = require.toUrl("app");
  return {
    app: app,
    root: app.concat("/../.."),
    script: app.concat("/.."),
    img: app.concat("/../../img")
  };
});

