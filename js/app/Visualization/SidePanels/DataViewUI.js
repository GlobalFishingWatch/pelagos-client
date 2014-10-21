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
    "dijit/form/MultiSelect",
    "dojox/layout/FloatingPane",
    "dijit/layout/ContentPane",
    "dijit/Menu",
    "dijit/MenuItem",
    "dijit/popup",
    "dojo/dom",
    "dojo/parser",
    "dojo/domReady!"
  ], function(Class, Logging, $, Fieldset, HorizontalSlider, MultiSelect, FloatingPane, ContentPane, Menu, MenuItem, popup){
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
        if (source.value != null) {
          sourcewidget.addChild(new HorizontalSlider({
            name: source.key,
            "class": "pull-right",
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
              $(sourcewidget.domNode).find('.value').html(value.toPrecision(3));
              spec.source[source.key] = value;
              self.dataview.changeCol(spec);
            }
          }));
        }
        $(sourcewidget.domNode).append("<span class='value' style='float: right;'>");
        var label = "";
        if (source.value === null) {
          label = "Automatic";
        } else {
          label = source.value.toPrecision(3);
        }
        $(sourcewidget.domNode).find('.value').html(label);
        colwidget.addChild(sourcewidget);
      },

      generateSelectionUI: function (ui, name, selection) {
        var self = this;

        if (selection.hidden) return;
        if (selection.sortcols.length != 1) return;
        var sourcename = selection.sortcols[0]
        var source = self.dataview.source.header.colsByName[sourcename];
        if (!source || !source.choices) return;

        var selectionwidget = new ContentPane({
          content: "<div>" + name + " from " + sourcename + "</div>",
          style: "padding-top: 0; padding-bottom: 0;"
        });

        var selectionselect = $("<select multiple='true'>");
        Object.items(source.choices).map(function (item) {
          var option = $("<option>");
          option.text(item.key);
          option.attr({value:item.value});
          if (selection.data[sourcename].indexOf(item.value) != -1) {
            option.attr({selected:'true'});
          }
          selectionselect.append(option);
        })
        selectionselect.change(function () {
          selection.clearRanges();
          var values = selectionselect.val();
          if (values) {
            values.map(function (value) {
              var data = {};
              data[sourcename] = value;
              selection.addDataRange(data, data);
            });
          } else {
            var startData = {};
            var endData = {};
            startData[sourcename] = -1.0/0.0;
            endData[sourcename] = 1.0/0.0;
            selection.addDataRange(startData, endData);
          }
        });

        $(selectionwidget.domNode).append(selectionselect);

        ui.addChild(selectionwidget);
      },
      
      generateUniformUI: function(ui, spec) {
        var self = this;

        var uniformwidget = new ContentPane({
          content: spec.name,
          style: "padding-top: 0; padding-bottom: 8px;"
        });
        uniformwidget.addChild(new HorizontalSlider({
          name: spec.name,
          "class": "pull-right",
          value: spec.value,
          minimum: spec.min,
          maximum: spec.max,
          intermediateChanges: true,
          style: "width:200px;",
          onChange: function (value) {
            Logging.main.log(
              "DataViewUI.set." + spec.name,
              {
                toString: function () {
                  return this.column + " = " + this.value;
                },
                column: spec.name,
                value: value,
              }
            );
            $(uniformwidget.domNode).find('.value').html(value.toPrecision(3));
            spec.value = value;
            self.dataview.changeUniform(spec);
          }
        }));
        $(uniformwidget.domNode).append("<span class='value' style='float: right;'>");
        var label = "";
        label = spec.value.toPrecision(3);
        $(uniformwidget.domNode).find('.value').html(label);

        ui.addChild(uniformwidget);
      },

      generateUI: function () {
        var self = this;

        var ui = new ContentPane({});

        Object.items(self.dataview.selections).map(function (item) {
          self.generateSelectionUI(ui, item.key, item.value);
        });

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
          Object.items(spec.source).map(function (source) {
            self.generateSourceUI(colwidget, spec, source);
          });
          ui.addChild(colwidget);
        });
        Object.items(self.dataview.header.uniforms).map(function (spec) {
          if (spec.hidden) return;
          self.generateUniformUI(ui, spec.value);
        });

        ui.startup();
        self.ui = ui;
      }
    });
  });
}
