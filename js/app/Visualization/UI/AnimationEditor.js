define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "dijit/form/TextBox",
  "app/Visualization/UI/DataViewUI",
  "shims/jQuery/main",
  "app/Visualization/UI/Widgets/ClickToEdit"
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  TextBox,
  DataViewUI,
  $,
  ClickToEdit
){
  return declare("AnimationEditor", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    baseClass: 'AnimationEditor',
    animation: null,
    templateString: '' +
      '<div class="${baseClass}">' +
      '  <div data-dojo-attach-point="containerNode">' +
      '    <div>' +
      '      <label>Title:</label>' +
      '      <div data-dojo-type="app/Visualization/UI/Widgets/ClickToEdit">' +
      '        <input data-dojo-type="dijit/form/TextBox" data-dojo-attach-point="titleInput" data-dojo-attach-event="change:titleChange"></input>' +
      '      </div>' +
      '    </div>' +
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
      self.titleInput.set("value", self.animation.title);
    },
    titleChange: function () {
      var self = this;
      self.animation.title = self.titleInput.get("value");
      self.animation.events.triggerEvent("updated", {});
    }
  });
});
