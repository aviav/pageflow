/**
 * Base thumbnail view for models supporting a `thumbnailFile` method.
 */
pageflow.ModelThumbnailView = Backbone.Marionette.View.extend({
  className: 'model_thumbnail',

  modelEvents: {
    'change:configuration': 'update'
  },

  render: function() {
    this.update();
    return this;
  },

  update: function() {
    var file = this.model && this.model.thumbnailFile();

    if (this.thumbnailView && this.currentFileThumbnail == file) {
      return;
    }

    this.currentFileThumbnail = file;

    if (this.thumbnailView) {
      this.thumbnailView.close();
    }

    this.thumbnailView = this.subview(
      this.options.thumbnailView ? new this.options.thumbnailView : new pageflow.FileThumbnailView({
        model: file,
        className: 'thumbnail file_thumbnail',
        imageUrlPropertyName: this.options.imageUrlPropertyName
      })
    );

    this.$el.append(this.thumbnailView.el);
  }
});
