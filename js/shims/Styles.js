define([], function () {
  return {
    add: function (stylesheet) {
      if (typeof(stylesheet) == "string") stylesheet = {url: stylesheet};
      stylesheet.url = require.toUrl(stylesheet.url);
      var head = document.getElementsByTagName('head')[0];
      var link = document.createElement('link');
      link.rel = stylesheet.rel || 'stylesheet';
      link.type = stylesheet.type || 'text/css';
      link.href = stylesheet.url;
      head.appendChild(link);
    }
  };
});
