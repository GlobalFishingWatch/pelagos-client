define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dojo/html",
  "app/Visualization/UI/SidePanels/SidePanelBase",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container"
], function(
  declare,
  domStyle,
  html,
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
    count: 0,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.emptyWidget = new self.EmptyWidget({visualization: self.visualization});
      self.addChild(self.emptyWidget);

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
        if (self.count == 0) {
          self.removeChild(self.emptyWidget);
        }
        self.count++;
        self.addChild(self.animationList[animation.id]);
      }
    },

    add: function () {
      var self = this;

      if (self.visualization.state.getValue('advanced')) {
        self.visualization.ui.addAnimation.show();
      } else {
        self.visualization.ui.library.show();
      }
    },

    removeHandler: function (event) {
      var self = this;
      var animation = event.animation;

      if (self.animationList[animation.id]) {
        self.removeChild(self.animationList[animation.id]);
        delete self.animationList[animation.id];
        self.count--;
        if (self.count == 0) {
          self.addChild(self.emptyWidget);
        }
      }
    },

    animationFilter: function (animation) {
      return true;
    },

    EmptyWidget: declare("EmptyWidget", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
      baseClass: 'AnimationListBase-EmptyWidget',
      templateString: '' +
        '<div class="${baseClass}" style="padding: 8px;">' +
        '  <em>No animations available<em>' +
        '</div>',
      visualization: null
    })
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

    startup: function () {
      var self = this;
      self.inherited(arguments)

      self.animation.events.on({
        updated: self.updatedHandler.bind(self)
      });
    },

    updatedHandler: function () {
      var self = this;
      html.set(self.titleNode, self.animation.title);
    },

    remove: function () {
      var self = this;

      self.visualization.animations.removeAnimation(self.animation);
    }
  });

  return AnimationListBase;
});
