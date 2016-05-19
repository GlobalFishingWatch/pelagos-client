define([
  "require",
  "app/Class",
  "app/LoadingInfo",
  "app/Data/CartoDBInfoWindow",
  "app/Visualization/Animation/ObjectToTable",
  "app/Visualization/Animation/Animation",
  "cartodb"
], function(
  require,
  Class,
  LoadingInfo,
  CartoDBInfoWindow,
  ObjectToTable,
  Animation,
  cartodb
) {
  var CartoDBAnimation = Class(Animation, {
    name: "CartoDBAnimation",

    destroy: function () {
      var self = this;

      self.layer.remove();
    },

    initGl: function(cb) {
      var self = this;

      cartodb.createLayer(self.manager.map, self.source.args.url, {infowindow: false}
      ).on('done', function(layer) {
        /* This is a workaround for an issue with having multiple
         * CartoDB layers, see
         * http://gis.stackexchange.com/questions/80816/adding-multiple-layers-in-cartodb-using-createlayer-not-working
         */
        self.manager.map.overlayMapTypes.setAt(self.manager.map.overlayMapTypes.length, layer);
        self.layer = layer;
        /* FIXME: Does not seem to work w/o jsonp:true... why? */
        self.sql = new cartodb.SQL({
          user: layer.options.user_name,
          jsonp: true,
          sql_api_template: self.layer.options.sql_api_template
        });

        self.layer.getSubLayers().map(function (subLayer) {
          subLayer.setInteraction(true); // Interaction for that layer must be enabled
          cartodb.vis.Vis.addCursorInteraction(self.manager.map, subLayer);
        });

        self.layer.on('featureOver', self.handleMouseOver.bind(self));
        self.layer.on('mouseout', self.handleMouseOut.bind(self));

        self.setVisible(self.visible);

        cb();
      }).on("error", function () {
        self.handleError();
        self.manager.visualization.data.events.triggerEvent("error", {
          url: self.source.args.url,
          toString: function () {
            return 'Unable to load CartoDB layer ' + this.url;
          }
        });
      });
    },

    handleMouseOver: function (event, latlng, pos, data, layerIndex) {
      var self = this;
      self.mouseOver = arguments;
    },
    handleMouseOut: function () {
      var self = this;
      self.mouseOver = undefined;
    },

    /* This is a bit of a hack, working around the normal selection
     * system. But all of this layer is a bit of a hack :) */
    handleClick: function (type, event, latlng, pos, data, layerIndex) {
      var self = this;

      if (type == 'selected') {
        self.manager.events.triggerEvent('info-loading', {});
      }

      var url = "CartoDB://" + self.source.args.url + "?" + JSON.stringify(data);

      LoadingInfo.main.add(url, true);

      new CartoDBInfoWindow(data.cartodb_id, self.layer).fetch(function(info) {
        LoadingInfo.main.remove(url);

        var data = {
          html: info.html,
          report: self.report,
          polygonData: info.data,
          toString: function () { return this.html; }
        };

        var selectionData = {
          latitude: latlng[0],
          longitude: latlng[1]
        };

        self.manager.handleInfo(self, type, undefined, data, selectionData);
      });
    },

    setVisible: function (visible) {
      var self = this;
      self.visible = visible;
      if (visible) {
        self.layer.show();
      } else {
        self.layer.hide();
      }
    },

    initUpdates: function(cb) { cb(); },

    draw: function () {},

    select: function (rowidx, type, replace, event) {
      var self = this;

      if (type != 'selected' && type != 'info') return;

      if (self.mouseOver) {
        self.handleClick.apply(self, [type].concat(Array.prototype.slice.call(self.mouseOver)));
      } else if (type == "selected" && self.selected) {
        self.selected = false;
        self.manager.events.triggerEvent('info', {});
      }
    }
  });
  Animation.animationClasses.CartoDBAnimation = CartoDBAnimation;

  return CartoDBAnimation;
});
