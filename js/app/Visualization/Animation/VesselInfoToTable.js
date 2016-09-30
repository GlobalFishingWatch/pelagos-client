define([
  "app/CountryCodes",
  "app/Visualization/UI/Paths",
  "shims/jQuery/main"
], function(
  CountryCodes,
  Paths,
  $
) {
  return function (data) {
    var tableNode = $(
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

    if (data != undefined) {

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
    }

    return tableNode.html();
  };
});