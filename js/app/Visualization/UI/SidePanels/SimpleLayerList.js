define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/UI/SidePanels/AnimationListBase",
  "dijit/form/HorizontalSlider",
  "shims/jQuery/main",
  "dijit/popup",
  "dojox/widget/ColorPicker"
], function(
  declare,
  domStyle,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  AnimationListBase,
  HorizontalSlider,
  $,
  popup,
  ColorPicker
){
  var SimpleLayerList = declare("SimpleLayerList", [AnimationListBase], {
    baseClass: 'SimpleLayerList display-mode',
    title: 'Layers',
    advanced: false,
    select_default: true,

    templateString: '' +
        '<div class="${baseClass}" style="overflow: auto;">' +
        '  <div class="titleButtons">' +
        '    <a href="javascript:undefined" class="editing-mode-toggle" data-dojo-attach-event="click:toggleEditingMode"><i class="fa fa-cogs"></i></a>' +
        '  </div>' +
        '  <div id="layers">' +
        '    <form class="layer-list" data-dojo-attach-point="containerNode">'+
        '      <div class="layer-row editing-mode-only">' +
        '        <div class="left-buttons">' +
        '          <label class="add-layer">' +
        '            <a href="javascript:undefined" data-dojo-attach-event="click:addLayer"><i class="fa fa-plus-square"></i></a>' +
        '          </label>' +
        '        </div>' + 
        '        <div class="layer-content">' +
        '          <div>' +
        '            <span>Add new layer</span>' +
        '          </div>' +
        '        </div>' +
        '      </div>' +
        '    </form>' +
        '  </div>' +
        '</div>',

    toggleEditingMode: function () {
      var self = this;

      var editing_mode = $(self.domNode).hasClass("editing-mode");

      $(self.domNode).toggleClass("editing-mode", !editing_mode);
      $(self.domNode).toggleClass("display-mode", editing_mode);
    },

    addLayer: function () {
    }
  });

  SimpleLayerList.AnimationWidget = declare("AnimationWidget", [AnimationListBase.AnimationWidget], {
    baseClass: 'SimpleLayerList-AnimationWidget',

    idCounter: 0,

    templateString: '' +
      '<div class="layer-row">' +
      '  <div class="left-buttons">' +
      '    <label class="remove-layer editing-mode-only">' +
      '      <a href="javascript:undefined" data-dojo-attach-event="click:remove"><i class="fa fa-trash"></i></a>' +
      '    </label>' +
      '    <label class="switch display-mode-only">' +
      '      <input class="cmn-toggle" id="cmn-toggle-${idCounter}" type="checkbox" data-dojo-attach-point="inputNode" data-dojo-attach-event="change:toggle">' +
      '      <div class="switch-line" for="cmn-toggle-${idCounter}" data-dojo-attach-point="switchNode"></div>' +
      '    </label>' +
      '  </div>' + 
      '  <div class="layer-content">' +
      '    <div>' +
      '      <span data-dojo-attach-point="titleNode"></span>' +
      '      <div class="layer-buttons">' +
      '        <a target="_blank" data-dojo-attach-point="infoNode" class="display-mode-only"><i class="fa fa-info"></i></a>' +
      '      </div>' +
      '    </div>' +
      '    <div class="intensity-slider-box display-mode-only" data-dojo-attach-point="intensityNode">' +
      '      <div class="intensity-label">Intensity &amp; Color:</div>' +
      '      <div class="eyedropper"><a target="_blank" data-dojo-attach-point="configNode" data-dojo-attach-event="click:onConfig"><i class="fa fa-eyedropper"></i></a></div>' +
      '    </div>' +
      '  </div>' +
      '</div>',

    toggle: function () {
      var self = this;
      self.animation.setVisible(self.inputNode.checked);
      $(self.intensityNode).toggle(self.inputNode.checked && self.animation.constructor.prototype.name == "ClusterAnimation");
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

        self.colorDropDown = new ColorPicker({
          'class': "sidebarColorPicker",
          onChange: self.colorSelected.bind(self),
          style: 'background: white; padding: 10px;',
          id: self.id + "_colorPopup",
          value: self.animation.color
        });
        popup.moveOffScreen(self.colorDropDown);
        self.colorDropDown.startup();
      }

      self.updatedHandler();
    },

    onConfig: function () {
      var self = this;
      popup.open({
        parent: self,
        popup: self.colorDropDown,
        around: this.configNode,
        orient: ["below", "before"],
        onExecute: function(){
          popup.close(dropDown);
        },
        onCancel: function(){
          popup.close(dropDown);
        }
      });
    },

    colorSelected: function(value) {
      var self = this;

      self.animation.color = value;
      if (self.animation.data_view != undefined && self.animation.data_view.header.uniforms.red != undefined) {
        var c = self.animation.color;
        var rgb = [parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255];
        self.animation.data_view.header.uniforms.red.value = rgb[0];
        self.animation.data_view.header.uniforms.green.value = rgb[1];
        self.animation.data_view.header.uniforms.blue.value = rgb[2];
      }
      self.animation.events.triggerEvent("updated");

      popup.close(self.colorDropDown);
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
      self.inherited(arguments);

      var color = self.animation.color;
      if (!color) color = 'orange';
      $(self.switchNode).css({'border-color': color});

      if (self.animation.visible) {
        $(self.inputNode).attr('checked','checked');
      } else {
        $(self.inputNode).removeAttr('checked');
      }
      self.toggle();

      var descriptionUrl = self.animation.descriptionUrl;
      if (descriptionUrl) {
        $(self.infoNode).attr("href", descriptionUrl);
      }
      $(self.infoNode).toggle(!!descriptionUrl);
      var isConfigurable = self.animation.constructor.prototype.name == "ClusterAnimation";
      $(self.configNode).toggle(isConfigurable);
    }
  });

  return SimpleLayerList;
});
