define([
  "app/Class",
  "app/Data/Format",
  "app/Data/TiledBinFormat",
  "app/Data/TMSTileBounds"
], function(
  Class,
  Format,
  TiledBinFormat,
  TMSTileBounds
) {
  var TMSTiledBinFormat = Class(TiledBinFormat, {
    name: "TMSTiledBinFormat",

    TileBounds: TMSTileBounds
  });
  Format.formatClasses.TMSTiledBinFormat = TMSTiledBinFormat;
  return TMSTiledBinFormat;
});