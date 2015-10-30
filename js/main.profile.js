dojoConfig = {
  isDebug: true,
  async: true,
  layerOptimize: "closure",
  cssOptimize: "comments.keepLines",
  cssOptimize: "comments",
  selectorEngine: "lite",
  baseUrl: '.',
  releaseDir: '../js-build',
  packages: [
      {name: "dojo", location:"libs/dojo"},
      {name: "dijit", location:"libs/dijit"},
      {name: "dojox", location:"libs/dojox"},

      {name: 'CanvasLayer', location: 'shims/CanvasLayer'},
      {name: 'Stats', location: 'shims/Stats'},
      {name: 'QUnit', location: 'shims/QUnit'},
      {name: 'jQuery', location: 'shims/jQuery'},
      {name: 'less', location: 'shims/less'},
      {name: 'async', location: 'shims/async'},
      {name: 'stacktrace', location: 'shims/stacktrace'},
      {name: 'LogglyTracker', location: 'shims/LogglyTracker'},
      {name: 'lodash', location: 'shims/lodash'},

      {name: 'app', location:'app', main: 'main'}
  ],
  deps:['app/main', "dojo/main"],
  layers: {
      "app/app": {
          include: [ "app/main", "dojo/dojo", "dijit", "dojox" ],
          boot: true
     }
  }
};
