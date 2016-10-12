define([
  "shims/jQuery/main",
  "dojo/store/Memory",
  "./MultiSelect",
  "dijit/form/FilteringSelect",
  "dojo/_base/array",
  "dojo/_base/declare",
  "dojo/dom-geometry",
  "dojo/sniff",
  "dojo/has",
  "dojo/query",
  "dijit/form/_FormValueWidget",
  "dijit/_Widget",
  "dijit/_Templated",
  "dojo/NodeList-dom"
], function(
  $,
  Memory,
  MultiSelect,
  FilteringSelect,
  array,
  declare,
  domGeometry,
  sniff,
  has,
  query,
  _FormValueWidget,
  _Widget,
  _Templated
){
  var FilteringMultiSelect = declare("FilteringMultiSelect", _FormValueWidget, {
    baseClass: "filteringMultiSelect",

    templateString: "<div data-dojo-attach-point='focusNode'></div>",

    value: [],
    
    proxyAttrs: ["name", "store", "labelAttr", "labelType", "searchAttr"],

    startup: function(){
      var self = this;

      if (has("ios") || has("android")) {
        self._select = new MultiSelect({
          onChange: function(value) {
            self.set("value", value);
          }
        });
      } else {
        var selectProps = {
          id: self.get("id") + "_select",
          required: false,
          onInput: function(event) {
            if (event.key == "Backspace" && $(this.textbox).val() == "") {
              self.set("value", self.get("value").slice(0, -1));
            }
          },
          onChange: function(state) {
            if (this.item) {
              self.set("value", self.get("value").concat([this.item.id]));
              self._select.set("value", null);
            }
          }
        };
        self.proxyAttrs.map(function (attr) {
          var value = self.get(attr);
          if (value != undefined) {
            selectProps[attr] = value;
          }
        });

        self._select = new FilteringSelect(selectProps);

        self.selectedItemsNode = $(self._select.domNode).find(".dijitInputContainer");
      }
      self.focusNode = self._select.focusNode;
      $(self.domNode).append(self._select.domNode);
      self._select.startup();

      self.set("value", self.get("value"));
      self.inherited(arguments);
    },

    _onFocus: function(by) {
      var self = this;

      self._select.focus();
      self.inherited(arguments);
    },

    postCreate: function(){
      this._set('value', this.get('value'));
      this.inherited(arguments);
    },

    set: function (name, value) {
      var self = this;
      if (self.proxyAttrs.indexOf(name) != -1 && self._select) {
        self._select.set(name, value);
      }
      this.inherited(arguments);
    },

    getSelected: function(){
      var self = this;
      return $(self.selectedItemsNode).find('.filteringMultiSelect-selectedItem').map(function () {
        return dijit.byNode(this);
      });
    },

    // Set multiple so parent form widget knows that I return multiple values.
    // Also adding a no-op custom setter; otherwise the multiple property is applied to the <select> node
    // which causes problem on Android < 4.4 with all but the first selected item being deselected.
    multiple: true,
    _setMultipleAttr: function(val){
    },

    _setValueAttr: function(/*String[]*/ values){
      var self = this;
      if (self.selectedItemsNode) {
        var store = self.get('store');
        var values_dict = {};
        var existing_dict = {};
        values.map(function (value) { values_dict[value] = true; });
        self.getSelected().map(function () {
          if (!values_dict[this.item.id]) {
            this.destroyRecursive();
          } else {
            existing_dict[this.item.id] = true;
          }
        });
        values.map(function (value) {
          if (!existing_dict[value]) {
            child = new FilteringMultiSelect.SelectedItem({multiSelect: self, item: store.get(value)});
            child.startup();
            $(self.selectedItemsNode).prepend(child.domNode);
          }
        });
      } else if (self._select && self._select.constructor === MultiSelect) {
        self._select.set("value", values);
      }
      this.inherited(arguments);
    }
  });

  FilteringMultiSelect.SelectedItem = dojo.declare("SelectedItem", [_Widget, _Templated], {
    baseClass: "filteringMultiSelect-selectedItem",
    widgetsInTemplate: true,
    multiSelect: null,
    templateString: "<span><span data-dojo-attach-point='text'></span><button data-dojo-attach-event='click:onClick' style='display: inline-block;'>X</button> </span>",
    _setItemAttr: function (document) {
      var self = this;
      self.inherited(arguments);
      var attr = self.multiSelect.get("labelAttr") || self.multiSelect.get("searchAttr") || "name";
      var labelType = self.multiSelect.get("labelType") || "text"
      if (labelType == "text") {
        $(self.text).text(self.item[attr]);
      } else {
        $(self.text).html(self.item[attr]);
      }
    },
    onClick: function (e) {
      var self = this;
      self.multiSelect.set(
        "value",
        self.multiSelect.get("value").filter(function (id) {
          return id != self.item.id;
        })
      );
    }
  });

  return FilteringMultiSelect;
});
