define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "dijit/form/TextBox",
  "app/Visualization/UI/AnimationFilterEditor",
  "dijit/form/HorizontalSlider",
  "./Widgets/ColorPicker",
  "dijit/popup",
  "shims/jQuery/main"
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  TextBox,
  AnimationFilterEditor,
  HorizontalSlider,
  ColorPicker,
  popup,
  $
){
  return declare("SimpleAnimationEditor", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    baseClass: 'SimpleAnimationEditor',
    animation: null,
    templateString: '' +
      '<div class="intensity-slider-box" data-dojo-attach-point="domNode">' +
      '  <div data-dojo-attach-point="intensityNode">' +
      '    <div class="intensity-label">Intensity:</div>' +
      '  </div>' +
      '  <div>' +
      '    <span class="eyedropper-label">Color:</span>' +
      '    <a style="float: right;" target="_blank" data-dojo-attach-point="configNode" data-dojo-attach-event="click:onConfig"><i class="fa fa-eyedropper"></i></a>' +
      '  </div>' +
      '</div>',

    startup: function () {
      var self = this;
      self.inherited(arguments);

      var is_editable = self.animation.constructor.prototype.name == "ClusterAnimation";
      $(self.domNode).toggle(is_editable);
      if (is_editable) {
        var maxv = self.val2slider(self.animation.data_view.header.colsByName.weight.max);
        var minv = self.val2slider(self.animation.data_view.header.colsByName.weight.min);
        var curv = self.val2slider(self.animation.data_view.header.colsByName.weight.source.weight);

        self.intensitySlider = new HorizontalSlider({
          value:curv,
          minimum: minv,
          maximum: maxv,
          discreteValues: 100,
          onChange: self.intensityChange.bind(self),
          intermediateChanges: true
        }, "mySlider");
        self.intensitySlider.placeAt(self.intensityNode);

        self.animationFilterEditor = new AnimationFilterEditor({animation: self.animation});
        self.animationFilterEditor.placeAt(self.domNode);

        self.colorDropDown = new ColorPicker({
          'class': "sidebarColorPicker",
          onChange: self.colorSelected.bind(self),
          style: 'background: white; padding: 10px;',
          value: self.animation.color
        });
        popup.moveOffScreen(self.colorDropDown);
        self.colorDropDown.startup();

        self.underlay = $("<div>");
        self.underlay.css({position: "absolute", "z-index": 999})
        $("body").append(self.underlay);
        self.underlay.click(self.closeColorDropDown.bind(self));
        self.hideUnderlay();
      }
    },

    hideUnderlay: function () {
     var self = this;
     self.underlay.css({display: "block", left: "-9999px", right: "auto", top: "-9999px", bottom: "auto"});
   },

    showUnderlay: function () {
      var self = this;
      self.underlay.css({display: "block", left: 0, right: 0, top: 0, bottom: 0});
    },

    onConfig: function () {
      var self = this;

      self.showUnderlay();
      popup.open({
        parent: self,
        popup: self.colorDropDown,
        around: this.configNode,
        orient: ["below", "before"],
        onExecute: function(){
          self.closeColorDropDown();
        },
        onCancel: function(){
          self.closeColorDropDown();
        }
      });
    },

    closeColorDropDown: function () {
      var self = this;

      self.hideUnderlay();
      popup.close(self.colorDropDown);
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
      self.animation.data_view.events.triggerEvent("update");

      self.closeColorDropDown();
    },

    val2slider: function(val) {
      return Math.log(1 + val)/Math.log(4);
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
    }
  });
});
