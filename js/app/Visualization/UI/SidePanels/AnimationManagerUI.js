define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "dijit/TooltipDialog",
  "dijit/form/Select",
  "dijit/form/TextBox",
  "dijit/form/Button",
  "dijit/popup",
  "app/Visualization/Animation/Animation",
  "app/Visualization/UI/SidePanels/AnimationListBase",
  "app/Visualization/UI/SidePanels/DataViewUI",
  "shims/jQuery/main"
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  TooltipDialog,
  Select,
  TextBox,
  Button,
  popup,
  Animation,
  AnimationListBase,
  DataViewUI,
  $
){
  var AnimationManagerUI = declare("AnimationManagerUI", [AnimationListBase], {
    baseClass: 'AnimationManagerUI',
    title: 'Layers',
    advanced: true,
    select_default: true,

    templateString: '' +
        '<div class="${baseClass}">' +
        '  <span class="title">' +
        '    <input type="text" style="display: none" class="input" data-dojo-attach-point="titleInputNode" data-dojo-attach-event="keypress:maybeEndEdit,blur:endEdit"></input>' +
        '    <span class="text" data-dojo-attach-point="titleNode" data-dojo-attach-event="click:beginEdit"></span>' +
        '  </span>' +
        '  <a href="javascript:void(0);" class="add" data-dojo-attach-point="addNode" data-dojo-attach-event="click:add">' +
            '<i class="fa fa-plus-square"></i>' +
          '</a>' +
        '  <div data-dojo-attach-point="containerNode"></div>' +
        '</div>',
    startup: function () {
      var self = this;
      self.inherited(arguments);

      var state = self.visualization.state;
      if (!state.getValue('title')) {
        state.setValue('title', "Pelagos");
      }

      state.events.on({
        title: self.titleChanged.bind(self)
      });
    },
    titleChanged: function () {
      var self = this;
      var state = self.visualization.state;

      var val = state.getValue('title');
      $(self.titleInputNode).val(val);
      $(self.titleNode).html(val);
    },
    beginEdit: function () {
      var self = this;
      $(self.titleInputNode).show();
      $(self.titleInputNode).focus();
      $(self.titleNod).hide();
    },
    endEdit: function () {
      var self = this;
      self.visualization.state.setValue('title', $(self.titleInputNode).val());
      $(self.titleInputNode).hide();
      $(self.titleNod).show();
    },
    maybeEndEdit: function (event) {
      var self = this;
      if (event.which == 13) {
        self.endEdit();
        event.preventDefault();
      }
    },
    add: function () {
      var self = this;
      new self.constructor.AddDialog({
        visualization: self.visualization,
        menuFor: self.addNode
      }).startup();
    }
  });

  AnimationManagerUI.AnimationWidget = declare("AnimationWidget", [AnimationListBase.AnimationWidget], {
    baseClass: 'AnimationManagerUI-AnimationWidget',
    templateString: '' +
      '<div class="${baseClass}">' +
      '  <div class="header">' +
      '    <a class="expander" data-dojo-attach-point="expanderNode" data-dojo-attach-event="click:setExpanded">' +
            '<i class="fa fa-chevron-right"></i>' +
          '</a>' +
      '    <input type="checkbox"  data-dojo-attach-point="visibleNode" data-dojo-attach-event="change:setVisible"></input>' +
        '  <span class="title">' +
        '    <input type="text" style="display: none" class="input" data-dojo-attach-point="titleInputNode" data-dojo-attach-event="keypress:maybeEndEdit,blur:endEdit"></input>' +
        '    <span class="text" data-dojo-attach-point="titleNode" data-dojo-attach-event="click:beginEdit"></span>' +
      '    <a href="javascript:void(0);" class="remove" data-dojo-attach-event="click:remove">' +
            '<i class="fa fa-minus-square"></i>' +
          '</a>' +
      '  </div>' +
      '  <div data-dojo-attach-point="containerNode" style="display:none">' +
      '    <div>${animation.name}</div>' +
      '    <div>${animation.args.source.type}:${animation.args.source.args.url}</div>' +
      '  </div>' +
      '</div>',
    startup: function () {
      var self = this;
      self.inherited(arguments);

      if (self.animation.data_view) {
        self.addChild(new DataViewUI({
          visualization: self.visualization,
          animation: self.animation,
          dataview: self.animation.data_view
        }));
      }

      self.animation.events.on({updated: self.updatedHandler.bind(self)});
      self.updatedHandler();
    },
    updatedHandler: function () {
      var self = this;

      var title = self.animation.title;
      $(self.titleInputNode).val(title);
      $(self.titleNode).html(title);

      if (self.animation.visible) {
        $(self.visibleNode).attr('checked','checked');
      } else {
        $(self.visibleNode).removeAttr('checked');
      }
    },
    setExpanded: function () {
      var self = this;
      var expander = $(self.expanderNode);
      var expand = !expander.find('i').hasClass('fa-chevron-down');
      if (expand) {
        expander.find('i').addClass('fa-chevron-down');
        expander.find('i').removeClass('fa-chevron-right');
      } else {
        expander.find('i').addClass('fa-chevron-right');
        expander.find('i').removeClass('fa-chevron-down');
      }
      $(self.containerNode).toggle(expand);
    },
    setVisible: function () {
      var self = this;
      self.animation.setVisible(self.visibleNode.checked);
    },
    beginEdit: function () {
      var self = this;
      $(self.titleInputNode).show();
      $(self.titleInputNode).focus();
      $(self.titleNod).hide();
    },
    endEdit: function () {
      var self = this;
      self.animation.title = $(self.titleInputNode).val();
      self.animation.events.triggerEvent("updated", {});
      $(self.titleInputNode).hide();
      $(self.titleNod).show();
    },
    maybeEndEdit: function (event) {
      var self = this;
      if (event.which == 13) {
        self.endEdit();
        event.preventDefault();
      }
    }
  });

  AnimationManagerUI.AddDialog = declare("AddDialog", [TooltipDialog], {
    baseClass: 'AnimationManagerUI-AddDialog',
    visualization: null,
    menuFor: null,
    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.visualization.data.listSources(function (sources) {
        self.visualization.data.listSourceTypes(function (sourceTypes) {

          var typeselect = new Select({
            name: "typeselect",
            options: Object.items(Animation.animationClasses).map(function (item) {
              return {label:item.key, value:item.key};
            })
          });
          self.addChild(typeselect);

          var sourceselect = new Select({
            name: "sourceselect",
            options: [{label:"New", value:null}].concat(
              sources.map(function (source) {
                return {label:source.type + ": " + source.args.url, value:source};
              })
            )
          });
          self.addChild(sourceselect);

          var sourcetypeselect = new Select({
            name: "sourcetypeselect",
            options: sourceTypes.map(function (type) {
              return {label:type, value:type};
            })
          });
          self.addChild(sourcetypeselect);

          var urlbox = new dijit.form.TextBox({
            name: "url",
            value: "",
            placeHolder: "Data source URL"
          });
          self.addChild(urlbox);

          var addbutton = new Button({
            label: "Add",
            onClick: function(){
              var type = typeselect.get('value');
              var source = sourceselect.get('value');
              if (!source) {
                source = {type:sourcetypeselect.get('value'), args: {url:urlbox.get('value')}};
              }
              self.visualization.animations.addAnimation({type:type, args: {source: source}}, function (err, animation) {});
              self.onExecute();
            }
          });
          self.addChild(addbutton);

          var librarybutton = new Button({
            label: "From library",
            onClick: function(){
              self.visualization.ui.library.displayAnimationLibraryDialog();
              self.onCancel();
            }
          });
          self.addChild(librarybutton);

          var cancelbutton = new Button({
            label: "Cancel",
            onClick: function(){
              self.onCancel();
            }
          });
          self.addChild(cancelbutton);

          popup.open({
            popup: self,
            onExecute: self.close.bind(self),
            onCancel: self.close.bind(self),
            onClose: self.close.bind(self),
            around: self.menuFor
          });
        });
      });
    },

    close: function () {
      var self = this;
      popup.close(self);
      self.destroy();
    }
  });

  return AnimationManagerUI;
});
