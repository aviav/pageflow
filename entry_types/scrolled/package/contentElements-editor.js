import { editor as editor$1 } from 'pageflow-scrolled/editor';
import { TextInputView, TextAreaInputView, SelectInputView, UrlInputView, CheckBoxInputView, cssModulesUtils, ConfigurationEditorView } from 'pageflow/ui';
import { FileInputView, ListView, transientReferences } from 'pageflow/editor';
import Marionette from 'backbone.marionette';
import _ from 'underscore';
import Backbone from 'backbone';
import I18n$1 from 'i18n-js';

editor$1.contentElementTypes.register('heading', {
  configurationEditor: function configurationEditor() {
    this.tab('general', function () {
      this.input('children', TextInputView);
    });
  }
});

editor$1.contentElementTypes.register('textBlock', {
  configurationEditor: function configurationEditor() {
    this.tab('general', function () {
      this.input('children', TextAreaInputView);
    });
  }
});

editor$1.contentElementTypes.register('inlineImage', {
  configurationEditor: function configurationEditor() {
    this.tab('general', function () {
      this.input('id', FileInputView, {
        collection: 'image_files',
        fileSelectionHandler: 'contentElementConfiguration'
      });
      this.input('caption', TextInputView, {
        attributeTranslationKeyPrefixes: ['pageflow_scrolled.editor.inputs']
      });
      this.input('position', SelectInputView, {
        attributeTranslationKeyPrefixes: ['pageflow_scrolled.editor.inputs'],
        values: ['inline', 'sticky', 'full']
      });
    });
  }
});

editor$1.contentElementTypes.register('inlineVideo', {
  configurationEditor: function configurationEditor() {
    this.tab('general', function () {});
  }
});

editor$1.contentElementTypes.register('inlineBeforeAfter', {
  configurationEditor: function configurationEditor() {
    this.tab('general', function () {});
  }
});

editor$1.contentElementTypes.register('soundDisclaimer', {
  configurationEditor: function configurationEditor() {
    this.tab('general', function () {});
  }
});

editor$1.contentElementTypes.register('videoEmbed', {
  configurationEditor: function configurationEditor() {
    this.tab('general', function () {
      this.input('videoSource', UrlInputView, {
        supportedHosts: ['http://youtu.be', 'https://youtu.be', 'http://www.youtube.com', 'https://www.youtube.com', 'http://vimeo.com', 'https://vimeo.com', 'http://www.facebook.com', 'https://www.facebook.com'],
        displayPropertyName: 'videoSource',
        required: true,
        permitHttps: true
      });
      this.input('hideInfo', CheckBoxInputView);
      this.input('hideControls', CheckBoxInputView);
      this.input('aspectRatio', SelectInputView, {
        values: ['wide', 'narrow', 'square', 'portrait']
      });
      this.input('caption', TextInputView, {
        attributeTranslationKeyPrefixes: ['pageflow_scrolled.editor.inputs']
      });
      this.input('position', SelectInputView, {
        attributeTranslationKeyPrefixes: ['pageflow_scrolled.editor.inputs'],
        values: ['inline', 'sticky', 'full']
      });
    });
  }
});

