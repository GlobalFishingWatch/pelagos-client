define([
  "app/Class",
  "app/Logging",
  "app/CountryCodes",
  "jQuery",
  "dijit/form/HorizontalSlider",
  "app/Visualization/KeyModifiers",
  "app/ObjectTemplate"
], function(
  Class ,
  Logging,
  CountryCodes,
  $,
  HorizontalSlider,
  KeyModifiers,
  ObjectTemplate
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
        '    <div id="content">' +
        '      <a id="activate_help" href="javascript:undefined" style="float: right; font-size: 15pt"><i class="fa fa-keyboard-o"></i></a>' +
        '' +
        '      <div id="collapse-button"><img src="%(img)s/buttons/close.png"></div>' +
        '' +
        '      <div id="layers">' +
        '        <h2>Layers</h2>' +
        '        <form class="layer-list"></form>' +
        '      </div>' +
        '' +
        '      <div id="divide"></div>' +
        '' +
        '      <a id="activate_search" href="javascript:undefined"><i class="fa fa-search"></i></a>' +
        '      <div id="vessel_identifiers"></div>' +
        '' +
        '      <div id="codeoutput"></div>' +
        '      <div id="divide"></div>' +
        '      <div id="sponsor_logos"></div>' +
        '    </div>' +
        '  </div>' +
        '</div>').eval(app.dirs));
      $('body').append(self.node);

      self.update("none", {});

      self.node.find("#activate_search").click(function () {
        self.visualization.ui.search.displaySearchDialog();
      });

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
    },

    updateLoading: function () {
      var self = this;
      self.node.find("#vessel_identifiers").html(
        '      <h2>Vessel Information</h2>' +
        '      <div class="loading-vessel-info" style=""><img style="width: 20px;" src="' + app.dirs.img + '/loader/spinner.min.svg"></div>'
      );
    },

    update: function (color, event) {
      var self = this;

      var data = event.data;
      if (!data || Object.keys(data).filter(function (name) { return name != 'toString'; }).length == 0 || data.vesselname || data.mmsi || data.imo || data.callsign) {
        self.node.find("#vessel_identifiers").html(
          '      <h2>Vessel Information</h2>' +
          '      <span class="download"></span>' +
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

        if (data) {
          self.node.find(".vessel_id .callsign").html(data.callsign || "---");


          var flag;
          if (data.flagstate)
              flag = data.flagstate;
          else
              flag = data.flag;

          if (flag) {
            if (CountryCodes.codeToName[flag] != undefined) {
              self.node.find(".vessel_id .flag").html(CountryCodes.codeToName[flag]);
              self.node.find(".vessel_id .flag").prepend('<img src="' + app.dirs.img + '/flags/png/' + flag.toLowerCase() + '.png"><br>');
            } else {
              self.node.find(".vessel_id .flag").html(flag);
            }
          } else {
            self.node.find(".vessel_id .flag").html("---");
          }

          self.node.find(".vessel_id .imo").html(data.imo || "---");
          self.node.find(".vessel_id .mmsi").html(data.mmsi || "---");

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
              self.node.find(".vessel_id .vesselclass").html(cls.name);
              self.node.find(".vessel_id .vesselclass").prepend('<img src="' + app.dirs.img + cls.icon + '"><br>');
            } else {
              self.node.find(".vessel_id .vesselclass").html(data.vesselclass);
            }
          } else {
            self.node.find(".vessel_id .vesselclass").html("---");
          }

          self.node.find(".vessel_id .vesselname").html(data.vesselname || "---");

          if (data.link) {
            var link = $("<a target='_new'>");
            link.attr({href: data.link});
            self.node.find("#vessel_identifiers h2").wrapInner(link);
          }

          var link = $('<a target="_new">Download as KML</a>');

          link.attr({
              href: (event.layerInstance.data_view.source.getUrl('export', -1) +
                   "/sub/" +
                   event.layerInstance.data_view.source.getSelectionQuery(
                     event.layerInstance.data_view.selections.selections[event.category]) +
                   "/export")
          });
          self.node.find(".download").append(link);

        }
      } else {
        self.node.find("#vessel_identifiers").html(
          '<h2>' + event.layer + '</h2>' +
          data.toString());
        self.node.find("table").attr({"class": "vessel_id"});
      }

      self.node.find("#vessel_identifiers").css({color: color});
    },

    addHandler: function (event) {
      var self = this;
      var animation = event.animation

      var node = $('' +
        '<div class="layer-row">' +
        '  <div class="switch">' +
        '    <input class="cmn-toggle" type="checkbox">' +
        '    <label></label>' +
        '  </div>' +
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
      if (animation.visible) {
        node.find("input").attr('checked','checked');
      } else {
        node.find("input").removeAttr('checked');
      }

      animation.basicSidebarNode = node;
      self.node.find(".layer-list").append(node);

      if (animation.constructor.prototype.name == "ClusterAnimation") {
        var maxv = Math.log(1+0.2)/Math.log(4);
        var minv = Math.log(1+0)/Math.log(4);

        // This is a hack to set the current value within the max value of our exponential scale below...
        animation.data_view.header.colsByName.weight.source.weight = Math.pow(4, maxv) - 1;
        animation.data_view.changeCol(animation.data_view.header.colsByName.weight);

        var update = undefined;
        var refreshSwatch = function () {
          if (update != undefined) return;
          update = setTimeout(function () {
            var value = slider.value;

            animation.data_view.header.colsByName.weight.source.weight = Math.pow(4, value) - 1;
            animation.data_view.changeCol(animation.data_view.header.colsByName.weight);
            update = undefined;
          }, 100);
        }

        var slider = new HorizontalSlider({
            value: Math.log(animation.data_view.header.colsByName.weight.source.weight + 1)/Math.log(4),
            minimum: minv,
            maximum: maxv,
            discreteValues: 100,
            onChange: refreshSwatch,
            intermediateChanges: true
        }, "mySlider");
        slider.placeAt(self.node.find(".layer-list")[0]);
        slider.startup();
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

      self.node.find("#sponsor_logos").html("");
      data.sponsorLogos.map(function (spec) {
        var logo = $("<img>");
        logo.attr(spec.attr);
        logo.css(spec.css);
        self.node.find("#sponsor_logos").append(logo);
      });

      cb && cb();
    }
  });
});
