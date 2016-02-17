define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/UI/SidePanels/AnimationListBase",
  "dijit/form/HorizontalSlider",
  "jQuery"
], function(
  declare,
  domStyle,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  AnimationListBase,
  HorizontalSlider,
  $
){
  var SimpleLayerList = declare("SimpleLayerList", [AnimationListBase], {
    baseClass: 'SimpleLayerList',
    title: 'Layers',
    templateString: '' +
        '<div class="${baseClass}" style="overflow: auto;">' +
        '  <a class="edit-layers" style="font-weight: bold; position: absolute; right: 0.5em; margin-top: -2em; z-index: 1000000;" data-dojo-attach-event="click:edit">' +
            '<i class="fa fa-pencil-square-o"></i>' +
        '  </a>' +
        '  <div id="layers">' +
        '    <form class="layer-list" data-dojo-attach-point="containerNode"></form>' +
        '  </div>' +
          '</div>',
    edit: function () {
      var self = this;
      self.visualization.ui.simpleAnimationEditor.display();
    }
  });

  SimpleLayerList.AnimationWidget = declare("AnimationWidget", [AnimationListBase.AnimationWidget], {
    baseClass: 'SimpleLayerList-AnimationWidget',

    idCounter: 0,

    templateString: '' +
      '<div class="layer-row">' +
      '  <label class="switch">' +
      '    <input class="cmn-toggle" id="cmn-toggle-${idCounter}" type="checkbox" data-dojo-attach-point="inputNode" data-dojo-attach-event="change:toggle">' +
      '    <div class="switch-line" for="cmn-toggle-${idCounter}" data-dojo-attach-point="switchNode"></div>' +
      '  </label>' +
      '  <div class="layer-label">' +
          '<span data-dojo-attach-point="labelNode"></span>' +
          '<div class="intensity-slider-box" data-dojo-attach-point="intensityNode">' +
            '<div class="intensity-label">Intensity:</div>' +
          '</div>' +
        '</div>' +
      '</div>',

    toggle: function () {
      var self = this;
      self.animation.setVisible(self.inputNode.checked);
      if (self.animation.constructor.prototype.name == "ClusterAnimation") {
        $(self.intensityNode).toggle(self.inputNode.checked);
      }
    },

    startup: function () {
      var self = this;
      self.inherited(arguments);
      self.idCounter = self.constructor.prototype.idCounter++;

      if (self.animation.constructor.prototype.name == "ClusterAnimation") {
        var val2slider = function(val) { return Math.log(1 + val)/Math.log(4); };
        var slider2val = function(val) { return Math.pow(4, val) - 1; };

        var maxv = val2slider(self.animation.data_view.header.colsByName.weight.max);
        var minv = val2slider(self.animation.data_view.header.colsByName.weight.min);
        var curv = val2slider(self.animation.data_view.header.colsByName.weight.source.weight);

        self.intensitySlider = new HorizontalSlider({
          value:curv,
          minimum: minv,
          maximum: maxv,
          discreteValues: 100,
          onChange: self.intensityChange.bind(self),
          intermediateChanges: true
        }, "mySlider");
        self.intensitySlider.placeAt(self.intensityNode);
        self.intensitySlider.startup();

        if (!self.animation.visible) {
          $(self.intensityNode).hide();
        }
      } else {
        $(self.intensityNode).hide();
      }

      self.animation.events.on({updated: self.updatedHandler.bind(self)});
      self.updatedHandler();
    },

    slider2val: function(val) {
      return Math.pow(4, val) - 1;
    },

    intensityChange: function () {
      var self = this;
      if (self.update != undefined) return;
      self.update = setTimeout(function () {
        var value = self.intensitySlider.get("value");

        self.animation.data_view.header.colsByName.weight.source.weight = self.slider2val(value);
        self.animation.data_view.changeCol(self.animation.data_view.header.colsByName.weight);
        self.update = undefined;
      }, 100);
    },

    updatedHandler: function () {
      var self = this;
      var title = self.animation.title
      if (!title) title = animation.toString();
      $(self.labelNode).html(title);

      var color = self.animation.color;
      if (!color) color = 'orange';
      $(self.switchNode).css({'border-color': color});

      if (self.animation.visible) {
        $(self.inputNode).attr('checked','checked');
      } else {
        $(self.inputNode).removeAttr('checked');
      }
    }
  });

  return SimpleLayerList;
});
