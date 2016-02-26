define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_Container",
  "dijit/Dialog",
  "dijit/form/Select",
  "app/ObjectTemplate",
  "lodash",
  "jQuery"
], function (
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _Container,
  Dialog,
  Select,
  ObjectTemplate,
  _,
  $
) {
  var ReportDialogContents = declare("GenerateReportDialogControls", [_WidgetBase, _TemplatedMixin, _Container], {
    templateString: '' +
      '<div>' +
      '  <p data-dojo-attach-point="promptNode"></p>' +
      '  <div data-dojo-attach-point="configurationNode">' +
      '    <p data-dojo-attach-point="configurationTitleNode">You may configure some of these parameters below:</p>' +
      '    <div data-dojo-attach-point="configurationContainerNode"></div>' +
      '  </div>' +
      '</div>',

    constructor: function(report) {
      this.report = report;
    },

    startup: function() {
      var self = this;
      self.inherited(arguments);

      var promptTemplate = new ObjectTemplate(self.report.spec.promptTemplate);
      var urlTemplate = new ObjectTemplate(self.report.spec.urlTemplate);

      var keys = self._getPolygonFieldKeys();
      // Keys may be direct, which means that they are copied from the polygon
      // values as they are, or splittable, which means that the polygon value
      // is actually a multivalued field and should be splitted into multiple
      // possible values for the field
      var splittableKeys = keys[0];
      var directKeys = keys[1];
      var templateContext = self._getBaseTemplateContext(directKeys);

      // For splittable fields we need to take the possible options, create
      // select fields to pick between the options and default to the first
      // option
      var multivaluedTemplateContext = self._getMultivaluedTemplateContext(splittableKeys);
      _.each(multivaluedTemplateContext, function(values, key) {
        var options = _.map(values, function(value) {
          return "<option>" + value + "</option>";
        });

        var control = $("<select>" + options.join(" ") + "</select>");
        control.on("change", function() {
          alert("Changed");
        });

        $(self.configurationContainerNode).append(control);
      });

      // Default to the first value
      var takeFirst = function(values) {
        return values[0];
      };
      var defaultValues = _.mapValues(multivaluedTemplateContext, takeFirst);
      var actualContext = _.assign(templateContext, defaultValues);

      var prompt = promptTemplate.eval(actualContext);
      var url = urlTemplate.eval(actualContext);

      $(self.promptNode).html(prompt);

      if (_.isEmpty(multivaluedTemplateContext)) {
        $(self.configurationNode).hide();
      } else {
        $(self.configurationNode).show();
      }
    },

    _getPolygonFieldKeys: function() {
      var self = this;

      var splittable = function (key) {
        return !!self.report.spec.polygonFields[key].split;
      };

      return _(self.report.spec.polygonFields)
        .keys()
        .partition(splittable)
        .value();
    },

    _getBaseTemplateContext: function(additionalKeys) {
      var self = this;

      var time = self.report.state.getValue("time");
      var extent = self.report.state.getValue("timeExtent");
      var result = {
        beginTime: new Date(time.getTime() - extent),
        endTime: time
      };

      var additionalProperties = _.pick(self.report.data, additionalKeys);
      return _.assign(result, additionalProperties);
    },

    _getMultivaluedTemplateContext: function(splittableKeys) {
      var self = this;

      var trim = function(value) {
         return value.trim();
      };

      var split = function(result, value, key) {
        var splitChar = self.report.spec.polygonFields[key].split;

        var values = value.split(splitChar);
        result[key] =  _.map(values, trim);
      };

      return _(self.report.data)
        .pick(splittableKeys)
        .transform(split, {})
        .value();
    }
  });

  return declare("GenerateReportDialog", [Dialog], {
    style: "width: 50%",
    title: "Generate Report",
    actionBarTemplate: '' +
      '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
      '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-event="click: handleAccept">Ok</button>' +
      '  <button data-dojo-type="dijit/form/Button" type="button" data-dojo-attach-event="click: handleCancel">Cancel</button>' +
      '</div>',

    constructor: function(report) {
      this.report = report;
    },

    startup: function() {
      var self = this;
      self.inherited(arguments);

      self.addChild(new ReportDialogContents(self.report));
    },

    handleAccept: function() {
      alert("Accepted");
      this.hide();
    },

    handleCancel: function() {
      alert("Canceled");
      this.hide();
    }
  });
});
