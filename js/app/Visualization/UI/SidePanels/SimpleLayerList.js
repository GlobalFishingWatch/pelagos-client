define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "app/Visualization/KeyBindings",
  "app/Visualization/Animation/ObjectToTable",
  "app/Visualization/UI/SidePanels/AnimationListBase",
  "app/Visualization/UI/SimpleAnimationEditor",
  "app/Visualization/UI/AnimationEditor",
  "app/Visualization/UI/SimpleMessageDialog",
  "shims/jQuery/main",
  "dijit/popup",
  "dojox/widget/ColorPicker",
  "app/Visualization/UI/Widgets/ClickToEdit",
  "dijit/form/ValidationTextBox"
], function(
  declare,
  domStyle,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  KeyBindings,
  ObjectToTable,
  AnimationListBase,
  SimpleAnimationEditor,
  AnimationEditor,
  SimpleMessageDialog,
  $,
  popup,
  ColorPicker,
  ClickToEdit,
  ValidationTextBox
){
  return declare("SimpleLayerList", [AnimationListBase], {
    baseClass: 'SimpleLayerList',
    title: 'Layers',
    select_default: true,

    templateString: '' +
        '<div class="${baseClass} display-mode" style="overflow: auto;">' +
        '  <div class="titleButtons">' +
        '    <a href="javascript:undefined" class="editing-mode-toggle" data-dojo-attach-event="click:toggleEditingMode"><i class="fa fa-cogs"></i></a>' +
        '  </div>' +
        '  <div class="contentWrapper">' +
        '    <div class="editing-mode-only advanced-mode-only workspaceTitle" data-dojo-type="app/Visualization/UI/Widgets/ClickToEdit" data-dojo-attach-point="titleEditor">' +
        '      <input' +
        '       data-dojo-type="dijit/form/ValidationTextBox"' +
        '       data-dojo-attach-point="titleInput"' +
        '       data-dojo-attach-event="change:titleChange"' +
        '       data-dojo-props="pattern: \'..*\', required: true"></input>' +
        '    </div>' +
        '    <div id="layers">' +
        '      <form class="animation-list" data-dojo-attach-point="containerNode">'+
        '        <div class="animation-row editing-mode-only" data-dojo-attach-point="addLayerRow">' +
        '          <div class="left-buttons">' +
        '            <label class="add-layer">' +
        '              <a href="javascript:undefined" data-dojo-attach-event="click:add"><i class="fa fa-plus-square"></i></a>' +
        '            </label>' +
        '          </div>' + 
        '          <div class="animation-content">' +
        '            <div>' +
        '              <a href="javascript:undefined" data-dojo-attach-event="click:add">Add new layer</a>' +
        '            </div>' +
        '          </div>' +
        '        </div>' +
        '      </form>' +
        '    </div>' +
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

      self._updatedHandler = self.updatedHandler.bind(self);
      self.visualization.state.events.on({
        "editing": self._updatedHandler,
        "title": self._updatedHandler
      });
      self.updatedHandler();
    },

    destroy: function () {
      var self = this;

      self.visualization.state.events.un({
        "editing": self._updatedHandler,
        "title": self._updatedHandler
      });
      self.inherited(arguments);
    },

    updatedHandler: function () {
      var self = this;
      if (self._beingDestroyed) return;

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
    },

    AnimationWidget: declare("AnimationWidget", AnimationListBase.prototype.AnimationWidget, {
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
        '      <div class="switch-line active" data-dojo-attach-point="colorPickerNode"></div>' +
        '    </label>' +
        '  </div>' + 
        '  <div class="animation-content">' +
        '    <div>' +
        '      <span class="animation-title">' +
        '        <div class="editing-mode-only" data-dojo-type="app/Visualization/UI/Widgets/ClickToEdit">' +
        '          <input' +
        '           data-dojo-type="dijit/form/ValidationTextBox"' +
        '           data-dojo-attach-point="titleInput"' +
        '           data-dojo-attach-event="change:titleChange"' +
        '           data-dojo-props="pattern: \'..*\', required: true"></input>' +
        '        </div>' +
        '        <span class="display-mode-only" data-dojo-attach-point="titleNode"></span>' +
        '      </span>' +
        '      <div class="animation-buttons">' +
        '        <a data-dojo-attach-point="saveNode" data-dojo-attach-event="click:saveLayer"><i class="fa fa-thumb-tack"></i></a>' +
        '        <a target="_blank" data-dojo-attach-point="infoNode" data-dojo-attach-event="click:infoClick" class="display-mode-only"><i class="fa fa-info"></i></a>' +
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

        self.updatedHandler();
      },

      updatedHandler: function () {
        var self = this;
        if (self._beingDestroyed) return;
        self.inherited(arguments);

        $(self.saveNode).toggle(!!self.animation.selectionAnimationFor);

        var color = self.animation.color;
        if (!color) color = 'orange';
          $(self.domNode).find(".switch-line").css({'border-color': color});

        if (self.animation.visible) {
          $(self.inputNode).attr('checked','checked');
        } else {
          $(self.inputNode).removeAttr('checked');
        }

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

        self.titleInput.set("value", self.animation.title);
      },

      saveLayer: function () {
        var self = this;

        self.visualization.animations.saveSelectionAnimation(self.animation);
        self.animation.setTitleFromInfo();
        self.updatedHandler();
      },

      titleChange: function () {
        var self = this;
        if (!self.titleInput.isValid()) return;
        self.animation.title = self.titleInput.get("value");
        self.animation.events.triggerEvent("updated", {});
      },

      infoClick: function () {
        var self = this;
        self.animation.getSelectionInfo(undefined, function (err, data) {
          if (err) {
            SimpleMessageDialog.show("Error fetching information", err.toString());
          } else {
          SimpleMessageDialog.show(data.title || self.animation.title, ObjectToTable(data, {render_title: false}));
          }
        });
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
      }
    })
  });
});
