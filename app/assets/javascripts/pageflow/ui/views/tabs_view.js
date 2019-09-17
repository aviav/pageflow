/**
 * Switch between different views using tabs.
 *
 * @param {string} [options.defaultTab]
 *   Name of the tab to enable by default.
 *
 * @param {string[]} [options.translationKeyPrefixes]
 *   List of prefixes to append tab name to. First exisiting translation is used as label.
 *
 * @param {string} [options.fallbackTranslationKeyPrefix]
 *   Translation key prefix to use if non of the `translationKeyPrefixes` result in an
 *   existing translation for a tab name.
 *
 * @param {string} [options.i18n]
 *   Legacy alias for `fallbackTranslationKeyPrefix`.
 *
 * @class
 * @memberof module:pageflow/ui
 */
pageflow.TabsView = Backbone.Marionette.Layout.extend({
  template: 'pageflow/ui/templates/tabs_view',
  className: 'tabs_view',

  ui: {
    headers: '> ul',
  },

  regions: {
    container: '> div'
  },

  events: {
    'click > ul > li': function(event) {
      this.changeTab($(event.target).data('tab-name'));
    }
  },

  initialize: function() {
    this.tabFactoryFns = {};
    this.tabNames = [];
    this.currentTabName = null;
  },

  tab: function(name, factoryFn) {
    this.tabFactoryFns[name] = factoryFn;
    this.tabNames.push(name);
  },

  onRender: function() {
    _.each(this.tabNames, function(name) {
      var label = pageflow.i18nUtils.findTranslation(this._labelTranslationKeys(name));

      this.ui.headers.append(
        $('<li />')
          .attr('data-tab-name', name)
          .text(label)
      );
    }, this);

    this.changeTab(this.defaultTab());
  },

  changeTab: function(name) {
    this.container.show(this.tabFactoryFns[name]());
    this._updateActiveHeader(name);
    this.currentTabName = name;
  },

  defaultTab: function() {
    if (_.include(this.tabNames, this.options.defaultTab)) {
      return this.options.defaultTab;
    }
    else {
      return _.first(this.tabNames);
    }
  },

  refresh: function() {
    this.changeTab(this.currentTabName);
  },

  toggleSpinnerOnTab: function(name, visible) {
    this.$('[data-tab-name=' + name + ']').toggleClass('spinner', visible);
  },

  _labelTranslationKeys: function(name) {
    var result =_.map(this.options.translationKeyPrefixes, function(prefix) {
      return prefix + '.' + name;
    });

    if (this.options.i18n) {
      result.push(this.options.i18n + '.' + name);
    }

    if (this.options.fallbackTranslationKeyPrefix) {
      result.push(this.options.fallbackTranslationKeyPrefix + '.' + name);
    }

    return result;
  },

  _updateActiveHeader: function(activeTabName) {
    this.ui.headers.children().each(function() {
      $(this).toggleClass('active', $(this).data('tab-name') === activeTabName);
    });
  }
});
