define([
  "app/Class",
  "dijit/layout/AccordionContainer",
  "jQuery",
  "app/ObjectTemplate",
  "app/Visualization/UI/SidePanels/InfoUI",
  "app/Visualization/UI/SidePanels/SimpleLayerList",
  "app/Visualization/UI/SidePanels/Filters"
], function(
  Class ,
  AccordionContainer,
  $,
  ObjectTemplate,
  InfoUI,
  SimpleLayerList,
  Filters
) {
  return Class({
    name: "BasicSidebar",

    initialize: function (ui) {
      var self = this;

      self.ui = ui;
      self.visualization = self.ui.visualization;
      self.animationManager = self.visualization.animations;

      self.node = $(new ObjectTemplate('' +        
        '<div id="w" class="expanded">' +
        '  <div id="expand-button"><img src="%(img)s/buttons/open.png"></div>' +
        '  <div class="border">' +
        '    <div class="sidebar-content">' +    
        '      <div class="header">' +
        '        <a id="activate_help" href="javascript:undefined">' +
        '          <i class="fa fa-keyboard-o"></i>' +
        '        </a>' +
        '        <a id="feedback_url" target="_blank">' +
        '          Feedback' +
        '        </a>' +
        '        <div id="collapse-button"><img src="%(img)s/buttons/close.png"></div>' +
        '      </div>' +    
        '      <div class="blades"></div>' +
        '      <div class="sponsor_logos">&nbsp;</div>' +
        '    </div>' +
        '  </div>' +
        '</div>').eval(app.dirs));
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


      self.info = new InfoUI(self);
      self.layers = new SimpleLayerList(self);

      self.filters = new Filters();
      self.sidebarContainer.addChild(self.filters);

      self.node.find("#activate_help").click(function () {
        self.visualization.ui.help.displayHelpDialog();
      });

      self.node.find("#collapse-button img").click(function () {
        self.node.css({left:self.node.offset().left + "px"});
        self.node.animate({left:"100%"}, undefined, undefined, function () {
          self.node.addClass('collapsed');
          self.node.removeClass('expanded');
        });
      });

      self.node.find("#expand-button img").click(function () {
        self.node.removeClass('collapsed');
        self.node.addClass('expanded');
        self.node.css({right: "-" + self.node.width() + "px", left: "auto"});
        self.node.animate({right: "15px"});
      });

      self.node.toggle(!self.visualization.state.getValue('edit'));
      self.visualization.state.events.on({'edit': function (data) {        
        self.node.toggle(!data.new_value);
      }});
    },

    toJSON: function () {
      var self = this;
      return self.config;
    },

    load: function (config, cb) {
      var self = this;
      self.config = config;
      var data = new ObjectTemplate(self.config).eval(app.dirs);

      self.node.find(".sponsor_logos").html("");
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
      
      self.node.find("#feedback_url").attr("href", data.feedback_url);

      cb && cb();
    }
  });
});
