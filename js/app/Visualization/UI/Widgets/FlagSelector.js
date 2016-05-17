define([
  "dojo/_base/declare",
  "app/CountryCodes",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/form/_FormValueMixin",
  "shims/jQuery/main"
], function(
  declare,
  CountryCodes,
  _WidgetBase,
  _TemplatedMixin,
  _FormValueMixin,
  $
){
  return declare("FlagSelector", [_WidgetBase, _TemplatedMixin, _FormValueMixin], {
    baseClass: 'FlagSelector',
    templateString: '<div class="${baseClass}">' +
                    '  <div class="${baseClass}-choices" data-dojo-attach-point="choicesNode,focusNode"></div>' +
                    '  <div class="${baseClass}-label" data-dojo-attach-point="labelNode"></div>' +
                    '</div>',
    choices: [],
    value: [],
    postCreate: function () {
      var self = this;
      self.inherited(arguments);
      self.set("choices", self.choices);
      self.set("value", self.value);
    },
    _setValueAttr: function (value) {
      var self = this;
      self.inherited(arguments);
      $(self.choicesNode).find('.' + self.baseClass + '-choice').map(function (idx, choice) {
        choice = $(choice);
        if (value.indexOf(choice.data("value")) != -1) {
          choice.addClass(self.baseClass + "-selected");
        } else {
          choice.removeClass(self.baseClass + "-selected");
        }
      });
    },
    _setChoicesAttr: function (value) {
      var self = this;
      self._set("choices", value);

      var selectionselect = $(self.domNode);
      var choices = Object.keys(
        CountryCodes.codeToName
      );
      if (value && value.length) {
        choices = choices.filter(function (key) {
          return self.choices.indexOf(key) != -1;
        });
      }
      choices.sort();
      $(self.choicesNode).html("");
      choices.map(function (key) {
        var choice = $('<img src="' + app.dirs.img + '/flags/png/' + key.toLowerCase() + '.png" alt="' + CountryCodes.codeToName[key] + '" class="' + self.baseClass + '-choice">');
        // choice.text(key);
        choice.data("value", key);
        choice.hover(function () {
          $(self.labelNode).html(CountryCodes.codeToName[key]);
        }, function () {});
        choice.click(function () {
          if (self.value.indexOf(key) == -1) {
            self.set("value", self.value.concat([key]));
          } else {
            self.set("value", self.value.filter(function (item) { return item != key; }));
          }
        });
        $(self.choicesNode).append(choice);
      });
    }
  });
});
