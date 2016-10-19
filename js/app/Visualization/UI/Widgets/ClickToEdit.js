define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "shims/jQuery/main"
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  $
){
  return declare("ClickToEdit", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    templateString: '<span class="${baseClass}">' +
                    '  <span class="${baseClass}Label" data-dojo-attach-point="labelNode" data-dojo-attach-event="click:beginEdit"></span>' +
                    '  <span class="${baseClass}Container" data-dojo-attach-point="containerNode" style="display: none;"></span>' +
                    '</span>',

    startup: function () {
      var self = this;
      var children = self.getChildren();
      if (children.length) {
        self.setupEditor(children[0]);
      }
      self.inherited(arguments);
    },

    addChild: function(widget,insertIndex) {
      var self = this;
      self.setupEditor(widget);
      self.inherited(arguments);
    },

    setupEditor: function (widget) {
      var self = this;
      self.editor = widget;
      self.editor.on("change", self.onChange.bind(self));
      self.editor.on("blur", self.onChange.bind(self));
      self.editor.on("keyUp", self.onKeyUp.bind(self));
      self.onChange();
    },

    beginEdit: function () {
      var self = this;
      $(self.labelNode).hide();
      $(self.containerNode).show();
      self.editor.focus();
    },

    endEdit: function () {
      var self = this;
      $(self.labelNode).show();
      $(self.containerNode).hide();
    },

    onKeyUp: function (e) {
      var self = this;
      if (e.which == 13) {
        self.onChange();
      }
    },

    onChange: function () {
      var self = this;
      if (!self.domNode || !self.editor.domNode) return;
      if (self.editor.isValid && !self.editor.isValid()) return;
      $(self.labelNode).text(self.editor.get("value").toString() || "[empty]");
      self.endEdit();
    }
  });
});
