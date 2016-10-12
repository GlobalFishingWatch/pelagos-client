define([
  "dojo/_base/declare",
  "dijit/form/MultiSelect",
  "shims/jQuery/main"
], function (
  declare,
  MultiSelect,
  $
) {
  return declare("MultiSelect", MultiSelect, {
    store: null,

    startup: function(){
      var self = this;
      self.inherited(arguments);
      if (self.store) {
        self.loadStore();
      }
    },

    _setStoreAttr: function(store) {
      var self = this;

      self._set("store", store);
      self.loadStore();
    },

    addOption: function(item) {
      var self = this;
      var option = $('<option>');
      option.html(item.label);
      option.attr({value: item.id});
      $(self.containerNode).append(option);
    }, 

    loadStore: function() {
      var self = this;

      $(self.containerNode).html("");

      self.store.query().map(self.addOption.bind(self));
    },

    loadAndOpenDropDown: function () {}
  });
});
