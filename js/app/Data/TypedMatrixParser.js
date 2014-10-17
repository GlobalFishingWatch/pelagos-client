/* Loads a matrix of rows/cols of typed data from a binary file.


   Data format:

   All values in the data format are in little endian. The following
   describes the main data layout:

   ['tmtx' magic cookie]
   [4 byte header length in bytes]
   [header data]
   [content data]

   The header is json encoded and should contain at the very least

   {length: NUMBER_OF_ROWS, orientation: ORIENTATION, cols: [COL,...]}

   COL should contain {name: NAME, type: TYPE}

   where NAME is any string and TYPE is one of the type names found
   in Pack.typemap.

   COL can optionally contain 'multiplier' and/or 'offset'. If defined
   for a column, the values in that column will be scaled and offset
   by those values:

   value = offset + (multiplier * value)

   The content data is either encoded as a series of rows or as a
   series of columns, depending on the header value orientation
   ('rowwise' or 'columnwise').

   For rowwise data, each row consists of data encoded as per the column
   specifications (in that same order). The byte length of each
   column is defined by its type.

   For columnwise data, the content data consists of a sequence of
   columns, in the order specified by the header. Each column is
   encoded as a sequence of items, each item being encoded as per the
   column specification. The byte length of each item is defined by
   the column type. The byte length of a column is the byte length of
   each item, times the length header value.

   API:

   f = new TypedMatrixFormat(source_url);
   f.events.on({
     load: function () {}, // Called before loading begins
     header: function (headerData) {},
     row: function (rowData) {},
     batch: function () {},
     all: function () {},
     update: function () {}, // Called after both batch and all
     error: function (error) { console.log(error.exception); },
   });
   f.load();

   f.cancel(); // To cancel the loading at any time.

   The header data is available in f.header during and after the
   header event fires, in addition to being sent as a parameter to
   that event. The header data is the same as the header data found in
   the binary, with one extra member added, colsByName, which contains
   a json object with column names as keys and the column specs from
   cols as values.

   In addition, the COL column specifications are updated as
   following:

   Any min and max entries are updated using offset and
   multiplier, if they exist.

   A typespec member is added, which contains the type from TypMap
   corresponding to the type specified for the column.

   Type specifications in Pack.typemap have the following format:

   {
     size: BYTES_PER_ELEMENT,
     array: ArrayClass,
     method: 'dataViewAccessorMethodName'
   }


   Implementation details/explanation for this ugly code:

   moz-chunked-arraybuffer is only supported in firefox... So I
   reverted to the old-school overrideMimeType and loading the file
   is binary "text", and converting it to ArrayBuffer by hand for
   decoding.
*/

