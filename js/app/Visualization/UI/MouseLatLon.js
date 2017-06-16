define([
  "dojo/_base/declare",
  "./TemplatedContainer",
  "shims/jQuery/main",
  "libs/bower-ol3/build/ol"
], function(
  declare,
  TemplatedContainer,
  $,
  ol
) {
  return declare("MouseLatLon", [TemplatedContainer], {
    baseClass: 'MouseLatLon',

    visualisation: null,

    templateString: '' +
      '<div class="${baseClass}">' +
      '  <div class="${baseClass}Container" data-dojo-attach-point="containerNode">' +
      '    <div class="display" data-dojo-attach-point="displayNode"></div>' +
      '  </div>' +
      '</div>',

    startup: function () {
      var self = this;
      self.placeAt(self.visualization.node[0]);

      $(self.visualization.animations.node).mousemove(self.mouseMove.bind(self));
    },

    mouseMove: function (e) {
      var self = this;

      var coords = ol.proj.transform(
	  self.visualization.animations.map.getCoordinateFromPixel([e.pageX, e.pageY]),
	  self.visualization.animations.map.getView().getProjection(),
	  "EPSG:4326");

      var s = coords[1].toFixed(4) + ", " + coords[0].toFixed(4);
      $(self.displayNode).text(s);
    }
  });
});
