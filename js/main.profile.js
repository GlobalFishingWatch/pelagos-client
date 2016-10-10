dojoConfig = {
  isDebug: true,
  async: true,
  cssOptimize: "comments.keepLines",
  cssOptimize: "comments",
  selectorEngine: "lite",
  baseUrl: '.',
  useSourceMaps: false,
  releaseDir: '../js-dojo-build',
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
  },
  localeList: ["ab", "ab-cd-ef", "ar", "az", "bg", "bs", "ca", "cs", "da", "de", "el", "en", "en-au", "en-ca", "en-gb", "en-us-hawaii", "en-us-new_york-brooklyn", "en-us-surfer", "en-us-texas", "es", "eu", "fa", "fi", "fr", "fr-ch", "he", "hi", "hr", "hu", "id", "it", "ja", "kk", "ko", "mk", "nb", "nl", "pl", "pt", "pt-pt", "ro", "ru", "sk", "sl", "sr", "sv", "sw", "th", "tr", "uk", "yi", "zh", "zh-cn", "zh-hant", "zh-hk", "zh-tw"]
};
