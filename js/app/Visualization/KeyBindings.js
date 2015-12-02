define(["app/Class", "app/Events", "app/Visualization/KeyModifiers", "jQuery"], function(Class, Events, KeyModifiers, $) {
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
      var categoryHtml = $("<div class='category'><h1></h1><dl class='key-bindings'></dl></div>");
      categoryHtml.find('h1').text(category);
      var bindings = KeyBindings.byCategory[category];
      Object.keys(bindings).map(function (keyPath) {
        var registration = bindings[keyPath];
        var keysHtml = $("<dt class='key-codes'>");
        keysHtml.text(registration.keyPath);
        var descriptionHtml = $("<dd class='description'>");
        descriptionHtml.html(registration.description);
        categoryHtml.find('.key-bindings').append(keysHtml);
        categoryHtml.find('.key-bindings').append(descriptionHtml);
      });
      html.append(categoryHtml);
    });

    return html;
  };

  KeyModifiers.events.on({
    keyDown: function (data) {
      var keyPath = KeyBindings.keysToKeyPath(Object.keys(data.active));
      var registration = KeyBindings.byKeys[keyPath];
      if (registration && registration.cb) {
        registration.cb(registration);
      }
    }
  });

  return KeyBindings;
});
