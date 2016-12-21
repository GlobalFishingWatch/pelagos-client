define([
  "dojo/_base/declare",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/_Container",
  "dijit/Dialog",
  "dijit/form/Select",
  "app/Visualization/UI/SimpleMessageDialog",
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
  SimpleMessageDialog,
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
      var self = this;

      self.report = report;
      self.promptTemplate = new ObjectTemplate("Generate report on the %(title)s %(value)s form %(from)s to %(to)s?");

      var time = self.report.state.getValue('time');
      var extent = self.report.state.getValue('timeExtent');
      self.configuration = {
        from: new Date(time.getTime() - extent),
        to: time,
        title: self.report.animation,
      };
    },

    startup: function() {
      var self = this;

      self.inherited(arguments);

      // For now, we only support single region reports
      var region = _(self.report.spec.regions).keys().first();
      var settings = self.report.spec.regions[region];
      var values = self.report.data[settings.cartodbColumn];
      self.configuration.region = region;
      self.configuration.value = values[0];

      if (values.length > 1) {
        var options = _.map(values, function(value) {
          return "<option>" + value + "</option>";
        });
        var label =
          '<label for="value">' +
          self.configuration.title +
          ':&nbsp;</label>';
        var select =
          '<select name="value">' + options.join('') + '</select>';
        var control = $(label + select);

        control.on('change', function () {
          self.configuration.value = $(this).val();
          self._refreshPromptTemplate();
        });

        $(self.configurationContainerNode).append(control);
        $(self.configurationTitleNode).show();
        $(self.configurationContainerNode).show();
      } else {
        $(self.configurationTitleNode).hide();
        $(self.configurationContainerNode).hide();
      }

      self._refreshPromptTemplate();
    },

    getReportData: function() {
      var self = this;

      var result = {
        from: self.configuration.from.toISOString(),
        to: self.configuration.to.toISOString(),
        regions: [{
          name: self.configuration.region,
          value: self.configuration.value,
        }],
        filters: self._getFilteredSelections(),
      };

      return result;
    },

    _getFilteredSelections: function() {
      var self = this;

      var tilesetHeader = self.report.reportableAnimation.data_view.source.header;
      var selections = self.report.reportableAnimation.data_view.selections.filteredSelections();

      var values = _.map(selections, function(selectionName) {
        var selection = self.report.reportableAnimation.data_view.selections.selections[selectionName];
        var column = selection.sortcols[0];
        var valueToNameMap = _.invert(tilesetHeader.colsByName[column].choices);
        var values = _(selection.data[column])
          .filter(function(item) {
            return _.isFinite(item);
          })
          .uniq()
          .map(function(value) {
            return valueToNameMap[value];
          })
          .value();

        var normalizedSelectionName = selectionName.replace(/\s/g, '');
        normalizedSelectionName = normalizedSelectionName
          .charAt(0).toLowerCase() + normalizedSelectionName.substring(1);

        return [normalizedSelectionName, values];
      });

      var result = _(values)
        .filter(function(item) {
          return item[1].length > 0;
        })
        .reduce(function(acc, item) {
          acc[item[0]] = item[1];
          return acc;
        }, {});

      return result;
    },

    _refreshPromptTemplate: function() {
      var self = this;

      var prompt = self.promptTemplate.eval(self.configuration);
      $(self.promptNode).html(prompt);
    },
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
      var self = this;

      var url = self.getReportUrl();
      var contentTypeHeaders = { "Content-Type": "application/json;charset=UTF-8" };
      var additionalHeaders = self.report.datamanager.headers;
      var headers = _.extend(contentTypeHeaders, additionalHeaders);
      var body = JSON.stringify(self.reportDialog.getReportData());
      Ajax.post(url, headers, body, function(err, result) {
        SimpleMessageDialog.show("Report generation", result.message);
      });
      self.hide();
    },

    handleCancel: function() {
      this.hide();
    },

    getReportUrl: function() {
      var self = this;

      return "" + self.report.reportableAnimation.args.source.args.url + "/reports";
    }
  });
});
