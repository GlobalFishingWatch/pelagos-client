define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/UI/SidePanels/AnimationListBase",
  "app/Visualization/UI/SimpleAnimationEditor",
  "app/Visualization/UI/AnimationEditor",
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
  SimpleAnimationEditor,
  AnimationEditor,
  $,
  popup,
  ColorPicker
){
  var SimpleLayerList = declare("SimpleLayerList", [AnimationListBase], {
    baseClass: 'SimpleLayerList display-mode',
    title: 'Layers',
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
        '            <a href="javascript:undefined" data-dojo-attach-event="click:add"><i class="fa fa-plus-square"></i></a>' +
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
      '    <div class="simple-mode-only editing-mode-only" data-dojo-attach-point="simpleAnimationEditorNode"></div>' +
      '    <div class="advanced-mode-only editing-mode-only" data-dojo-attach-point="animationEditorNode"></div>' +
      '  </div>' +
      '</div>',

    toggle: function () {
      var self = this;
      self.animation.setVisible(self.inputNode.checked);
      $(self.simpleAnimationEditorNode).toggle(self.inputNode.checked);
      $(self.animationEditorNode).toggle(self.inputNode.checked);
    },

    startup: function () {
      var self = this;
      self.inherited(arguments);
      self.idCounter = self.constructor.prototype.idCounter++;

      self.simpleAnimationEditor = new SimpleAnimationEditor({animation: self.animation});
      self.simpleAnimationEditor.placeAt(self.simpleAnimationEditorNode);

      self.animationEditor = new AnimationEditor({animation: self.animation});
      self.animationEditor.placeAt(self.animationEditorNode);

      self.updatedHandler();
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
    }
  });

  return SimpleLayerList;
});
