define([
  "app/Class",
  "dijit/Dialog",
  "dijit/layout/BorderContainer",
  "dijit/layout/ContentPane",
  "dijit/form/Button",
  "async",
  "jQuery",
  "app/Visualization/KeyBindings",
  "app/LoadingInfo",
  "app/Visualization/UI/ColorDropdown"
], function(
  Class,
  Dialog,
  BorderContainer,
  ContentPane,
  Button,
  async,
  $,
  KeyBindings,
  LoadingInfo,
  ColorDropdown
){
  return Class({
    name: "SimpleAnimationEdtor",
    initialize: function (visualization) {
      var self = this;

      self.visualization = visualization;
      self.animationManager = visualization.animations;
      self.dataManager = self.visualization.data;

      KeyBindings.register(
        ['Ctrl', 'Alt', 'G'], null, 'General',
        'Simple animation editor', self.display.bind(self)
      );

      self.dialog = new Dialog({
        style: "width: 50%;",
        title: "Animation editor",
        "class": 'simple-animation-editor-dialog',
        content: '',
        actionBarTemplate: '' +
          '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
          '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Close</button>' +
          '</div>'
      });

      self.container = new BorderContainer({style: "min-height: 300px; height: 100%; width: 100%; padding: 0; margin: 0;", liveSplitters: true});
      self.dialog.addChild(self.container);

      self.actions = new ContentPane({region: 'top', class: 'actions', style: 'border: none; padding: 0; margin: 0;', content: ''});

      self.addcartodbbutton = new Button({
        label: "Add CartoDB",
        onClick: function(){
          self.addCartoDBAnimation();
        }
      });
      self.actions.addChild(self.addcartodbbutton);

      self.librarybutton = new Button({
        label: "From library",
        onClick: function(){
          self.visualization.ui.library.displayAnimationLibraryDialog();
        }
      });
      self.actions.addChild(self.librarybutton);
      self.container.addChild(self.actions);

      self.list = new ContentPane({region: 'center', content: '', class: 'list', style: 'border: none; padding: 0; margin: 0;'});
      self.container.addChild(self.list);
      self.editorPane = new ContentPane({region: 'right', splitter: true, class: 'editor-pane', style: 'border: none; padding: 10px; margin: 0; width: 50%;', content: ''});
      self.container.addChild(self.editorPane);

      self.dialog.startup();

      $(self.dialog.containerNode).find(".query").keyup(function(event) {
        if (event.which == 13) {
          self.performSearch($(self.dialog.containerNode).find(".query").val());
        }
      });

      $(self.dialog.closeButton).on('click', function () {
        self.dialog.hide();
      });

      self.updateListHandler = self.updateList.bind(self)
      self.animationManager.events.on({
        'add': self.updateListHandler,
        'remove': self.updateListHandler
      });
      self.updateList();
      self.addCartoDBAnimation();
      self.display();
    },

    updateList: function () {
      var self = this;
      $(self.list.containerNode).html('');

      visualization.animations.animations.map(function (animation) {
        var row = $("<div></div>");
        row.text(animation.title);
        var description = animation.name;
        try {
          if (animation.args.source.args.url) {
            description += ': ' + animation.args.source.args.url;
          }
        } catch (e) {};

        row.attr({title: description});
        row.data('animation', animation);
        row.click(self.editAnimation.bind(self));

        animation.events.un({updated: self.updateListHandler});
        animation.events.on({updated: self.updateListHandler});

        $(self.list.containerNode).append(row);
      });
    },

    setEditor: function (editor) {
      var self = this;

      if (self.editor) {
        self.editorPane.removeChild(self.editor);
      }
      self.editor = editor;
      if (self.editor) {
        self.editorPane.addChild(self.editor);
      }
    },

    editAnimation: function (event) {
      var self = this;
      var animation = $(event.target).data('animation');

      var editor = new ContentPane({class: 'editor', style: 'border: none; padding: 0; margin: 0; width: 100%; height: 100%;', content: '' +
        '<table>' +
        '  <tr><th>Title:</th><td><input class="title" type="text"></td></tr>' +
        '  <tr><th>Type:</th><td class="type"></td></tr>' +
        '  <tr><th>Url:</th><td><input class="url" type="text" disabled="disabled"></td></tr>' +
        '  <tr><th>Color:</th><td><select class="color">' +
        '    <option value="orange">Orange</option>' +
        '    <option value="purple">Purple</option>' +
        '    <option value="blue">Blue</option>' +
        '    <option value="blue2">Light blue</option>' +
        '    <option value="green">Light green</option>' +
        '    <option value="green2">Green</option>' +
        '    <option value="grey">Grey</option>' +
        '  </select></td></tr>' +
        '</table>' +
        '<button class="save">Save</button> ' +
        '<button class="delete">Delete</button>'
      });

      $(editor.containerNode).find('.title').val(animation.title);
      $(editor.containerNode).find('.type').text(animation.name);
      $(editor.containerNode).find('.url').val(animation.args.source.args.url);
      $(editor.containerNode).find('.color [value="' + animation.color + '"]').attr({selected: 'selected'});

      $(editor.containerNode).find('.save').click(function () {
        animation.title = $(editor.containerNode).find('.title').val();
        animation.color = $(editor.containerNode).find('.color').val();
        animation.events.triggerEvent("updated");
        self.setEditor();
      });
      $(editor.containerNode).find('.delete').click(function () {
        self.animationManager.removeAnimation(animation);
        self.setEditor();
      });

      self.setEditor(editor);
    },

    addCartoDBAnimation: function (event) {
      var self = this;

      var editor = new ContentPane({class: 'editor', style: 'border: none; padding: 0; margin: 0; width: 100%; height: 100%;', content: '' +
        '<table>' +
        '  <tr><th>Title:</th><td><input class="title" type="text"></td></tr>' +
        '  <tr><th>Type:</th><td class="type">CartoDBAnimation</td></tr>' +
        '  <tr><th>Url:</th><td><input class="url" type="text"></td></tr>' +
        '  <tr><th>Color:</th><td class="color"></td></tr>' +
        '</table>' +
        '<button class="add">Add animation</button'
      });

      var colorDropdown = new ColorDropdown({});
        colorDropdown.placeAt($(editor.containerNode).find('.color')[0]);
        colorDropdown.startup();

      $(editor.containerNode).find('.add').click(function () {
        var title = $(editor.containerNode).find('.title').val();
        var url = $(editor.containerNode).find('.url').val();
        var color = $(editor.containerNode).find('.color').val();

        if (url.length == 0) {
          alert("You must provide a layer URL");
          return;
        }
        if (title.length == 0) {
          title = 'CartoDBAnimation: ' + url;
        }

        self.visualization.animations.addAnimation({
          type:'CartoDBAnimation',
          args: {
            title: title,
            color: color,
            source: {type:'EmptyFormat', args: {url:url}}
          }
        }, function (err, animation) {});

        self.setEditor();
      });

      self.setEditor(editor);
    },


    display: function () {
      var self = this;
      self.dialog.show();
    }
  });
});
