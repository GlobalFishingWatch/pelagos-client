define([
  "app/Class",
  "app/Logging",
  "jQuery",
  "app/CountryCodes",
  "dijit/layout/ContentPane",
  "dijit/form/HorizontalSlider",
  "dojo/dom",
  "dojo/parser",
  "dojo/domReady!"
], function(
  Class,
  Logging,
  $,
  CountryCodes,
  ContentPane,
  HorizontalSlider
){
  return Class({
    name: "SimpleLayerList",
    initialize: function (sidePanels) {
      var self = this;

      self.sidePanels = sidePanels;
      self.sidebarContainer = self.sidePanels.sidebarContainer;
      self.visualization = self.sidePanels.visualization;

      self.ui = new ContentPane({title: 'Layers', content:"" +
          "<a class='edit-layers' style='font-weight: bold; position: absolute; right: 0.5em; margin-top: -1.5em; z-index: 1000000;'><i class='fa fa-pencil-square-o'></i></a>" +
          "<div id='layers'>" +
          "  <form class='layer-list'></form>" +
          "</div>"});
      $(self.ui.containerNode).find(".edit-layers").click(function () {
        self.visualization.ui.simpleAnimationEditor.display();
      });
      self.sidePanels.sidebarContainer.addChild(self.ui);
      self.node = $(self.ui.containerNode);

      self.visualization.animations.events.on({
        'add': self.addHandler.bind(self),
        'remove': self.removeHandler.bind(self)
      });

      self.idCounter = 0;

      self.sidebarContainer.selectChild(self.ui, false);
    },

    addHandler: function (event) {
      var self = this;
      var animation = event.animation

      var node = $('' +
        '<div class="layer-row">' +
        '  <label class="switch">' +
        '    <input class="cmn-toggle" type="checkbox">' +
        '    <div class="switch-line"></div>' +
        '  </label>' +
        '  <div class="layer-label"></div>' +
        '</div>');

      node.find(".cmn-toggle").attr({id:"cmn-toggle-" + self.idCounter});
      node.find("label").attr({"for":"cmn-toggle-" + self.idCounter});
      self.idCounter++;

      node.find("input").change(function (event) {
        animation.setVisible(event.target.checked);
      });

      animation.basicSidebarNode = node;
      self.node.find(".layer-list").append(node);

      if (animation.constructor.prototype.name == "ClusterAnimation") {
        var val2slider = function(val) { return Math.log(1 + val)/Math.log(4); };
        var slider2val = function(val) { return Math.pow(4, val) - 1; };

        var maxv = val2slider(animation.data_view.header.colsByName.weight.max);
        var minv = val2slider(animation.data_view.header.colsByName.weight.min);
        var curv = val2slider(animation.data_view.header.colsByName.weight.source.weight);

        var update = undefined;
        var refreshSwatch = function () {
          if (update != undefined) return;
          update = setTimeout(function () {
            var value = slider.value;

            animation.data_view.header.colsByName.weight.source.weight = slider2val(value);
            animation.data_view.changeCol(animation.data_view.header.colsByName.weight);
            update = undefined;
          }, 100);
        }

        var slider = new HorizontalSlider({
          value:curv,
          minimum: minv,
          maximum: maxv,
          discreteValues: 100,
          onChange: refreshSwatch,
          intermediateChanges: true
        }, "mySlider");

        var intensityNode = $('<div class="intensity-slider-box"><div class="intensity-label">Intensity:</div></div>')
        node.find(".layer-label").append(intensityNode);
        slider.placeAt(intensityNode[0]);
        slider.startup();

        node.find("input").change(function (event) {
          intensityNode.toggle(event.target.checked);
        });
      }

      animation.events.on({updated: self.updatedHandler.bind(self, animation, node)});
      self.updatedHandler(animation, node);
    },

    updatedHandler: function (animation, node, e) {
      if (!animation.title) animation.title = animation.toString();
      node.find(".layer-label").html(animation.title);

      if (!animation.color) animation.color = 'orange';
      node.find(".switch-line").css({'border-color': animation.color});

      if (animation.visible) {
        node.find("input").attr('checked','checked');
      } else {
        node.find("input").removeAttr('checked');
      }
    },

    removeHandler: function (event) {
      event.animation.basicSidebarNode.remove();
    }
  });
});
