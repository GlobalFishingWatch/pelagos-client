define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "app/Visualization/UI/SidePanels/SidePanelBase",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container"
], function(
  declare,
  domStyle,
  SidePanelBase,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container
){
  var AnimationListBase = declare("AnimationListBase", [SidePanelBase], {
    baseClass: 'AnimationListBase',
    title: 'Animation list',
    visualization: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.animationList = {};
      self.visualization.animations.events.on({
        'add': self.addHandler.bind(self),
        'remove': self.removeHandler.bind(self)
      });
    },

    addHandler: function (event) {
      var self = this;
      var animation = event.animation;

      if (self.animationFilter(animation)) {
        self.animationList[animation.id] = new self.constructor.AnimationWidget({
          visualization: self.visualization,
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
    templateString: '' +
      '<div class="${baseClass}">' +
      '  <h2 data-dojo-attach-point="titleNode">${animation.title}</h2>' +
      '  <table class="${baseClass}Container" data-dojo-attach-point="containerNode" style="width: 100%;"></table>' +
      '</div>',
    visualization: null,
    animation: null,

    remove: function () {
      var self = this;

      self.visualization.animations.removeAnimation(self.animation);
    }
  });

  return AnimationListBase;
});
