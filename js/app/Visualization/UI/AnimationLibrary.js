define([
  "app/Class",
  "dijit/Dialog",
  "dijit/layout/BorderContainer",
  "dijit/layout/ContentPane",
  "async",
  "jQuery",
  "app/Visualization/KeyBindings",
  "app/LoadingInfo",
], function(
  Class,
  Dialog,
  BorderContainer,
  ContentPane,
  async,
  $,
  KeyBindings,
  LoadingInfo
){
  return Class({
    name: "AnimationLibrary",
    initialize: function (visualization) {
      var self = this;

      self.visualization = visualization;
      self.animationManager = visualization.animations;
      self.dataManager = self.visualization.data;

      KeyBindings.register(
        ['Ctrl', 'Alt', 'A'], null, 'General',
        'Add animation', self.displayAnimationLibraryDialog.bind(self)
      );

      self.dialog = new Dialog({
        style: "width: 50%;",
        title: "Animation library",
        "class": 'library-dialog',
        content: '',
        actionBarTemplate: '' +
          '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
          '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Close</button>' +
          '</div>'
      });

      self.container = new BorderContainer({style: "min-height: 300px; height: 100%; width: 100%;"});
      self.dialog.addChild(self.container);

      self.container.addChild(new ContentPane({region: 'top', content: '' +
        '<input type="text" class="query" style="width: 100%;" placeholder="Search by name or tag"></input>' +
        '<div class="search-loading">' +
        '  <img style="width: 20px;" src="' + app.dirs.img + '/loader/spinner.min.svg">' +
        '</div>'
      }));

      self.listsContainer = new BorderContainer({region: 'center', liveSplitters: true});
      self.container.addChild(self.listsContainer);

      self.listsContainer.addChild(new ContentPane({'class': 'sources', region: 'center', content: '&nbsp;'}));
      self.listsContainer.addChild(new ContentPane({'class': 'animations', region: 'right', content: '&nbsp;'}));


      $(self.dialog.closeButton).on('click', function () {
        self.dialog.hide();
      });

      $(self.dialog.containerNode).find(".query").keyup(function(event) {
        if (event.which == 13) {
          self.performSearch($(self.dialog.containerNode).find(".query").val());
        }
      });

      self.dialog.startup();
    },

    displayAnimationsForSource: function (event) {
      var self = this;
      var name = $(event.target).data('name');

      $(self.dialog.containerNode).find('.animations').html('');
      self.dataManager.listAvailableSourceAnimations(self.sources[name], function (err, animations) {
        animations.map(function (animation) {
          var row = $("<div></div>");
          row.text(animation.args.title);
          row.attr({title: animation.type});
          $(self.dialog.containerNode).find('.animations').append(row);
        });
      });
    },

    performSearch: function (query) {
      var self = this;

      $(self.dialog.containerNode).find('.search-loading').show();
      self.dataManager.listAvailableSources(function (err, sources) {
        self.sources = sources;
        var results = [];
        if (!query) {
          results = Object.keys(sources);
        } else {
          for (var name in sources) {
            if (name.indexOf(query) != -1) {
              results.push(name);
            } else {
              if (sources[name].tags) {
                for (var i = 0; i < sources[name].tags.length; i++) {
                  if (sources[name].tags[i].indexOf(query)) {
                    results.push(name);
                    break;
                  }
                }
              }
            }
          }
        }
        results.sort();

        $(self.dialog.containerNode).find('.sources').html('');
        $(self.dialog.containerNode).find('.animations').html('');

        results.map(function (key) {
          var label = key;
          if (sources[key].tags) {
            label += ' [' + sources[key].tags.join(',') + ']';
          }
          var source = $("<div>" +  label + "</div>");
          source.data('name', key);
          source.click(self.displayAnimationsForSource.bind(self));
          $(self.dialog.containerNode).find('.sources').append(source);
        });

        $(self.dialog.containerNode).find('.search-loading').hide();
      });
    },

    displayAnimationLibraryDialog: function () {
      var self = this;
      $(self.dialog.containerNode).find('.sources').html('');
      $(self.dialog.containerNode).find('.animations').html('');
      self.dialog.show();
      self.performSearch();
    }

  });
});