define([
  "app/Class",
  "app/Logging",
  "jQuery",
  "dijit/Fieldset",
  "dijit/form/HorizontalSlider",
  "dojox/layout/FloatingPane",
  "dijit/layout/ContentPane",
  "dijit/Menu",
  "dijit/MenuItem",
  "dijit/popup",
  "dojo/dom",
  "dojo/parser",
  "dojo/domReady!"
], function(Class, Logging, $, Fieldset, HorizontalSlider, FloatingPane, ContentPane, Menu, MenuItem, popup){
  return Class({
    name: "LoggingUI",
    initialize: function (sidePanels) {
      var self = this;

      self.sidePanels = sidePanels;

      self.ui = new ContentPane({title: "Logging"});
      self.sidePanels.sidebarContainer.addChild(self.ui);
      self.sidePanels.sidebarContainer.layout();

      self.updateUI(self.sidePanels.ui.visualization.state.getValue("logging"));

      self.sidePanels.ui.visualization.state.events.on({
        logging: function () {
          self.updateUI(self.sidePanels.ui.visualization.state.getValue("logging"));
        }
      });
    },

    updateUI: function (rules) {
      var self = this;

      self.ui.getChildren().map(function (child) {
        child.destroy();
      });

      Object.items(rules).map(function (dst) {

        var destinationWidget = new ContentPane({
          content: dst.key + " <a href='javascript:void(0);' class='add'><i class='fa fa-plus-square'></i></a>",
          style: "padding-top: 0; padding-bottom: 0;"
        });

        var addButton = $(destinationWidget.domNode).find("a.add");

        addButton.click(function () {
          var ruleSelect = new Menu({});

          Logging.main.getUsedCategories().map(function (key) {
            var item = new MenuItem({
              label: key,
              onClick: function () {
                var newRules = $.extend({}, rules);
                newRules[dst.key] = $.extend({}, newRules[dst.key]);
                newRules[dst.key].rules.push('-' + key); 
                self.sidePanels.ui.visualization.state.setValue("logging", newRules);
              }
            });
            ruleSelect.addChild(item);
          });

          popup.open({
            popup: ruleSelect,
            onExecute : function() { 
              popup.close(ruleSelect);
              ruleSelect.destroy();
            }, 
            onCancel : function() { 
              popup.close(ruleSelect);
              ruleSelect.destroy();
            }, 
            onClose : function() { 
              popup.close(ruleSelect);
              ruleSelect.destroy();
            }, 
            around:addButton[0]
          });
        });

        var dstRules = dst.value.rules.map(function (x) { return x; });

        dstRules.sort(function (a, b) {
          var at = a;
          var bt = b;
          if (at.indexOf('-') == 0) at = at.substr(1);
          if (bt.indexOf('-') == 0) bt = bt.substr(1);
          if (at > bt) return 1;
          if (at < bt) return -1;
          return 0;
        });

        dstRules.map(function (rule) {
          var title = rule;
          var isNegative = rule.indexOf('-') == 0;
          if (isNegative) {
            title = title.substr(1);
          }

          var sourceWidget = new ContentPane({
            content: "<input class='positive' type='checkbox'></input> " + title + " <a href='javascript:void(0);' class='remove'><i class='fa fa-minus-square'></i></a>",
            style: "padding-top: 0; padding-bottom: 8px;"
          });
          var isPositiveNode = $(sourceWidget.domNode).find(".positive")
          if (!isNegative) {
            isPositiveNode.attr({'checked': 'checked'});
          }

          isPositiveNode.click(function () {
            var newRules = $.extend({}, rules);
            newRules[dst.key] = $.extend({}, newRules[dst.key]);
            newRules[dst.key].rules = newRules[dst.key].rules.map(function (x) {
              if (x != rule) return x;
              if (isNegative) {
                return title;
              } else {
                return '-' + title;
              }
            });

            self.sidePanels.ui.visualization.state.setValue("logging", newRules);

          });

          $(sourceWidget.domNode).find("a.remove").click(function () {

            var newRules = $.extend({}, rules);
            newRules[dst.key] = $.extend({}, newRules[dst.key]);
            newRules[dst.key].rules = newRules[dst.key].rules.filter(function (x) {
              return x != rule;
            });

            self.sidePanels.ui.visualization.state.setValue("logging", newRules);
          })
          destinationWidget.addChild(sourceWidget);
        });
        self.ui.addChild(destinationWidget);
      });
    }
  });
});
