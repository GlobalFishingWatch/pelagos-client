define([
  "app/Class",
  "app/Logging",
  "app/CountryCodes",
  "dijit/layout/ContentPane",
  "dijit/layout/AccordionContainer",
  "jQuery",
  "dijit/form/HorizontalSlider",
  "app/Visualization/KeyModifiers",
  "app/ObjectTemplate",
  "app/Visualization/UI/SidePanels/SimpleInfoUI"
], function(
  Class ,
  Logging,
  CountryCodes,
  ContentPane,
  AccordionContainer,
  $,
  HorizontalSlider,
  KeyModifiers,
  ObjectTemplate,
  SimpleInfoUI
) {
  return Class({
    name: "BasicSidebar",

    initialize: function (visualization) {
      var self = this;

      self.visualization = visualization;
      self.animationManager = visualization.animations;

      self.idCounter = 0;

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

      self.info = new SimpleInfoUI(self);

      self.layers = new ContentPane({title: 'Layers', content:"" +
          "<div id='layers'>" +
          "  <h2>Layers</h2>" +
          "  <form class='layer-list'></form>" +
          "</div>"});
      self.sidebarContainer.addChild(self.layers);

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

      self.animationManager.events.on({
        'add': self.addHandler.bind(self),
        'remove': self.removeHandler.bind(self)
      });

      self.node.toggle(!self.visualization.state.getValue('edit'));
      self.visualization.state.events.on({'edit': function (data) {        
        self.node.toggle(!data.new_value);
      }});

      self.sidebarContainer.selectChild(self.layers, false);
    },

    addHandler: function (event) {
      var self = this;
      var animation = event.animation

      var node = $('' +
        '<div class="layer-row">' +
        '  <label class="switch">' +
        '    <input class="cmn-toggle" type="checkbox">' +
        '    <div class="switch-line"></div>' +
        '  </label>' +
        '  <div class="layer-label"></div>' +
        '</div>');

      node.find(".cmn-toggle").attr({id:"cmn-toggle-" + self.idCounter});
      node.find("label").attr({"for":"cmn-toggle-" + self.idCounter});
      self.idCounter++;

      if (!animation.title) animation.title = animation.toString();
      node.find(".layer-label").html(animation.title);

      if (!animation.color) animation.color = 'orange';
      node.find("input").addClass('cmn-toggle-' + animation.color);

      node.find("input").change(function (event) {
        animation.setVisible(event.target.checked);
      });

      animation.basicSidebarNode = node;
      self.node.find(".layer-list").append(node);

      if (animation.constructor.prototype.name == "ClusterAnimation") {
        var val2slider = function(val) { return Math.log(1 + val)/Math.log(4); };
        var slider2val = function(val) { return Math.pow(4, val) - 1; };

        var maxv = val2slider(animation.data_view.header.colsByName.weight.max);
        var minv = val2slider(animation.data_view.header.colsByName.weight.min);
        var curv = val2slider(animation.data_view.header.colsByName.weight.source.weight);

        var update = undefined;
        var refreshSwatch = function () {
          if (update != undefined) return;
          update = setTimeout(function () {
            var value = slider.value;

            animation.data_view.header.colsByName.weight.source.weight = slider2val(value);
            animation.data_view.changeCol(animation.data_view.header.colsByName.weight);
            update = undefined;
          }, 100);
        }

        var slider = new HorizontalSlider({
          value:curv,
          minimum: minv,
          maximum: maxv,
          discreteValues: 100,
          onChange: refreshSwatch,
          intermediateChanges: true
        }, "mySlider");

        var intensityNode = $('<div class="intensity-slider-box"><div class="intensity-label">Intensity:</div></div>')
        node.find(".layer-label").append(intensityNode);
        slider.placeAt(intensityNode[0]);
        slider.startup();

        node.find("input").change(function (event) {
          intensityNode.toggle(event.target.checked);
        });
      }

      /* Transplanted from
       * js/app/Visualization/UI/SidePanels/DataViewUI.js This is a
       * hack for now... */

      if (animation.data_view && animation.data_view.selections.selections.active_category) {
        var selection = animation.data_view.selections.selections.active_category;
        var name = "active_category";

        if (!selection.hidden && selection.sortcols.length == 1) {
          var sourcename = selection.sortcols[0]
          var source = animation.data_view.source.header.colsByName[sourcename];
          if (source && source.choices) {

            var selectionwidget = new ContentPane({
              content: "<div>" + name + " from " + sourcename + "</div>",
              style: "padding-top: 0; padding-bottom: 0;"
            });

            var selectionselect = $("<div class='imageselector' style='position: fixed; z-index: 100000; background: white; border: 1px solid red;'><div class='choices' style='overflow: auto; height:200px;'></div><div class='label'></div></div>");
            var choices = Object.keys(
              CountryCodes.codeToName
            ).filter(function (key) {
              return source.choices[key] != undefined;
            });
            choices.sort();
            choices.map(function (key) {
              var value = source.choices[key];
              var option = $('<img src="' + app.dirs.img + '/flags/png/' + key.toLowerCase() + '.png" alt="' + CountryCodes.codeToName[key] + '" class="choice">');
              // option.text(key);
              option.data("value", value);
              if (selection.data[sourcename].indexOf(value) != -1) {
                option.addClass("selected");
              }
              option.hover(function () {
                selectionselect.find('.label').html(CountryCodes.codeToName[key]);
              }, function () {});
              option.click(function () {
                option.toggleClass("selected");
                updateSelection();
              });
              selectionselect.find('.choices').append(option);
            });

            var toggleselectionselect = $("<div>Countries</div>");
            toggleselectionselect.click(function () {
              selectionselect.toggle();
            });
            selectionselect.hide();
            $(self.node.find(".layer-list")).append(toggleselectionselect);
            $(self.node.find(".layer-list")).append(selectionselect);

            var updateSelection = function () {
              selection.clearRanges();

              var values = Array.prototype.slice.call(
                selectionselect.find('.choices .selected')
              ).map(function (option) {
                return $(option).data("value");
              });
              if (values.length) {
                values.map(function (value) {
                  var data = {};
                  data[sourcename] = value;
                  selection.addDataRange(data, data);
                });
              } else {
                var startData = {};
                var endData = {};
                startData[sourcename] = Number.NEGATIVE_INFINITY;
                endData[sourcename] = Number.POSITIVE_INFINITY;
                selection.addDataRange(startData, endData);
              }
            };
          }
        }
      }

      if (animation.visible) {
        node.find("input").attr('checked','checked');
      } else {
        node.find("input").removeAttr('checked');
      }
    },

    removeHandler: function (event) {
      event.animation.basicSidebarNode.remove();
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