var SidebarRouter = Marionette.AppRouter.extend({
  appRoutes: {
    'scrolled/external_links/:id/': 'links',
    'scrolled/external_links/:id/:link_id': 'link'
  }
});

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css = ".SidebarListView-module_container__2j0sq {\n  margin-top: 30px;\n}\n.SidebarListView-module_add__138Ey{\n  border: 1px solid #1c86fe;\n  border-radius: 3px;\n  box-shadow: inset 0 1px 0 0 #b6d5f8;\n  color: white !important;\n  display: inline-block;\n  font-size: 11px;\n  font-weight: bold;\n  background-color: #6aacf7;\n  background-image: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #6aacf7), color-stop(100%, #2b8efe));\n  background-image: -webkit-linear-gradient(#6aacf7, #2b8efe);\n  background-image: linear-gradient(#6aacf7, #2b8efe) !important;\n  padding: 7px 18px;\n  text-decoration: none !important;\n  text-shadow: 0 1px 0 #067bff;\n  background-clip: padding-box;\n  padding-top: 5px;\n  padding-bottom: 4px;\n  padding-left: 12px\n}\n\n.SidebarListView-module_add__138Ey::before{\n  font-family: 'entypo';\n  content: \"\\2795\"\n}\n\n.SidebarListView-module_add__138Ey:hover:not(:disabled):not(.SidebarListView-module_disabled__2s_kN) {\n  box-shadow: inset 0 1px 0 0 #87baf4;\n  cursor: pointer;\n  background-color: #559ff2;\n  background-image: -webkit-gradient(linear, left top, left bottom, color-stop(0%, #559ff2), color-stop(100%, #1d86fc));\n  background-image: -webkit-linear-gradient(#559ff2, #1d86fc);\n  background-image: linear-gradient(#559ff2, #1d86fc)\n}\n\n.SidebarListView-module_add__138Ey:active:not(:disabled):not(.SidebarListView-module_disabled__2s_kN) {\n  border: 1px solid #1c86fe;\n  box-shadow: inset 0 0 8px 4px #0f7efb, inset 0 0 8px 4px #0f7efb, 0 1px 1px 0 #eee\n}\n\n.SidebarListView-module_header__fxwPU{\n  display: 'block';\n}\n\n\n.SidebarListView-module_links_container__XDAeC {\n  margin-top: 10px;\n}";
var styles = {"container":"SidebarListView-module_container__2j0sq","add":"SidebarListView-module_add__138Ey","disabled":"SidebarListView-module_disabled__2s_kN","header":"SidebarListView-module_header__fxwPU","links_container":"SidebarListView-module_links_container__XDAeC"};
styleInject(css);

var SidebarListView = Marionette.Layout.extend({
  template: function template(data) {
    return "\n    <a class=\"back\">".concat(I18n.t('pageflow_scrolled.editor.content_elements.externalLinkList.outline'), "</a>\n    <a class=\"destroy\">").concat(I18n.t('pageflow_scrolled.editor.content_elements.externalLinkList.destroy'), "</a>\n    <div class=\"").concat(styles.container, "\">\n      <label class=\"").concat(styles.header, "\">\n        <span class=\"name\">").concat(I18n.t('pageflow_scrolled.editor.content_elements.externalLinkList.name'), "</span>\n      </label>\n      <div class='").concat(styles.links_container, "'></div>\n      <a class=\"").concat(styles.add, "\" href=\"\">").concat(I18n.t('pageflow_scrolled.editor.content_elements.externalLinkList.add'), "</a>\n    </div>\n  ");
  },
  className: 'manage_external_links',
  regions: {
    linksContainer: '.' + styles.links_container
  },
  ui: cssModulesUtils.ui(styles, 'add', 'header'),
  events: function events() {
    var eventObject = {
      'click a.back': 'goBack',
      'click a.destroy': 'destroyElement'
    };
    eventObject['click a.' + styles.add] = 'addElement';
    return eventObject;
  },
  initialize: function initialize(options) {
    this.listenTo(options.contentElement.configuration, 'change', function () {
      this.render();
    });
  },
  onRender: function onRender() {
    this.linksContainer.show(new ListView({
      collection: this.model,
      onEdit: _.bind(this.onEdit, this),
      onRemove: _.bind(this.onRemove, this),
      contentElement: this.options.contentElement
    }));
  },
  goBack: function goBack() {
    editor$1.navigate('', {
      trigger: true
    });
  },
  destroyElement: function destroyElement() {
    if (confirm(I18n.t('pageflow_scrolled.editor.content_elements.externalLinkList.confirm_delete'))) {
      this.options.contentElement.destroy();
      this.goBack();
    }
  },
  addElement: function addElement() {
    var newModel = this.model.addNewLink();
    this.onEdit(newModel);
  },
  onEdit: function onEdit(linkModel) {
    editor$1.navigate("/scrolled/external_links/".concat(this.options.contentElement.get('id'), "/").concat(linkModel.get('id')), {
      trigger: true
    });
  },
  onRemove: function onRemove(linkModel) {
    if (confirm(I18n.t('pageflow_scrolled.editor.content_elements.externalLinkList.confirm_delete_link'))) {
      this.model.remove(linkModel);
    }
  }
});

