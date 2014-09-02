if (!app.useDojo) {
  define(["app/Class"], function (Class) {
    return Class({name: "DataViewUI"});
  });
} else {
  define([
    "app/Class",
    "app/Logging",
    "jQuery",
    "dijit/Fieldset",
    "dijit/form/HorizontalSlider",
    "dojox/layout/FloatingPane",
    "dijit/layout/ContentPane",
    "dijit/Menu",
    "dijit/MenuItem",
    "dijit/popup",
    "dojo/dom",
    "dojo/parser",
    "dojo/domReady!"
  ], function(Class, Logging, $, Fieldset, HorizontalSlider, FloatingPane, ContentPane, Menu, MenuItem, popup){
    return Class({
      name: "DataViewUI",
      initialize: function (dataview) {
        var self = this;

        self.dataview = dataview;

        self.generateUI();
      },

      generateSourceUI: function (colwidget, spec, source) {
        var self = this;

        var sourcespec = self.dataview.header.colsByName[source.key];
        var min = -1.0;
        var max = 1.0;
        if (spec.min != undefined && spec.max != undefined) {
          if (sourcespec != undefined && sourcespec.min != undefined && sourcespec.max != undefined) {
            max = spec.max / sourcespec.max;
            min = -spec.max / sourcespec.max;
          } else {
            min = -spec.max;
            max = spec.max;
          }
        }
        var label = "[Constant value]";
        if (source.key != "_") label = source.key;

        var sourcewidget = new ContentPane({
          content: "<a href='javascript:void(0);' class='remove' style='float:left;'><i class='fa fa-minus-square'></i> " + label + "</a>",
          style: "padding-top: 0; padding-bottom: 8px;"
        });
        $(sourcewidget.domNode).find("a.remove").click(function () {
          delete spec.source[source.key];
          sourcewidget.destroy();
        })
        Logging.main.log(
          "DataViewUI.source." + spec.name + "." + source.key,
          {
            toString: function () {
              return this.column + " [" + this.min + ", " + this.max + "] = " + this.value + " * " + this.source;
            },
            column: spec.name,
            min: min,
            max: max,
            value: source.value,
            source: source.key
          }
        );
        sourcewidget.addChild(new HorizontalSlider({
          name: source.key,
          value: source.value,
          minimum: min,
          maximum: max,
          intermediateChanges: true,
          style: "width:200px;",
          onChange: function (value) {
            Logging.main.log(
              "DataViewUI.set." + spec.name + "." + source.key,
              {
                toString: function () {
                  return this.column + " = " + this.value + " * " + this.source;
                },
                column: spec.name,
                value: value,
                source: source.key
              }
            );                    
            spec.source[source.key] = value;
            self.dataview.changeCol(spec);
          }
        }));
        colwidget.addChild(sourcewidget);
      },

      generateUI: function () {
        var self = this;

        var ui = new ContentPane({});

        Object.values(self.dataview.header.colsByName).map(function (spec) {
          if (spec.hidden) return;

          var colwidget = new ContentPane({
            content: spec.name + " <a href='javascript:void(0);' class='add'><i class='fa fa-plus-square'></i></a>",
            style: "padding-top: 0; padding-bottom: 0;"
          });
          $(colwidget.domNode).find("a.add").click(function () {
            self.dataview.getAvailableColumns(function (err, availableColumns) {
              var sourceselect = new Menu({
                onMouseLeave: function () {
                  popup.close(sourceselect);
                }
              });
              availableColumns.map(function (colname) {
                sourceselect.addChild(new MenuItem({
                  label: colname,
                  onClick: function(evt) {
                    spec.source[colname] = 0.0;
                    self.generateSourceUI(colwidget, spec, {key:colname, value: 0.0});
                  }
                }));
              });
              sourceselect.addChild(new MenuItem({
                label: "[Constant value]",
                onClick: function(evt) {
                  spec.source._ = 0.0;
                  self.generateSourceUI(colwidget, spec, {key:"_", value: 0.0});
                }
              }));
              popup.open({
                popup: sourceselect,
                onExecute : function() { 
                  popup.close(sourceselect);
                }, 
                onCancel : function() { 
                  popup.close(sourceselect);
                }, 
                around: $(colwidget.domNode).find("a.add")[0]
              });
            });
          });
          Object.items(spec.source).map(function (source) { self.generateSourceUI(colwidget, spec, source); });
          ui.addChild(colwidget);


        });

        self.ui = ui;
      }
    });
  });
}
