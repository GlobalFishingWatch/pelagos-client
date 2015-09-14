define([
  "app/Class",
  "jQuery",
  "app/Visualization/KeyModifiers"
], function(Class, $, KeyModifiers){
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

      self.dialog = $('<div class="modal fade" id="search" tabindex="-1" role="dialog" aria-labelledby="searchLabel" aria-hidden="true">' +
                     '  <div class="modal-dialog">' +
                     '    <div class="modal-content">' +
                     '      <div class="modal-header bg-primary text-primary">' +
                     '        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                     '        <h4 class="modal-title" id="searchLabel">Search</h4>' +
                     '      </div>' +
                     '      <div class="modal-body alert">' +
                     '        <input type="text" class="form-control query" placeholder="Search by MMSI, IMO, callsign, ship name or port name."></input>' +
                     '        <div class="search-loading" style="float: right; margin-top: -2em; margin-right: 0.5em; z-index: 0; display: block; display: none;">' +
                     '          <img style="width: 20px;" src="/client/img/gfw/spinner.min.svg">' +
                     '        </div>' +
                     '        <div class="results" style="max-height: 200px; overflow: auto;"></div>' +
                     '      </div>' +
                     '      <div class="modal-footer">' +
                     '        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>' +
                     '        <button type="button" class="btn btn-success search">Search</button>' +
                     '      </div>' +
                     '    </div>' +
                     '  </div>' +
                     '</div>');
      $('body').append(self.dialog);
      self.dialog.modal({show:false});
      self.dialog.on('hidden.bs.modal', function (e) {
        self.dialog.modal('hide');
      });
      self.dialog.find(".search").click(function () {
        self.performSearch(self.dialog.find(".query").val());
      });
    },

    displaySearchDialog: function () {
      var self = this;
      self.dialog.find('.results').html('');
      self.dialog.modal('show');
    },

    performSearch: function (query) {
      var self = this;
      self.dialog.modal('show');

      self.dialog.find('.search-loading').show();

      self.animationManager.search(
        query,
        self.displaySearchResults.bind(self)
      );
    },

    displaySearchResults: function (err, res) {
      var self = this;
      self.dialog.modal('show');
      self.dialog.find('.search-loading').hide();
      if (err) {
      } else {
        self.dialog.find('.results').html('<table class="table result-table">' +
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
            self.dialog.modal('hide');
          });

          self.dialog.find(".result-table").append(row);
        });
      }
    }
  });
});