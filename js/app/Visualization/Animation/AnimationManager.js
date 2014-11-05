define(["app/Class", "app/Events", "app/Bounds", "async", "app/Logging", "app/Visualization/KeyModifiers", "jQuery", "app/Visualization/Matrix", "CanvasLayer", "Stats", "app/Visualization/Animation/Animation", "app/Visualization/Animation/PointAnimation", "app/Visualization/Animation/LineAnimation", "app/Visualization/Animation/TileAnimation", "app/Visualization/Animation/DebugAnimation", "app/Visualization/Animation/ClusterAnimation", "app/Visualization/Animation/MapsEngineAnimation", "app/Visualization/Animation/VesselTrackAnimation"], function(Class, Events, Bounds, async, Logging, KeyModifiers, $, Matrix, CanvasLayer, Stats, Animation) {
  return Class({
    name: "AnimationManager",

    mapOptions: {
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT
      },
      streetViewControl: false,
      overviewMapControl: true,
      overviewMapControlOptions: {
        opened: true
      },
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
      google.maps.event.addListener(self.map, 'idle', self.mapIdle.bind(self));
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

    initCanvas: function (cb) {
      var self = this;

      var canvasLayerOptions = {
        map: self.map,
        resizeHandler: function () { if (self.initialized) self.canvasResize() },
        updateHandler: function () { if (self.initialized) self.update(); },
        animate: true
      };
      self.canvasLayer = new CanvasLayer(canvasLayerOptions);

      self.gl = self.canvasLayer.canvas.getContext('experimental-webgl');
      if (!self.gl) {
        var failover = self.visualization.state.getValue('nowebgl');
        if (failover) {
          window.location = failover;
        } else {
          var dialog = $('<div class="modal fade" id="error" tabindex="-1" role="dialog" aria-labelledby="errorLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-header bg-danger text-danger"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button><h4 class="modal-title" id="errorLabel">Loading failed</h4></div><div class="modal-body alert">Your browser does not support WebGL.</div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div></div></div></div>');
          $('body').append(dialog);
          dialog.modal();
          dialog.on('hidden.bs.modal', function (e) {
            dialog.detach();
          });
        }
        cb({msg: "Your browser does not support WebGL."});
      } else {
        self.gl.enable(self.gl.BLEND);
        self.gl.blendFunc(self.gl.SRC_ALPHA, self.gl.ONE);
        self.canvasResize();
        cb();
      }
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

      for (var key in self.animations) {
        var animation = self.animations[key];
        if (animation.select(x, y, type, true)) {
          return animation;
        }
      }
      return false;
    },

    handleMouseSelection: function (e, type, raw, cb) {
      var self = this;

      var animation = self.handleMouse(e, type);
      var dataView = animation.data_view;
      if (!dataView) {
        cb(null, null);
      } else {
        if (raw) {
          var data = dataView.selections[type].data;
          data.layerInstance = animation;
          data.layer = animation.title;
          data.toString = function () {
            var content = ["<table class='table table-striped table-bordered'>"];
            Object.keys(data).sort().map(function (key) {
              if (key == 'toString' || key == 'layer' || key == 'layerInstance') return;
              var value = data[key][0];
              if (key.indexOf('time') != -1 || key.indexOf('date') != -1) {
                value = new Date(value).toISOString().replace("T", " ").split("Z")[0];
              }
              content.push("<tr><th>" + key + "</th><td>" + value + "</td></tr>");
            });
            content.push("</table>");
            return content.join('\n');
          };
          cb(null, data);
        } else {
          dataView.getSelectionInfo(type, function (err, data) {
            var content;

            if (err) {
              err.layerInstance = animation;
              err.layer = animation.title;
              cb(err, null);
            } else {
              data.layerInstance = animation;
              data.layer = animation.title;
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
                  if (key == 'toString' || key == 'name' || key == 'link' || key == 'layer' || key == 'layerInstance') return;
                  if (typeof(data[key])=="string" && data[key].indexOf("://") != -1) {
                    content.push("<tr><th colspan='2'><a target='_new' href='" + data[key] +  "'>" + key + "</a></th></tr>");
                  } else {
                    content.push("<tr><th>" + key + "</th><td>" + data[key] + "</td></tr>");
                  }
                });

                content.push("</table>");

                return content.join('\n');
              };
              cb(null, data);
            }
          });

        }
      }
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
    },

    showSeriesAnimation: function (baseAnimation, series) {
      var self = this;

      if (!baseAnimation.data_view.source.header.seriesTilesets) return;

      if (baseAnimation.seriesAnimation != undefined) {
        self.removeAnimation(baseAnimation.seriesAnimation);
        baseAnimation.seriesAnimation = undefined;
      }

      if (series != undefined) {
        self.addAnimation({
          "args": {
            "title": "Vessel Track",
            "color": "grey",
            "visible": true,
            "source": {
              "type": "BinFormat",
              "args": {
                "url": baseAnimation.data_view.source.header.alternatives[0] + "-" + series + "/-180,-90,180,90"
              }
            }
          },
          "type": "VesselTrackAnimation"
        }, function (err, animation) {
          if (baseAnimation.seriesAnimation != undefined) {
            self.removeAnimation(baseAnimation.seriesAnimation);
            baseAnimation.seriesAnimation = undefined;
          }
          baseAnimation.seriesAnimation = animation;
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
        self.handleMouseSelection(e, 'selected', KeyModifiers.active.Shift, function (err, data) {
          if (err) {
            self.events.triggerEvent('info-error', err);
          } else if (data) {
            self.events.triggerEvent('info', data);
            self.showSeriesAnimation(data.layerInstance, data.series);
          }
        });
      });
      google.maps.event.addListener(self.map, "rightclick", function(e) {
        e.pageX = e.pixel.x;
        e.pageY = e.pixel.y;
        
        self.handleMouseSelection(e, 'info', KeyModifiers.active.Shift, function (err, data) {
          if (err) data = err;
          if (!data) return;
          self.infoPopup.setOptions({
            content: data.toString(),
            position: e.latLng
          });
          self.infoPopup.open(self.map);
        });
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
      animationInstance.initGl(self.gl, function () { 
        animationInstance.initUpdates(function () {
          if (animationInstance.addingToManager) {
            animationInstance.addingToManager = false;
            self.animations.push(animationInstance);
            self.triggerUpdate();
            self.events.triggerEvent("add", {animation: animationInstance});
          }
          cb(null, animationInstance);
        });
      });
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

    mapIdle: function() {
      var self = this;
      self.visualization.data.mapIdle();
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

      return {animations:self.animations, options:self.mapOptions};
    }
  });
});
