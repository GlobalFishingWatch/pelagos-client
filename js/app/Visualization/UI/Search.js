define([
  "app/Class",
  "dijit/Dialog",
  "jQuery",
  "app/Visualization/KeyModifiers"
], function(Class, Dialog, $, KeyModifiers){
  return Class({
    name: "Search",
    initialize: function (visualization) {
      var self = this;

      self.visualization = visualization;
      self.animationManager = visualization.animations;

      $(document).on({
        keyup: function (e) {
          if (KeyModifiers.nameById[e.keyCode] == 'F' && KeyModifiers.active.Alt && KeyModifiers.active.Ctrl) {
            self.displaySearchDialog();
          }
        }
      });

      self.dialog = new Dialog({
        style: "width: 50%;",
        title: "Search",
        content: '' +
          '<input type="text" class="query" style="width: 100%;" placeholder="Search by MMSI, IMO, callsign, ship name or port name."></input>' +
          '<div class="search-loading" style="margin-top: -1.7em; margin-right: 0.5em; padding-left: 100%; margin-left: -1.7em; display: block; display: none;">' +
          '  <img style="width: 20px;" src="' + app.dirs.img + '/gfw/spinner.min.svg">' +
          '</div>' +
          '<div class="results" style="max-height: 300px; overflow: auto;"></div>',
        actionBarTemplate: '' +
          '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
          '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Close</button>' +
          '  <button data-dojo-type="dijit/form/Button" type="button" data-dojo-attach-point="searchButton">Search</button>' +
          '</div>'
      });

      $(self.dialog.closeButton).on('click', function () {
        self.dialog.hide();
      });
      $(self.dialog.searchButton).on('click', function () {
        self.performSearch($(self.dialog.containerNode).find(".query").val());
      });
    },

    displaySearchDialog: function () {
      var self = this;
      $(self.dialog.containerNode).find('.results').html('');
      self.dialog.show();
    },

    performSearch: function (query) {
      var self = this;
      self.dialog.show();

      $(self.dialog.containerNode).find('.search-loading').show();

      self.animationManager.search(
        query,
        self.displaySearchResults.bind(self)
      );
    },

    displaySearchResults: function (err, res) {
      var self = this;
      self.dialog.show();
      $(self.dialog.containerNode).find('.search-loading').hide();
      if (err) {
      } else {
        $(self.dialog.containerNode).find('.results').html('<table class="table result-table">' +
                                          '  <tr>' +
                                          '    <th>Name</th>' +
                                          '    <th>IMO</th>' +
                                          '    <th>MMSI</th>' +
                                          '    <th>Callsign</th>' +
                                          '  </tr>' +
                                          '</table>');
        res.map(function (info) {
          var row = $('<tr><td><a class="vesselname"></a></td><td><a class="imo"></a></td><td><a class="mmsi"></a></td><td><a class="callsign"></a></td></tr>');
          row.find(".vesselname").html(info.vesselname);
          row.find(".imo").html(info.imo);
          row.find(".mmsi").html(info.mmsi);
          row.find(".callsign").html(info.callsign);
          row.find('a').attr({href: "javascript: void(0);"});
          row.find('a').click(function () {
            info.animation.data_view.selections.selections.selected.addDataRange(info, info, true);
            self.dialog.hide();
          });

          $(self.dialog.containerNode).find(".result-table").append(row);
        });
      }
    }
  });
});