define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/KeyBindings",
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
  KeyBindings,
  AnimationListBase,
  SimpleAnimationEditor,
  AnimationEditor,
  $,
  popup,
  ColorPicker
){
  var SimpleLayerList = declare("SimpleLayerList", [AnimationListBase], {
    baseClass: 'SimpleLayerList',
    title: 'Layers',
    select_default: true,

    templateString: '' +
        '<div class="display-mode" style="overflow: auto;">' +
        '  <div class="titleButtons">' +
        '    <a href="javascript:undefined" class="editing-mode-toggle" data-dojo-attach-event="click:toggleEditingMode"><i class="fa fa-cogs"></i></a>' +
        '  </div>' +
        '  <div class="editing-mode-only advanced-mode-only">' +
        '    <label>Title:</label>' +
        '    <input data-dojo-type="dijit/form/TextBox" data-dojo-attach-point="titleInput" data-dojo-attach-event="change:titleChange"></input>' +
        '  </div>' +
        '  <div id="layers">' +
        '    <form class="animation-list" data-dojo-attach-point="containerNode">'+
        '      <div class="animation-row editing-mode-only">' +
        '        <div class="left-buttons">' +
        '          <label class="add-layer">' +
        '            <a href="javascript:undefined" data-dojo-attach-event="click:add"><i class="fa fa-plus-square"></i></a>' +
        '          </label>' +
        '        </div>' + 
        '        <div class="animation-content">' +
        '          <div>' +
        '            <a href="javascript:undefined" data-dojo-attach-event="click:add">Add new layer</a>' +
        '          </div>' +
        '        </div>' +
        '      </div>' +
        '    </form>' +
        '  </div>' +
        '</div>',


    startup: function () {
      var self = this;
      self.inherited(arguments);

      KeyBindings.register(
        ['Ctrl', 'Alt', 'E'], null, 'General',
        'Toggle between editing and view mode',
        self.toggleEditingMode.bind(self)
      );

      self.visualization.state.events.on({
        "editing": self.updatedHandler.bind(self),
        "title": self.updatedHandler.bind(self)
      });
      self.updatedHandler();
    },

    updatedHandler: function () {
      var self = this;
      var editing = !!self.visualization.state.getValue('editing');

      $(self.domNode).toggleClass("editing-mode", editing);
      $(self.domNode).toggleClass("display-mode", !editing);

      self.titleInput.set("value", self.visualization.state.getValue('title'))
    },

    toggleEditingMode: function () {
      var self = this;

      self.visualization.state.setValue(
        'editing',
        !self.visualization.state.getValue('editing'));
    },

    titleChange: function () {
      var self = this;
      self.visualization.state.setValue('title', self.titleInput.get("value"));
    }
  });

  SimpleLayerList.AnimationWidget = declare("AnimationWidget", [AnimationListBase.AnimationWidget], {
    baseClass: 'SimpleLayerList-AnimationWidget',

    idCounter: 0,

    templateString: '' +
      '<div class="animation-row">' +
      '  <div class="left-buttons">' +
      '    <label class="remove-layer editing-mode-only">' +
      '      <a href="javascript:undefined" data-dojo-attach-event="click:remove"><i class="fa fa-trash"></i></a>' +
      '    </label>' +
      '    <label class="switch display-mode-only">' +
      '      <input class="cmn-toggle" id="cmn-toggle-${idCounter}" type="checkbox" data-dojo-attach-point="inputNode" data-dojo-attach-event="change:toggleVisible"></input>' +
      '      <div class="switch-line" for="cmn-toggle-${idCounter}"></div>' +
      '    </label>' +
      '    <label class="switch editing-mode-only">' +
      '      <div class="switch-line active" data-dojo-attach-point="colorPickerNode" data-dojo-attach-event="click:popupColorPicker"></div>' +
      '    </label>' +
      '  </div>' + 
      '  <div class="animation-content">' +
      '    <div>' +
      '      <span class="animation-title" data-dojo-attach-point="titleNode"></span>' +
      '      <div class="animation-buttons">' +
      '        <a target="_blank" data-dojo-attach-point="infoNode" class="display-mode-only"><i class="fa fa-info"></i></a>' +
      '        <a class="expander advanced-mode-only editing-mode-only" data-dojo-attach-point="expanderNode" data-dojo-attach-event="click:toggleExpanded">' +
                '<i class="fa fa-chevron-right"></i>' +
              '</a>' +
      '      </div>' +
      '    </div>' +
      '    <div class="animation-editor">' +
      '      <div class="simple-mode-only editing-mode-only" data-dojo-attach-point="simpleAnimationEditorNode"></div>' +
      '      <div class="advanced-mode-only editing-mode-only animation-editor-expansion" data-dojo-attach-point="animationEditorNode"></div>' +
      '    </div>' +
      '  </div>' +
      '</div>',

    startup: function () {
      var self = this;
      self.inherited(arguments);
      self.idCounter = self.constructor.prototype.idCounter++;

      self.simpleAnimationEditor = new SimpleAnimationEditor({animation: self.animation});
      self.simpleAnimationEditor.placeAt(self.simpleAnimationEditorNode);

      self.animationEditor = new AnimationEditor({animation: self.animation});
      self.animationEditor.placeAt(self.animationEditorNode);

      self.animation.events.on({updated: self.updatedHandler.bind(self)});
      self.updatedHandler();
    },

    updatedHandler: function () {
      var self = this;
      self.inherited(arguments);

      var color = self.animation.color;
      if (!color) color = 'orange';
        $(self.domNode).find(".switch-line").css({'border-color': color});

      if (self.animation.visible) {
        $(self.inputNode).attr('checked','checked');
      } else {
        $(self.inputNode).removeAttr('checked');
      }

      var descriptionUrl = self.animation.descriptionUrl;
      if (descriptionUrl) {
        $(self.infoNode).attr("href", descriptionUrl);
      }
      $(self.infoNode).toggle(!!descriptionUrl);

      var expand = !!self.animation.args.editorExpanded;
      var expander = $(self.expanderNode);
      if (expand) {
        expander.find('i').addClass('fa-chevron-down');
        expander.find('i').removeClass('fa-chevron-right');
      } else {
        expander.find('i').addClass('fa-chevron-right');
        expander.find('i').removeClass('fa-chevron-down');
      }
      $(self.domNode).toggleClass('animation-editor-collapsed', !expand);
    },

    toggleVisible: function () {
      var self = this;
      self.animation.setVisible(self.inputNode.checked);
      self.animation.events.triggerEvent("updated")
    },

    toggleExpanded: function () {
      var self = this;
      self.animation.args.editorExpanded = !self.animation.args.editorExpanded;
      self.animation.events.triggerEvent("updated")
    },

    popupColorPicker: function () {
      var self = this;
      if (self.simpleAnimationEditor.colorDropDown != undefined) {
        popup.open({
          parent: self,
          popup: self.simpleAnimationEditor.colorDropDown,
          around: this.colorPickerNode,
          orient: ["below", "before"],
          onExecute: function(){
            popup.close(dropDown);
          },
          onCancel: function(){
            popup.close(dropDown);
          }
        });
      }
    }
  });

  return SimpleLayerList;
});
