define([
  "dojo/_base/declare",
  "./FilterEditorText",
  "./FilterEditorFlags",
  "./FilterEditorFlagSelector"
], function(
  declare,
  FilterEditorText,
  FilterEditorFlags,
  FilterEditorFlagSelector
){
  var FilterEditor = declare("FilterEditor", null, {});

  FilterEditor.getEditorClass = function (data_view, source_name) {
    var source = data_view.source.header.colsByName[source_name];

    var cls = FilterEditorText;
    if (source.choices_type == 'ISO 3166-1 alpha-2') {
      cls = FilterEditorFlags;
    }
    return cls;
  };

  return FilterEditor;
});
