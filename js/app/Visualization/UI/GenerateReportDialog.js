define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_Container",
  "dijit/Dialog",
  "dijit/form/Select",
  "app/ObjectTemplate",
  "app/Data/Ajax",
  "shims/lodash/main",
  "shims/jQuery/main"
], function (
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _Container,
  Dialog,
  Select,
  ObjectTemplate,
  Ajax,
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
      this.templates = {
        prompt: new ObjectTemplate(this.report.spec.promptTemplate),
        url: new ObjectTemplate(this.report.spec.urlTemplate),
        context: {}
      };
    },

    startup: function() {
      var self = this;
      self.inherited(arguments);


      // Keys may be direct, which means that they are copied from the polygon
      // values as they are, or splittable, which means that the polygon value
      // is actually a multivalued field and should be splitted into multiple
      // possible values for the field. Keys that are in the report polygonKeys
      // object are all multivalued fields.
      var splittableKeys = self._getPolygonFieldKeys();
      var baseContext = self._getBaseTemplateContext();

      // Multivalued fields default to the first value
      var multivaluedTemplateContext = self._getMultivaluedTemplateContext(splittableKeys);
      var takeFirst = function(values) {
        return values[0];
      };
      var defaultValues = _.mapValues(multivaluedTemplateContext, takeFirst);
      self.templates.context = _.assign(baseContext, defaultValues);

      // Multivalued fields allow selection of a single value through select
      // fields
      _.each(multivaluedTemplateContext, function(values, key) {
        var options = _.map(values, function(value) {
          return "<option>" + value + "</option>";
        });

        var label =
          '<label for="' + key + '">' +
            self.report.spec.polygonFields[key].label +
          ':&nbsp;</label>'

        var select =
          '<select name="' + key + '">' + options.join(" ") + '</select>';

        var control = $(label + select);

        control.on("change", function() {
          self.templates.context[key] = $(this).val();

          var prompt = self.templates.prompt.eval(self.templates.context);
          $(self.promptNode).html(prompt);
        });

        $(self.configurationContainerNode).append(control);
      });

      var prompt = self.templates.prompt.eval(self.templates.context);
      $(self.promptNode).html(prompt);

      if (_.isEmpty(multivaluedTemplateContext)) {
        $(self.configurationNode).hide();
      } else {
        $(self.configurationNode).show();
      }
    },

    getReportUrl: function() {
      var self = this;

      // We have to translate datetimes from the template context into postable
      // timestamps, and uri-encode the rest of the properties
      var urlize = function(result, value, key) {
        if (key == "beginTime" || key == "endTime") {
          result[key] = value.getTime();
        } else {
          result[key] = encodeURIComponent(value);
        }
      };

      var urlContext =
        _(self.templates.context)
        .transform(urlize, {})
        .value();

      var animation = self.report.animations.getReportableAnimation();
      return "" +
        animation.args.source.args.url +
        self.templates.url.eval(urlContext);
    },

    _getPolygonFieldKeys: function() {
      var self = this;

      return _(self.report.spec.polygonFields)
        .keys();
    },

    _getBaseTemplateContext: function() {
      var self = this;

      var time = self.report.state.getValue("time");
      var extent = self.report.state.getValue("timeExtent");
      var result = {
        beginTime: new Date(time.getTime() - extent),
        endTime: time
      };

      return _.assign(result, self.report.data);
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
      this.reportDialog = new ReportDialogContents(this.report);
    },

    startup: function() {
      var self = this;
      self.inherited(arguments);

      self.addChild(self.reportDialog);
    },

    handleAccept: function() {
      var url = this.reportDialog.getReportUrl();
      Ajax.post(url, {}, function(err, result) {
        console.log("Got response", err, result);
      });
      this.hide();
    },

    handleCancel: function() {
      this.hide();
    }
  });
});
