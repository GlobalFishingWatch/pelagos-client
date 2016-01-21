define([
  "require",
  "app/Class",
  "app/LoadingInfo",
  "app/Visualization/Animation/ObjectToTable",
  "app/Visualization/Animation/Animation",
  "cartodb"
], function(
  require,
  Class,
  LoadingInfo,
  ObjectToTable,
  Animation,
  cartodb
) {
  var CartoDBAnimation = Class(Animation, {
    name: "CartoDBAnimation",

    columns: {},
    programSpecs: {},

    initialize: function(manager, args) {
      var self = this;

      self.visible = true;
      self.args = args;
      if (args) $.extend(self, args);
      self.manager = manager;
    },

    destroy: function () {
      var self = this;
      self.layer.setMap(null);
      // FIXME: DO we need to call destroy or something like that on self.layer?
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

        cb();
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
 
      var url = "CartoDB://" + self.source.args.url + "?" + JSON.stringify(data);

      if (type == 'selected') {
        self.manager.events.triggerEvent('info-loading', {});
      }
      LoadingInfo.main.add(url, true);

      self.sql.execute(
        (  'select * from ('
         +   self.layer.getSubLayer(layerIndex).getSQL()
         + ') as a'
         + ' where '
         + Object.keys(data).map(function (key) {
             return key + ' = {{' + key + '}}';
           }).join(' and ')),
        data
      ).done(function(data) {
        LoadingInfo.main.remove(url);
        if (data.error) {
          self.manager.handleInfo(self, type, data.error, undefined, {latitude: latlng.lat(), longitude: latlng.lng()});
        } else {
          data = data.rows[0];
          delete data.the_geom;
          delete data.the_geom_webmercator;
          data.toString = function () {
            return ObjectToTable(this);
          };
          self.selected = true;
          self.manager.handleInfo(self, type, undefined, data, {latitude: latlng[0], longitude: latlng[1]});
        }
      }).error(function(errors) {
        LoadingInfo.main.remove(url);
        self.manager.handleInfo(self, type, errors, undefined, {latitude: latlng.lat(), longitude: latlng.lng()});
      });
    },

    setVisible: function (visible) {
      var self = this;
      Animation.prototype.setVisible.call(self, visible);
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
    },

    toString: function () {
      var self = this;
      return self.name + ": " + self.source.args.url;
    },

    toJSON: function () {
      var self = this;
      return {
        args: _.extend({}, self.args, {source: self.source, title: self.title, visible: self.visible}),
        "type": self.name
      };
    }
  });
  Animation.animationClasses.CartoDBAnimation = CartoDBAnimation;

  return CartoDBAnimation;
});
