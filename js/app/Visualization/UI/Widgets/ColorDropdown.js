define([
  "dojo/dom-style",
  "dojox/widget/ColorPicker",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dijit/form/RangeBoundTextBox",
  "dijit/_HasDropDown",
  "dijit/popup",
  "dojo/text!dijit/form/templates/DropDownBox.html"
], function(
  domStyle,
  ColorPicker,
  declare,
  lang,
  RangeBoundTextBox,
  _HasDropDown,
    popup,
  template
){

  return declare("ColorDropdown", [RangeBoundTextBox, _HasDropDown], {
    templateString: template,
    hasDownArrow: true,
    cssStateNodes: {
      "_buttonNode": "dijitDownArrowButton"
    },
    dropDownDefaultValue: '#ffffff',
    value: '#ffffff',
    pattern: '#[0-9a-fA-F]{6}',

    buildRendering: function(){
      this.inherited(arguments);

      if(!this.hasDownArrow){
        this._buttonNode.style.display = "none";
      }

      if(!this.hasDownArrow){
        this._buttonNode = this.domNode;
        this.baseClass += " dijitComboBoxOpenOnClick";
      }
    },

    _setValueAttr: function(value, priorityChange, formattedValue){
      this.inherited(arguments, [value, priorityChange, formattedValue]);
      if(this.dropDown){
        this.dropDown.set('value', value, false);
      }
    },

    openDropDown: function(callback){
      if(this.dropDown){
        this.dropDown.destroy();
      }
      var textBox = this,
        value = this.get("value");
      this.dropDown = new ColorPicker({
        onChange: function(value){
          textBox.set('value', value, true);
          popup.close(textBox.dropDown);
        },
        style: 'background: white; padding: 10px;',
        id: this.id + "_popup",
        dir: textBox.dir,
        lang: textBox.lang,
        value: value,
        textDir: textBox.textDir
      });

      this.inherited(arguments);
    },

    onChange: function (value) {
      domStyle.set(this._buttonNode, 'backgroundColor', value);
    }
  });
});
