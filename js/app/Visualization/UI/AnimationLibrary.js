define([
  "dojo/_base/declare",
  "./Widgets/TemplatedDialog",
  "dijit/layout/BorderContainer",
  "dijit/layout/ContentPane",
  "shims/async/main",
  "shims/jQuery/main",
  "app/Visualization/KeyBindings",
  "app/LoadingInfo"
], function(
  declare,
  Dialog,
  BorderContainer,
  ContentPane,
  async,
  $,
  KeyBindings,
  LoadingInfo
){
  return declare("AnimationLibrary", [Dialog], {
    style: "width: 50%;",
    title: "Animation library",
    "class": 'library-dialog',
    app: app,
    contentTemplate: '' +
      '<div data-dojo-type="dijit/layout/BorderContainer" data-dojo-props="liveSplitters: true" style="min-height: 300px; height: 100%; width: 100%; padding: 0; margin: 0;">' +

      '  <div data-dojo-type="dijit/layout/ContentPane" data-dojo-props="region:\'top\'" style="border: none; padding: 0; padding-bottom: 10px; margin: 0; overflow: hidden;">' +
      '    <input type="text" class="query" style="width: 100%;" placeholder="Search by name or tag" data-dojo-attach-event="keyup:queryQueyUp"></input>' +
      '    <div class="search-loading">' +
      '      <img style="width: 20px;" src="' + app.dirs.loader + '">' +
      '    </div>' +
      '  </div>' +
      '  <div data-dojo-type="dijit/layout/ContentPane" data-dojo-attach-point="sourcesList" data-dojo-props="region:\'center\'" style="border: none; padding: 0; margin: 0;" class="sourcesList"></div>' +
      '  <div data-dojo-type="dijit/layout/ContentPane" data-dojo-attach-point="animationsList" data-dojo-props="region:\'right\', splitter: true" style="border: none; padding: 0; margin: 0; width: 150px;" class="animationsList"></div>' +
      '</div>',

    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-event="click:hide">Close</button>' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" disabled="disabled" data-dojo-attach-point="addButton" data-dojo-attach-event="click:add">Add</button>' +
      '</div>',

    visualization: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      KeyBindings.register(
        ['Ctrl', 'Alt', 'A'], null, 'General',
        'Add animation', self.displayAnimationLibraryDialog.bind(self)
      );
    },

    add: function () {
    },

    queryQueyUp: function (event) {
      var self = this;
      if (event.which == 13) {
        self.performSearch($(event.target).val());
      }
    },

    displayAnimationLibraryDialog: function () {
      var self = this;
      $(self.sourcesList.containerNode).html('');
      $(self.animationsList.containerNode).html('');
      self.show();
      self.performSearch();
    },

    performSearch: function (query) {
      var self = this;

      $(self.containerNode).find('.search-loading').show();
      self.visualization.data.listAvailableSources(function (err, sources) {
        $(self.containerNode).find('.search-loading').hide();

        if (!sources) {
          $(self.sourcesList.containerNode).html('<div class="error">Unable to retrieve library: ' + err.toString() + '</div>');
          return;
        }

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
                  if (sources[name].tags[i].indexOf(query) != -1) {
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
      });
    },

    displayAnimationsForSource: function (event) {
      var self = this;
      var name = $(event.target).data('name');

      $(self.animationsList.containerNode).html('');
      self.visualization.data.listAvailableSourceAnimations(self.sources[name], function (err, animations) {
        animations.map(function (animation) {
          var row = $("<div></div>");
          row.text(animation.args.title);
          row.attr({title: animation.type});

          row.data('name', name);
          row.data('animation', animation);
          row.click(self.selectAnimation.bind(self));

          $(self.animationsList.containerNode).append(row);
        });
      });

      $(self.sourcesList.containerNode).find("*").removeClass("selected");
      $(event.target).addClass("selected");

      self.addButton.set("disabled", true);
    },

    selectAnimation: function (event) {
      var self = this;
      var name = $(event.target).data('name');
      self.selectedAnimation = $(event.target).data('animation');
      self.selectedAnimation.args.title = name + ": " + self.selectedAnimation.args.title;
      $(self.animationsList.containerNode).find("*").removeClass("selected");
      $(event.target).addClass("selected");
      self.addButton.set("disabled", false);
    },

    add: function () {
      var self = this;
      self.visualization.animations.addAnimation(self.selectedAnimation, function () {});
      self.hide();
    }
  });
});
