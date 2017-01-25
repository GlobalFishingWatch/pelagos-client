define([
  "dojo/_base/declare",
  "app/Visualization/UI/TemplatedContainer",
  "app/Visualization/UI/ColorDropdown",
  "jQuery",
], function(
  declare,
  TemplatedContainer,
  ColorDropdown,
  $
){
  var Animation = declare("Animation", [TemplatedContainer], {
    templateString: '',
      '<div class="${baseClass}">' +
      '  <table>' +
      '    <tr><th>Type:</th><td data-dojo-attach-point="typeNode"></td></tr>' +
      '    <tr><th>Source type:</th><td data-dojo-attach-point="sourceTypeNode"></td></tr>' +
      '    <tr><th>Url:</th><td data-dojo-attach-point="urlNode"></td></tr>' +
      '    <tr><th>Title:</th><td><input type="text" data-dojo-attach-point="titleNode" data-dojo-attach-event="change:titleChanged"></td></tr>' +
      '    <tr><th>Color:</th><td data-dojo-attach-point="colorNode"></td></tr>' +
      '  </table>' +
      '  <div data-dojo-attach-point="containerNode"></div>' +
      '</div>',

    animation: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.colorDropdown = new ColorDropdown({
        onChange: self.colorChanged.bind(self)
      });
      self.colorDropdown.placeAt(self.colorNode);
      self.colorDropdown.startup();


      self._update = self.update.bind(self);
      self.animation.events.on({updated: self._update});
      self.update();
    },

    destroy: function () {
      var self = this;
      self.inherited(arguments);
      self.animation.events.un({updated: self._update});
      self.colorDropdown.destroy();
    },

    update: {
      var self = this;
      self.colorDropdown.set("value", self.animation.color);
      self.typeNode.innerHTML = animation.name;
      self.sourceTypeNode.innerHTML = animation.args.source.type;
      self.urlNode.innerHTML = animation.args.source.args.url;
      $(self.titleNode).val(animation.title);
    },

    titleChanged: function () {
      var self = this;
      self.animation.title = $(self.titleNode).val();
      self.animation.events.triggerEvent("updated");
    },

    colorChanged: function () {
      var self = this;
      self.animation.color = self.colorDropdown.get("value");
      self.animation.events.triggerEvent("updated");
    }
  });

  Animation.registry = {};

  /* Registered names must match animation class names (subclasses of
   * app/Visualization/Animation/Animation) */
  Animation.registry.Animation = Animation;

  return Animation;
}
