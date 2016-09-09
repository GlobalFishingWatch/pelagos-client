/* Makes use of answers from http://stackoverflow.com/a/1060034/5397148 */

define([
  "app/Class",
  "app/Events",
], function(
  Class,
  Events
) {
  var PageVisibility = Class({name: "PageVisibility"});
  PageVisibility.events = new Events("PageVisibility");

  PageVisibility._eventMap = {
    focus:'show',
    focusin:'show',
    pageshow:'show',
    blur:'hide',
    focusout:'hide',
    pagehide:'hide'
  };

  PageVisibility._standards = [
    {attr: 'hidden', event: 'visibilitychange'},
    {attr: 'mozHidden', event: 'mozvisibilitychange'},
    {attr: 'webkitHidden', event: 'webkitvisibilitychange'},
    {attr: 'msHidden', event: 'msvisibilitychange'},
    {attr: 'onfocusin', register: function () {
      // IE 9 and lower
      document.onfocusin = document.onfocusout = PageVisibility._onChange;
    }},
    {register: function () {
      // Catch all default
      window.onpageshow = window.onpagehide = window.onfocus = window.onblur = PageVisibility._onChange;
    }}
  ];

  PageVisibility._onChange = function (e) {
    e = e || window.event;
    var change = PageVisibility._eventMap[e.type]
    if (change === undefined) {
        change = document[PageVisibility._attr] ? "hide" : "show";
    }

    PageVisibility.visible = change == 'show';
    PageVisibility.events.triggerEvent(change);
  }

  for (var i = 0; i < PageVisibility._standards.length; i++) {
    var std = PageVisibility._standards[i];
    if (!std.attr || std.attr in document) {
      PageVisibility._attr = std.attr;
      if (std.event) {
        document.addEventListener(std.event, PageVisibility._onChange);
      } else {
        std.register();
      }
      break;
    }
  }

  // Set the initial state if browser supports the Page Visibility API
  if (document[PageVisibility._attr] !== undefined) {
    PageVisibility._onChange({type: document[PageVisibility._attr] ? "blur" : "focus"});
  }
  return PageVisibility;
});
