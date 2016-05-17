define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "dojo/dom-attr",
  "app/Logging",
  "app/Visualization/UI/TemplatedContainer",
  "app/Visualization/UI/SidePanels/SidePanelBase",
  "dijit/Menu",
  "dijit/MenuItem",
  "dijit/popup",
  "shims/lodash/main"
], function(
  declare,
  domStyle,
  domAttr,
  Logging,
  TemplatedContainer,
  SidePanelBase,
  Menu,
  MenuItem,
  popup,
  _
){
  var LoggingUI = declare("LoggingUI", [SidePanelBase], {
    baseClass: 'LoggingUI',
    title: 'Logging',

    visualization: null,

    startup: function () {
      var self = this;

      self.inherited(arguments);

      self.visualization.state.events.on({
        logging: self.update.bind(self)
      });
      self.update();
    },

    update: function () {
      var self = this;

      var rules = self.visualization.state.getValue("logging");

      self.getChildren().map(function (child) {
        child.destroy();
      });

      Object.items(rules).map(function (dst) {
        var dstWidget = new self.constructor.DestinationWidget({
          visualization: self.visualization,
          rules: rules,
          destination: dst.key,
          destinationRules: dst.value.rules
        });
        self.addChild(dstWidget);
      });
    }
  });

  LoggingUI.DestinationWidget = declare("DestinationWidget", [TemplatedContainer], {
    baseClass: 'DestinationWidget',
    templateString: '<div class="${baseClass}" style="padding-top: 0; padding-bottom: 0;">' +

      '  ${destination} ' +
      '  <a href="javascript:void(0);" class="add" data-dojo-attach-point="addNode" data-dojo-attach-event="click: add">' +
          '<i class="fa fa-plus-square"></i>' +
        '</a>' +
      '  <div class="${baseClass}Container" data-dojo-attach-point="containerNode"></div>' +
      '</div>',

    visualization: null,
    rules: null,
    destination: "Unknown",
    destinationRules: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.get("destinationRules").map(function (rule) {
        var dstWidget = new self.constructor.SourceWidget({
          visualization: self.visualization,
          rules: self.rules,
          destination: self.destination,
          rule: rule
        });
        self.addChild(dstWidget);
      });
    },

    sortRules: function(rules) {
      rules = rules.slice();
      rules.sort(function (a, b) {
        var at = a;
        var bt = b;
        if (at.indexOf('-') == 0) at = at.substr(1);
        if (bt.indexOf('-') == 0) bt = bt.substr(1);
        if (at > bt) return 1;
        if (at < bt) return -1;
        return 0;
      });
      return rules;
    },

    _setDestinationRulesAttr: function (value) {
      var self = this;
      self._set("destinationRules", self.sortRules(value));
    },

    add: function () {
      var self = this;
      new self.constructor.AddMenu({
        visualization: self.visualization,
        destination: self.destination,
        rules: self.rules,
        menuFor: self.addNode
      }).startup();
    }
  });

  LoggingUI.DestinationWidget.AddMenu = declare("AddMenu", [Menu], {
    visualization: null,
    destination: null,
    rules: null,
    menuFor: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      Logging.main.getUsedCategories().map(function (source) {
        var item = new MenuItem({
          label: source,
          onClick: function () {
            var newRules = _.clone(self.rules);
            newRules[self.destination] = _.clone(newRules[self.destination]);
            newRules[self.destination].rules = newRules[self.destination].rules.concat(['-' + source]);
            self.visualization.state.setValue("logging", newRules);
          }
        });
        self.addChild(item);
      });

      popup.open({
        popup: self,
        onExecute: self.close.bind(self),
        onCancel: self.close.bind(self),
        onClose: self.close.bind(self),
        around: self.menuFor
      });
    },

    close: function () {
      var self = this;
      popup.close(self);
      self.destroy();
    }
  });

  LoggingUI.DestinationWidget.SourceWidget = declare("SourceWidget", [TemplatedContainer], {
    baseClass: 'SourceWidget',
    templateString: '<div class="${baseClass}" style="padding-top: 0; padding-bottom: 8px;">' +
      '  <input class="positive" type="checkbox" data-dojo-attach-point="toggleNode" data-dojo-attach-event="click:toggle"></input>' +
      '  <span data-dojo-attach-point="titleNode"></span>' +
      '  <a href="javascript:void(0);" class="remove" data-dojo-attach-event="click:remove">' +
          '<i class="fa fa-minus-square"></i>' +
        '</a>' +
      '</div>',

    visualization: null,
    destination: "Unknown",
    rules: null,
    rule: 'unknown',
    title: 'unknown',
    invertedRule: 'unknown',

    _setRuleAttr: function (value) {
      var self = this;
      self._set("rule", value);
      var isNegative = value.indexOf('-') == 0;

      if (isNegative) {
        self.title = value.substr(1);
        self.invertedRule = value.substr(1);
      } else {
        self.title = value;
        self.invertedRule = '-' + value;
      }
      self.titleNode.innerHTML = self.title;
      if (isNegative) {
        domAttr.remove(self.toggleNode, "checked");
      } else {
        domAttr.set(self.toggleNode, 'checked', 'checked');
      }
    },

    toggle: function () {
      var self = this;

      var newRules = _.clone(self.rules);
      newRules[self.destination] = _.clone(newRules[self.destination]);
      newRules[self.destination].rules = newRules[self.destination].rules.map(function (x) {
        if (x != self.rule) return x;
        return self.invertedRule;
      });

      self.visualization.state.setValue("logging", newRules);
    },

    remove: function () {
      var self = this;

      var newRules = _.clone(self.rules);
      newRules[self.destination] = _.clone(newRules[self.destination]);
      newRules[self.destination].rules = newRules[self.destination].rules.filter(function (x) {
        return x != self.rule;
      });

      self.visualization.state.setValue("logging", newRules);
    }
  });

  return LoggingUI;
});
