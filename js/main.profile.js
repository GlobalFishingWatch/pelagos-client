dojoConfig = {
  isDebug: true,
  async: true,
  layerOptimize: "closure",
  baseUrl: '.',
  releaseDir: '../js-build',
  packages: [
      {name: "dojo", location:"libs/dojo-release-1.10.0-src/dojo"},
      {name: "dijit", location:"libs/dojo-release-1.10.0-src/dijit"},
      {name: "dojox", location:"libs/dojo-release-1.10.0-src/dojox"},

      {name: 'bootstrap', location: 'shims/bootstrap'},
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
  deps:['app/main'],
  layers: {
      "app/app": {
          include: [ "app/main" ]
     }
  }
};
