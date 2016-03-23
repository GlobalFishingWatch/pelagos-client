define([
  "dojo/_base/declare",
  "dijit/Dialog",
  "dijit/_WidgetsInTemplateMixin"
], function(
  declare,
  Dialog,
  _WidgetsInTemplateMixin
){
  return declare("TemplatedDialog", [Dialog, _WidgetsInTemplateMixin], {
    contentTemplate: '',
    templateString: '' +
      '<div class="dijitDialog" role="dialog" aria-labelledby="${id}_title">' +
      '  <div data-dojo-attach-point="titleBar" class="dijitDialogTitleBar">' +
      '    <span data-dojo-attach-point="titleNode" class="dijitDialogTitle" id="${id}_title" role="heading" level="1"></span>' +
      '    <span data-dojo-attach-point="closeButtonNode" class="dijitDialogCloseIcon" data-dojo-attach-event="ondijitclick: onCancel" title="${buttonCancel}" role="button" tabindex="-1">' +
      '      <span data-dojo-attach-point="closeText" class="closeText" title="${buttonCancel}">x</span>' +
      '    </span>' +
      '  </div>' +
      '  <div data-dojo-attach-point="containerNode" class="dijitDialogPaneContent">${!contentTemplate}</div>' +
      '  ${!actionBarTemplate}' +
      '</div>'
  });
});