var SidebarEditLinkView = Marionette.Layout.extend({
  template: function template(data) {
    return "\n    <a class=\"back\">".concat(I18n.t('pageflow_scrolled.editor.content_elements.externalLinkList.back'), "</a>\n    <a class=\"destroy\">").concat(I18n.t('pageflow_scrolled.editor.content_elements.externalLinkList.destroy'), "</a>\n\n    <div class='form_container'></div>\n  ");
  },
  className: 'edit_external_link',
  regions: {
    formContainer: '.form_container'
  },
  events: {
    'click a.back': 'goBack',
    'click a.destroy': 'destroyLink'
  },
  initialize: function initialize(options) {},
  onRender: function onRender() {
    var configurationEditor = new ConfigurationEditorView({
      model: this.model,
      attributeTranslationKeyPrefixes: ['pageflow_scrolled.editor.content_elements.externalLinkList.attributes'],
      tabTranslationKeyPrefix: 'pageflow_scrolled.editor.content_elements.externalLinkList.tabs'
    });
    var self = this;
    configurationEditor.tab('edit_link', function () {
      this.input('url', TextInputView, {
        required: true
      });
      this.input('open_in_new_tab', CheckBoxInputView);
      this.input('thumbnail', FileInputView, {
        collection: 'image_files',
        fileSelectionHandler: 'contentElement.externalLinks.link',
        fileSelectionHandlerOptions: {
          contentElementId: self.options.contentElement.get('id')
        },
        positioning: false
      });
      this.input('title', TextInputView, {
        required: true
      });
      this.input('description', TextAreaInputView, {
        size: 'short',
        disableLinks: true
      });
    });
    this.formContainer.show(configurationEditor);
  },
  goBack: function goBack() {
    editor.navigate("/scrolled/external_links/".concat(this.options.contentElement.get('id'), "/"), {
      trigger: true
    });
  },
  destroyLink: function destroyLink() {
    if (confirm('pageflow_scrolled.editor.content_elements.externalLinkList.confirm_delete_link')) {
      this.options.collection.remove(this.model);
      this.goBack();
    }
  }
});

var ExternalLinkModel = Backbone.Model.extend({
  modelName: 'ExternalLink',
  i18nKey: 'external_link',
  mixins: [transientReferences],
  initialize: function initialize(options) {},
  thumbnailUrl: function thumbnailUrl() {
    var image = this.collection.entry.imageFiles.getByPermaId(this.get('thumbnail'));
    return image ? image.get('thumbnail_url') : '';
  },
  title: function title() {
    return this.get('title');
  }
});

var ExternalLinkCollection = Backbone.Collection.extend({
  model: ExternalLinkModel,
  initialize: function initialize(models, options) {
    this.entry = options.entry;
    this.configuration = options.configuration;
    this.bind('change', this.updateConfiguration);
    this.bind('add', this.updateConfiguration);
    this.bind('remove', this.updateConfiguration);
  },
  modelId: function modelId(attrs) {
    return attrs.id;
  },
  updateConfiguration: function updateConfiguration() {
    var _this = this;

    this.configuration.set('links', this.toJSON(), {
      silent: true
    });
    setTimeout(function () {
      //triggering change event inside this timeout block because otherwise due to
      //some unknown reason page navigates to window.location.origin+window.location.pathname
      //ignoring the hash thus causing the page to refresh.
      _this.configuration.trigger('change');
    }, 0);
  },
  addNewLink: function addNewLink() {
    var newLink = {
      id: this.length + 1,
      title: '',
      url: '',
      thumbnail: '',
      description: '',
      open_in_new_tab: 1
    };
    this.add(newLink);
    return this.get(this.length);
  }
});

