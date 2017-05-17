pageflow.ThemeInputView = pageflow.ReferenceInputView.extend({
  choose: function() {
    return pageflow.editor.changeTheme({
      model: this.model,
      themes: this.options.themes
    });
  },

  chooseValue: function() {
    return this.choose().then(function(model) {
      return model.get('name');
    });
  },

  getTarget: function(themeName) {
    return this.options.themes.findByName(themeName);
  },

  thumbnailViewOptions: function(target) {
    return {
      model: target,
      thumbnailView: pageflow.StaticThumbnailView
    };
  }
});
