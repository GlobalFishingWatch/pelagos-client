define(["app/Class"], function(Class) {
  var Rowidx = Class({name: "Rowidx" });

  Rowidx.appendByteArrays = function(array1, array2) {
    var len = 0;
    for (var i = 0; i < arguments.length; i++) {
      len += arguments[i].length;
    }

    var res = new Uint8Array(len);
    var pos = 0;
    for (var i = 0; i < arguments.length; i++) {
      res.set(arguments[i], pos);
      pos += arguments[i].length;
    }
    return res;
  }

  Rowidx.getBits = function (data, lower, upper) {
    return (data & (Math.pow(2, upper + 1) - 1)) >> lower;
  };

  Rowidx.pixelToId = function (data) {
    /* Bit layout, packed in 6 bytes (r1, g1, b1, r2, g2, b2):
     * 8bits animation id
     * 16bits tile id
     * 24bits row id
     *
     * See js/app/Visualization/Animation/rowidx.glsl:rowidxColor
     */
     
    if (data[0] == 255 && data[1] == 255 && data[2] == 255 && data[3] == 255 && data[4] == 255 && data[5] == 255) {
      return undefined;
    }

    var animationidx = data[0];
    var tileidx = data[1] << 8 | data[2];
    var rowidx = data[3] << 16 | data[4] << 8 | data[5];
    return [animationidx, tileidx, rowidx];
  };

  /* The following functions are not actually used, but are straight
   * translations from the GLSL ones in
   * js/app/Visualization/Animation/rowidx.glsl and can be used to
   * verify that they give the same results as the ones above. */

  Rowidx._getBits = function(data, lower, upper) {
    var upperPow = Math.pow(2, upper + 1);
    var leftBits = Math.floor(data / upperPow) * upperPow;
    return Math.floor((data - leftBits) / Math.pow(2, lower));
  };

  return Rowidx;
});

