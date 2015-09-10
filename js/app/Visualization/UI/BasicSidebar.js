define([
  "app/Class",
  "app/Logging",
  "app/CountryCodes",
  "jQuery",
  "app/Visualization/KeyModifiers"
], function(Class, Logging, CountryCodes, $, KeyModifiers){
  return Class({
    name: "BasicSidebar",
    initialize: function (visualization) {
      var self = this;

      self.visualization = visualization;
      self.animationManager = visualization.animations;

      self.idCounter = 0;

      $('body').append('<img class="logo" src="' + app.dirs.img + '/gfw/logo-white.png">');
      self.node = $('' +        
        '<div id="w" class="expanded">' +
        '  <div id="expand-button"><img src="' + app.dirs.img + '/gfw/gfw_open.png"></div>' +
        '  <div class="border">' +
        '    <div id="content">' +
        '      <div id="collapse-button"><img src="' + app.dirs.img + '/gfw/gfw_close.png"></div>' +
        '' +
        '      <div id="layers">' +
        '        <h2>Layers</h2>' +
        '        <form class="layer-list"></form>' +
        '      </div>' +
        '' +
        '      <div id="divide"></div>' +
        '' +
        '      <div id="vessel_identifiers"></div>' +
        '' +
        '      <div id="codeoutput"></div>' +
        '      <div id="divide"></div>' +
        '      <div id="gfw_logos"><img class="st" src="' + app.dirs.img + '/gfw/st_logo.png"><img class="oc" src="' + app.dirs.img + '/gfw/oceana_logo.png"><img class="g" src="' + app.dirs.img + '/gfw/google_logo.png"></div>' +
        '    </div>' +
        '  </div>' +
        '</div>');
      $('body').append(self.node);

      self.update("none", {});

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
        'info': self.update.bind(self, "none"),
        'info-error': self.update.bind(self, "#ff0000")
      });

      self.node.toggle(!self.visualization.state.getValue('edit'));
      self.visualization.state.events.on({'edit': function (data) {        
        self.node.toggle(!data.new_value);
      }});
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
            self.node.find("h2").wrapInner(link);
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
          event.toString());
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
        var slider = $("<div class=\"intensity-slider\">");
        self.node.find(".layer-list").append(slider);

        // This is a hack to set the current value within the max value of our exponential scale below...
        animation.data_view.header.colsByName.weight.source.weight = Math.pow(4, 0.2) - 1;
        animation.data_view.changeCol(animation.data_view.header.colsByName.weight);

        function refreshSwatch() {
          var value = slider.slider("value");

          animation.data_view.header.colsByName.weight.source.weight = Math.pow(4, value) - 1;
          animation.data_view.changeCol(animation.data_view.header.colsByName.weight);
        }
        slider.slider({
          orientation: "horizontal",
          min: Math.log(1+0)/Math.log(4),
          max: Math.log(1+0.2)/Math.log(4),
          step: 0.01,
          value: Math.log(animation.data_view.header.colsByName.weight.source.weight + 1)/Math.log(4),
          slide: refreshSwatch
        });
      }

    },

    removeHandler: function (event) {
      event.animation.basicSidebarNode.remove();
    }
  });
});
