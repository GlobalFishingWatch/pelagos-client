define([], function () {
  return {
    load : function (id, require, callback) {
      window[id](require, callback);
    }
  };
});
