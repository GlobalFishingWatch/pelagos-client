define(["app/Class"], function(Class) {
  var ObjectToTable = function (data) {
    var content = ["<table class='table table-striped table-bordered'>"];
    Object.keys(data).sort().map(function (key) {
      if (key == 'toString') return;
      var value = data[key];
      if (typeof(value) == "object" && value !== null && value !== undefined && value.length != undefined) {
        value = value[0];
      }
      if (key.indexOf('time') != -1 || key.indexOf('date') != -1) {
        try {
          value = new Date(value).toISOString().replace("T", " ").split("Z")[0];
        } catch (e) { }
      }
      if (typeof(value) == "object" && value !== null && value !== undefined) {
        value = ObjectToTable(value);
      }
      if (typeof(value)=="string" && value.indexOf("://") != -1) {
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
        content.push("<tr><th>" + key + "</th><td><a target='_new' href='" + url +  "'>" + name + "</a></th></tr>");
      } else {
        content.push("<tr><th>" + key + "</th><td>" + value + "</td></tr>");
      }
    });
    content.push("</table>");
    return content.join('\n');
  };
  return ObjectToTable;
});