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

      self.container = new BorderContainer({style: "min-height: 300px; height: 100%; width: 100%; padding: 0; margin: 0;", liveSplitters: true});
      self.dialog.addChild(self.container);

      self.container.addChild(new ContentPane({region: 'top', style: 'border: none; padding: 0; padding-bottom: 10px; margin: 0; overflow: hidden;', content: '' +
        '<input type="text" class="query" style="width: 100%;" placeholder="Search by name or tag"></input>' +
        '<div class="search-loading">' +
        '  <img style="width: 20px;" src="' + app.dirs.img + '/loader/spinner.min.svg">' +
        '</div>'
      }));

      self.sourcesList = new ContentPane({region: 'center', content: '', class: 'sourcesList', style: 'border: none; padding: 0; margin: 0;'});
      self.animationsList = new ContentPane({region: 'right', splitter: true, content: '', class: 'animationsList', style: 'border: none; padding: 0; margin: 0; width: 150px'});
      self.container.addChild(self.sourcesList);
      self.container.addChild(self.animationsList);

      self.dialog.startup();

      $(self.dialog.containerNode).find(".query").keyup(function(event) {
        if (event.which == 13) {
          self.performSearch($(self.dialog.containerNode).find(".query").val());
        }
      });

      $(self.dialog.closeButton).on('click', function () {
        self.dialog.hide();
      });
    },

    displayAnimationLibraryDialog: function () {
      var self = this;
      $(self.sourcesList.containerNode).html('');
      $(self.animationsList.containerNode).html('');
      self.dialog.show();
      self.performSearch();
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

        $(self.sourcesList.containerNode).html('');
        $(self.animationsList.containerNode).html('');

        results.map(function (key) {
          var label = key;
          if (sources[key].tags) {
            label += ' [' + sources[key].tags.join(',') + ']';
          }
          var source = $("<div>" +  label + "</div>");
          source.data('name', key);
          source.click(self.displayAnimationsForSource.bind(self));
          $(self.sourcesList.containerNode).append(source);
        });
        $(self.dialog.containerNode).find('.search-loading').hide();
      });
    },

    displayAnimationsForSource: function (event) {
      var self = this;
      var name = $(event.target).data('name');

      $(self.animationsList.containerNode).html('');
      self.dataManager.listAvailableSourceAnimations(self.sources[name], function (err, animations) {
        animations.map(function (animation) {
          var row = $("<div></div>");
          row.text(animation.args.title);
          row.attr({title: animation.type});

          row.data('name', name);
          row.data('animation', animation);
          row.click(self.addAnimation.bind(self));

          $(self.animationsList.containerNode).append(row);
        });
      });
    },

    addAnimation: function (event) {
      var self = this;
      var name = $(event.target).data('name');
      var animation = $(event.target).data('animation');

      animation.args.title = name + ": " + animation.args.title;

      self.animationManager.addAnimation(animation, function () {});
      self.dialog.hide();
    }
  });
});
