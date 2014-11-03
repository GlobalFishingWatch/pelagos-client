if (app.useDojo) {
  define(["app/Class"], function (Class) {
    return Class({name: "BasicSidebar"});
  });
} else {
  define([
    "app/Class",
    "app/Logging",
    "app/CountryCodes",
    "jQuery"
  ], function(Class, Logging, CountryCodes, $){
    return Class({
      name: "BasicSidebar",
      initialize: function (visualization) {
        var self = this;

        self.visualization = visualization;
        self.animationManager = visualization.animations;

        self.idCounter = 0;

        self.node = $('' +
          '<div id="w">' +
          '  <div id="content">' +
          '    <div id="drawer_slide"><img src="' + app.dirs.img + '/gfw/gfw_close.png"></div>' +
          '  ' +
          '    <div id="gfw_title"><img src="' + app.dirs.img + '/gfw/gfw_logo.png">Global Fishing Watch</div>' +
          '    <div id="gfw_logos"><img class="st" src="' + app.dirs.img + '/gfw/st_logo.png"><img class="oc" src="' + app.dirs.img + '/gfw/oceana_logo.png"><img class="g" src="' + app.dirs.img + '/gfw/google_logo.png"></div>' +
          '' +
          '    <div id="divide"></div>' +
          '' +
          '    <div id="layers">' +
          '      <h2>Layers</h2>' +
          '      <form class="layer-list"></form>' +
          '    </div>' +
          '' +
          '    <div id="divide"></div>' +
          '' +
          '    <div id="vessel_identifiers"></div>' +
          '' +
          '    <div id="codeoutput"></div>' +
          '  </div>' +
          '</div>');
        $('body').append(self.node);

        self.update("none", undefined);

        self.node.find("#drawer_slide img").click(function () {
          self.node.toggleClass('collapsed');
          if (self.node.hasClass('collapsed')) {
            self.node.find("#drawer_slide img").attr({src: app.dirs.img + '/gfw/gfw_open.png'});
          } else {
            self.node.find("#drawer_slide img").attr({src: app.dirs.img + '/gfw/gfw_close.png'});
          }
        });

        self.animationManager.events.on({
          'add': self.addHandler.bind(self),
          'remove': self.removeHandler.bind(self),
          'info': self.update.bind(self, "none"),
          'info-error': self.update.bind(self, "#ff8888")
        });

      },

      update: function (color, event) {
        var self = this;

        if (!event || event.vesselname) {
          self.node.find("#vessel_identifiers").html(
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

          if (event) {
            self.node.find(".vessel_id .callsign").html(event.callsign || "---");


            var flag;
            if (event.flagstate)
                flag = event.flagstate;
            else
                flag = event.flag;

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

            self.node.find(".vessel_id .imo").html(event.imo || "---");
            self.node.find(".vessel_id .mmsi").html(event.mmsi || "---");
            self.node.find(".vessel_id .vesselclass").html(event.vesselclass || "---");
            self.node.find(".vessel_id .vesselclass").prepend('<img src="' + app.dirs.img + '/gfw/vessel.png"><br>');

            self.node.find(".vessel_id .vesselname").html(event.vesselname || "---");
          }
        } else {
          self.node.find("#vessel_identifiers").html(
            '<h2>' + event.layer + '</h2>' +
            event.toString());
          self.node.find("table").attr({"class": "vessel_id"});
        }

        self.node.find("#vessel_identifiers").css({background: color});
      },

      addHandler: function (event) {
        var self = this;
        var animation = event.animation

        var node = $('' +
          '<div class="layer-row">' +
          '  <div class="switch">' +
          '    <input class="cmn-toggle cmn-toggle-round-flat" type="checkbox">' +
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
          var slider = $("<div style='margin-top: 5px; margin-left: 43px; margin-right: 17px;'>");
          self.node.find(".layer-list").append(slider);

          function refreshSwatch() {
            var value = slider.slider("value");

            animation.data_view.header.colsByName.weight.source.weight = value;
            animation.data_view.changeCol(animation.data_view.header.colsByName.weight);
          }
          slider.slider({
            orientation: "horizontal",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: animation.data_view.header.colsByName.weight.source.weight,
            change: refreshSwatch
          });
        }

      },

      removeHandler: function (event) {
        event.animation.basicSidebarNode.remove();
      }
    });
  });
}
