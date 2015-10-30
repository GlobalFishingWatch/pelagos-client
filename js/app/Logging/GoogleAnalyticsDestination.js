define(["app/Class", "app/Logging/Destination"], function(Class, Destination) {
  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');


  var GoogleAnalyticsDestination = Class(Destination, {
    name: "GoogleAnalyticsDestination",

    initialize: function () {
      var self = this;
      Destination.prototype.initialize.apply(self, arguments);

      ga('create', self.trackingID, 'auto');
      ga('set', 'page', visualization.workspaceUrl);
      ga('send', 'pageview');
    },

    store: function(entry, cb) {
      var self = this;

      ga('send', {
        hitType: 'event',
        eventCategory: entry.category.split(".").slice(0, -1).join("."),
        eventAction: entry.category.split(".").slice(-1)[0],
        eventLabel: entry.data.toString()
      });

      cb(); // No way to get completion from loggly API
    }
  });
  Destination.destinationClasses.googleAnalytics = GoogleAnalyticsDestination;

  return GoogleAnalyticsDestination;
});
