define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "dijit/form/TextBox",
  "app/Visualization/UI/DataViewUI",
  "shims/jQuery/main",
  "app/Visualization/UI/Widgets/ClickToEdit",
  "dijit/form/TextBox"
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  TextBox,
  DataViewUI,
  $
){
  return declare("AnimationEditor", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    baseClass: 'AnimationEditor',
    animation: null,
    templateString: '' +
      '<div class="${baseClass}">' +
      '  <div data-dojo-attach-point="containerNode">' +
      '    <div class="source">Source: ${animation.args.source.type}:${animation.args.source.args.url}</div>' +
      '    <div>' +
      '      Category:' +
      '      <div data-dojo-type="app/Visualization/UI/Widgets/ClickToEdit">' +
      '        <input' +
      '           data-dojo-type="dijit/form/TextBox"' +
      '           data-dojo-attach-point="categoryInput"' +
      '           data-dojo-attach-event="change:categoryChange"></input>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>',

    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.categoryInput.set("value", self.animation.args.category);

      if (self.animation.data_view) {
        self.addChild(new DataViewUI({
          visualization: self.visualization,
          animation: self.animation,
          dataview: self.animation.data_view
        }));
      }
    },

    updatedHandler: function () {
      var self = this;
      self.inherited(arguments);

      self.categoryInput.set("value", self.animation.args.category);
    },

    categoryChange: function () {
      var self = this;
      self.animation.args.category = self.categoryInput.get("value");
      self.animation.events.triggerEvent("updated", {});
    }
  });
});
