dojoConfig = {
  isDebug: true,
  async: true,
  layerOptimize: "closure",
  cssOptimize: "comments.keepLines",
  cssOptimize: "comments",
  selectorEngine: "lite",
  baseUrl: '.',
  useSourceMaps: false,
  releaseDir: '../js-build',
  packages: [
      {name: "dojo", location:"libs/dojo"},
      {name: "dijit", location:"libs/dijit"},
      {name: "dojox", location:"libs/dojox"},

      {name: 'shims', location:'shims', main: 'main'},
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
