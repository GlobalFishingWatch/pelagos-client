define([
  "dojo/dom-style",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dijit/form/_DateTimeTextBox",
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
  _DateTimeTextBox,
  _HasDropDown,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  _Container,
  popup,
  template
){
  var DateTimeSelector = declare("DateTimeSelector", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Container], {
    templateString: '' +
      '<div class="${baseClass}" style="background: white; padding: 8px; border: solid 1px #b5bcc7; border-collapse: separate; -moz-border-radius: 4px; border-radius: 4px;">' +
      '  <div data-dojo-type="dijit/Calendar" data-dojo-attach-point="calendar" data-dojo-attach-event="onChange:setDate"></div>' +
      '  <div style="height: 100px; overflow: auto; margin-top: 8px; border: solid 1px #b5bcc7; border-collapse: separate; -moz-border-radius: 4px; border-radius: 4px;" data-dojo-type="dijit/_TimePicker" data-dojo-attach-point="time" data-dojo-attach-event="onChange:setTime" data-dojo-props="constraints: {selector: \'time\'}"></div>' +
      '</div>',

    value: new Date(),

    constraints: {selector: 'time', timePattern:'HH:mm:ss', clickableIncrement:'T00:15:00', visibleIncrement:'T00:15:00', visibleRange:'T01:00:00'},

    setDateTime: function (date, time) {
      var self = this;
      if (self.widgetUpdate) return;
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
      var old = self.value;

      if (value == null || value == undefined) {
        value = new Date();
      }

      self._set("value", value);

      self.widgetUpdate = true;
      self.calendar.set("value", value);
      self.calendar.set("currentFocus", value);
      self.time.set("value", value);
      self.time.set("currentFocus", value);
      self.widgetUpdate = false;

      if ((value && value.toISOString()) != (old && old.toISOString())) {
        self.onChange(value);
      }
    },

    onChange: function () {}
  });

  return declare("DateTimeDropdown", [_DateTimeTextBox], {
    _selector: undefined,
    popupClass: DateTimeSelector,

    /* Hack to get ISO date format */
    constructor: function(){
     this._set('pattern', this.constructor.prototype.pattern);
    },
    pattern: '[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}:[0-9]{2}\(\.[0-9]{3}\)?Z?',
    format: function(/*Date*/ value, /*locale.__FormatOptions*/ constraints){
      if(!value){ return ''; }
      return value.toISOString().slice(0, -1).replace("T", " ");
    },

    "parse": function(value, constraints){
      if(!value){ return null; }
      return new Date(value.replace(" ", "T"));
    }
  });
});
