/* Ajax helper functions */
define([
  "app/Class",
  "app/Events",
  "app/LoadingInfo"
], function(
  Class,
  Events,
  LoadingInfo
) {
  var Ajax = Class({
    name: "Ajax"
  });
  Ajax.setHeaders = function(request, headers) {
    for (var key in headers) {
      var values = headers[key]
      if (typeof(values) == "string") values = [values];
      for (var i = 0; i < values.length; i++) {
        request.setRequestHeader(key, values[i]);
      }
    }
  };
  Ajax.isSuccess = function (request, url) {
    /* HTTP reports success with a 200 status. The file protocol
       reports success with zero. HTTP returns zero as a status
       code for forbidden cross domain requests.
       https://developer.mozilla.org/En/Using_XMLHttpRequest */
    var isFileUri = url.indexOf("file://") == 0;
    return request.status == 200 || (isFileUri && request.status == 0);
  };
  Ajax.makeError = function (request, url, name) {
    return {
      url: url,
      status: request.status,
      name: name,
      toString: function () {
        var name = "";
        if (this.name) {
          name = this.name + " ";
        }
        return 'Could not load ' + name + this.url + ' due to HTTP status ' + this.status;
      }
    };
  };

  Ajax.makeRequest = function (verb, url, headers, cb) {
    /* Handle file:// urls as well as CORS correctly, as well as the
     * combinations of CORS and credentials and CORS, credentials and CDNs
     * that set the CORS domain to *. */

    var doLoad = function (withCredentials) {
      var request = new XMLHttpRequest();
      request.open(verb, url, true);
      request.withCredentials = withCredentials;
      Ajax.setHeaders(request, headers);
      LoadingInfo.main.add(url, {request: request});
      request.onreadystatechange = function() {
        if (request.readyState === 4) {
          LoadingInfo.main.remove(url);
          if (Ajax.isSuccess(request, url)) {
            cb(null, JSON.parse(request.responseText));
          } else {
            if (withCredentials) {
              doLoad(false);
            } else {
              cb(Ajax.makeError(request, url));
            }
          }
        }
      };
      request.send(null);
    };
    doLoad(true);
  };

  /* TODO: Implement proper body parsing and sending */
  Ajax.post = function (url, headers, cb) {
    Ajax.makeRequest('POST', url, headers, cb);
  };

  Ajax.get = function (url, headers, cb) {
    Ajax.makeRequest('GET', url, headers, cb);
  };

  return Ajax;
});
