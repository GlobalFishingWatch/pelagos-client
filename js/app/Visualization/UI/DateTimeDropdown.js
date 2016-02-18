define([
  "dojo/dom-style",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dijit/form/RangeBoundTextBox",
  "dijit/_HasDropDown",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_WidgetsInTemplateMixin",
  "dijit/_Container",
  "dijit/popup",
  "dojo/text!dijit/form/templates/DropDownBox.html",
  "dijit/Calendar",
  "dijit/_TimePicker"
], function(
  domStyle,
  declare,
  lang,
  RangeBoundTextBox,
  _HasDropDown,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  popup,
  template
){

  var DateTimeDropdown = declare("DateTimeDropdown", [RangeBoundTextBox, _HasDropDown], {
    templateString: template,
    hasDownArrow: true,
    cssStateNodes: {
      "_buttonNode": "dijitDownArrowButton"
    },
    value: new Date('1970-01-01 00:00:00.000'),
    pattern: '[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}(.[0-9]{3})?Z?',


    format: function(value, constraints) {
      return value.toISOString();
    },
    parse: function(value, constraints) {
      return new Date(value);
    },


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
      this.dropDown = new this.constructor.DateTimeSelector({
        onChange: function(value){
          textBox.set('value', value.toISOString(), true);
//          popup.close(textBox.dropDown);
        },
        value: value,
        id: this.id + "_popup",
        dir: textBox.dir,
        lang: textBox.lang,
        textDir: textBox.textDir,
      });

      this.inherited(arguments);
    }
  });

  DateTimeDropdown.DateTimeSelector = declare("DateTimeSelector", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    templateString: '' +
      '<div class="${baseClass}" style="background: white; padding: 8px; border: solid 1px #b5bcc7; border-collapse: separate; -moz-border-radius: 4px; border-radius: 4px;">' +
      '  <div data-dojo-type="dijit/Calendar" data-dojo-attach-point="calendar" data-dojo-attach-event="onChange:setDate"></div>' +
      '  <div style="height: 100px; overflow: auto; margin-top: 8px; border: solid 1px #b5bcc7; border-collapse: separate; -moz-border-radius: 4px; border-radius: 4px;" data-dojo-type="dijit/_TimePicker" data-dojo-attach-point="time" data-dojo-attach-event="onChange:setTime"></div>' +
      '</div>',

    value: new Date(),

    setDateTime: function (date, time) {
      var self = this;
      self.set("value", new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds()));
    },

    setDate: function (date) {
      var self = this;
      self.setDateTime(date, self.get("value"));
    },

    setTime: function (time) {
      var self = this;
      self.setDateTime(self.get("value"), time);
    },

    _setValueAttr: function (value) {
      var self = this;
      self._set("value", value);
      self.onChange(value);
    },

    onChange: function () {}
  });

  return DateTimeDropdown;
});
