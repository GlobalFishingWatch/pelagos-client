define([
  "app/Class",
  "app/Events",
  "app/Visualization/KeyModifiers",
  "shims/jQuery/main"
], function(
  Class,
  Events,
  KeyModifiers,
  $
) {
  var KeyBindings = Class({name: "KeyBindings"});

  KeyBindings.byCategory = {};
  KeyBindings.byKeys = {};

  KeyBindings.keysToKeyPath = function (keys) {
    return keys.sort().join('-');
  };

  KeyBindings.register = function (keys, context, category, description, cb) {
    keys = keys.slice();
    var keyPath = KeyBindings.keysToKeyPath(keys);
    if (context) {
      keyPath = keyPath + " " + context;
    }

    var registration = {
      keys: keys,
      context: context,
      keyPath: keyPath,
      category: category,
      description: description,
      cb: cb
    };

    if (KeyBindings.byCategory[category] == undefined) {
      KeyBindings.byCategory[category] = {};
    }
    KeyBindings.byCategory[category][keyPath] = registration;
    KeyBindings.byKeys[keyPath] = registration;
  };

  KeyBindings.toHelp = function () {
    var html = $("<div class='key-bindings-help'>");

    Object.keys(KeyBindings.byCategory).sort().map(function (category) {
      var categoryHtml = $("<div class='category'><h1></h1><iv class='key-bindings'></div></div>");
      categoryHtml.find('h1').text(category);
      var bindings = KeyBindings.byCategory[category];
      Object.keys(bindings).map(function (keyPath) {
        var registration = bindings[keyPath];
        var regHtml = $("<div class='binding'><a href='javascript: void(0);'><div class='key-codes'></div><div class='description'></div></a></div>");
        regHtml.find("a").click(function () {
          if (registration && registration.cb) {
              registration.cb(registration, {});
          }
        });
        regHtml.find('.key-codes').text(registration.keyPath);
        regHtml.find('.description').html(registration.description);
        categoryHtml.find('.key-bindings').append(regHtml);
      });
      html.append(categoryHtml);
    });

    return html;
  };

  KeyModifiers.events.on({
    keyDown: function (data) {
      var keyPath = KeyBindings.keysToKeyPath(Object.keys(data.active));
        console.log(keyPath);
      var registration = KeyBindings.byKeys[keyPath];
      if (registration && registration.cb) {
        registration.cb(registration, data);
      }
    }
  });

  return KeyBindings;
});
