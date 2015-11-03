define(["app/Class"], function(Class) {
  return function (data) {
     var content = ["<table class='table table-striped table-bordered'>"];
     Object.keys(data).sort().map(function (key) {
       if (key == 'toString') return;
       var value = data[key];
       if (value.length == 1) {
         value = value[0];
       }
       if (key.indexOf('time') != -1 || key.indexOf('date') != -1) {
         value = new Date(value).toISOString().replace("T", " ").split("Z")[0];
       }
       if (typeof(value)=="string" && value.indexOf("://") != -1) {
         content.push("<tr><th colspan='2'><a target='_new' href='" + value +  "'>" + key + "</a></th></tr>");
       } else {
         content.push("<tr><th>" + key + "</th><td>" + value + "</td></tr>");
       }
     });
     content.push("</table>");
     return content.join('\n');
   };
});