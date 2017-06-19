define([
  "dojo/_base/declare",
  "./TemplatedContainer",
  "shims/jQuery/main"
], function(
  declare,
  TemplatedContainer,
  $
) {
  return declare("ZoomButtons", [TemplatedContainer], {
    baseClass: 'ZoomButtons',

    visualisation: null,

    templateString: '' +
      '<div class="${baseClass} data-dojo-attach-point="containerNode">' +
      '  <div class="zoomIn" data-dojo-attach-event="click:zoomIn">+</div>' +
      '  <div class="zoomDivider"></div>' +
      '  <div class="zoomOut" data-dojo-attach-event="click:zoomOut">-</div>' +
      '</div>',

    startup: function () {
      var self = this;
      self.placeAt(self.visualization.node[0]);
    },

    zoomIn: function () {
      var self = this;
      var view = self.visualization.animations.map.getView();
      view.setZoom(view.getZoom() + 1);
    },
    zoomOut: function () {
      var self = this;
      var view = self.visualization.animations.map.getView();
      view.setZoom(view.getZoom() - 1);
    }
  });
});
