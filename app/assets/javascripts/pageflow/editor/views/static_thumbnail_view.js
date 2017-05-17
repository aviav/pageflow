pageflow.StaticThumbnailView = Backbone.Marionette.ItemView.extend({
  template: 'templates/static_thumbnail',

  onRender: function() {
    this.update();
  },

  update: function() {
    this.$el.css('background-image', 'url(' + this._imageUrl() + ')');
  },

  _imageUrl: function() {
    return this.model.thumbnailFile().get('thumbnail_url');
  }
});
