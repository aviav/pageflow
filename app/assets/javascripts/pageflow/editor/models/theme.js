pageflow.Theme = Backbone.Model.extend({
  title: function() {
    return I18n.t('pageflow.' + this.get('name') + '_theme.name');
  },

  thumbnailFile: function() {
    return {
      thumbnail_url: this.previewImageUrl
    };
  }
});
