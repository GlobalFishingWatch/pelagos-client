define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "jQuery",
  "app/Visualization/KeyBindings",
  "dijit/form/Button"
], function(
  declare,
  Dialog,
  $,
  KeyBindings
){
  return declare("Search", [Dialog], {
    style: "width: 50%;",
    title: "Search",
    "class": 'search-dialog',
    content: '' +
      '<input type="text" class="query" style="width: 100%;" placeholder="Search by MMSI, IMO, callsign, ship name or port name."></input>' +
      '<div class="search-loading">' +
      '  <img style="width: 20px;" src="' + app.dirs.loader + '">' +
      '</div>' +
      '<div class="results" style="max-height: 300px; overflow: auto;"></div>' +
      '<div class="paging" style="display: hidden;">' +
      '  <button class="prev">Prev</button>' +
      '  <span class="start"></span>-<span class="end"></span> of <span class="total"></span>' +
      '  <button class="next">Next</button>' +
      '</div>',
    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <button data-dojo-type="dijit/form/Button" data-dojo-attach-event="click:hide">Close</button>' +
      '  <button data-dojo-type="dijit/form/Button" data-dojo-attach-event="click:search">Search</button>' +
      '</div>',

    visualization: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      KeyBindings.register(
        ['Ctrl', 'Alt', 'F'], null, 'General',
        'Search', self.displaySearchDialog.bind(self)
      );

      $(self.containerNode).find(".query").keyup(function(event) {
        if (event.which == 13) {
          self.search();
        }
      });


      $(self.containerNode).find(".prev").click(function () {
        self.performSearch(self.currentResults.query, self.currentResults.offset - self.currentResults.limit, self.currentResults.limit);
      });
      $(self.containerNode).find(".next").click(function () {
        self.performSearch(self.currentResults.query, self.currentResults.offset + self.currentResults.limit, self.currentResults.limit);
      });
    },

    displaySearchDialog: function () {
      var self = this;
      $(self.containerNode).find('.results').html('');
      $(self.containerNode).find('.paging').hide();
      self.show();
    },

    search: function () {
      var self = this;
      self.performSearch($(self.containerNode).find(".query").val());
    },

    performSearch: function (query, offset, limit) {
      var self = this;
      self.displaySearchDialog();

      $(self.containerNode).find('.search-loading').show();

      self.visualization.animations.search(
        query, offset, limit,
        self.displaySearchResults.bind(self)
      );
    },

    displaySearchResults: function (err, res) {
      var self = this;
      self.currentResults = res;
      self.displaySearchDialog();
      $(self.containerNode).find('.search-loading').hide();
      var results = $(self.containerNode).find('.results');
      if (err) {
        results.html('<div class="error">An error occured: ' + err.toString() + '<div>');
      } else if (res.total == 0) {
        results.html('<div class="no-results">No results found</div>');
      } else {
        if (res.offset > 0 || res.total > res.offset + res.entries.length) {
          $(self.containerNode).find('.paging').show();

          $(self.containerNode).find(".start").html(res.offset);
          $(self.containerNode).find(".end").html(res.offset + res.entries.length);
          $(self.containerNode).find(".total").html(res.total);

          if (res.offset <= 0) {
            $(self.containerNode).find(".prev").attr({disabled: 'disabled'});
          } else {
            $(self.containerNode).find(".prev").removeAttr('disabled');
          }
          if (res.offset + res.limit  >= res.total) {
            $(self.containerNode).find(".next").attr({disabled: 'disabled'});
          } else {
            $(self.containerNode).find(".next").removeAttr('disabled');
          }
        } else {
          $(self.containerNode).find('.paging').hide();
        }

        results.html('<table class="table result-table">' +
                     '  <tr>' +
                     '    <th class="name">Name</th>' +
                     '    <th class="imo">IMO</th>' +
                     '    <th class="mmsi">MMSI</th>' +
                     '    <th class="callsign">Callsign</th>' +
                     '  </tr>' +
                     '</table>');
        res.entries.map(function (item) {
          var row = $('<tr><td><a class="vesselname"></a></td><td><a class="imo"></a></td><td><a class="mmsi"></a></td><td><a class="callsign"></a></td></tr>');
          row.find(".vesselname").html(item.data.vesselname);
          row.find(".imo").html(item.data.imo);
          row.find(".mmsi").html(item.data.mmsi);
          row.find(".callsign").html(item.data.callsign);
          row.find('a').attr({href: "javascript: void(0);"});
          row.find('a').click(function () {
            item.data.zoomToSelectionAnimations = true;
            item.animation.data_view.selections.selections.selected.rawInfo = false;
            item.animation.data_view.selections.selections.selected.addDataRange(item.data, item.data, true);
            self.hide();
          });

          results.find(".result-table").append(row);
        });
      }
    }
  });
});