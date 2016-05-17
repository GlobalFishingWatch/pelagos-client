define([], function () {
  window.classicHelper = function (id, value) {
    classicHelper.queue[id](value);
    delete classicHelper.queue[id];
  };
  classicHelper.queue = {};
  window.classicHelperBeforeLoad = window.classicHelperBeforeLoad || {};
  window.classicHelperAfterLoad = window.classicHelperAfterLoad || {};

  return {
    load : function (id, require, callback) {
      window.classicHelper.queue[id] = callback;

      var beforeLoad = window.classicHelperBeforeLoad[id] || function (cb) { cb(); };

      beforeLoad(function () {
        delete window.classicHelperBeforeLoad[id];
        require([id], function (value) {
          if (window.classicHelperAfterLoad[id]) {
            window.classicHelperAfterLoad[id](value);
          }
        });
      });
    }
  };
});
