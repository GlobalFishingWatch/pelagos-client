define([
  "dojo/_base/declare",
  "dojo/dom-style",
  "app/Visualization/UI/GenerateReportDialog",
  "app/Visualization/UI/SidePanels/SidePanelBase",
  "app/CountryCodes",
  "shims/jQuery/main",
  "app/Visualization/UI/Paths"
], function(
  declare,
  domStyle,
  GenerateReportDialog,
  SidePanelBase,
  CountryCodes,
  $,
  Paths
){
  return declare("InfoUI", [SidePanelBase], {
    baseClass: 'InfoUI',
    title: 'Info',
    paths: Paths,
    colors: {
      info: 'inherit',
      warning: '#ff5500',
      error: '#ff0000'
    },

    templateString: '' +
      '<div class="${baseClass}" style="overflow: auto;">' +
      '  <div class="titleButtons">' +
      '    <a id="activate_search" class="activate_search" href="javascript:undefined" data-dojo-attach-event="click:activateSearch"><i class="fa fa-search"></i></a>' +
      '    <a class="download_kml" target="_new" href="javascript:undefined" style="display: none;" data-dojo-attach-point="downloadNode"><i class="fa fa-download" title="Download as KML"></i></a>' +
      '    <a class="report" href="javascript:undefined" style="display: none;" data-dojo-attach-point="reportNode"><i class="fa fa-list-alt" title="Generate report"></i></a>' +
      '  </div>' +
      '  <div class="contentWrapper">' +
      '    <h2 data-dojo-attach-point="titleNode">Vessel Information</h2>' +
      '    <div class="loading-vessel-info" style="display: none;" data-dojo-attach-point="loadingNode">' +
             '<img style="width: 20px;" src="${paths.LoaderIcon}">'+
          '</div>' +
      '    <div id="vessel_identifiers" class="${baseClass}Container" data-dojo-attach-point="containerNode"></div>' + 
      '  </div>' +
      '</div>',
   startup: function () {
      var self = this;
      self.inherited(arguments);

      self.visualization.animations.events.on({
        'info-loading': self.updateLoading.bind(self),
        'info': self.update.bind(self, self.colors.info),
        'info-error': self.update.bind(self, self.colors.error)
      });
      self.clear();
    },

    activateSearch: function () {
      var self = this;
      self.visualization.ui.search.displaySearchDialog();
    },

    setDefaultTitle: function () {
      var self = this;
      $(self.titleNode).html("Vessel Information");
    },

    clear: function () {
      var self = this;

      self.setDefaultTitle();
      $(self.containerNode).html(
        '<table class="vessel_id">' +
        '  <tbody>' +
        '    <tr>' +
        '      <th>Name</th>' +
        '      <td class="vesselname">---</td>' +
        '    </tr>' +
        '    <tr>' +
        '      <th>Class</th>' +
        '      <td class="vesselclass">---</td>' +
        '    </tr>' +
        '    <tr>' +
        '      <th>Flag</th>' +
        '      <td class="flag">---</td>' +
        '    </tr>' +
        '    <tr>' +
        '      <th>IMO</th>' +
        '      <td class="imo">---<td>' +
        '    </tr>' +
        '    <tr>' +
        '      <th>MMSI</th>' +
        '      <td class="mmsi">---</td>' +
        '    </tr>' +
        '    <tr>' +
        '      <th>Callsign</th>' +
        '      <td class="callsign">---</td>' +
        '    </tr>' +
        '  </tbody>' +
        '</table>'
      );
      $(self.loadingNode).hide();
      $(self.containerNode).show();
    },

    updateLoading: function () {
      var self = this;

      self.setDefaultTitle();
      $(self.containerNode).hide();
      $(self.loadingNode).show();
    },

    update: function (color, event) {
      var self = this;

      self.clear();

      if (event.data) {
        self._updateContainerNode(event);
      }

      self._setupDownloadLink(event);
      self._setupReportLink(event);

      if (
        event.data &&
        event.data.level &&
        self.colors[event.data.level]) {

        color = self.colors[event.data.level]
      }

      $(self.containerNode).css({color: color});

      $(self.loadingNode).hide();
      $(self.containerNode).show();

      var ancestor = self;
      while (ancestor = ancestor.getParent()) {
        if (ancestor.selectChild) {
          ancestor.resize();
          ancestor.selectChild(self, true);
          break;
        }
      }
    },

    _updateContainerNode: function(event) {
      var self = this;

      var onlyHasToString =
        Object
        .keys(event.data)
        .filter(function (name) { return name != 'toString'; })
        .length == 0;

      var hasVesselInfo =
        event.data.vesselname || event.data.mmsi || event.data.imo || event.data.callsign;

      if (onlyHasToString || hasVesselInfo) {
        self._updateContainerWithVesselInfo(event.data);
      } else {
        self._updateContainerWithCustomInfo(event);
      }
    },

    _updateContainerWithVesselInfo: function(data) {
      var self = this;

      var tableNode =  $(self.containerNode).find(".vessel_id");
      tableNode.find(".callsign").html(data.callsign || "---");

      var flag;
      if (data.flagstate)
          flag = data.flagstate;
      else
          flag = data.flag;

      if (flag) {
        if (CountryCodes.codeToName[flag] != undefined) {
          tableNode.find(".flag").html(CountryCodes.codeToName[flag]);
          tableNode.find(".flag").prepend('<img src="' + Paths.img + '/flags/png/' + flag.toLowerCase() + '.png"><br>');
        } else {
          tableNode.find(".flag").html(flag);
        }
      } else {
        tableNode.find(".flag").html("---");
      }

      var setMultiLinkField = function (field, url_prefix) {
        var node = tableNode.find("." + field);
        if (data[field]) {
          var entries = data[field]
	      .toString()
	      .split(",")
	      .map(function(value) {
		return "<a target='_blank' href='" + url_prefix + value + "'>" + value + "</a>";
	      })
	      .join(", ");

	  node.html(entries); 
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
          tableNode.find(".vesselclass").prepend('<img src="' + Paths.img + cls.icon + '"><br>');
        } else {
          tableNode.find(".vesselclass").html(data.vesselclass);
        }
      } else {
        tableNode.find(".vesselclass").html("---");
      }

      tableNode.find(".vesselname").html(data.vesselname || "---");
    },

    _updateContainerWithCustomInfo: function(event) {
      var self = this;

      $(self.titleNode).html(event.layer);
      $(self.containerNode).html(event.data.toString());
    },

    _setupDownloadLink: function(event) {
      $(self.downloadNode).hide();

      if (
        event.layerInstance &&
        event.layerInstance.data_view &&
        event.layerInstance.data_view.source &&
        event.layerInstance.data_view.source.header &&
        event.layerInstance.data_view.source.header.kml) {

        var query = event.layerInstance.data_view.source.getSelectionQuery(
          event.layerInstance.data_view.selections.selections[event.category]);

        $(self.downloadNode).attr({
            href: (event.layerInstance.data_view.source.getUrl('export', query, -1) +
                 "/sub/" +
                 query +
                 "/export")
        });

        $(self.downloadNode).show();
      }
    },

    _setupReportLink: function(event) {
      var self = this;

      $(self.reportNode).hide();
      $(self.reportNode).off("click");

      if (
        event.data &&
        event.data.report &&
        self.visualization.animations.getReportableAnimation()) {
        $(self.reportNode).on("click", function() {
          var report = {
            spec: event.data.report,
            data: event.data.polygonData,
            state: self.visualization.state,
            animations: self.visualization.animations,
            datamanager: self.visualization.data
          };

          new GenerateReportDialog(report).show();
        });

        $(self.reportNode).show();
      }
    }
  });
});
