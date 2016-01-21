define([
  "app/Class",
  "app/CountryCodes",
  "app/Logging",
  "app/ObjectTemplate",
  "app/Visualization/KeyModifiers",
  "app/Visualization/UI/LayerReportDialog",
  "dijit/form/HorizontalSlider",
  "dijit/layout/AccordionContainer",
  "dijit/layout/ContentPane",
  "jQuery"
], function(
  Class ,
  CountryCodes,
  Logging,
  ObjectTemplate,
  KeyModifiers,
  LayerReportDialog,
  HorizontalSlider,
  AccordionContainer,
  ContentPane,
  $
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

      self.sidebar = new AccordionContainer({splitter:true});
      $(self.sidebar.domNode).addClass("basic-sidebar");
      self.node.find(".blades").prepend(self.sidebar.domNode);
      self.sidebar.startup();

      self.info = new ContentPane({title: 'Info', content: "<div id='vessel_identifiers'></div>", doLayout: false});
      self.sidebar.addChild(self.info);
      self.sidebar.layout();

      self.layers = new ContentPane({title: 'Layers', content:"" +
          "<div id='layers'>" +
          "  <h2>Layers</h2>" +
          "  <form class='layer-list'></form" +
          "</div>", doLayout: false});
      self.sidebar.addChild(self.layers);
      self.sidebar.layout();

      self.update("none", {});

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
        'remove': self.removeHandler.bind(self),
        'info-loading': self.updateLoading.bind(self),
        'info': self.update.bind(self, "none"),
        'info-error': self.update.bind(self, "#ff0000")
      });

      self.node.toggle(!self.visualization.state.getValue('edit'));
      self.visualization.state.events.on({'edit': function (data) {        
        self.node.toggle(!data.new_value);
      }});

      self.sidebar.selectChild(self.layers, false);
    },

    updateLoading: function () {
      var self = this;
      self.node.find("#vessel_identifiers").html(
        '      <h2>Vessel Information</h2>' +
        '      <div class="loading-vessel-info" style=""><img style="width: 20px;" src="' + app.dirs.img + '/loader/spinner.min.svg"></div>'
      );
    },

    updateWithCustomInfo: function(event) {
      var self = this;
      var vesselNodes = self.node.find("#vessel_identifiers");

      var infoHtml =
        '<h2>' + event.layer + '</h2>' +
        event.data.toString();

      if (event.data.reportable) {
        infoHtml += '<br />' +
          '<div class="text-center">' +
            '<button id="generate-report" class="btn btn-default">' +
              'Generate vessel report' +
            '</button>' +
          '</div>' +
          '<br />';
      }

      vesselNodes.html(infoHtml);
      vesselNodes.find("table").attr({"class": "vessel_id"});
      vesselNodes.find("#generate-report").on('click', function() {
        LayerReportDialog.show(self.visualization.state, event.layer, event.data);
      });
    },

    update: function (color, event) {
      var self = this;

      var vesselIdNode = self.node.find("#vessel_identifiers");

      var data = event.data;
      if (!data || Object.keys(data).filter(function (name) { return name != 'toString'; }).length == 0 || data.vesselname || data.mmsi || data.imo || data.callsign) {
        vesselIdNode.html(
          '      <div class="action_icons">'+
          '        <a id="activate_search" class="activate_search" href="javascript:undefined"><i class="fa fa-search"></i></a>' +
          '      </div>' +
          '      <h2>Vessel Information</h2>' +
          '      <table class="vessel_id">' +
          '        <tbody>' +
          '          <tr>' +
          '            <th>Name</th>' +
          '            <td class="vesselname">---</td>' +
          '          </tr>' +
          '          <tr>' +
          '            <th>Class</th>' +
          '            <td class="vesselclass">---</td>' +
          '          </tr>' +
          '          <tr>' +
          '            <th>Flag</th>' +
          '            <td class="flag">---</td>' +
          '          </tr>' +
          '          <tr>' +
          '            <th>IMO</th>' +
          '            <td class="imo">---</td>' +
          '          </tr>' +
          '          <tr>' +
          '            <th>MMSI</th>' +
          '            <td class="mmsi">---</td>' +
          '          </tr>' +
          '          <tr>' +
          '            <th>Callsign</th>' +
          '            <td class="callsign">---</td>' +
          '          </tr>' +
          '        </tbody>' +
          '      </table>'
        );

        self.node.find("#activate_search").click(function () {
          self.visualization.ui.search.displaySearchDialog();
        });
        
        var tableNode =  self.node.find(".vessel_id");

        if (data) {
          tableNode.find(".callsign").html(data.callsign || "---");


          var flag;
          if (data.flagstate)
              flag = data.flagstate;
          else
              flag = data.flag;

          if (flag) {
            if (CountryCodes.codeToName[flag] != undefined) {
              tableNode.find(".flag").html(CountryCodes.codeToName[flag]);
              tableNode.find(".flag").prepend('<img src="' + app.dirs.img + '/flags/png/' + flag.toLowerCase() + '.png"><br>');
            } else {
              tableNode.find(".flag").html(flag);
            }
          } else {
            tableNode.find(".flag").html("---");
          }

          var setMultiLinkField = function (field, url_prefix) {
            var node = tableNode.find("." + field);
            if (data[field]) {
              node.html("");
              var first = true;
              data[field].split(",").map(function (value) {
                var link = $("<a target='_blank'>");
                link.text(value);
                link.attr({href: url_prefix + value});
                if (!first) {
                  node.append(", ");
                }
                node.append(link);
                first = false;
              });
            } else {
              node.html("---");
            }
          };

          setMultiLinkField('imo', 'http://www.marinetraffic.com/ais/details/ships/imo:');
          setMultiLinkField('mmsi', 'https://www.marinetraffic.com/en/ais/details/ships/');

          var classes = {
            "transport/bulkcarrier": {name: "Bulk carrier", icon: "/vessels/bulkcarrier.png"},
            "transport/cargo": {name: "Cargo vessel", icon: "/vessels/cargo.png"},
            "transport/cargo/container": {name: "Container ship", icon: "/vessels/container.png"},
            "transport/tanker": {name: "Tanker", icon: "/vessels/tanker.png"},
            "fishing": {name: "Fishing vessel", icon: "/vessels/fishing.png"},
            "transport/passenger": {name: "Passenger ship", icon: "/vessels/passenger.png"},
            "pleasurecraft": {name: "Pleasure craft", icon: "/vessels/pleasurecraft.png"},
            "reefer": {name: "Reefer", icon: "/vessels/reefer.png"},
            "fishing/research": {name: "Research vessel", icon: "/vessels/research.png"}
          };

          var getClass = function(name) {
            if (classes[name]) return classes[name];
            if (name.indexOf('/') != -1) return getClass(name.slice(0, name.lastIndexOf("/")))
            return undefined;
          }

          if (data.vesselclass) {
            var cls = getClass(data.vesselclass);
            if (cls) {
              tableNode.find(".vesselclass").html(cls.name);
              tableNode.find(".vesselclass").prepend('<img src="' + app.dirs.img + cls.icon + '"><br>');
            } else {
              tableNode.find(".vesselclass").html(data.vesselclass);
            }
          } else {
            tableNode.find(".vesselclass").html("---");
          }

          tableNode.find(".vesselname").html(data.vesselname || "---");

          if (event.layerInstance.data_view.source.header.kml) {
            var link = $('<a class="download_kml" target="_new"><i class="fa fa-download" title="Download as KML"></i></a>');
            var query = event.layerInstance.data_view.source.getSelectionQuery(
              event.layerInstance.data_view.selections.selections[event.category]);

            link.attr({
                href: (event.layerInstance.data_view.source.getUrl('export', query, -1) +
                     "/sub/" +
                     query +
                     "/export")
            });
            self.node.find(".action_icons").append(link);
          }
        }
      } else {
        self.updateWithCustomInfo(event)
      }

      vesselIdNode.css({color: color});

      self.sidebar.resize();

      if (!self.visualization.state.getValue('edit')) {
        self.sidebar.selectChild(self.info, true);
      }
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
