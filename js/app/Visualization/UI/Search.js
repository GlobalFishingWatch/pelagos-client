define([
  "app/Class",
  "dijit/Dialog",
  "jQuery",
  "app/Visualization/KeyBindings"
], function(Class, Dialog, $, KeyBindings){
  return Class({
    name: "Search",
    initialize: function (visualization) {
      var self = this;

      self.visualization = visualization;
      self.animationManager = visualization.animations;

      KeyBindings.register(
        ['Ctrl', 'Alt', 'F'], null, 'General',
        'Search', self.displaySearchDialog.bind(self)
      );

      self.dialog = new Dialog({
        style: "width: 50%;",
        title: "Search",
        "class": 'search-dialog',
        content: '' +
          '<input type="text" class="query" style="width: 100%;" placeholder="Search by MMSI, IMO, callsign, ship name or port name."></input>' +
          '<div class="search-loading">' +
          '  <img style="width: 20px;" src="' + app.dirs.img + '/loader/spinner.min.svg">' +
          '</div>' +
          '<div class="results" style="max-height: 300px; overflow: auto;"></div>',
        actionBarTemplate: '' +
          '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
          '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Close</button>' +
          '  <button data-dojo-type="dijit/form/Button" type="button" data-dojo-attach-point="searchButton">Search</button>' +
          '</div>'
      });

      $(self.dialog.containerNode).find(".query").keyup(function(event) {
        if (event.keyCode == 13) {
          self.performSearch($(self.dialog.containerNode).find(".query").val());
        }
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

    performSearch: function (query, offset, limit) {
      var self = this;
      self.displaySearchDialog();

      $(self.dialog.containerNode).find('.search-loading').show();

      self.animationManager.search(
        query, offset, limit,
        self.displaySearchResults.bind(self)
      );
    },

    displaySearchResults: function (err, res) {
      var self = this;
      self.displaySearchDialog();
      $(self.dialog.containerNode).find('.search-loading').hide();
      var results = $(self.dialog.containerNode).find('.results');
      if (err) {
        results.html('<div class="error">An error occured: ' + err.toString() + '<div>');
      } else if (res.length == 0) {
        results.html('<div class="no-results">No results found</div>');
      } else {
        results.html("");

        results.append("<div class='paging'><button class='prev'>Prev</button> <span class='start'></span>-<span class='end'></span> of <span class='total'></span> <button class='next'>Next</button></div>");

        results.find(".start").html(res.offset);
        results.find(".end").html(res.offset + res.entries.length);
        results.find(".total").html(res.total);

        if (res.offset <= 0) results.find(".prev").attr({disabled: 'disabled'});
        if (res.offset + res.limit  >= res.total) results.find(".next").attr({disabled: 'disabled'});

        results.find(".prev").click(function () {
          self.performSearch(res.query, res.offset - res.limit, res.limit);
        });
        results.find(".next").click(function () {
          self.performSearch(res.query, res.offset + res.limit, res.limit);
        });

        results.append('<table class="table result-table">' +
                     '  <tr>' +
                     '    <th class="name">Name</th>' +
                     '    <th class="imo">IMO</th>' +
                     '    <th class="mmsi">MMSI</th>' +
                     '    <th class="callsign">Callsign</th>' +
                     '  </tr>' +
                     '</table>');
        res.entries.map(function (info) {
          var row = $('<tr><td><a class="vesselname"></a></td><td><a class="imo"></a></td><td><a class="mmsi"></a></td><td><a class="callsign"></a></td></tr>');
          row.find(".vesselname").html(info.vesselname);
          row.find(".imo").html(info.imo);
          row.find(".mmsi").html(info.mmsi);
          row.find(".callsign").html(info.callsign);
          row.find('a').attr({href: "javascript: void(0);"});
          row.find('a').click(function () {
            info.zoomToSelectionAnimations = true;
            info.animation.data_view.selections.selections.selected.addDataRange(info, info, true);
            self.dialog.hide();
          });

          results.find(".result-table").append(row);
        });
      }
    }
  });
});