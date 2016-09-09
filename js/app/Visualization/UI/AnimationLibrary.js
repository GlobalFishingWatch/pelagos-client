define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "shims/jQuery/main",
  "app/Visualization/KeyBindings",
  "app/Visualization/UI/LoaderIcon",
  "dijit/form/Button"
], function(
  declare,
  TemplatedDialog,
  $,
  KeyBindings,
  LoaderIcon
){
  return declare("AnimationLibrary", [TemplatedDialog], {
    style: "width: 50%;",
    title: "Animation library",
    "class": 'search-dialog',
    content: '' +
      '<input type="text" class="query" style="width: 100%;" placeholder="Animation title or keywords"></input>' +
      '<div class="search-loading">' +
      '  <img style="width: 20px;" src="' + LoaderIcon + '">' +
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

    show: function () {
      var self = this;
      $(self.containerNode).find('.results').html('');
      $(self.containerNode).find('.paging').hide();
      self.performSearch("");
    },

    search: function () {
      var self = this;
      self.performSearch($(self.containerNode).find(".query").val());
    },

    performSearch: function (query, offset, limit) {
      var self = this;
      $(self.containerNode).find('.results').html('');
      $(self.containerNode).find('.paging').hide();
      TemplatedDialog.prototype.show.call(self);

      $(self.containerNode).find('.search-loading').show();

      self.visualization.data.queryDirectories(
        query, offset, limit,
        self.displaySearchResults.bind(self)
      );
    },

    displaySearchResults: function (err, res) {
      var self = this;
      self.currentResults = res;
      TemplatedDialog.prototype.show.call(self);
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
                     '    <th class="title">Title</th>' +
                     '    <th class="description">Description</th>' +
                     '  </tr>' +
                     '</table>');
        res.entries.map(function (animation) {
          var row = $('<tr><td><a class="title"></a></td><td><a class="description"></a></td>');
          row.find(".title").html(animation.args.title);
          row.find(".description").html(animation.args.description);
          row.find('a').click(function () {
            self.visualization.animations.addAnimation(animation, function () {});
            self.hide();
          });

          results.find(".result-table").append(row);
        });
      }
    }
  });
});
