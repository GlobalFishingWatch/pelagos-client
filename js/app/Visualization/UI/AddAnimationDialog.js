define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "app/Visualization/Animation/Animation",
  "shims/jQuery/main",

  "dijit/form/Select",
  "dijit/form/TextBox",
  "dijit/form/Button",
], function(
  declare,
  TemplatedDialog,
  Animation,
  $
){
  return declare("AddAnimationDialog", [TemplatedDialog], {
    baseClass: 'AddAnimationDialog',
    visualization: null,

    contentTemplate: '' +
      '<div>' +
      '  <div>' +
      '    <label>Animation type</label>' +
      '    <div data-dojo-type="dijit/form/Select" data-dojo-attach-point="typeselect"></div>' +
      '  </div>' +
      '  <div>' +
      '    <label>Existing source</label>' +
      '    <div data-dojo-type="dijit/form/Select" data-dojo-attach-point="sourceselect"></div>' +
      '  </div>' +
      '  <div>' +
      '    <label>Source type</label>' +
      '    <div data-dojo-type="dijit/form/Select" data-dojo-attach-point="sourcetypeselect"></div>' +
      '  </div>' +
      '  <div>' +
      '    <label>Source URL</label>' +
      '    <div data-dojo-type="dijit/form/TextBox" data-dojo-attach-point="urlbox" data-dojo-props="placeHolder: \'Data source URL\'"></div>' +
      '  </div>' +
      '</div>',

    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-event="click:hide">Close</button>' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-event="click:addFromLibrary">Add from library</button>' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-event="click:add">Add</button>' +
      '</div>',

    show: function () {
      var self = this;

      self.visualization.data.listSources(function (sources) {
        self.visualization.data.listSourceTypes(function (sourceTypes) {
          self.typeselect.set(
            "options",
            Object.items(Animation.animationClasses).map(function (item) {
              return {label:item.key, value:item.key};
            })
          );
          self.sourceselect.set(
            "options",
            [{label:"New", value:null}].concat(
              sources.map(function (source) {
                return {label:source.type + ": " + source.args.url, value:source};
              })
            )
          );

          self.sourcetypeselect.set(
            "options",
            sourceTypes.map(function (type) {
              return {label:type, value:type};
            })
          );

          TemplatedDialog.prototype.show.apply(self, arguments);
        });
      });
    },

    add: function(){
      var self = this;
      var type = self.typeselect.get('value');
      var source = self.sourceselect.get('value');
      if (!source) {
        source = {type:self.sourcetypeselect.get('value'), args: {url:self.urlbox.get('value')}};
      }
      self.visualization.animations.addAnimation({type:type, args: {source: source}}, function (err, animation) {
        if (err) {
        } else {
          self.hide();
        }
      });
    },

    addFromLibrary: function () {
      var self = this;
      self.visualization.ui.library.displayAnimationLibraryDialog();
      self.hide();
    }
  });
});
