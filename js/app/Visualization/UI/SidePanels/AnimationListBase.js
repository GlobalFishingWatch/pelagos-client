define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container"
], function(
  declare,
  domStyle,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container
){
  var AnimationListBase = declare("AnimationListBase", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    baseClass: 'AnimationListBase',
    templateString: '<div class="${baseClass}">' +
                    '  <div class="${baseClass}Container" data-dojo-attach-point="containerNode"></div>' +
                    '</div>',
    title: 'Animation list',
    startup: function () {
      var self = this;
      self.inherited(arguments);
      var parent = self.getParent();

      self.animationList = {};
      parent.visualization.animations.events.on({
        'add': self.addHandler.bind(self),
        'remove': self.removeHandler.bind(self)
      });
    },

    addHandler: function (event) {
      var self = this;
      var animation = event.animation;

      if (self.animationFilter(animation)) {
        self.animationList[animation.id] = new self.constructor.AnimationWidget({
          animation: animation
        });
        self.addChild(self.animationList[animation.id]);
      }
    },

    removeHandler: function (event) {
      var self = this;
      var animation = event.animation;

      if (self.animationList[animation.id]) {
        self.removeChild(self.animationList[animation.id]);
        delete self.animationList[animation.id];
      }
    },

    animationFilter: function (animation) {
      return true;
    }
  });

  AnimationListBase.AnimationWidget = declare("AnimationWidget", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    baseClass: 'AnimationListBase-AnimationWidget',
    templateString: '<div class="${baseClass}">' +
                    '  <h2 data-dojo-attach-point="titleNode">${animation.title}</h2>' +
                    '  <table class="${baseClass}Container" data-dojo-attach-point="containerNode" style="width: 100%;"></table>' +
                    '</div>',
    animation: null
  });

  return AnimationListBase;
});
