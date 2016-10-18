define([
  "require",
  "app/Class",
  "app/Visualization/Animation/Shader",
  "app/Visualization/Animation/GlAnimation",
  "app/Visualization/KeyModifiers",
  "app/Visualization/KeyBindings",
  "shims/async/main",
  "app/Events",
  "app/Bounds"
], function(
  require,
  Class,
  Shader,
  GlAnimation,
  KeyModifiers,
  KeyBindings,
  async,
  Events,
  Bounds
) {
  return Class(GlAnimation, {
    name: "BboxSelection",

    columns: {},

    programSpecs: {
      program: {
        context: "gl",
        vertex: "app/Visualization/Animation/BboxSelection-vertex.glsl",
        fragment: "app/Visualization/Animation/BboxSelection-fragment.glsl",
        columns: []
      }
    },

    keys: ['Ctrl'],

    getKeyPath: function () {
      var self = this;
      return KeyBindings.keysToKeyPath(self.keys);
    },


    initialize: function(manager, args) {
      var self = this;

      self.events = new Events("BboxSelection");

      GlAnimation.prototype.initialize.call(self, manager, args);
    },

    initGl: function(cb) {
      var self = this;

      self.bounds = undefined;

      KeyBindings.register(
        self.keys, 'click and drag', 'Map',
        'Select a region'
      );

      KeyModifiers.events.on({
        "keyDown": self.handleKeys.bind(self),
        "keyUp": self.handleKeys.bind(self)
      });

      $(self.manager.node).mousedown(self.handleMouseDown.bind(self));
      $(self.manager.node).mousemove(self.handleMouseMove.bind(self));
      $(self.manager.node).mouseup(self.handleMouseUp.bind(self));

      GlAnimation.prototype.initGl.call(self, function () {
        Object.values(self.programs).map(function (programs) {
          programs.map(function (program) {
            program.arrayBuffers.main = {};
            program.arrayBuffers.main.worldCoords = program.gl.createBuffer();
          });
        });

        cb();
      });
    },

    handleKeys: function (e) {
      var self = this;
      var ourKey = (KeyBindings.keysToKeyPath(Object.keys(e.active)) == self.getKeyPath());
      self.manager.map.setOptions({draggable: !ourKey});
    },

    handleMouseDown: function (e) {
      var self = this;
      if (KeyBindings.keysToKeyPath(Object.keys(KeyModifiers.active)) != self.getKeyPath()) return;

      self.manager.disableMouseHandling();
      self.startLatLng = self.currentLatLng = self.point2LatLng(new google.maps.Point(e.pageX, e.pageY));
      self.updateBounds();
      self.updateSelection();
      e.preventDefault();
      e.stopImmediatePropagation();
    },

    handleMouseMove: function (e) {
      var self = this;
      if (!self.bounds) return;

      self.currentLatLng = self.point2LatLng(new google.maps.Point(e.pageX, e.pageY));
      self.updateBounds();
      self.updateSelection();
    },

    handleMouseUp: function (e) {
      var self = this;
      if (!self.bounds) return;

      self.manager.enableMouseHandling();
      var topLeft = self.latLng2Point(new google.maps.LatLng(self.bounds.top, self.bounds.left));
      var bottomRight = self.latLng2Point(new google.maps.LatLng(self.bounds.bottom, self.bounds.right));

      var rowidxs = [];
      for (var x = topLeft.x; x < bottomRight.x; x++) {
        for (var y = topLeft.y; y < bottomRight.y; y++) {
          var rowidx = self.manager.getRowidxAtPos(x, y);
          if (rowidx) {
            if (rowidxs.indexOf(rowidx) == -1) rowidxs.push(rowidx);
          }
        }
      }

      var animations = [];
      self.manager.getRenderers().map(function (animation) {
        animation.select([undefined, undefined], "bbox", true, e);
      });

      rowidxs.map(function (rowidx) {
        var animation = self.manager.getRenderers()[rowidx[0]];
        if (animation.select([rowidx[1], rowidx[2]], "bbox", false, e)) {
          if (animations.indexOf(animation) == -1) {
            animations.push(animation);
          }
        }
      });

      self.events.triggerEvent("selection", {bounds: self.bounds, selection: "bbox", animations: animations});

      animations.map(function (animation) {
        var dataView = animation.data_view;
        var selection = dataView.selections.selections.bbox;
        var iter = selection.iterate(true);

        try {
          while (true) {
            self.manager.showSelectionAnimations(animation, iter, true, function (selectionAnimations) {
              selectionAnimations.map(function (selectionAnimation) {
                selectionAnimation.setTitleFromInfo();
              });
            });
          }
        } catch (e) {
          if (e.type != "StopIteration") throw(e);
        }
      });

      console.log("SELECTED AREA", self.bounds.toString(), animations.map(function (animation) {
          var dataView = animation.data_view;
          var selection = dataView.selections.selections.bbox;
          return selection.data;
        }));
      self.bounds = undefined;
    },

    updateBounds: function () {
      var self = this;

      var startLat = self.startLatLng.lat();
      var startLon = self.startLatLng.lng();
      var currentLat = self.currentLatLng.lat();
      var currentLon = self.currentLatLng.lng();

      var left = Math.min(startLon, currentLon);
      var right = Math.max(startLon, currentLon);
      var bottom = Math.min(startLat, currentLat);
      var top = Math.max(startLat, currentLat);

      self.bounds = new Bounds([left,bottom,right,top]);
    },

    latLng2Point: function(latLng) {
      var self = this;
      var map = self.manager.map;

      var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
      var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
      var scale = Math.pow(2, map.getZoom());
      var worldPoint = map.getProjection().fromLatLngToPoint(latLng);
      return new google.maps.Point((worldPoint.x - bottomLeft.x) * scale, (worldPoint.y - topRight.y) * scale);
    },

    point2LatLng: function(point) {
      var self = this;
      var map = self.manager.map;
      var topRight = map.getProjection().fromLatLngToPoint(map.getBounds().getNorthEast());
      var bottomLeft = map.getProjection().fromLatLngToPoint(map.getBounds().getSouthWest());
      var scale = Math.pow(2, map.getZoom());
      var worldPoint = new google.maps.Point(point.x / scale + bottomLeft.x, point.y / scale + topRight.y);
      return map.getProjection().fromPointToLatLng(worldPoint);
    },

    updateSelection: function () {
      var self = this;

      if (!self.bounds) return;

      self.rawLatLonData = new Float32Array(5*2);
      var bounds = self.bounds.getBounds();
      var i = 0;
      [
        {lat: bounds.top, lon: bounds.left},
        {lat: bounds.top, lon: bounds.right},
        {lat: bounds.bottom, lon: bounds.right},
        {lat: bounds.bottom, lon: bounds.left},
        {lat: bounds.top, lon: bounds.left}
      ].map(function (corner) {
        self.rawLatLonData[i++] = corner.lon;
        self.rawLatLonData[i++] = corner.lat;
      });

      Object.values(self.programs).map(function (programs) {
        programs.map(function (program) {
          program.gl.useProgram(program);
          Shader.programLoadArray(program.gl, program.arrayBuffers.main.worldCoords, self.rawLatLonData, program);
        });
      });
      self.manager.triggerUpdate();
    },

    drawProgram: function (program) {
      var self = this;

      if (!self.bounds) return;
      if (program.name == "rowidxProgram" && (self.manager.indrag || !self.manager.isPaused()))
        return;

      GlAnimation.prototype.drawProgram.apply(self, arguments);
      Shader.programBindArray(program.gl, program.arrayBuffers.main.worldCoords, program, "worldCoord", 2, program.gl.FLOAT);
      program.gl.drawArrays(program.gl.LINE_STRIP, 0, 5);
    }
  });
});