var SidebarController = Marionette.Controller.extend({
  initialize: function initialize(options) {
    this.region = options.region;
  },
  links: function links(id) {
    var _this = this;

    this.setModel(id); //if not done without timeout another empty tab view is shown in the sidebar
    //to me it seems to be the problem of some method call ordering which gets fixed with this
    //hack but in future it should be fixed without having to use setTimeout

    setTimeout(function () {
      _this.region.show(new SidebarListView({
        model: _this.linksCollection,
        contentElement: _this.model,
        entry: _this.options.entry
      }));
    }, 0);
  },
  link: function link(id, link_id) {
    var _this2 = this;

    this.setModel(id);
    setTimeout(function () {
      _this2.region.show(new SidebarEditLinkView({
        model: _this2.linksCollection.get(link_id),
        collection: _this2.linksCollection,
        contentElement: _this2.model,
        entry: _this2.options.entry
      }));
    }, 0);
  },
  setModel: function setModel(id) {
    this.model = this.options.entry.contentElements.get(id);
    var configuration = this.model.configuration;

    if (!configuration.get('links')) {
      configuration.set('links', []);
    }

    this.linksCollection = new ExternalLinkCollection(configuration.get('links'), {
      entry: this.options.entry,
      configuration: configuration
    });
  }
});

//router defines the URL hash path mapping and controller provides functions for the paths

editor$1.registerSideBarRouting({
  router: SidebarRouter,
  controller: SidebarController
}); // register external link list content element configuration editor for sidebar

editor$1.contentElementTypes.register('externalLinkList', {
  configurationEditor: function configurationEditor() {
    this.tab('general', function () {
      var externalListModel = this.model.parent; //redirect to special hash path that is specific to external links only

      editor$1.navigate("/scrolled/external_links/".concat(externalListModel.get('id'), "/"), {
        trigger: true
      });
    });
  }
}); // register file handler for thumbnail of external link

editor$1.registerFileSelectionHandler('contentElement.externalLinks.link', function (options) {
  var contentElement = options.entry.contentElements.get(options.contentElementId);
  var links = contentElement.configuration.get('links');

  this.call = function (file) {
    var link = links.find(function (link) {
      return link.id == options.id;
    });
    link.thumbnail = file.get('perma_id');
    contentElement.configuration.set('links', links);
    contentElement.configuration.trigger('change', contentElement.configuration);
  };

  this.getReferer = function () {
    return '/scrolled/external_links/' + contentElement.id + '/' + options.id;
  };
});

var DatawrapperAdView = Marionette.ItemView.extend({
  template: function template(data) {
    return "\n    <form action=\"https://datawrapper.de/chart/create\" method=\"POST\" target=\"_blank\">\n      <input type=\"hidden\" name=\"theme\" value=\"pageflow\" />\n      <input type=\"submit\" value=\"".concat(I18n$1.t('pageflow_scrolled.editor.content_elements.dataWrapperChart.attributes.create_chart.label'), "\" />\n    </form>\n  ");
  },
  className: 'datawrapper_ad'
});

editor$1.contentElementTypes.register('dataWrapperChart', {
  configurationEditor: function configurationEditor() {
    this.tab('general', function () {
      this.input('url', UrlInputView, {
        supportedHosts: ['http://cf.datawrapper.de', 'https://cf.datawrapper.de', 'http://datawrapper.dwcdn.de', 'https://datawrapper.dwcdn.de', 'http://datawrapper.dwcdn.net', 'https://datawrapper.dwcdn.net', 'http://charts.datawrapper.de', 'https://charts.datawrapper.de'],
        displayPropertyName: 'url',
        required: true,
        permitHttps: true
      });
      this.view(DatawrapperAdView);
    });
  }
});
