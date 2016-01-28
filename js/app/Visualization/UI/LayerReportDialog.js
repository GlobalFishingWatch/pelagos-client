define([
  "app/Logging",
  "app/Visualization/UI/MessageDialog",
  "dijit/Dialog",
  "jQuery"
], function(
  Logging,
  MessageDialog,
  Dialog,
  $
) {
  return {
    show: function(visualizationState, layerName, layerData) {
      var endTime = visualizationState.values.time;
      var offset = visualizationState.values.timeExtent;
      var startTime = new Date(endTime.getTime() + offset);

      var message =
        "Do you want to generate a vessel activity report for " +
        layerName + " " + layerData.boundary +
        " from " + startTime + " to " + endTime;

      var dialog = new Dialog({
        style: "width: 50%",
        title: "Generate " + layerName + " report",
        content: message,
        actionBarTemplate: '' +
          '<div class="dijitDialogPaneActionBar" data-dojo-attach-point="actionBarNode">' +
          '  <button data-dojo-type="dijit/form/Button" type="submit" data-dojo-attach-point="closeButton">Cancel</button>' +
          '  <button data-dojo-type="dijit/form/Button" type="button" data-dojo-attach-point="acceptButton">Accept</button>' +
          '</div>'
      });

      $(dialog.closeButton).on("click", function() {
        dialog.hide();
      });

      $(dialog.acceptButton).on("click", function() {
        dialog.hide();

        Logging.main.log(
          "Visualization.UI.LayerReportDialog.report",
          {
            data: layerData,
            toString: function() {
              return this.data.boundary;
            }
          }
        );

        // TODO: Complete this once the server endpoint is done, eez should be
        // replaced by the actual column name.
        var url = layerData.reportBaseUrl + "/sub/eez=" + eez + "/report";
        $.post(url, layerData, function()  {

          MessageDialog.show(
            "Report is being processed",
            "The report is being generated. You will receive it by email once it's ready.");

        });
      });

      dialog.show();
    }
  }
});
