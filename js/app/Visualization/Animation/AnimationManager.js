define([
  "app/Class",
  "app/Events",
  "app/Bounds",
  "app/Timerange",
  "app/SpaceTime",
  "app/ObjectTemplate",
  "shims/async/main",
  "shims/lodash/main",
  "app/Logging",
  "app/Visualization/KeyModifiers",
  "app/Visualization/KeyBindings",
  "shims/jQuery/main",
  "dijit/Dialog",
  "app/Visualization/Animation/Matrix",
  "libs/bower-ol3/build/ol",
//  "shims/CanvasLayer/main",
  "shims/Stats/main",
  "app/Visualization/Animation/ObjectToTable",
  "app/Visualization/Animation/Rowidx",
  "app/Visualization/Animation/Animation",
//  "app/Visualization/Animation/BboxSelection",
  "app/Visualization/Animation/PointAnimation",
  "app/Visualization/Animation/LineAnimation",
  "app/Visualization/Animation/LineStripAnimation",
  "app/Visualization/Animation/TileAnimation",
  "app/Visualization/Animation/DebugAnimation",
  "app/Visualization/Animation/ClusterAnimation",
//  "app/Visualization/Animation/MapsEngineAnimation",
//  "app/Visualization/Animation/CartoDBAnimation",
  "app/Visualization/Animation/VesselTrackAnimation",
  "app/Visualization/Animation/ArrowAnimation",
  "app/Visualization/Animation/SatelliteAnimation"
], function(Class,
  Events,
  Bounds,
  Timerange,
  SpaceTime,
  ObjectTemplate,
  async,
  _,
  Logging,
  KeyModifiers,
  KeyBindings,
  $,
  Dialog,
  Matrix,
//  CanvasLayer,
  ol,
  Stats,
  ObjectToTable,
  Rowidx,
  Animation,
  BboxSelection
) {
  var AnimationManager = Class({
    name: "AnimationManager",

    mapOptions: {
    },

    initialize: function (visualization) {
      var self = this;

      self.events = new Events("AnimationManager");

      self.visualization = visualization;
      self.node = $("<div class='animations' style='width: 100%; height: 100%;'>");
      self.visualization.node.append(self.node);

      self.indrag = false;
      self.inPanZoom = false;
      self.animationIdCounter = 0;
    },

    init: function (cb) {
      var self = this;

      self.overlays = [];
      self.animations = [];
      self.updateNeeded = false;
      self.mouseoverUpdateNeeded = false;
      self.lastUpdate = undefined;
      self.map = undefined;
      self.canvasLayer = undefined;
      self.gl = undefined;
      self.pixelsToWebGLMatrix = new Float32Array(16);
      self.googleMercator2webglMatrix = new Float32Array(16);

      async.series([
        self.initMap.bind(self),
        self.initStats.bind(self),
        self.initCanvas.bind(self),
        self.initMouse.bind(self),
        self.initUpdates.bind(self),
        self.initOverlays.bind(self),
        function (cb) {
          self.initialized = true;
          cb();
        }
      ], cb);
    },

    initStats: function (cb) {
      var self = this;

      /* bgein stats */
      self.stats = new Stats();
      self.stats.setMode(0); // 0: fps, 1: ms
      // Align top-left
      self.stats.domElement.style.position = 'absolute';
      self.stats.domElement.style.left = '0px';
      self.stats.domElement.style.top = '0px';
      /* end stats */

      if (self.visualization.state.getValue("stats") == 'true') {
        document.body.appendChild(self.stats.domElement);
      }

      cb();
    },

    initMap: function (cb) {
      var self = this;

      self.layer = new ol.layer.Tile({
        source: new ol.source.OSM()
      });
      self.map = new ol.Map({
        layers: [
         self.layer
        ],
        target: self.node[0],
        controls: ol.control.defaults({
          attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
            collapsible: false
          })
        }),
        view: new ol.View({
          center: [0, 0],
          zoom: 2
        })
      });

      window.addEventListener('resize', self.windowSizeChanged.bind(self), false);
      self.layer.getSource().on('tileloadstart', self.tilesLoaded.bind(self));
      self.map.getView().on('change:zoom', self.zoomChanged.bind(self));
      self.map.getView().on('change:center', self.centerChanged.bind(self));
      self.map.getView().on('resolution', self.boundsChanged.bind(self));
      self.map.on('movestart', function () { self.indrag = true; });
      self.map.on('moveend', function () { self.indrag = false; self.boundsChanged(); });
      self.map.getView().on('resolution', self.checkBounds.bind(self));

      cb();
    },

    maxLat: 88,
    minLat: -88,

    checkBounds: function() {
      var self = this;
// FIXME: NOT FIXED
return;

      var bounds = self.map.getBounds();
      var top = bounds.getNorthEast().lat();
      var bottom = bounds.getSouthWest().lat();
      var center = self.map.getView().getCenter();

      if (bottom < self.minLat) {
        if (top > self.maxLat) {
          self.map.setZoom(self.map.getZoom() + 1);
        } else {
          self.map.setCenter([center.lng(), center.lat() + (self.minLat - bottom)]);
        }
      } else if (top > self.maxLat) {
        self.map.setCenter([center.lng(), center.lat() + (self.maxLat - top)]);
      }
    },

    tilesLoaded: function() {    
      var self = this;

      /* FIXME: We a way set focus to handle keyboard combinations...
       * Not sure how it should work. The following works for initial
       * focus, but generates a spurious and broken selection event.
       * self.node.children().children().first().children().trigger('click');
       */
    },

    handleNoGl: function () {
      var self = this;
      var failover = self.visualization.state.getValue('nowebgl');
      if (failover) {
        window.location = failover;
      } else {
        self.dialog = new Dialog({
          title: "Loading failed",
          content: '' +
            '<b class="error">Your browser does not support WebGL</b>',
          actionBarTemplate: '' +
            '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
            '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Close</button>' +
            '</div>'
        });
        $(self.dialog.closeButton).on('click', function () {
          self.dialog.hide();
        });
        self.dialog.show();
      }
      throw new AnimationManager.NoGlError();
    },

    getGlContext: function (canvas) {
      var self = this;
      var gl = canvas.getContext('experimental-webgl', {preserveDrawingBuffer: true});
      if (!gl) self.handleNoGl();
      gl.enable(gl.BLEND);
      return gl;
    },

    createRowidxGlContext: function () {
      var self = this;
      var canvas = document.createElement('canvas');
      var gl = self.getGlContext(canvas);
      gl.clearColor(1.0, 1.0, 1.0, 1.0);
      return gl;
    },

    initCanvas: function (cb) {
      var self = this;

      self.canvas = document.createElement('canvas');
      $(self.canvas).css({position: "fixed", top: 0, left: 0, width: "100%", height: "100%"});
      self.node.append(self.canvas);

      window.requestAnimationFrame(self.update.bind(self));

      try {
        self.gl = self.getGlContext(self.canvas);

        self.rowidxGl = [self.createRowidxGlContext(), self.createRowidxGlContext()];
      } catch (e) {
        if (e instanceof AnimationManager.NoGlError) {
          cb({msg: "Your browser does not support WebGL."});
        } else {
           throw e;
        }
      }

      self.canvasResize();
      cb();
   },

    search: function(query, offset, limit, cb) {
      var self = this;

      Logging.main.log(
        "Visualization.Animation.AnimationManager.search",
        {
          query: query,
          offset: offset,
          limit: limit,
          toString: function () {
            var offsetLog = this.offset ? this.offset.toString() : "NULL";
            var limitLog = this.limit ? this.limit.toString() : "NULL";
            return this.query + " [" + offsetLog + " / " + limitLog + "]";
          }
        }
      );

      searchers = [];
      for (var key in self.animations) {
        var animation = self.animations[key];
        if (animation.search && !animation.selectionAnimationFor) {
          searchers.push(animation.search.bind(animation));
        }
      }

      var res = {total: 0, entries: []};
      async.each(searchers, function (searcher, cb) {
        searcher(query, offset, limit, function (err, item) {
          if (err) return cb(err);
          if (item) {
            var tmp =_.extend({}, res, item);
            tmp.total = res.total + item.total;
            tmp.entries = res.entries.concat(item.entries);
            res = tmp;
          }
          cb(null);
        });
      }, function (err) {
        cb(err, err ? null : res);
      });
    },

    /* readPixels takes rougly 150ms regardless of the size of
     * window to read if the window size is 100x100 or less. For the
     * whole buffer it takes ca 650ms with our data. */

    mouseoverCacheCellSize: {
      width: 100,
      height: 100
    },

    getRenderers: function () {
      var self = this;
      return self.animations.concat(self.overlays);
    },

    readMouseoverPixels: function(x, y) {
      var self = this;

      if (self.mouseoverUpdateNeeded || !self.mouseoverPixelCache) {
        self.mouseoverPixelCache = {};
        self.mouseoverUpdateNeeded = false;
      }

      var gridX = Math.floor(x / self.mouseoverCacheCellSize.width);
      var gridY = Math.floor(y / self.mouseoverCacheCellSize.height);
      var cellX = x % self.mouseoverCacheCellSize.width;
      var cellY = y % self.mouseoverCacheCellSize.height;

      var cell = gridX.toString() + ',' + gridY.toString();

      if (!self.mouseoverPixelCache[cell]) {
        var gridX_global = gridX * self.mouseoverCacheCellSize.width;
        var gridY_global = gridY * self.mouseoverCacheCellSize.height;


        self.mouseoverPixelCache[cell] = self.rowidxGl.map(function (gl) {
          gl.canvas.width = $(self.canvas).innerWidth();
          gl.canvas.height = $(self.canvas).innerHeight();
          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
          gl.enable(gl.SCISSOR_TEST);
          gl.scissor(gridX_global, gridY_global, self.mouseoverCacheCellSize.width, self.mouseoverCacheCellSize.height);
          gl.clear(gl.COLOR_BUFFER_BIT);

          self.getRenderers().map(function (animation) {
            animation.draw(gl);
          });

          var data = new Uint8Array(4 * self.mouseoverCacheCellSize.width * self.mouseoverCacheCellSize.height);
          gl.readPixels(gridX_global, gridY_global, self.mouseoverCacheCellSize.width, self.mouseoverCacheCellSize.height, gl.RGBA, gl.UNSIGNED_BYTE, data);

          return data;
        })
      }

      return self.mouseoverPixelCache[cell].map(function (layer) {
        var start = 4 * (cellY * self.mouseoverCacheCellSize.width + cellX);
        /* Disregard Alpha for now... Unsure how it interacts with BLEND functions... */
        return layer.subarray(start, start + 3);
      });
    },

    /* Uses the selectionGl canvases to get a source animation, tile
     * id and rowid from a pixel x/y position. */
    getRowidxAtPos: function (x, y) {
      var self = this;

      var height = $(self.canvas).innerHeight();

      /* Canvas coordinates are upside down for some reason... */
      y = height - y;

      return Rowidx.pixelToId(
        Rowidx.appendByteArrays.apply(
          undefined,
          self.readMouseoverPixels(x, y)
        )
      );
    },

    getReportableAnimation: function() {
      var self = this;

      var predicate = function(animation) {
        return animation.data_view &&
          animation.data_view.source &&
          animation.data_view.source.header &&
          animation.data_view.source.header.reports;
      };

     return _.find(self.animations, predicate);
    },

    mouseHandlingDisabled: 0,
    disableMouseHandling: function () { this.mouseHandlingDisabled++; },
    enableMouseHandling: function () {
      this.mouseHandlingDisabled--;
      if (this.mouseHandlingDisabled < 0) this.mouseHandlingDisabled = 0;
    },

    handleMouse: function (e, type) {
      var self = this;

      if (self.mouseHandlingDisabled > 0) return;

      var x, y;

      if (e.pageX != undefined) {
        var offset = self.node.offset();
        x = e.pageX - offset.left;
        y = e.pageY - offset.top;
      } else {
        x = e.pixel.x;
        y = e.pixel.y;
      }

      var rowidx = self.getRowidxAtPos(x, y);

      self.events.triggerEvent("select", {type: type, x: x, y: y, rowidx: rowidx}); 

      Logging.main.log(
        "Visualization.Animation.AnimationManager.handleMouse",
        {
          x: x,
          y: y,
          rowidx: rowidx,
          toString: function () {
            if (this.rowidx != undefined) {
              return this.x.toString() + "," + this.y.toString() + ": " + JSON.stringify(this.rowidx);
            } else {
              return this.x.toString() + "," + this.y.toString() + ": NO OBJECT";
            }
          }
        }
      );

      if (type == "info" || type == "selected") {
        self.closeInfoPopup();
      }

      if (rowidx) {
        var animation = self.getRenderers()[rowidx[0]];

        if (animation) {
          if (animation.data_view) {
            animation.data_view.selections.selections[type].rawInfo = KeyModifiers.active.Shift;
          }

          if (!animation.selectionAnimationFor || animation.data_view.selections.selections[type].rawInfo) {
            if (animation.select([rowidx[1], rowidx[2]], type, true, e)) {
              return animation;
            }
          }
        }
      } else {
        self.getRenderers().map(function (animation) {
          animation.select(undefined, type, true, e);
        });
      }
      return false;
    },

    hideAllSelectionAnimations: function () {
      var self = this;

      var animations = self.animations.slice(0);
      for (var i = 0; i < animations.length; i++) {
        self.hideSelectionAnimations(animations[i]);
      }
    },

    hideSelectionAnimations: function (baseAnimation) {
      var self = this;

      if (baseAnimation.selectionAnimations != undefined) {
        baseAnimation.selectionAnimations.map(function (selectionAnimation) {
          self.removeAnimation(selectionAnimation);
        });
      }
      baseAnimation.selectionAnimations = [];
    },

    saveSelectionAnimation: function (animation) {
      var self = this;
      var baseAnimation = animation.selectionAnimationFor;

      animation.selectionAnimationFor = undefined;

      animation.events.un({updated: animation.selectionAnimationUpdate});
      if (animation.data_view) {
        animation.data_view.events.un({update: animation.selectionAnimationUpdate});
      }
      baseAnimation.selectionAnimations = baseAnimation.selectionAnimations.filter(
        function (a) {
          return a !== animation;
        }
      );
      baseAnimation.select(undefined, "selected", true);
    },

    showSelectionAnimations: function (baseAnimation, selectionIter, autoSave, cb) {
      var self = this;

      if (!cb) cb = function () {};

      var baseHeader = baseAnimation.data_view.source.header;

      if (!baseHeader.seriesTilesets) return cb(null, []);

      if (!autoSave) {
        self.hideSelectionAnimations(baseAnimation);
      }

      if (selectionIter.iterate !== undefined) {
        selectionIter = selectionIter.iterate();
      }

      var query = undefined;
      var queryValues;
      try {
        while (!query) {
          queryValues = selectionIter(true).map(function (item) {
            return item.value.toString();
          }).join(",");

          query = baseAnimation.data_view.source.getSelectionQuery(selectionIter);
        }
      } catch (e) {
        return cb(e);
      }

      if (query.length == 0) return cb(null, []);

      var query_url = baseAnimation.data_view.source.getQueryUrl(query, -1);
      var existing = self.animations.filter(function (animation) {
        return animation.args.source.args.url == query_url;
      });

      if (existing.length > 0) return cb(null, []);

      var args = {
        url: baseAnimation.data_view.source.url,
        versioned_url: baseAnimation.data_view.source.getUrl('sub', query, -1),
        query_url: query_url,
        query: query,
        queryValues: queryValues,
        header: baseAnimation.data_view.source.header,
        selection: selectionIter
      };
      var seriesTilesets = baseAnimation.args.seriesTilesets;

      if (!seriesTilesets) {
        seriesTilesets = baseHeader.seriesTilesets;
      }

      if (seriesTilesets === true) {
        seriesTilesets = [
          {
            "type": "VesselTrackAnimation",
            "args": {
              "title": "Vessel Track (%(queryValues)s)",
              "color": "grey",
              "visible": true,
              "source": {
                "type": "TiledBinFormat",
                "args": {
                  "url": "%(query_url)s"
                }
              }
            }
          }
        ];
      }

      baseAnimation.args.seriesTilesets = seriesTilesets;

      if (!autoSave) {
        self.hideSelectionAnimations(baseAnimation);
      }

      var seriesAnimations = [];
      async.each(seriesTilesets, function (seriesTilesetTemplate, cb) {
        seriesTileset = new ObjectTemplate(seriesTilesetTemplate).eval(args);

        self.addAnimation(
          seriesTileset,
          function (err, animation) {
            if (err) {
              self.removeAnimation(animation);
            } else {
              if (!autoSave) {
                animation.selectionAnimationUpdate = self.selectionAnimationUpdate.bind(self, animation, seriesTilesetTemplate, seriesTileset);
                animation.events.on({updated: animation.selectionAnimationUpdate});
                if (animation.data_view) {
                  animation.data_view.events.on({update: animation.selectionAnimationUpdate});
                }
                animation.selectionAnimationFor = baseAnimation;
                baseAnimation.selectionAnimations.push(animation);
              }
              seriesAnimations.push(animation);
            }
            cb();
          }
        );
      }, function (err) {
        var selection = selectionIter.context ? selectionIter.context.selection : selectionIter;
        if (selection.data.zoomToSelectionAnimations != undefined) {
          var bounds = new SpaceTime();
          seriesAnimations.map(function (animation) {
            bounds.update(new Timerange([
              animation.data_view.source.header.colsByName.datetime.min,
              animation.data_view.source.header.colsByName.datetime.max]));
            bounds.update(new Bounds([
              animation.data_view.source.header.colsByName.longitude.min,
              animation.data_view.source.header.colsByName.latitude.min,
              animation.data_view.source.header.colsByName.longitude.max,
              animation.data_view.source.header.colsByName.latitude.max]));
          });

          self.visualization.state.setValue("time", bounds.getTimerange().end);
          self.visualization.state.setValue("timeExtent", bounds.getTimerange().end.getTime() - bounds.getTimerange().start.getTime());
          bounds = bounds.getBounds();
          self.visualization.animations.map.fitBounds({
            south:bounds.bottom,
            west:bounds.left,
            north:bounds.top,
            east:bounds.right
          });
          delete selection.data.zoomToSelectionAnimations;
        }
        cb(null, seriesAnimations);
      });
    },

    selectionAnimationUpdate: function (animation, specTemplate, spec) {
      var self = this;

      newSpec = animation.toJSON();

      var isObject = function (x) {
        return x !== null && typeof(x) == "object";
      };

      var doDiff = function (a, b) {
        var res = {};

        var handleKey = function (key) {
          if (a[key] != b[key]) {
            if (isObject(a[key]) && isObject(b[key])) {
              res[key] = doDiff(a[key], b[key]);
            } else {
              res[key] = b[key];
            }
          }
        }

        for (var key in a) {
          handleKey(key);
        }
        for (var key in b) {
          if (a[key] == undefined) {
            handleKey(key);
          }
        }
        return res;
      };

      var applyDiff = function (obj, diff) {
        for (var key in diff) {
          if (isObject(obj[key]) && isObject(diff[key])) {
            applyDiff(obj[key], diff[key]);
          } else {
            obj[key] = diff[key];
          }
        }
      };

      applyDiff(specTemplate, _.cloneDeep(doDiff(spec, newSpec)));
    },

    initMouse: function(cb) {
      var self = this;

      KeyBindings.register(
        [], 'left click (on object)', 'Map',
        'Show object information in the sidebar'
      );
      KeyBindings.register(
        [], 'double click (on background)', 'Map',
        'Deselect currently selected object'
      );
      KeyBindings.register(
        [], 'right click (on object)', 'Map',
        'Show object information in a popup'
      );
      KeyBindings.register(
        ['Shift'], 'left click (on object)', 'Map',
        'Show raw object information (no server query) in the sidebar'
      );
      KeyBindings.register(
        ['Shift'], 'right click (on object)', 'Map',
        'Show raw object information (no server query) in popup'
      );

/*
      self.infoPopup = new google.maps.InfoWindow({});
      google.maps.event.addListener(self.infoPopup, "closeclick", self.closeInfoPopup.bind(self));
*/
      self.node.mousemove(function (e) {
        if (!self.indrag) self.handleMouse(e, 'hover');
      });

      self.map.on('click', function(e) {
        self.handleMouse(e, 'selected');
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      });
      self.map.getView().on('contextmenu', function(e) {
        e.pageX = e.pixel.x;
        e.pageY = e.pixel.y;
        
        self.handleMouse(e, 'info');
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      });
      cb();
    },

    initUpdates: function (cb) {
      var self = this;

      self.visualization.state.events.on({
        set: self.triggerUpdate,
        lat: self.panZoom,
        lon: self.panZoom,
        zoom: self.panZoom,
        time: self.dataNeedsChanged,
        timeExtent:self.dataNeedsChanged,
        scope: self
      });
      cb();
    },

    initOverlays:function (cb) {
      var self = this;

      async.series([
/*
        function (cb) {
          self.bboxSelection = new BboxSelection(self, {});
          self.addAnimationInstance(self.bboxSelection, cb, "overlays");
        }
*/
      ], cb);
    },

    addAnimationInstance: function (animationInstance, cb, collection) {
      var self = this;

      if (collection == undefined) collection = "animations";

      animationInstance.id = self.animationIdCounter++;
      animationInstance.addingToManager = true;
      animationInstance.initGl(function () { 
        animationInstance.initUpdates(function () {
          if (animationInstance.addingToManager) {
            animationInstance.addingToManager = false;
            self[collection].push(animationInstance);
            self.triggerUpdate();
            if (animationInstance.data_view) {
              animationInstance.data_view.selections.events.on({
                "add": self.handleSelectionUpdate.bind(
                  self, animationInstance)
              });
              animationInstance.data_view.selections.retriggerSelectionEvents();
            }
            self.events.triggerEvent("add", {animation: animationInstance});
          }
          cb(null, animationInstance);
        });
      });
    },

/*
    closeInfoPopup: function () {
      var self = this;
      self.infoPopup.close();
      self.getRenderers().map(function (animation) {
        animation.select(undefined, "info", true, {});
      });
    },
*/

    handleInfo: function (animation, type, err, data, selectionData) {
      var self = this;
 
      Logging.main.log(
        "Visualization.Animation.AnimationManager.handleInfo",
        {
          layer: animation.title,
          category: type,
          data: data,
          toString: function () {
            var data
            if (this.data !== undefined) {
              data = this.data.toString();
            } else {
              data = 'CLEAR';
            }
            return this.layer + "/" + this.category + ": " + data;
          }
        }
      );

      if (type == 'info') {
        if (err) data = err;
        if (!data) return;
/*
        var content = ObjectToTable(data);
        if (typeof(content) != "string") content = content.html();

        self.infoPopup.setOptions({
          content: content,
          position: {lat: selectionData.latitude,
                     lng: selectionData.longitude}
        });
        self.infoPopup.open(self.map);
*/
      } else {
        var category;
        var event = {
          layerInstance: animation,
          layer: animation.title,
          category: type,
          selection: selectionData
        }

        if (err) {
          category = 'info-error';
          event.data = err;
          event.toString = function () { return this.data.toString(); };
        } else if (data && data.error) {
          category = 'info-error';
          event.data = data.error;
          event.toString = function () { return this.data.toString(); };
        } else if (data) {
          category = 'info';
          event.data = data;
          event.toString = function () { return this.data.toString(); };
        } else {
          category = 'info';
          event.data = data;
          event.toString = function () { return 'Nothing selected'; };
        }

        self.events.triggerEvent(category, event);
      }
    },

    handleSelectionUpdate: function (animation, selectionEvent, type) {
      var self = this;
      var dataView = animation.data_view;
      var type = selectionEvent.category;
      var selection = dataView.selections.selections[type];

      if (type != 'selected' && type != 'info') return;

      var selectionData = {};
      for (var key in selection.data) {
        selectionData[key] = selection.data[key][0];
      }

      var query = "";
      try {
        query = animation.data_view.source.getSelectionQuery(selection);
      } catch (e) {
        if (e.type != "StopIteration") throw(e);
      }

      Logging.main.log(
        "Visualization.Animation.AnimationManager.handleSelectionUpdate",
        {
          layer: animation.title,
          category: type,
          query: query,
          toString: function () {
            return this.layer + "/" + this.category + ": " + this.query;
          }
        }
      );

      if (type == 'selected') {
        self.events.triggerEvent('info-loading', {});
        if (dataView.source.header.seriesTilesets && !selection.rawInfo) {
          self.hideAllSelectionAnimations();
        }

        if (   (selectionEvent.startidx == undefined || selectionEvent.endidx == undefined)
            && (selectionEvent.startData == undefined || selectionEvent.endData == undefined)) {
          var data = {};
          data.toString = function () { return ""; };
          self.handleInfo(animation, selectionEvent.category, null, undefined, selectionData);
        }
      }

      if (   (selectionEvent.startidx == undefined || selectionEvent.endidx == undefined)
          && (selectionEvent.startData == undefined || selectionEvent.endData == undefined)) {
        return;
      }

      animation.getSelectionInfo(type, function (err, data) {
        if (err || data) {
          self.handleInfo(animation, selectionEvent.category, err, data, selectionData);
        } else {
          // We got an error call before, but now something has
          // changed and we're retrying the load...
          self.events.triggerEvent('info-loading', {});
        }
      });
    },

    addAnimation: function (animation, cb, collection) {
      var self = this;
      self.addAnimationInstance(
        new Animation.animationClasses[animation.type](
          self, animation.args
        ),
        cb,
        collection
      );
    },

    removeAnimation: function (animation, collection) {
      var self = this;

      if (collection == undefined) collection = "animations";

      if (animation.addingToManager) {
        animation.addingToManager = false;
      } else {
        self[collection] = self[collection].filter(function (a) { return a !== animation; });
        self.events.triggerEvent("remove", {animation: animation, collection: collection});
        animation.destroy();
        self.triggerUpdate();
      }
    },

    windowSizeChanged: function () {
      var self = this;
      self.canvasResize();
      self.map.updateSize();
    },

    panZoom: function () {
      var self = this;

      if (!self.inPanZoom) {
        self.map.getView().setCenter(
	    ol.proj.transform([self.visualization.state.getValue("lon"),
			       self.visualization.state.getValue("lat")],
			      'EPSG:4326', self.map.getView().getProjection()));
        self.map.getView().setZoom(self.visualization.state.getValue("zoom"));
      }
    },

    centerChanged: function() {
      var self = this;
      self.inPanZoom = true;
      var center = ol.proj.transform(self.map.getView().getCenter(), self.map.getView().getProjection(), 'EPSG:4326');
      self.visualization.state.setValue("lat", center[1]);
      self.visualization.state.setValue("lon", center[0]);
      self.inPanZoom = false;
      self.triggerUpdate();
    },

    zoomChanged: function() {
      var self = this;
      self.inPanZoom = true;
      self.visualization.state.setValue("zoom", self.map.getZoom());
      self.inPanZoom = false;
      self.triggerUpdate();
    },

    boundsChanged: function() {
      var self = this;

      if (self.indrag) return;
      self.dataNeedsChanged();
    },

    dataNeedsChanged: function() {
      var self = this;
      var extent = ol.proj.transformExtent(
	  self.map.getView().calculateExtent(
	      self.map.getSize()),
	  self.map.getView().getProjection(),
	  'EPSG:4326');
      var bounds = new Bounds(extent);

      var end = self.visualization.state.getValue("time");
      if (end == undefined) return;

      var start = new Date(end.getTime() - self.visualization.state.getValue("timeExtent"));
      var range = new Timerange([start, end]);

      self.visualization.data.zoomTo(new SpaceTime(range, bounds));
    },

    canvasResize: function() {
      var self = this;

      if (!self.gl) return;

      var width = $(self.canvas).innerWidth();
      var height = $(self.canvas).innerHeight();

      self.gl.viewport(0, 0, width, height);

      // matrix which maps pixel coordinates to WebGL coordinates
      self.pixelsToWebGLMatrix.set([
        2/width, 0,         0, 0,
        0,       -2/height, 0, 0,
        0,       0,         0, 0,
        -1,      1,         0, 1
      ]);

      self.updateNeeded = true;
      self.mouseoverUpdateNeeded = true;
    },

    updateTime: function (header, paused) {
      var self = this;

      self.stats.begin();

      if (paused) {
        self.lastUpdate = undefined;
      } else {
        var timeExtent = self.visualization.state.getValue("timeExtent");
        var time = self.visualization.state.getValue("time").getTime();
        var min = header.colsByName.datetime.min;
        var max = header.colsByName.datetime.max;
        var timeNow = new Date().getTime();
        var timePerTimeExtent = self.visualization.state.getValue("length");

        var timePerAnimationTime = timePerTimeExtent / timeExtent;

        if (self.lastUpdate != undefined) {
          var time = (timeNow - self.lastUpdate) / timePerAnimationTime + time;
          self.visualization.state.setValue("time", new Date(time));
        }
        self.lastUpdate = timeNow;
      }
    },

    updateProjection: function () {
      var self = this;

      /**
       * We need to create a transformation that takes world coordinate
       * points in the pointArrayBuffer to the coodinates WebGL expects.
       * 1. Start with second half in pixelsToWebGLMatrix, which takes pixel
       *     coordinates to WebGL coordinates.
       * 2. Scale and translate to take world coordinates to pixel coords
       * see https://developers.google.com/maps/documentation/javascript/maptypes#MapCoordinate
       */

      // copy pixel->webgl matrix
      self.googleMercator2webglMatrix.set(self.pixelsToWebGLMatrix);

      var scale = self.map.getView().getZoom();
      Matrix.scaleMatrix(self.googleMercator2webglMatrix, scale, scale);

      var translation = self.map.getView().getCenter();
      Matrix.translateMatrix(self.googleMercator2webglMatrix, translation[0], translation[1]);
console.log("\n\n" + JSON.stringify({scale:scale, translation:translation, matrix:self.googleMercator2webglMatrix}) + "\n\n");
    },

    isPaused: function () {
      var self = this;
      return self.visualization.state.getValue("paused");
    },

    update: function() {
      var self = this;

      if (!self.gl) return;

      var time = self.visualization.state.getValue("time");
      var paused = self.visualization.state.getValue("paused");
      if (!self.visualization.data.header.colsByName.datetime) paused = true;
      if (!paused) {
        var min = self.visualization.data.header.colsByName.datetime.min;
        var max = self.visualization.data.header.colsByName.datetime.max;
        if (time < min || time > max) paused = true;
      }

      if (!self.updateNeeded && paused) {
        return;
      }
      self.updateNeeded = false;

      self.updateTime(self.visualization.data.header, paused);
      self.updateProjection();

      self.gl.clear(self.gl.COLOR_BUFFER_BIT);

      Logging.main.log("Visualization.Animation.AnimationManager.update", {
        toString: function () {
          return (this.time != undefined ? this.time.rfcstring(" ") : "undefined")
            + " [" + (this.timeExtent != undefined ? this.timeExtent.toString() : "undefined") + "]";
        },
        timeExtent: self.visualization.state.getValue("timeExtent"),
        time: time
      });

      self.getRenderers().map(function (animation) {
        animation.draw(self.gl);
      });

      self.stats.end();
    },

    triggerUpdate: function (e) {
      var self = this;

      Logging.main.log("Visualization.Animation.AnimationManager.triggerUpdate", {msg: "Trigger update"});

      self.updateNeeded = true;
      if (!e || e.mouseoverChange !== false) {
        self.mouseoverUpdateNeeded = true;
      }
    },

    load: function (animations, cb) {
      var self = this;
      self.animations.map(function (animation) {
        self.events.triggerEvent("remove", {animation: animation});
        animation.destroy();
      });
      self.animations = [];

      async.mapSeries(
        animations.animations,
        function (item, cb) {
          self.addAnimation(item, function (err) {
            cb(); // Ignore load errors and keep loading other animations
          });
        },
        cb || function () {});
    },

    toJSON: function () {
      var self = this;

      return {animations: self.animations.filter(function (animation) {
                return animation.selectionAnimationFor == undefined;
              }).map(function (animation) {
                return animation.toJSON()
              }),
              options: self.mapOptions};
    }
  });

  AnimationManager.NoGlError = function () { Error.call(this); };
  AnimationManager.NoGlError.prototype = new Error();
  AnimationManager.NoGlError.prototype.name = "NoGlError";

  return AnimationManager;
});
