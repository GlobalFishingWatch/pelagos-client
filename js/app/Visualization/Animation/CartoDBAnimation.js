define([
  "require",
  "app/Class",
  "app/Visualization/Animation/ObjectToTable",
  "app/Visualization/Animation/Animation",
  "cartodb"
], function(
  require,
  Class,
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
      ).addTo(self.manager.map
      ).on('done', function(layer) {
        self.layer = layer;
        /* FIXME: Does not seem to work w/o jsonp:true... why? */
        self.sql = new cartodb.SQL({user: layer.options.user_name, jsonp: true});

        self.layer.getSubLayers().map(function (subLayer) {
          subLayer.setInteraction(true); // Interaction for that layer must be enabled
          cartodb.vis.Vis.addCursorInteraction(self.manager.map, subLayer);
        });

        self.layer.on('featureClick', self.handleClick.bind(self, 'click'));

/*
          google.maps.event.addListener(self.layer, 'click', self.handleClick.bind(self, 'click'));
          google.maps.event.addListener(self.layer, 'rightclick', function () {
              console.log("XXXXX", arguments);
          });
*/

        cb();
      });
    },

    /* This is a bit of a hack, working around the normal selection
     * system. But all of this layer is a bit of a hack :) */
    handleClick: function (type, event, latlng, pos, data, layerIndex) {
      var self = this;
      var handleInfo = function(info, type) {
        if (type == 'rightclick') {
          self.manager.infoPopup.setOptions({
            content: info.toString(),
            position: latlng
          });
          self.manager.infoPopup.open(self.manager.map);
        } else {
          self.selected = true;
          var event = {
            layer: self.title,
            data: info,
            toString: function () {
              return this.data.toString();
            }
          };
          self.manager.events.triggerEvent(type, event);
        }
      };
 
      self.sql.execute(
        (  self.layer.getSubLayer(layerIndex).getSQL()
         + ' where '
         + Object.keys(data).map(function (key) {
             return key + ' = {{' + key + '}}';
           }).join(' and ')),
        data
      ).done(function(data) {
        if (data.errors) {
          handleInfo(data, 'info-error');
        } else {
          data = data.rows[0];
          data.toString = function () {
            return ObjectToTable(this);
          };
          handleInfo(data, 'info');
        }
      }).error(function(errors) {
        handleInfo(errors, 'info-error');
      });
    },

    setVisible: function (visible) {
      var self = this;
      Animation.prototype.setVisible.call(self, visible);
      self.layer.setMap(self.visible ? self.manager.map : null);
    },

    initUpdates: function(cb) { cb(); },

    draw: function () {},

    select: function (rowidx, type, replace) {
      var self = this;
      if (type == "selected" && self.selected) {
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
