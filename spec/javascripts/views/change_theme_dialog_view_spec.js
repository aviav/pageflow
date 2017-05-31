describe('ChangeThemeDialogView', function() {
  it('shows preview on item hover', function() {
    var view = new pageflow.ChangeThemeDialogView({

    });

    view.render();
    var themeItem = support.dom.ThemeItemView.findFirstIn(view);
  });

  it('shows preview on item click', function() {

  });
});
