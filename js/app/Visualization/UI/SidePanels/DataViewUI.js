define([
  "dojo/_base/declare",
  "app/Visualization/UI/TemplatedContainer",
  "app/Logging",
  "shims/jQuery/main",
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
], function(
  declare,
  TemplatedContainer,
  Logging,
  $,
  Fieldset,
  HorizontalSlider,
  MultiSelect,
  FloatingPane,
  ContentPane,
  Menu,
  MenuItem,
  popup
){

  var DataViewUI = declare("DataViewUI", [TemplatedContainer], {
    baseClass: 'DataViewUI',
    visualization: null,
    dataview: null,
    startup: function () {
      var self = this;
      self.inherited(arguments);

      self.selections = new self.constructor.SelectionsUI({
        visualization: self.visualization,
        dataview: self.dataview
      });
      self.addChild(self.selections);

      self.cols = new self.constructor.ColsUI({
        visualization: self.visualization,
        dataview: self.dataview
      });
      self.addChild(self.cols);

      self.uniforms = new self.constructor.UniformsUI({
        visualization: self.visualization,
        dataview: self.dataview
      });
      self.addChild(self.uniforms);
    }
  });

  DataViewUI.SelectionsUI = declare("SelectionsUI", [TemplatedContainer], {
    baseClass: 'DataViewUI-SelectionsUI',
    visualization: null,
    dataview: null,
    startup: function () {
      var self = this;
      self.inherited(arguments);

      Object.items(self.dataview.selections.selections).map(function (item) {
        self.addChild(new self.constructor.SelectionUI({
          visualization: self.visualization,
          dataview: self.dataview,
          name: item.key,
          selection: item.value
        }));
      });
    }
  });

  DataViewUI.SelectionsUI.SelectionUI = declare("SelectionUI", [TemplatedContainer], {
    templateString: '' +
      '<div class="${baseClass}">' +
      '  <div>${name} from ${selection.sortcols.0}</div>' +
      '  <select multiple="true" data-dojo-attach-point="selectNode" data-dojo-attach-event="change:change"></select>' +
      '</div>',
    baseClass: 'DataViewUI-SelectionsUI-SelectionUI',
    visualization: null,
    dataview: null,
    name: 'unknown',
    selection: null,
    startup: function () {
      var self = this;
      self.inherited(arguments);

      var sourcename = self.selection.sortcols[0];
      var source = self.dataview.source.header.colsByName[sourcename];

      if (   self.selection.hidden
          || self.selection.sortcols.length != 1
          || !source
             || !source.choices) {
        $(self.domNode).hide();
        return;
      }

      var selectionselect = $(self.selectNode);
      var choices = Object.keys(source.choices);
      choices.sort();
      choices.map(function (key) {
        var value = source.choices[key];
        var option = $("<option>");
        option.text(key);
        option.attr({value:value});
        if (self.selection.data[sourcename].indexOf(value) != -1) {
          option.attr({selected:'true'});
        }
        selectionselect.append(option);
      })
    },

    change: function () {
      var self = this;
      var selectionselect = $(self.selectNode);
      var sourcename = self.selection.sortcols[0];

      self.selection.clearRanges();
      var values = selectionselect.val();
      if (values) {
        values.map(function (value) {
          var data = {};
          data[sourcename] = parseFloat(value);
          self.selection.addDataRange(data, data);
        });
      } else {
        var startData = {};
        var endData = {};
        startData[sourcename] = -1.0/0.0;
        endData[sourcename] = 1.0/0.0;
        self.selection.addDataRange(startData, endData);
      }
    }
  });

  DataViewUI.ColsUI = declare("ColsUI", [TemplatedContainer], {
    baseClass: 'DataViewUI-ColsUI',
    visualization: null,
    dataview: null,
    startup: function () {
      var self = this;
      self.inherited(arguments);

      Object.values(self.dataview.header.colsByName).map(function (spec) {
        if (spec.hidden) return;

        self.addChild(new self.constructor.ColUI({
          visualization: self.visualization,
          dataview: self.dataview,
          spec: spec
        }));
      });
    }
  });

  DataViewUI.ColsUI.ColUI = declare("ColUI", [TemplatedContainer], {
    templateString: '' +
      '<div class="${baseClass}">' +
      '  ${spec.name}' +
      '  <a href="javascript:void(0);" class="add" data-dojo-attach-event="click:add" data-dojo-attach-point="addNode">' +
          '<i class="fa fa-plus-square"></i>' +
        '</a>' +
      '  <div class="${baseClass}Container" data-dojo-attach-point="containerNode"></div>' +
      '</div>',
    baseClass: 'DataViewUI-ColsUI-ColUI',
    visualization: null,
    dataview: null,
    spec: null,

    startup: function () {
      var self = this;
      self.inherited(arguments);

      Object.items(self.spec.source).map(function (source) {
        self.addChild(new self.constructor.SourceUI({
          visualization: self.visualization,
          dataview: self.dataview,
          spec: self.spec,
          source: source
        }));
      });
    },

    add: function () {
      var self = this;

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
              self.spec.source[colname] = 0.0;

              self.addChild(new self.constructor.SourceUI({
                visualization: self.visualization,
                dataview: self.dataview,
                spec: self.spec,
                source: {key:colname, value: 0.0}
              }));
            }
          }));
        });
        sourceselect.addChild(new MenuItem({
          label: "[Constant value]",
          onClick: function(evt) {
            self.spec.source._ = 0.0;
            self.addChild(new self.constructor.SourceUI({
              visualization: self.visualization,
              dataview: self.dataview,
              spec: self.spec,
              source: {key:"_", value: 0.0}
            }));
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
          around: self.addNode
        });
      });
    }
  });

  DataViewUI.ColsUI.ColUI.SourceUI = declare("SourceUI", [TemplatedContainer], {
    templateString: '' +
      '<div class="${baseClass}">' +
      '  <a href="javascript:void(0);" class="remove" data-dojo-attach-event="click:remove">' +
          '<i class="fa fa-minus-square"></i>' +
      '   <span data-dojo-attach-point="labelNode"></span>' +
      '  </a>' +
      '  <div class="${baseClass}Container" data-dojo-attach-point="containerNode"></div>' +
      '</div>',
    baseClass: 'DataViewUI-ColsUI-ColUI-SourceUI',
    visualization: null,
    dataview: null,
    spec: null,
    source: null,
    startup: function () {
      var self = this;
      self.inherited(arguments);

      var sourcespec = self.dataview.header.colsByName[self.source.key];
      var min = -1.0;
      var max = 1.0;
      if (self.spec.min != undefined && self.spec.max != undefined) {
        if (sourcespec != undefined && sourcespec.min != undefined && sourcespec.max != undefined) {
          max = self.spec.max / sourcespec.max;
          min = -self.spec.max / sourcespec.max;
        } else {
          min = -self.spec.max;
          max = self.spec.max;
        }
      }
      var label = "[Constant value]";
      if (self.source.key != "_") label = self.source.key;
      self.labelNode.innerHTML = label;

      Logging.main.log(
        "DataViewUI.source." + self.spec.name + "." + self.source.key,
        {
          toString: function () {
            return this.column + " [" + this.min + ", " + this.max + "] = " + this.value + " * " + this.source;
          },
          column: self.spec.name,
          min: min,
          max: max,
          value: self.source.value,
          source: self.source.key
        }
      );
      if (self.source.value != null) {
        if (self.source.value < min) {
          min = self.source.value;
        }
        if (self.source.value > max) {
          max = self.source.value;
        }
        var valuewidget = $("<input type='text' class='value'>");
        var sliderwidget = new HorizontalSlider({
          name: self.source.key,
          "class": "pull-right",
          value: self.source.value,
          minimum: min,
          maximum: max,
          intermediateChanges: true,
          style: "width:200px;",
          onChange: function (value) {
            Logging.main.log(
              "DataViewUI.set." + self.spec.name + "." + self.source.key,
              {
                toString: function () {
                  return this.column + " = " + this.value + " * " + this.source;
                },
                column: self.spec.name,
                value: value,
                source: self.source.key
              }
            );
            valuewidget.val(value.toPrecision(3));
            self.spec.source[self.source.key] = value;
            self.dataview.changeCol(self.spec);
          }
        });
        self.addChild(sliderwidget);
        $(self.containerNode).append(valuewidget);
        valuewidget.change(function () {
          var value = parseFloat(valuewidget.val());
          if (value < sliderwidget.get("minimum")) {
            sliderwidget.set("minimum", value);
          }
          if (value > sliderwidget.get("maximum")) {
            sliderwidget.set("maximum", value);
          }
          sliderwidget.set("value", value);
        });
        valuewidget.val(self.source.value.toPrecision(3));
      } else {
        $(self.containerNode).append($("<span class='value null-value'>Automatic</span>"));
      }
    },

    remove: function () {
      var self = this;
      delete self.spec.source[self.source.key];
      self.destroy();
    }
  });

  DataViewUI.UniformsUI = declare("UniformsUI", [TemplatedContainer], {
    baseClass: 'DataViewUI-UniformsUI',
    visualization: null,
    dataview: null,
    startup: function () {
      var self = this;
      self.inherited(arguments);

      Object.values(self.dataview.header.uniforms).map(function (spec) {
        if (spec.hidden) return;

        self.addChild(new self.constructor.UniformUI({
          visualization: self.visualization,
          dataview: self.dataview,
          spec: spec
        }));
      });
    }
  });

  DataViewUI.UniformsUI.UniformUI = declare("UniformUI", [TemplatedContainer], {
   templateString: '' +
     '<div class="${baseClass}">' +
     '  ${spec.name}' +
     '  <span class="${baseClass}Container" data-dojo-attach-point="containerNode"></span>' +
     '  <input type="text" class="value">' +
     '</div>',
   baseClass: 'DataViewUI-UniformsUI-UniformUI',
   visualization: null,
   dataview: null,
   spec: null,
   startup: function () {
     var self = this;
     self.inherited(arguments);

     self.addChild(new HorizontalSlider({
       name: self.spec.name,
       "class": "pull-right",
       value: self.spec.value,
       minimum: self.spec.min,
       maximum: self.spec.max,
       intermediateChanges: true,
       style: "width:200px;",
       onChange: function (value) {
         Logging.main.log(
           "DataViewUI.set." + self.spec.name,
           {
             toString: function () {
               return this.column + " = " + this.value;
             },
             column: self.spec.name,
             value: value
           }
         );
         $(self.domNode).find('.value').val(value.toPrecision(3));
         self.spec.value = value;
         self.dataview.changeUniform(self.spec);
       }
     }));
     $(self.domNode).find('.value').val(self.spec.value.toPrecision(3));
   }
  });

  return DataViewUI;
});
