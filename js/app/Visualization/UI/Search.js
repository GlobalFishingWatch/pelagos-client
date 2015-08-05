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
            var dialog = $('<div class="modal fade" id="search" tabindex="-1" role="dialog" aria-labelledby="searchLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-header bg-primary text-primary"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 class="modal-title" id="searchLabel">Search</h4></div><div class="modal-body alert"><input type="text" class="form-control query" placeholder="Search"></input></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button><button type="button" class="btn btn-success search" data-dismiss="modal">Search</button></div></div></div></div>');
            $('body').append(dialog);
            dialog.modal();
            dialog.on('hidden.bs.modal', function (e) {
              dialog.detach();
            });
            dialog.find(".search").click(function () {
              self.animationManager.search(
                dialog.find(".query").val(),
                function (err, res) {
                  if (err) {
                  } else {
                    var dialog = $('<div class="modal fade" id="search" tabindex="-1" role="dialog" aria-labelledby="searchLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-header bg-success text-success"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 class="modal-title" id="searchLabel">Search results</h4></div><div class="modal-body alert"><table class="table results"><tr><th>Name</th><th>IMO</th><th>MMSI</th><th>Callsign</th></tr></table></input></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div></div></div></div>');
                    res.map(function (info) {
                      var row = $('<tr><td><a class="vesselname"></a></td><td><a class="imo"></a></td><td><a class="mmsi"></a></td><td><a class="callsign"></a></td></tr>');
                      row.find(".vesselname").html(info.vesselname);
                      row.find(".imo").html(info.imo);
                      row.find(".mmsi").html(info.mmsi);
                      row.find(".callsign").html(info.callsign);
                      row.find('a').attr({href: "javascript: void(0);"});
                      row.find('a').click(function () {
                        info.animation.data_view.selections.selected.addDataRange(info, info, true);
                        dialog.modal('hide');
                      });

                      dialog.find(".results").append(row);
                    });

                    $('body').append(dialog);
                    dialog.modal();
                    dialog.on('hidden.bs.modal', function (e) {
                      dialog.detach();
                    });


                  }
                }
              );
            });
          }
        }
      });
    }
  });
});