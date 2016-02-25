define([
  "app/Class",
  "cartodb"
], function(
  Class,
  cartodb
) {
  return Class({
    name: "CartoDBInfoWindow",

    initialize: function(cartodbId, cartodbLayer) {
      this.id = cartodbId;
      this.layer = cartodbLayer;
    },

    _fieldStringifier: function(model) {
      return function(field) {
        var result = _.clone(field);
        // Check null or undefined :| and set both to empty == ''
        if (field.value == null || field.value == undefined) {
          result.value = '';
        }

        //Get the alternative title
        var actualTitle = model.getAlternativeName(field.title);

        if (field.title && actualTitle) {
          result.title = actualTitle;
        } else if (field.title) {
          // Remove '_' character from titles
          result.title = field.title.replace(/_/g,' ');
        }

        // Cast all values to string due to problems with Mustache 0 number rendering
        result.value = result.value.toString();

        return result;
      }
    },

    fetch: function(cb) {
      var self = this;

      var infoWindowData = self.layer.getInfowindowData(0);
      if (!infoWindowData) {
        return;
      }

      self.layer.fetchAttributes(0, self.id, infoWindowData.fields, function(attributes) {
        var model = new cdb.geo.ui.InfowindowModel(infoWindowData);
        model.updateContent(attributes);

        var fields = _.map(model.attributes.content.fields, self._fieldStringifier(model));

        var data = model.get('content') ? model.get('content').data : {};

        if (model.get('template_name')) {
          var template_name = _.clone(model.attributes.template_name);
        }

        var values = {};
        _.each(model.get('content').fields, function(pair) {
          values[pair.title] = pair.value;
        })

        var obj = _.extend({
          content: {
            fields: fields,
            data: data
          }
        }, values);

        var popupHtml = new cdb.core.Template({
          template: model.get('template'),
          type: model.get('template_type') || 'mustache'
        }).asFunction()(
         obj
        );

        var html = $(popupHtml).find('.cartodb-popup-content');

        cb(html, data);
      });
    }
  });
});

