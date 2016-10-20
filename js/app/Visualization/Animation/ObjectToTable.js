define(["app/Class"], function(Class) {
  var valueToString = function (value, key) {
    if (typeof(value) == "object" && value !== null && value !== undefined && value.length != undefined) {
      value = value[0];
    }
    if (key && (key.indexOf('time') != -1 || key.indexOf('date') != -1)) {
      try {
        value = new Date(value).toISOString().replace("T", " ").split("Z")[0];
      } catch (e) { }
    }
    if (typeof(value) == "object" && value !== null && value !== undefined) {
      value = ObjectToTable(value);
    }
    if (typeof(value)=="string" && value.indexOf("://") != -1 && value.indexOf("<") == -1) {
      var nameUrl = value.split("://")
      var name = 'Link';
      var url = value;
      if (nameUrl[0].indexOf(' ') != -1) {
        var pos = nameUrl[0].lastIndexOf(' ');
        var proto = nameUrl[0].slice(pos + 1);
        name = nameUrl[0].slice(0, pos);
        if (name.slice(-1) == ':') {
          name = name.slice(0, -1);
        }
        url = proto + '://' + nameUrl[1];
      }
      return "<a target='_new' href='" + url +  "'>" + name + "</a>";
    } else {
      return value;
    }
  };

  var ObjectToTable = function (data) {
    var content = [];
    if (data.title) {
      content.push("<h1>");
        content.push(valueToString(data.title, "title"));
      content.push("</h1>");
    }
    if (data.description) {
      content.push(valueToString(data.description, "description"));
    }
    content.push(["<table class='table table-striped table-bordered'>"]);
    Object.keys(data).sort().map(function (key) {
      if (['toString', 'title', 'description', 'footer'].indexOf(key) != -1) return;
      content.push("<tr><th>" + key + "</th><td>" + valueToString(data[key], key) + "</td></tr>");
    });
    content.push("</table>");
    if (data.footer) {
      content.push(valueToString(data.footer, "footer"));
    }

    return content.join('\n');
  };
  return ObjectToTable;
});
