define([
  "app/Class",
  "dijit/layout/AccordionContainer",
  "shims/jQuery/main",
  "app/ObjectTemplate",
  "app/Visualization/UI/SidePanels/InfoUI",
  "app/Visualization/UI/SidePanels/SimpleLayerList",
  "app/Visualization/UI/SidePanels/Filters",
  "app/Visualization/UI/SidePanels/LoggingUI",
  "app/Visualization/UI/SidePanels/AnimationManagerUI",
  "app/Visualization/UI/SidePanels/DataUI",
  "app/Visualization/UI/Paths"
], function(
  Class ,
  AccordionContainer,
  $,
  ObjectTemplate,
  InfoUI,
  SimpleLayerList,
  Filters,
  LoggingUI,
  AnimationManagerUI,
  DataUI,
  Paths
) {
  return Class({
    name: "SidePanelManager",

    initialize: function (ui) {
      var self = this;

      self.ui = ui;
      self.visualization = self.ui.visualization;
      self.animationManager = self.visualization.animations;

      self.node = $(new ObjectTemplate('' +        
        '<div id="w" class="expanded">' +
        '  <div id="expand-button"><i class="fa fa-chevron-circle-left"></i><!--img src="%(img)s/buttons/open.png"--></div>' +
        '  <div class="border">' +
        '    <div class="sidebar-content">' +    
        '      <div class="header">' +
        '        <a id="activate_help" href="javascript:undefined">' +
        '          <i class="fa fa-keyboard-o"></i>' +
        '        </a>' +
        '        <a id="feedback_url" target="_blank">' +
        '          Feedback' +
        '        </a>' +
        '        <div id="collapse-button"><i class="fa fa-chevron-circle-right"></i><!--img src="%(img)s/buttons/close.png"--></div>' +
        '      </div>' +    
        '      <div class="blades"></div>' +
        '      <div class="sponsor_logos">&nbsp;</div>' +
        '    </div>' +
        '  </div>' +
        '</div>').eval(Paths));
      $('body').append(self.node);

      self.sidebarContainer = new AccordionContainer({splitter:true});
      $(self.sidebarContainer.domNode).addClass("basic-sidebar");
      self.node.find(".blades").prepend(self.sidebarContainer.domNode);
      self.sidebarContainer.startup();

      // FIXME: Hack. Eventually, the sidebar will be a real widget,
      // and this duplication will not be necessary
      self.sidebarContainer.ui = ui;
      self.sidebarContainer.visualization = self.ui.visualization;
      self.sidebarContainer.animationManager = self.visualization.animations;

      self.node.find("#activate_help").click(function () {
        self.visualization.ui.help.displayHelpDialog();
      });

      self.node.find("#collapse-button").click(function () {
        self.node.css({left:self.node.offset().left + "px"});
        self.node.animate({left:"100%"}, undefined, undefined, function () {
          self.node.addClass('collapsed');
          self.node.removeClass('expanded');
        });
      });

      self.node.find("#expand-button").click(function () {
        self.node.removeClass('collapsed');
        self.node.addClass('expanded');
        self.node.css({right: "-" + self.node.width() + "px", left: "auto"});
        self.node.animate({right: "0px"});
      });

      var resize = self.node.find(".sidebar-content");

      resize.mousedown(self.resizeStart.bind(self));
      $(document).mousemove(self.resizeMove.bind(self));
      $(document).mouseup(self.resizeEnd.bind(self));
      resize.on('touchstart', self.resizeStart.bind(self));
      $(document).on('touchmove', self.resizeMove.bind(self));
      $(document).on('touchend', self.resizeEnd.bind(self));

      self.initTabs();
      self.ui.visualization.state.events.on({'edit': self.setTabs.bind(self)});
      self.setTabs();

    },

    tabClasses: [
      InfoUI,
      SimpleLayerList,
      AnimationManagerUI,
      Filters,
      LoggingUI,
      DataUI
    ],
      
    initTabs: function () {
      var self = this;
      self.filters_tab = true;
      self.tabs = self.tabClasses.map(function (tabClass) {
        var tab = new tabClass({visualization: self.visualization});
        tab.startup();
        self[tabClass.prototype.baseClass] = tab;
        return tab;
      });
    },

    setTabs: function () {
      var self = this;
      var advanced = !!self.visualization.state.getValue('edit');

      self.sidebarContainer.getChildren().map(function (tab) {
        self.sidebarContainer.removeChild(tab);
      });
      self.tabs.map(function (tab) {
        if (!self.filters_tab && tab.name == "Filters") return;
        if ((tab.advanced === undefined) || (tab.advanced == advanced)) {
          self.sidebarContainer.addChild(tab);
          if (tab.select_default) {
            self.sidebarContainer.selectChild(tab, false);
          }
        }
      });
    },

    // Copied from Timeline...
    getEventPositions: function (e) {
      var event = e.originalEvent || e;
      var res = {};
      if (event.touches && event.touches.length > 0) {
        for (var i = 0; i < event.touches.length; i++) {
          res[event.touches[i].identifier.toString()] = event.touches[i];
        };
      } else {
        event.identifier = "pointer";
        res[event.identifier] = event;
      }

      if (e.ctrlKey && e.altKey && e.shiftKey) {
        console.log("Multi-touch test mode enabled.");
        var offsets = $(".window").offset();
        var left = {identifier: "left", pageX: offsets.left - 1, pageY: offsets.top + 1};
        res[left.identifier] = left;
      }

      return res;
    },

    getFirstPosition: function (positions) {
      for (var key in positions) {
        return positions[key];
      }
    },

    resizeStart: function (e) {
      var self = this;
      var pos = self.getFirstPosition(self.getEventPositions(e));
      self.resizing = {
        original_pos: pos,
        original_width: self.node.outerWidth()
      };
      self.node.css({"max-width": "none"});
      // Don't grow the collapse button (it has a width in % to handle different screen sizes)
      var collapse_button = self.node.find("#collapse-button img")
      collapse_button.css({width: collapse_button.outerWidth() + "px"});
    },
    resizeMove: function (e) {
      var self = this;
      if (self.resizing == undefined) return;

      var pos = self.getFirstPosition(self.getEventPositions(e));
      var offset = pos.pageX - self.resizing.original_pos.pageX;
      self.node.css({"width": (self.resizing.original_width - offset).toString() + "px"});
    },
    resizeEnd: function (e) {
      var self = this;
      self.resizing = undefined;
      self.sidebarContainer.resize();
    },

    toJSON: function () {
      var self = this;
      return self.config;
    },

    load: function (config, cb) {
      var self = this;
      self.config = config;
      var data = new ObjectTemplate(self.config).eval(Paths);

      self.node.find(".sponsor_logos").html("");
      if (data.sponsorLogos.length) {
        data.sponsorLogos.map(function (spec) {
          if (typeof(spec) == "string") {
            self.node.find(".sponsor_logos").append(spec);
          } else {
            var logo = $("<img>");
            logo.attr(spec.attr);
            logo.css(spec.css);
            self.node.find(".sponsor_logos").append(logo);
          }
        });
        self.node.find(".sidebar-content").addClass("has-sponsor-logos");
      } else {
        self.node.find(".sidebar-content").removeClass("has-sponsor-logos");
      }
      
      self.node.find("#feedback_url").toggle(!!data.feedback_url);
      if (data.feedback_url) {
        self.node.find("#feedback_url").attr("href", data.feedback_url);
      }

      data.filters_tab = !!data.filters_tab;
      self.setTabs();

      cb && cb();
    }
  });
});
