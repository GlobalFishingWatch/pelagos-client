define([
  "app/Class",
  "app/Events",
  "app/Bounds",
  "app/ObjectTemplate",
  "async",
  "app/Logging",
  "app/Visualization/KeyModifiers",
  "jQuery",
  "dijit/Dialog",
  "app/Visualization/Animation/Matrix",
  "CanvasLayer",
  "Stats",
  "app/Visualization/Animation/ObjectToTable",
  "app/Visualization/Animation/Rowidx",
  "app/Visualization/Animation/Animation",
  "app/Visualization/Animation/PointAnimation",
  "app/Visualization/Animation/LineAnimation",
  "app/Visualization/Animation/LineStripAnimation",
  "app/Visualization/Animation/TileAnimation",
  "app/Visualization/Animation/DebugAnimation",
  "app/Visualization/Animation/ClusterAnimation",
  "app/Visualization/Animation/MapsEngineAnimation",
  "app/Visualization/Animation/CartoDBAnimation",
  "app/Visualization/Animation/VesselTrackAnimation",
  "app/Visualization/Animation/ArrowAnimation"],
function(Class,
  Events,
  Bounds,
  ObjectTemplate,
  async,
  Logging,
  KeyModifiers,
  $,
  Dialog,
  Matrix,
  CanvasLayer,
  Stats,
  ObjectToTable,
  Rowidx,
  Animation
) {
  var AnimationManager = Class({
    name: "AnimationManager",

    mapOptions: {
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControlOptions: {
          position: google.maps.ControlPosition.TOP_LEFT,
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
      },
      zoomControlOptions: {
        position: google.maps.ControlPosition.LEFT_TOP,
        style: google.maps.ZoomControlStyle.LARGE
      },
      streetViewControl: false,
      overviewMapControl: false,
      styles: [
        {
          featureType: 'poi',
          stylers: [{visibility: 'off'}]
        }
      ]
    },

    initialize: function (visualization) {
      var self = this;

      self.events = new Events("AnimationManager");

      self.visualization = visualization;
      self.node = $("<div class='animations'>");
      self.visualization.node.append(self.node);

      self.indrag = false;
      self.inPanZoom = false;
    },

    init: function (cb) {
      var self = this;

      self.animations = [];
      self.updateNeeded = false;
      self.lastUpdate = undefined;
      self.map = undefined;
      self.canvasLayer = undefined;
      self.gl = undefined;
      self.pixelsToWebGLMatrix = new Float32Array(16);
      self.googleMercator2webglMatrix = new Float32Array(16);

      async.series([
        self.initMap.bind(self),
        self.initOverlay.bind(self),
        self.initCanvas.bind(self),
        self.initStats.bind(self),
        self.initMouse.bind(self),
        self.initUpdates.bind(self),
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

      self.map = new google.maps.Map(
        self.node[0],
        $.extend(
          {
            zoom: 1,
            center: {lat: 0, lng: 0}
          },
          self.mapOptions
        )
      );

      window.addEventListener('resize', self.windowSizeChanged.bind(self), false);
      google.maps.event.addListener(self.map, 'center_changed', self.centerChanged.bind(self));
      google.maps.event.addListener(self.map, 'zoom_changed', self.zoomChanged.bind(self));
      google.maps.event.addListener(self.map, 'bounds_changed', self.boundsChanged.bind(self));
      google.maps.event.addListener(self.map, 'dragstart', function () { self.indrag = true; });
      google.maps.event.addListener(self.map, 'dragend', function () { self.indrag = false; self.boundsChanged(); });
      cb();
    },

    initOverlay: function (cb) {
      var self = this;

      var overlay = self.visualization.state.getValue("overlay")
      if (overlay) {
        var kmlLayer = new google.maps.KmlLayer({url: overlay, preserveViewport: true});
        kmlLayer.setMap(self.map);
      }
      cb();
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

      var canvasLayerOptions = {
        map: self.map,
        resizeHandler: function () { if (self.initialized) self.canvasResize() },
        updateHandler: function () { if (self.initialized) self.update(); },
        animate: true
      };
      self.canvasLayer = new CanvasLayer(canvasLayerOptions);

      try {
        self.gl = self.getGlContext(self.canvasLayer.canvas);

        self.rowidxGl = [self.createRowidxGlContext(), self.createRowidxGlContext()];
      } catch (e) {
        if (e instanceof AnimationManager.NoGlError) {
          cb({msg: "Your browser does not support WebGL."});
        } else {
           throw e;
        }
      }

      var onAdd = function () {
        if (!self.canvasLayer.isAdded_) {
          setTimeout(onAdd, 1);
        } else {
          self.canvasResize();
          cb();
        }
      }
      onAdd();
    },

    search: function(query, cb) {
      var self = this;

      Logging.main.log(
        "Visualization.Animation.AnimationManager.search",
        {
          query: query,
          toString: function () {
            return this.query;
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

      async.concat(searchers, function (searcher, cb) {
        searcher(query, cb);
      }, cb);
    },

    /* Uses the selectionGl canvases to get a source animation, tile
     * id and rowid from a pixel x/y position. */
    getRowidxAtPos: function (x, y) {
      var self = this;

      /* Canvas coordinates are upside down for some reason... */
      y = self.canvasLayer.canvas.height - y;

      return Rowidx.pixelToId(
        Rowidx.appendByteArrays.apply(
          undefined,
          self.rowidxGl.map(function (gl) {
            var data = new Uint8Array(4);
            gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, data);
            return data.subarray(0, 3); /* Disregard Alpha for now... Unsure how it interacts with BLEND functions... */
          })
        )
      );
    },

    handleMouse: function (e, type) {
      var self = this;

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

      if (rowidx) {
        var animation = self.animations[rowidx[0]];
        if (animation.data_view) {
          animation.data_view.selections.selections[type].rawInfo = KeyModifiers.active.Shift;
        }

        if (animation.select([rowidx[1], rowidx[2]], type, true, e)) {
          return animation;
        }
      } else {
        self.animations.map(function (animation) {
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

    showSelectionAnimations: function (baseAnimation, selection) {
      var self = this;
      var baseHeader = baseAnimation.data_view.source.header;

      if (!baseHeader.seriesTilesets) return;

      self.hideSelectionAnimations(baseAnimation);

      if (selection.data.series != undefined || selection.data.seriesgroup != undefined) {
        var seriesTilesets = baseHeader.seriesTilesets;

        if (seriesTilesets === true) {
          seriesTilesets = [
            {
              "type": "VesselTrackAnimation",
              "args": {
                "title": "Vessel Track",
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

        var selectionValue = selection.data.series[0];
        if (selection.data.seriesgroup != undefined) selectionValue = selection.data.seriesgroup[0];

        seriesTilesets = new ObjectTemplate(seriesTilesets).eval({
          url: baseAnimation.data_view.source.url,
          versioned_url: baseAnimation.data_view.source.getUrl('sub', -1),
          query_url: baseAnimation.data_view.source.getSelectionUrl(selection, -1),
          selectionValue: selectionValue,
          query: baseAnimation.data_view.source.getSelectionQuery(selection),
          header: baseAnimation.data_view.source.header,
          selection: selection
        });

        self.hideSelectionAnimations(baseAnimation);

        async.each(seriesTilesets, function (seriesTileset, cb) {
          self.addAnimation(
            seriesTileset,
            function (err, animation) {
              if (err) {
                self.removeAnimation(animation);
              } else {
                animation.selectionAnimationFor = baseAnimation;
                baseAnimation.selectionAnimations.push(animation);
              }
              cb();
            }
          );
        });
      }
    },

    initMouse: function(cb) {
      var self = this;

      self.infoPopup = new google.maps.InfoWindow({});

      self.node.mousemove(function (e) {
        if (!self.indrag) self.handleMouse(e, 'hover');
      });

      google.maps.event.addListener(self.map, "click", function(e) {
        self.handleMouse(e, 'selected');
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
      });
      google.maps.event.addListener(self.map, "rightclick", function(e) {
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
        scope: self
      });
      cb();
    },

    addAnimationInstance: function (animationInstance, cb) {
      var self = this;

      animationInstance.addingToManager = true;
      animationInstance.initGl(function () { 
        animationInstance.initUpdates(function () {
          if (animationInstance.addingToManager) {
            animationInstance.addingToManager = false;
            self.animations.push(animationInstance);
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

    handleInfo: function (animation, selectionEvent, err, data) {
      var self = this;
      var dataView = animation.data_view;
      var type = selectionEvent.category;
      var info = {};
      var selectionData = dataView.selections.selections[selectionEvent.category].data;
      for (var key in selectionData) {
        info[key] = selectionData[key][0];
      }
 
      Logging.main.log(
        "Visualization.Animation.AnimationManager.handleInfo",
        {
          layer: animation.title,
          category: selectionEvent.category,
          data: data,
          toString: function () {
            return this.layer + "/" + this.category + ": " + this.data.toString();
          }
        }
      );

      if (type == 'info') {
        if (err) data = err;
        if (!data) return;

        self.infoPopup.setOptions({
          content: data.toString(),
          position: {lat: info.latitude,
                     lng: info.longitude}
        });
        self.infoPopup.open(self.map);
      } else {
        var category;
        var event = {
          layerInstance: animation,
          layer: animation.title,
          category: selectionEvent.category,
          selection: info
        }

        if (err) {
          category = 'info-error';
          event.error = err;
          event.toString = function () { return this.error.toString(); };
        } else if (data && data.error) {
          category = 'info-error';
          event.data = data;
          event.toString = function () { return this.data.error; };
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

      if (type != 'selected' && type != 'info') return;

      Logging.main.log(
        "Visualization.Animation.AnimationManager.handleSelectionUpdate",
        {
          layer: animation.title,
          category: type,
          query: animation.data_view.source.getSelectionQuery(dataView.selections.selections[type]),
          toString: function () {
            return this.layer + "/" + this.category + ": " + this.query;
          }
        }
      );

      if (type == 'selected') {
        self.events.triggerEvent('info-loading', {});
        if (dataView.source.header.seriesTilesets) {
          self.hideAllSelectionAnimations();
        }

        if (   (selectionEvent.startidx == undefined || selectionEvent.endidx == undefined)
            && (selectionEvent.startData == undefined || selectionEvent.endData == undefined)) {
          var data = {};
          data.toString = function () { return ""; };
          self.handleInfo(animation, selectionEvent, null, undefined);
        }
      }

      if (   (selectionEvent.startidx == undefined || selectionEvent.endidx == undefined)
          && (selectionEvent.startData == undefined || selectionEvent.endData == undefined)) {
        return;
      }

      if (dataView.selections.selections[type].rawInfo) {
        var data = dataView.selections.selections[type].data;
        data.layer = animation.title;
        data.toString = function () {
          return ObjectToTable(this);
        };
        self.handleInfo(animation, selectionEvent, null, data);
      } else {
        if (type == 'selected') {
          self.showSelectionAnimations(animation, dataView.selections.selections[type]);
        }
        dataView.selections.getSelectionInfo(type, function (err, data) {
          var content;

          if (err) {
            self.handleInfo(animation, selectionEvent, err, null);
          } else {
            data.toString = function () {
              var content = ["<table class='table table-striped table-bordered'>"];
              if (data.name) {
                var name = data.name;
                if (data.link) {
                  name = "<a target='_new' href='" + data.link + "'>" + name + "</a>";
                }
                content.push("<tr><th colspan='2'>" + name + "</th><tr>");
              }

              Object.keys(data).sort().map(function (key) {
                if (key == 'toString' || key == 'name' || key == 'link') return;
                if (typeof(data[key])=="string" && data[key].indexOf("://") != -1) {
                  content.push("<tr><th colspan='2'><a target='_new' href='" + data[key] +  "'>" + key + "</a></th></tr>");
                } else {
                  content.push("<tr><th>" + key + "</th><td>" + data[key] + "</td></tr>");
                }
              });

              content.push("</table>");

              return content.join('\n');
            };
            self.handleInfo(animation, selectionEvent, null, data);
          }
        });

      }
    },

    addAnimation: function (animation, cb) {
      var self = this;
      self.addAnimationInstance(
        new Animation.animationClasses[animation.type](
          self, animation.args
        ),
        cb
      );
    },

    removeAnimation: function (animation) {
      var self = this;
      if (animation.addingToManager) {
        animation.addingToManager = false;
      } else {
        self.animations = self.animations.filter(function (a) { return a !== animation; });
        self.events.triggerEvent("remove", {animation: animation});
        animation.destroy();
        self.triggerUpdate();
      }
    },

    windowSizeChanged: function () {
      var self = this;
      google.maps.event.trigger(self.map, 'resize');
    },

    panZoom: function () {
      var self = this;

      if (!self.inPanZoom) {
        self.map.setCenter({
          lat: self.visualization.state.getValue("lat"),
          lng: self.visualization.state.getValue("lon")
        });
        self.map.setZoom(self.visualization.state.getValue("zoom"));
      }
    },

    centerChanged: function() {
      var self = this;
      self.inPanZoom = true;
      self.visualization.state.setValue("lat", self.map.getCenter().lat());
      self.visualization.state.setValue("lon", self.map.getCenter().lng());
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
      var bounds = self.map.getBounds();
      var ne = bounds.getNorthEast();
      var sw = bounds.getSouthWest();
      var latmin = sw.lat();
      var lonmin = sw.lng();
      var latmax = ne.lat();
      var lonmax = ne.lng();
      self.visualization.data.zoomTo(new Bounds(lonmin, latmin, lonmax, latmax));
    },

    canvasResize: function() {
      var self = this;

      if (!self.gl) return;

      var width = self.canvasLayer.canvas.width;
      var height = self.canvasLayer.canvas.height;

      self.gl.viewport(0, 0, width, height);

      // matrix which maps pixel coordinates to WebGL coordinates
      self.pixelsToWebGLMatrix.set([
        2/width, 0,         0, 0,
        0,       -2/height, 0, 0,
        0,       0,         0, 0,
        -1,      1,         0, 1
      ]);

      self.updateNeeded = true;
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

      var mapProjection = self.map.getProjection();

      // copy pixel->webgl matrix
      self.googleMercator2webglMatrix.set(self.pixelsToWebGLMatrix);

      var scale = self.canvasLayer.getMapScale();
      Matrix.scaleMatrix(self.googleMercator2webglMatrix, scale, scale);

      var translation = self.canvasLayer.getMapTranslation();
      Matrix.translateMatrix(self.googleMercator2webglMatrix, translation.x, translation.y);
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

      var width = self.canvasLayer.canvas.width;
      var height = self.canvasLayer.canvas.height;

      self.rowidxGl.map(function (gl) {
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, width, height);
        gl.clear(gl.COLOR_BUFFER_BIT);
      });

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

      self.animations.map(function (animation) { animation.draw(); });

      self.stats.end();
    },

    triggerUpdate: function (e) {
      var self = this;

      Logging.main.log("Visualization.Animation.AnimationManager.triggerUpdate", {msg: "Trigger update"});

      self.updateNeeded = true;
    },

    setMapOptions: function (options) {
      var self = this;

      options = $.extend({}, options);
      delete options.zoom;
      delete options.center;

      self.mapOptions = options;
      self.map.setOptions(options);
    },

    load: function (animations, cb) {
      var self = this;
      self.animations.map(function (animation) {
        self.events.triggerEvent("remove", {animation: animation});
        animation.destroy();
      });
      self.animations = [];

      if (animations.options) {
        self.setMapOptions(animations.options);
      }

      async.map(animations.animations, self.addAnimation.bind(self), cb || function () {});
    },

    toJSON: function () {
      var self = this;

      return {animations: self.animations.filter(function (animation) {
                return animation.selectionAnimationFor == undefined;
              }),
              options: self.mapOptions};
    }
  });

  AnimationManager.NoGlError = function () { Error.call(this); };
  AnimationManager.NoGlError.prototype = new Error();
  AnimationManager.NoGlError.prototype.name = "NoGlError";

  return AnimationManager;
});
