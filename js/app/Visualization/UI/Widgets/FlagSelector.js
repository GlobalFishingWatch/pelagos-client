define([
  "dojo/_base/declare",
  "app/CountryCodes",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/form/_FormValueMixin",
  "shims/jQuery/main",
  "app/Paths"
], function(
  declare,
  CountryCodes,
  _WidgetBase,
  _TemplatedMixin,
  _FormValueMixin,
  $,
  Paths
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
      /* Sort by country name, not country code, as the name is what
       * is displayed to the user, and sorting by CC is therefore
       * confusing. */
      choices.sort(function (a, b) {
        a = CountryCodes.codeToName[a];
        b = CountryCodes.codeToName[b];

        return a < b ? -1 : (a > b ? 1 : 0);
      });
      $(self.choicesNode).html("");
      choices.map(function (key) {
        var choice = $('<img src="' + Paths.img + '/flags/png/' + key.toLowerCase() + '.png" alt="' + CountryCodes.codeToName[key] + ' [' + key + ']" class="' + self.baseClass + '-choice">');
        // choice.text(key);
        choice.data("value", key);
        choice.hover(function () {
          $(self.labelNode).html(CountryCodes.codeToName[key] + ' [' + key + ']');
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
