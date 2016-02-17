define([
  "dojo/_base/declare",
  "app/Visualization/UI/AnimationEditors/Animation",
], function(
  declare,
  Animation
){
  var AnimationEditorManager = declare("AnimationEditorManager", [], {});

  AnimationEditorManager.getEditorClassForClass = function (animationClass) {
    // FIXME: Replace with real MRO maybe

    while (true) {
      var res = Animation.registry[animationClass.name];
      if (res) return res;
      if (animationClass.bases.length == 0) return undefined;
      animationClass = animationClass.bases[0];
    }
  },

  AnimationEditorManager.getEditorClass = function (animation) {
    return AnimationEditorManager.getEditorClassForClass(animation.constructor);
  }

  AnimationEditorManager.getEditor: function (args) {
    return new (AnimationEditorManager.getEditorClass(args.animation))(args);
  }

  return AnimationEditorManager;
});
