define([
  "app/Class",
  "app/Logging",
  "jQuery",
  "app/CountryCodes",
  "dijit/layout/ContentPane",
  "dojo/dom",
  "dojo/parser",
  "dojo/domReady!"
], function(
  Class,
  Logging,
  $,
  CountryCodes,
  ContentPane
){
  return Class({
    name: "SimpleInfoUI",
    initialize: function (sidePanels) {
      var self = this;

      self.sidePanels = sidePanels;
      self.visualization = self.sidePanels.visualization;

      self.ui = new ContentPane({title: 'Info', content: "<div id='vessel_identifiers'></div>"});
      self.sidePanels.sidebarContainer.addChild(self.ui);
      self.node = $(self.ui.containerNode);

      self.visualization.animations.events.on({
        'info-loading': self.updateLoading.bind(self),
        'info': self.update.bind(self, "none"),
        'info-error': self.update.bind(self, "#ff0000")
      });
      self.update("none", {});
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

/*
          if (data.link) {
            var link = $("<a target='_new'>");
            link.attr({href: data.link});
            self.node.find("#vessel_identifiers h2").wrapInner(link);
          }
*/

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
        vesselIdNode.html('<h2>' + event.layer + '</h2>');
        vesselIdNode.append(data.toString());
      }

      vesselIdNode.css({color: color});

      self.sidePanels.sidebarContainer.resize();

      if (!self.visualization.state.getValue('edit')) {
        self.sidePanels.sidebarContainer.selectChild(self.ui, true);
      }
    }
  });
});