define(["app/Class", "app/Events", "app/Data/Pack", "app/Logging"], function (Class, Events, Pack, Logging) {
  return Class({
    name: "TypedMatrixParser",
    MAGIC_COOKIE: 'tmtx',
    initialize: function(url) {
      var self = this;

      self.header = {length: 0, colsByName: {}};
      self.loadingStarted = false;
      self.loadingCanceled = false;
      self.headerIsLoaded = false;
      self.headerLen = null;
      self.offset = 0;
      self.rowidx = 0;
      self.rowLen = null;
      self.request = null;
      self.responseData = null;

      self.url = url;
      self.isFileUri = url.indexOf("file://") == 0;
      if (!self.events) {
        // There is an if around this so we don't overwrite an events
        // structure from another constructor if someone uses multiple
        // inheritance...
        self.events = new Events("Data.TypedMatrixParser");
      }
    },

    setHeaders: function (headers) {
      var self = this;
      self.headers = headers || {};
    },

    load: function () {
      var self = this;
      if (self.loadingStarted || self.loadingCanceled) return;
      self.loadingStarted = true;
      self._load();
    },

    _load: function () {
      var self = this;

      self.loadStartTime = new Date();
      self.events.triggerEvent("load");

      if (typeof XMLHttpRequest != 'undefined') {
        self.request = new XMLHttpRequest();
      } else {
        throw 'XMLHttpRequest is disabled';
      }
      /*
        if (request.responseType === undefined) {
          throw 'no support for binary files';
        }
      */

      self.request.open('GET', self.url, true);
      self.request.overrideMimeType('text\/plain; charset=x-user-defined');
      self.request.withCredentials = true;
      for (var key in self.headers) {
        var values = self.headers[key]
        if (typeof(values) == "string") values = [values];
        for (var i = 0; i < values.length; i++) {
          self.request.setRequestHeader(key, values[i]);
        }
      }
      self.request.send(null);
      var handleDataCallback = function () {
        if (!self.handleData()) {
          setTimeout(handleDataCallback, 500);
        }
      }
      setTimeout(handleDataCallback, 500);

    },

    cancel: function () {
      var self = this;

      if (self.loadingCanceled) return;
      self.loadingCanceled = true;
      if (self.request) self.request.abort();
    },

    headerLoaded: function (data) {
      var self = this;

      if (data.nodata) {
        self.errorLoading({
          toString: function () {
            return 'Could not load ' + this.url + ' due to it being empty';
          }
        });
      } else {
        self.events.triggerEvent("header", data);
      }
    },

    colLoaded: function (col, colValues) {
      var self = this;
      self.events.triggerEvent("col", {column: col, values: colValues});
    },

    rowLoaded: function(data) {
      var self = this;
      self.events.triggerEvent("row", data);
    },

    batchLoaded: function () {
      var self = this;
      var e = {update: "batch"};
      self.events.triggerEvent("batch", e);
      self.events.triggerEvent("update", e);
    },

    allLoaded: function () {
      var self = this;
      self.loadEndTime = new Date();
      var e = {update: "all", timing: self.loadEndTime - self.loadStartTime};
      self.events.triggerEvent("all", e);
      self.events.triggerEvent("update", e);
    },

    errorLoading: function (exception) {
      var self = this;

      self.error = exception;
      self.error.url = self.url;
      self.events.triggerEvent("error", self.error);
    },

    handleData: function() {
      var self = this;

      if (!self.request) return;
      if (self.error) return true;

      if (self.request.readyState == 4) {
        /* HTTP reports success with a 200 status. The file protocol
           reports success with zero. HTTP returns zero as a status
           code for forbidden cross domain requests.
           https://developer.mozilla.org/En/Using_XMLHttpRequest */
        var success = self.request.status == 200 || (self.isFileUri && self.request.status == 0);
        if (!success) {
          self.errorLoading({
            status: self.request.status,
            toString: function () {
              return 'Could not load ' + this.url + ' due to HTTP status ' + this.status;
            }
          });
          return true;
        }
      }

      if (!self.request.responseText) return;

      var length = self.request.responseText.length;
      var text = self.request.responseText;

      if (length < 4+4) return;
      if (self.headerLen == null) {
        var dataView = new DataView(Pack.stringToArrayBuffer(text, 0, 4+4+1+4));
        if (text.slice(0, 4) != self.MAGIC_COOKIE) {
          self.errorLoading({
            cookie: text.slice(0, 4),
            toString: function () {
              return 'Could not load ' + this.url + ' due to incorrect file format. Cookie: [' + this.cookie + ']';
            }
          });
          return true;
        }

        self.headerLen = dataView.getInt32(4, true);

        self.offset = 4+4;
      }
      if (length < self.offset + self.headerLen) return;
      if (!self.headerIsLoaded) {
        self.header = JSON.parse(text.substr(self.offset, self.headerLen));
        self.rowLen = 0;
        self.header.colsByName = {};
        for (var colidx = 0; colidx < self.header.cols.length; colidx++) {
          var col = self.header.cols[colidx];
          col.idx = colidx;
          self.header.colsByName[col.name] = col;
          col.typespec = Pack.typemap.byname[col.type];

          if (col.multiplier != undefined && col.min != undefined) col.min = col.min * col.multiplier;
          if (col.offset != undefined && col.min != undefined) col.min = col.min + col.offset;
          if (col.multiplier != undefined && col.max != undefined) col.max = col.max * col.multiplier;
          if (col.offset != undefined && col.max != undefined) col.max = col.max + col.offset;

          self.rowLen += col.typespec.size;
        };

        self.offset += self.headerLen;
        self.dataOffset = self.offset;
        self.headerIsLoaded = true;
        self.headerLoaded(self.header);

        if (self.header.version != 1) {
          self.errorLoading({
            version: self.header.version,
            toString: function () {
              return 'Could not load ' + this.url + ' due to unsupported file format version. Version: ' + this.version + '. Supported versions: 1.';
            }
          });
          return true;
        }

        if (self.header.orientation != 'rowwise' && self.header.orientation != 'columnwise') {
          self.errorLoading({
            orientation: self.header.orientation,
            toString: function () {
              return 'Could not load ' + this.url + ' due to unsupported file orientation. Orientation: ' + this.orientation + '. Supported orientations: rowwise, columnwise.';
            }
          });
          return true;
        }

        // Empty tile, stop parsing.
        if (!self.rowLen) {
          self.allLoaded();
          return true;
        }
      }
      if (self.responseData == null) {
        self.responseData = new Uint8ClampedArray(self.rowLen * self.header.length);
      }
      Pack.writeStringToArrayBuffer(text, self.offset, undefined, self.responseData, self.offset - self.dataOffset);

      if (self.header.orientation == "rowwise") {
        var dataView = new DataView(self.responseData.buffer);
        for (; self.offset + self.rowLen <= length; self.rowidx++) {
          var row = {};
          for (var colidx = 0; colidx < self.header.cols.length; colidx++) {
            var col = self.header.cols[colidx];
            var val = dataView[col.typespec.getter](self.offset - self.dataOffset, true);
            row[col.name] = val;
            self.offset += col.typespec.size;
          }
          self.rowLoaded(row);
        }
        if (self.rowidx == self.header.length) {
          self.allLoaded();
          return true;
        } else {
          self.batchLoaded();
        }
      } else if (self.header.orientation == 'columnwise') {
        if (length >= self.dataOffset + self.header.length * self.rowLen) {

          for (var colidx = 0; colidx < self.header.cols.length; colidx++) {
            var col = self.header.cols[colidx];

            colValues = new (eval(col.typespec.array))(self.responseData.buffer, self.offset - self.dataOffset, self.header.length)
            self.offset += self.header.length * col.typespec.size;

            self.colLoaded(col, colValues);
          }

          self.allLoaded();
          return true;
        }
      }
    }
  });
});
