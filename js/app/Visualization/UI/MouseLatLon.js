define([
  "dojo/_base/declare",
  "./TemplatedContainer",
  "shims/jQuery/main"
], function(
  declare,
  TemplatedContainer,
  $
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
      google.maps.event.addListener(self.visualization.animations.map, 'mousemove', self.mouseMove.bind(self));
    },

    mouseMove: function (e) {
      var self = this;
      var s = e.latLng.lat().toFixed(4) + ", " + e.latLng.lng().toFixed(4);
      $(self.displayNode).text(s);
    }
  });
});
