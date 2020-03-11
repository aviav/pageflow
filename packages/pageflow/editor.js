import Backbone from 'backbone';
import _$1 from 'underscore';
import { Object as Object$1, ConfigurationEditorTabView, TextInputView, UrlDisplayView, TabsView, ConfigurationEditorView, CollectionView, CheckBoxInputView, tooltipContainer, SelectInputView, inputView, TextAreaInputView, CheckBoxGroupInputView, ExtendedSelectInputView, i18nUtils, TableView, TextTableCellView, PresenceTableCellView, SortableCollectionView, DeleteRowTableCellView, ColorInputView, SliderInputView, IconTableCellView } from 'pageflow/ui';
export * from 'pageflow/ui';
import Cocktail from 'cocktail';
import I18n$1 from 'i18n-js';
import Marionette from 'backbone.marionette';
import $ from 'jquery';
import 'jquery-ui';

(function () {
  var sync = Backbone.sync;

  Backbone.sync = function (method, model, options) {
    if (model.paramRoot && !options.attrs) {
      options.attrs = options.queryParams || {};
      options.attrs[model.paramRoot] = model.toJSON(options);
    }

    return sync(method, model, options);
  };
})();

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var CommonPageConfigurationTabs = Object$1.extend({
  initialize: function initialize() {
    this.configureFns = {};
  },
  register: function register(name, configureFn) {
    this.configureFns[name] = configureFn;
  },
  apply: function apply(configurationEditorView) {
    _$1.each(this.configureFns, function (configureFn, name) {
      configurationEditorView.tab(name, function () {
        configureFn.call(prefixInputDecorator(name, this));
      });
    });

    function prefixInputDecorator(name, dsl) {
      return {
        input: function input(propertyName, view, options) {
          return dsl.input(name + '_' + propertyName, view, options);
        }
      };
    }
  }
});

/**
 * Failure and subclasses are used in the failures api.
 *
 * Subclasses that represent failures that are can not be retried should
 * override `catRetry` with false.
 * Retryable failures should implement `retryAction`.
 *
 * @class
 */

var Failure = Object$1.extend({
  canRetry: true,
  type: 'Failure',
  initialize: function initialize(model) {
    this.model = model;
  },
  retry: function retry() {
    if (this.canRetry) {
      return this.retryAction();
    }
  },
  retryAction: function retryAction() {
    return this.model.save();
  },
  key: function key() {
    return this.model.cid + '-' + this.type;
  }
});
var SavingFailure = Failure.extend({
  type: 'SavingFailure'
});
var OrderingFailure = Failure.extend({
  type: 'OrderingFailure',
  initialize: function initialize(model, collection) {
    Failure.prototype.initialize.call(this, model);
    this.collection = collection;
  },
  retryAction: function retryAction() {
    return this.collection.saveOrder();
  }
});

/**
 * API to allow access to failure UI and recovery.
 *
 * Can watch collections for errors saving models and display the error
 * allong with a retry button.
 *
 *     editor.failures.watch(collection);
 *
 * It's possible to add failures to the UI by adding instances of subclasses of Failure:
 *
 *     editor.failures.add(new OrderingFailure(model, collection));
 *
 * @alias Failures
 */

var FailuresAPI = Object$1.extend(
/** @lends Failures.prototype */
{
  initialize: function initialize() {
    this.failures = {};
    this.length = 0;
  },

  /**
   * Listen to the `error` and `sync` events of a collection and
   * create failure objects.
   */
  watch: function watch(collection) {
    this.listenTo(collection, 'sync', this.remove);
    this.listenTo(collection, 'error', function (model) {
      if (!model.isNew()) {
        this.add(new SavingFailure(model));
      }
    });
  },
  retry: function retry() {
    _$1.each(this.failures, function (failure, key) {
      this.remove(key);
      failure.retry();
    }, this);
  },
  isEmpty: function isEmpty() {
    return _$1.size(this.failures) === 0;
  },

  /**
   * Record that a failure occured.
   *
   * @param {Failure} failure
   * The failure object to add.
   */
  add: function add(failure) {
    this.failures[failure.key()] = failure;
    this.length = _$1.size(this.failures);
  },
  remove: function remove(key) {
    delete this.failures[key];
    this.length = _$1.size(this.failures);
  },
  count: function count() {
    return this.length;
  }
});

_$1.extend(FailuresAPI.prototype, Backbone.Events);

var UploadError = Object$1.extend({
  setMessage: function setMessage(options) {
    this.upload = options.upload;
    var typeTranslation;

    if (options.typeTranslation) {
      typeTranslation = options.typeTranslation;
    } else if (this.upload.type !== '') {
      typeTranslation = this.upload.type;
    } else {
      typeTranslation = I18n$1.t('pageflow.editor.errors.upload.type_empty');
    }

    var interpolations = {
      name: this.upload.name,
      type: typeTranslation,
      validList: options.validList
    };
    this.message = I18n$1.t(options.translationKey, interpolations);
  }
});
var UnmatchedUploadError = UploadError.extend({
  name: 'UnmatchedUploadError',
  initialize: function initialize(upload) {
    this.setMessage({
      upload: upload,
      translationKey: 'pageflow.editor.errors.unmatched_upload_error'
    });
  }
});
var validFileTypeTranslationList = {
  validFileTypeTranslations: function validFileTypeTranslations(validFileTypes) {
    return _$1.map(validFileTypes, function (validFileType) {
      return I18n$1.t('activerecord.models.' + validFileType.i18nKey + '.other');
    }).join(', ');
  }
};
var NestedTypeError = UploadError.extend({
  name: 'NestedTypeError',
  initialize: function initialize(upload, options) {
    var fileType = options.fileType;
    var fileTypes = options.fileTypes;
    var validParentFileTypes = fileTypes.filter(function (parentFileType) {
      return parentFileType.nestedFileTypes.contains(fileType);
    });
    var validParentFileTypeTranslations = this.validFileTypeTranslations(validParentFileTypes);
    var typeI18nKey = fileTypes.findByUpload(upload).i18nKey;
    var typePluralTranslation = I18n$1.t('activerecord.models.' + typeI18nKey + '.other');
    this.setMessage({
      upload: upload,
      translationKey: 'pageflow.editor.errors.nested_type_error',
      typeTranslation: typePluralTranslation,
      validList: validParentFileTypeTranslations
    });
  }
});
Cocktail.mixin(NestedTypeError, validFileTypeTranslationList);
var InvalidNestedTypeError = UploadError.extend({
  name: 'InvalidNestedTypeError',
  initialize: function initialize(upload, options) {
    var editor = options.editor;
    var fileType = options.fileType;
    var validFileTypes = editor.nextUploadTargetFile.fileType().nestedFileTypes.fileTypes;
    var validFileTypeTranslations = this.validFileTypeTranslations(validFileTypes);
    var typeI18nKey = fileType.i18nKey;
    var typeSingularTranslation = I18n$1.t('activerecord.models.' + typeI18nKey + '.one');
    this.setMessage({
      upload: upload,
      translationKey: 'pageflow.editor.errors.invalid_nested_type_error',
      typeTranslation: typeSingularTranslation,
      validList: validFileTypeTranslations
    });
  }
});
Cocktail.mixin(InvalidNestedTypeError, validFileTypeTranslationList);

var FileTypesCollection = Object$1.extend({
  initialize: function initialize(fileTypes) {
    this._fileTypes = fileTypes;
  },
  findByUpload: function findByUpload(upload) {
    var result = this.find(function (fileType) {
      return fileType.matchUpload(upload);
    });

    if (!result) {
      throw new UnmatchedUploadError(upload);
    }

    return result;
  },
  findByCollectionName: function findByCollectionName(collectionName) {
    var result = this.find(function (fileType) {
      return fileType.collectionName === collectionName;
    });

    if (!result) {
      throw 'Could not find file type by collection name "' + collectionName + '"';
    }

    return result;
  }
});

_$1.each(['each', 'map', 'reduce', 'first', 'find', 'contains', 'filter'], function (method) {
  FileTypesCollection.prototype[method] = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(this._fileTypes);
    return _$1[method].apply(_$1, args);
  };
});

var state = window.pageflow || {};

function template(data) {
var __p = '';
__p += '';
return __p
}

var EditFileView = Marionette.ItemView.extend({
  template: template,
  className: 'edit_file',
  onRender: function onRender() {
    var fileType = this.model.fileType();
    var entry = this.options.entry || state.entry;
    var tab = new ConfigurationEditorTabView({
      model: this.model.configuration,
      attributeTranslationKeyPrefixes: ['pageflow.editor.files.attributes.' + fileType.collectionName, 'pageflow.editor.files.common_attributes', 'pageflow.editor.nested_files.' + fileType.collectionName, 'pageflow.editor.nested_files.common_attributes']
    });
    tab.input('file_name', TextInputView, {
      model: this.model,
      disabled: true
    });
    tab.input('rights', TextInputView, {
      model: this.model,
      placeholder: entry.get('default_file_rights')
    });

    _$1(this.fileTypeInputs()).each(function (options) {
      tab.input(options.name, options.inputView, options.inputViewOptions);
    });

    tab.input('original_url', UrlDisplayView, {
      model: this.model
    });
    this.appendSubview(tab);
  },
  fileTypeInputs: function fileTypeInputs() {
    var fileType = this.model.fileType();
    return _$1.chain(fileType.configurationEditorInputs).map(function (inputs) {
      if (_$1.isFunction(inputs)) {
        return inputs(this.model);
      } else {
        return inputs;
      }
    }, this).flatten().value();
  }
});

var app = new Marionette.Application();

var dialogView = {
  events: {
    'click .close': function clickClose() {
      this.close();
    },
    'click .box': function clickBox() {
      return false;
    },
    'click': function click() {
      this.close();
    }
  }
};

function template$1(data) {
var __t, __p = '';
__p += '<div class="box">\n  <div class="content">\n  </div>\n\n  <div class="footer">\n    <a href="" class="close">\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.file_settings_dialog.close') )) == null ? '' : __t) +
'\n    </a>\n  </div>\n</div>\n';
return __p
}

var FileSettingsDialogView = Marionette.ItemView.extend({
  template: template$1,
  className: 'file_settings_dialog editor dialog',
  mixins: [dialogView],
  ui: {
    content: '.content'
  },
  onRender: function onRender() {
    this.tabsView = new TabsView({
      model: this.model,
      i18n: 'pageflow.editor.files.settings_dialog_tabs',
      defaultTab: this.options.tabName
    });

    _$1.each(this.model.fileType().settingsDialogTabs, function (options) {
      this.tabsView.tab(options.name, _$1.bind(function () {
        return this.subview(new options.view(_$1.extend({
          model: this.model
        }, options.viewOptions)));
      }, this));
    }, this);

    this.ui.content.append(this.subview(this.tabsView).el);
  }
});

FileSettingsDialogView.open = function (options) {
  app.dialogRegion.show(new FileSettingsDialogView(options));
};

function template$2(data) {
var __t, __p = '';
__p += '<a class="edit" href="" title="' +
((__t = ( I18n.t('pageflow.editor.templates.file_meta_data_item_value_view.edit') )) == null ? '' : __t) +
'">\n</a>\n<span class="value"></span>\n';
return __p
}

/**
 * Base class for views used as `valueView` for file type meta data
 * attributes.
 *
 * @param {Object} [options]
 *
 * @param {string} [options.name]
 *   Name of the meta data item used in translation keys.
 *
 * @param {string} [options.settingsDialogTabLink]
 *   Dispaly a link to open the specified tab of the file settings
 *   dialog.
 *
 * @since 12.0
 *
 * @class
 */

var FileMetaDataItemValueView = Marionette.ItemView.extend({
  template: template$2,
  ui: {
    value: '.value',
    editLink: '.edit'
  },
  events: {
    'click .edit': function clickEdit() {
      FileSettingsDialogView.open({
        model: this.model,
        tabName: this.options.settingsDialogTabLink
      });
    }
  },
  modelEvents: {
    'change': 'toggleEditLink'
  },
  onRender: function onRender() {
    this.listenTo(this.model, 'change:' + this.options.name, this.update);
    this.toggleEditLink();
    this.update();
  },
  update: function update() {
    this.ui.value.text(this.getText() || I18n$1.t('pageflow.editor.views.file_meta_data_item_value_view.blank'));
  },
  getText: function getText() {
    throw new Error('Not implemented');
  },
  toggleEditLink: function toggleEditLink() {
    this.ui.editLink.toggle(!!this.options.settingsDialogTabLink && !this.model.isNew());
  }
});

var TextFileMetaDataItemValueView = FileMetaDataItemValueView.extend({
  getText: function getText() {
    var model;

    if (this.options.fromConfiguration) {
      model = this.model.configuration;
    } else {
      model = this.model;
    }

    return model.get(this.options.name);
  }
});

var FileType = Object$1.extend({
  initialize: function initialize(options) {
    this.model = options.model;
    this.typeName = options.typeName;
    this.collectionName = options.collectionName;
    this.topLevelType = options.topLevelType;
    this.paramKey = options.paramKey;
    this.i18nKey = options.i18nKey;
    this.nestedFileTypes = [];
    this.confirmUploadTableColumns = options.confirmUploadTableColumns || [];
    this.configurationEditorInputs = [].concat(options.configurationEditorInputs || []);
    this.configurationUpdaters = options.configurationUpdaters || [];
    this.nestedFileTableColumns = options.nestedFileTableColumns || [];
    this.nestedFilesOrder = options.nestedFilesOrder;
    this.skipUploadConfirmation = options.skipUploadConfirmation || false;
    this.filters = options.filters || [];
    this.metaDataAttributes = [{
      name: 'rights',
      valueView: TextFileMetaDataItemValueView,
      valueViewOptions: {
        settingsDialogTabLink: 'general'
      }
    }].concat(options.metaDataAttributes || []);
    this.settingsDialogTabs = [{
      name: 'general',
      view: EditFileView
    }].concat(options.settingsDialogTabs || []);

    if (typeof options.matchUpload === 'function') {
      this.matchUpload = options.matchUpload;
    } else if (options.matchUpload instanceof RegExp) {
      this.matchUpload = function (upload) {
        return upload.type.match(options.matchUpload);
      };
    } else {
      throw 'matchUpload option of FileType "' + this.collectionName + '" must either be a function or a RegExp.';
    }

    this.setupModelNaming();
  },
  setupModelNaming: function setupModelNaming() {
    this.model.prototype.modelName = this.model.prototype.modelName || this.paramKey;
    this.model.prototype.paramRoot = this.model.prototype.paramRoot || this.paramKey;
    this.model.prototype.i18nKey = this.model.prototype.i18nKey || this.i18nKey;
  },
  setNestedFileTypes: function setNestedFileTypes(fileTypesCollection) {
    this.nestedFileTypes = fileTypesCollection;
  },
  getFilter: function getFilter(name) {
    var result = _$1(this.filters).find(function (filter) {
      return filter.name === name;
    });

    if (!result) {
      throw new Error('Unknown filter "' + name + '" for file type "' + this.collectionName + '".');
    }

    return result;
  }
});

var FileTypes = Object$1.extend({
  modifyableProperties: ['configurationEditorInputs', 'configurationUpdaters', 'confirmUploadTableColumns', 'filters'],
  initialize: function initialize() {
    this.clientSideConfigs = [];
    this.clientSideConfigModifications = {};
  },
  register: function register(name, config) {
    if (this._setup) {
      throw 'File types already set up. Register file types before initializers run.';
    }

    this.clientSideConfigs[name] = config;
  },
  modify: function modify(name, config) {
    if (this._setup) {
      throw 'File types already set up. Modify file types before initializers run.';
    }

    this.clientSideConfigModifications[name] = this.clientSideConfigModifications[name] || [];
    this.clientSideConfigModifications[name].push(config);
  },
  setup: function setup(serverSideConfigs) {
    var clientSideConfigs = this.clientSideConfigs;
    this._setup = true;
    this.collection = new FileTypesCollection(_$1.map(serverSideConfigs, function (serverSideConfig) {
      var clientSideConfig = clientSideConfigs[serverSideConfig.collectionName];

      if (!clientSideConfig) {
        throw 'Missing client side config for file type "' + serverSideConfig.collectionName + '"';
      }

      _$1(this.clientSideConfigModifications[serverSideConfig.collectionName]).each(function (modification) {
        this.lintModification(modification, serverSideConfig.collectionName);
        this.applyModification(clientSideConfig, modification);
      }, this);

      return new FileType(_$1.extend({}, serverSideConfig, clientSideConfig));
    }, this));
    var those = this;

    _$1.map(serverSideConfigs, function (serverSideConfig) {
      var fileType = those.findByCollectionName(serverSideConfig.collectionName);
      fileType.setNestedFileTypes(new FileTypesCollection(_$1.map(serverSideConfig.nestedFileTypes, function (nestedFileType) {
        return those.findByCollectionName(nestedFileType.collectionName);
      })));
    });
  },
  lintModification: function lintModification(modification, collectionName) {
    var unmodifyableProperties = _$1.difference(_$1.keys(modification), this.modifyableProperties);

    if (unmodifyableProperties.length) {
      throw 'Only the following properties are allowed in FileTypes#modify: ' + this.modifyableProperties.join(', ') + '. Given in modification for ' + collectionName + ': ' + unmodifyableProperties.join(', ') + '.';
    }
  },
  applyModification: function applyModification(target, modification) {
    _$1(this.modifyableProperties).each(function (property) {
      target[property] = (target[property] || []).concat(modification[property] || []);
    });
  }
});

_$1.each(['each', 'map', 'reduce', 'first', 'find', 'findByUpload', 'findByCollectionName', 'contains', 'filter'], function (method) {
  FileTypes.prototype[method] = function () {
    if (!this._setup) {
      throw 'File types are not yet set up.';
    }

    return this.collection[method].apply(this.collection, arguments);
  };
});

var FileImporters = Object$1.extend({
  initialize: function initialize() {
    this.importers = {};
  },
  register: function register(name, config) {
    if (this._setup) {
      throw 'File importers setup is already finished. Register file importers before setup is finished';
    }

    this.importers[name] = config;
    config.key = name;
  },
  setup: function setup(serverSideConfigs) {
    this._setup = true;
    var registeredImporters = this.importers;
    var importers = {};
    serverSideConfigs.forEach(function (importer) {
      var regImporter = registeredImporters[importer.importerName];
      regImporter['authenticationRequired'] = importer.authenticationRequired;
      regImporter['authenticationProvider'] = importer.authenticationProvider;
      regImporter['logoSource'] = importer.logoSource;
      importers[importer.importerName] = regImporter;
    });
    this.importers = importers;
  },
  find: function find(name) {
    if (!this.importers[name]) {
      throw 'Could not find file importer with name "' + name + '"';
    }

    return this.importers[name];
  },
  keys: function keys() {
    return _.keys(this.importers);
  },
  values: function values() {
    return _.values(this.importers);
  }
});

var PageLinkConfigurationEditorView = ConfigurationEditorView.extend({
  configure: function configure() {
    this.tab('general', function () {
      this.group('page_link');
    });
  }
});

var PageType = Object$1.extend({
  initialize: function initialize(name, options, seed) {
    this.name = name;
    this.options = options;
    this.seed = seed;
  },
  translationKey: function translationKey() {
    return this.seed.translation_key;
  },
  thumbnailCandidates: function thumbnailCandidates() {
    return this.seed.thumbnail_candidates;
  },
  pageLinks: function pageLinks(configuration) {
    if ('pageLinks' in this.options) {
      return this.options.pageLinks(configuration);
    }
  },
  configurationEditorView: function configurationEditorView() {
    return this.options.configurationEditorView || ConfigurationEditorView.repository[this.name];
  },
  embeddedViews: function embeddedViews() {
    return this.options.embeddedViews;
  },
  createConfigurationEditorView: function createConfigurationEditorView(options) {
    var constructor = this.configurationEditorView();
    options.pageType = this.seed;
    return new constructor(_$1.extend({
      tabTranslationKeyPrefixes: [this.seed.translation_key_prefix + '.page_configuration_tabs', 'pageflow.common_page_configuration_tabs'],
      attributeTranslationKeyPrefixes: [this.seed.translation_key_prefix + '.page_attributes', 'pageflow.common_page_attributes']
    }, options));
  },
  createPageLinkConfigurationEditorView: function createPageLinkConfigurationEditorView(options) {
    var constructor = this.options.pageLinkConfigurationEditorView || PageLinkConfigurationEditorView;
    return new constructor(_$1.extend({
      tabTranslationKeyPrefixes: [this.seed.translation_key_prefix + '.page_link_configuration_tabs', 'pageflow.common_page_link_configuration_tabs'],
      attributeTranslationKeyPrefixes: [this.seed.translation_key_prefix + '.page_link_attributes', 'pageflow.common_page_link_attributes']
    }, options));
  },
  supportsPhoneEmulation: function supportsPhoneEmulation() {
    return !!this.options.supportsPhoneEmulation;
  }
});

var PageTypes = Object$1.extend({
  initialize: function initialize() {
    this.clientSideConfigs = {};
  },
  register: function register(name, config) {
    if (this._setup) {
      throw 'Page types already set up. Register page types before initializers run.';
    }

    this.clientSideConfigs[name] = config;
  },
  setup: function setup(serverSideConfigs) {
    var clientSideConfigs = this.clientSideConfigs;
    this._setup = true;
    this.pageTypes = _$1.map(serverSideConfigs, function (serverSideConfig) {
      var clientSideConfig = clientSideConfigs[serverSideConfig.name] || {};
      return new PageType(serverSideConfig.name, clientSideConfig, serverSideConfig);
    });
  },
  findByName: function findByName(name) {
    var result = this.find(function (pageType) {
      return pageType.name === name;
    });

    if (!result) {
      throw 'Could not find page type with name "' + name + '"';
    }

    return result;
  },
  findByPage: function findByPage(page) {
    return this.findByName(page.get('template'));
  }
});

_$1.each(['each', 'map', 'reduce', 'first', 'find', 'pluck'], function (method) {
  PageTypes.prototype[method] = function () {
    if (!this._setup) {
      throw 'Page types are not yet set up.';
    }

    var args = Array.prototype.slice.call(arguments);
    args.unshift(this.pageTypes);
    return _$1[method].apply(_$1, args);
  };
});

// different model types.  Backbone.Collection tries to merge records
// if they have the same id.

var MultiCollection = function MultiCollection() {
  this.records = {};
  this.length = 0;
};

_$1.extend(MultiCollection.prototype, {
  add: function add(record) {
    if (!this.records[record.cid]) {
      this.records[record.cid] = record;
      this.length = _$1.keys(this.records).length;
      this.trigger('add', record);
    }
  },
  remove: function remove(record) {
    if (this.records[record.cid]) {
      delete this.records[record.cid];
      this.length = _$1.keys(this.records).length;
      this.trigger('remove', record);
    }
  },
  isEmpty: function isEmpty() {
    return this.length === 0;
  }
});

_$1.extend(MultiCollection.prototype, Backbone.Events);

MultiCollection.extend = Backbone.Collection.extend;

/**
 * Watch Backbone collections to track which models are currently
 * being saved. Used to update the notifications view displaying
 * saving status/failutes.
 */

var SavingRecordsCollection = MultiCollection.extend({
  /**
   * Listen to events of models in collection to track when they are
   * being saved.
   *
   * @param {Backbone.Collection} collection - Collection to watch.
   */
  watch: function watch(collection) {
    var that = this;
    this.listenTo(collection, 'request', function (model, xhr) {
      that.add(model);
      xhr.always(function () {
        that.remove(model);
      });
    });
  }
});

var WidgetType = Object$1.extend({
  initialize: function initialize(serverSideConfig, clientSideConfig) {
    this.name = serverSideConfig.name;
    this.translationKey = serverSideConfig.translationKey;
    this.configurationEditorView = clientSideConfig.configurationEditorView;
    this.isOptional = clientSideConfig.isOptional;
  },
  hasConfiguration: function hasConfiguration() {
    return !!this.configurationEditorView;
  },
  createConfigurationEditorView: function createConfigurationEditorView(options) {
    var constructor = this.configurationEditorView;
    return new constructor(_$1.extend({
      attributeTranslationKeyPrefixes: ['pageflow.editor.widgets.attributes.' + this.name, 'pageflow.editor.widgets.common_attributes']
    }, options));
  }
});

var WidgetTypes = Object$1.extend({
  initialize: function initialize() {
    this._clientSideConfigs = {};
    this._optionalRoles = {};
  },
  register: function register(name, config) {
    if (this._setup) {
      throw 'Widget types already set up. Register widget types before initializers run.';
    }

    this._clientSideConfigs[name] = config;
  },
  setup: function setup(serverSideConfigsByRole) {
    this._setup = true;
    this._widgetTypesByName = {};

    var roles = _$1.keys(serverSideConfigsByRole);

    this._widgetTypesByRole = roles.reduce(_$1.bind(function (result, role) {
      result[role] = serverSideConfigsByRole[role].map(_$1.bind(function (serverSideConfig) {
        var clientSideConfig = this._clientSideConfigs[serverSideConfig.name] || {};
        var widgetType = new WidgetType(serverSideConfig, clientSideConfig);
        this._widgetTypesByName[serverSideConfig.name] = widgetType;
        return widgetType;
      }, this));
      return result;
    }, this), {});
  },
  findAllByRole: function findAllByRole(role) {
    return this._widgetTypesByRole[role] || [];
  },
  findByName: function findByName(name) {
    if (!this._widgetTypesByName[name]) {
      throw 'Could not find widget type with name "' + name + '"';
    }

    return this._widgetTypesByName[name];
  },
  registerRole: function registerRole(role, options) {
    this._optionalRoles[role] = options.isOptional;
  },
  isOptional: function isOptional(role) {
    return !!this._optionalRoles[role];
  }
});

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/**
 * Interface for engines providing editor extensions.
 * @alias editor
 */

var EditorApi = Object$1.extend(
/** @lends editor */
{
  initialize: function initialize(options) {
    this.router = options && options.router;
    this.sideBarRoutings = [];
    this.mainMenuItems = [];
    this.initializers = [];
    this.fileSelectionHandlers = {};
    /**
     * Failures API
     *
     * @returns {Failures}
     * @memberof editor
     */

    this.failures = new FailuresAPI();
    /**
     * Tracking records that are currently being saved.
     *
     * @returns {SavingRecordsCollection}
     * @memberof editor
     * @since 15.1
     */

    this.savingRecords = new SavingRecordsCollection();
    /**
     * Set up editor integration for page types.
     * @memberof editor
     */

    this.pageTypes = new PageTypes();
    /**
     * Add tabs to the configuration editor of all pages.
     * @memberof editor
     */

    this.commonPageConfigurationTabs = new CommonPageConfigurationTabs();
    /**
     * Setup editor integration for widget types.
     * @memberof editor
     */

    this.widgetTypes = new WidgetTypes();
    /**
     * Set up editor integration for file types
     * @memberof editor
     */

    this.fileTypes = new FileTypes();
    /**
     * List of available file import plugins
     * @memberof editor
     */

    this.fileImporters = new FileImporters();
  },

  /**
   * Configure editor for entry type.
   *
   * @param {string} name
   *   Must match name of entry type registered in Ruby configuration.
   * @param {Object} options
   * @param {function} options.EntryModel
   *   Backbone model extending {Entry} to store entry state.
   * @param {function} options.EntryPreviewView
   *   Backbone view that will render the live preview of the entry.
   * @param {function} options.EntryOutlineView
   *   Backbone view that will be rendered in the side bar.
   */
  registerEntryType: function registerEntryType(name, options) {
    this.entryType = _objectSpread({
      name: name
    }, options);
  },
  createEntryModel: function createEntryModel(seed, options) {
    var entry = new this.entryType.entryModel(seed.entry, options);

    if (entry.setupFromEntryTypeSeed) {
      entry.setupFromEntryTypeSeed(seed.entry_type, state);
    }

    return entry;
  },

  /**
   *  Display Backbone/Marionette View inside the main panel
   *  of the editor.
   */
  showViewInMainPanel: function showViewInMainPanel(view) {
    app.mainRegion.show(view);
  },

  /**
   *  Display the Pageflow-Preview inside the main panel.
   */
  showPreview: function showPreview() {
    app.mainRegion.$el.empty();
  },

  /**
   * Register additional router and controller for sidebar.
   *
   * Supported options:
   * - router: constructor function of Backbone Marionette app router
   * - controller: constructor function of Backbone Marionette controller
   */
  registerSideBarRouting: function registerSideBarRouting(options) {
    this.sideBarRoutings.push(options);
  },

  /**
   * Set the file that is the parent of nested files when they are
   * uploaded. This value is automatically set and unset upon
   * navigating towards the appropriate views.
   */
  setUploadTargetFile: function setUploadTargetFile(file) {
    this.nextUploadTargetFile = file;
  },

  /**
   * Set the name of the help entry that shall be selected by
   * default when the help view is opened. This value is
   * automatically reset when navigation occurs.
   */
  setDefaultHelpEntry: function setDefaultHelpEntry(name) {
    this.nextDefaultHelpEntry = name;
  },
  applyDefaultHelpEntry: function applyDefaultHelpEntry(name) {
    this.defaultHelpEntry = this.nextDefaultHelpEntry;
    this.nextDefaultHelpEntry = null;
  },

  /**
   * Register additional menu item to be displayed on the root sidebar
   * view.
   *
   * Supported options:
   * - translationKey: for the label
   * - path: route to link to
   * - click: click handler
   */
  registerMainMenuItem: function registerMainMenuItem(options) {
    this.mainMenuItems.push(options);
  },

  /**
   * Register a custom initializer which will be run before the boot
   * initializer of the editor.
   */
  addInitializer: function addInitializer(fn) {
    this.initializers.push(fn);
  },

  /**
   * Navigate to the given path.
   */
  navigate: function navigate(path, options) {
    if (!this.router) {
      throw 'Routing has not been initialized yet.';
    }

    this.router.navigate(path, options);
  },

  /**
   * Extend the interface of page configuration objects. This is
   * especially convenient to wrap structured data from the page
   * configuration as Backbone objects.
   *
   * Example:
   *
   *     editor.registerPageConfigurationMixin({
   *       externalLinks: function() {
   *         return new Backbone.Collection(this.get('external_links'));
   *       }
   *     }
   *
   *     state.pages.get(1).configuration.externalLinks().each(...);
   */
  registerPageConfigurationMixin: function registerPageConfigurationMixin(mixin) {
    app.trigger('mixin:configuration', mixin);
  },

  /**
   * File selection handlers let editor extensions use the files view
   * to select files for usage in their custom models.
   *
   * See {@link #editorselectfile
   * selectFile} method for details how to trigger file selection.
   *
   * Example:
   *
   *     function MyFileSelectionHandler(options) { this.call =
   *       function(file) { // invoked with the selected file };
   *
   *       this.getReferer = function() { // the path to return to
   *         when the back button is clicked // or after file
   *         selection return '/some/path'; } }
   *
   *
         editor.registerFileSelectionHandler('my_file_selection_handler',
         MyFileSelectionHandler);
   */
  registerFileSelectionHandler: function registerFileSelectionHandler(name, handler) {
    this.fileSelectionHandlers[name] = handler;
  },

  /**
   * Trigger selection of the given file type with the given
   * handler. Payload hash is passed to selection handler as options.
   *
   * @param {string|{name: string, filter: string}} fileType
   *   Either collection name of a file type or and object containing
   *   the collection name a file type and a the name of a file type
   *   filter.
   *
   * @param {string} handlerName
   *   The name of a handler registered via {@link
   *   #editorregisterfileselectionhandler registerFileSelectionHandler}.
   *
   * @param {Object} payload
   *   Options passed to the file selection handler.
   *
   * @example
   *
   * editor.selectFile('image_files',
   *                            'my_file_selection_handler',
   *                            {some: 'option for handler'});
   *
   * editor.selectFile({name: 'image_files', filter: 'some_filter'},
   *                            'my_file_selection_handler',
   *                            {some: 'option for handler'});
   */
  selectFile: function selectFile(fileType, handlerName, payload) {
    if (typeof fileType === 'string') {
      fileType = {
        name: fileType
      };
    }

    this.navigate('/files/' + fileType.name + '?handler=' + handlerName + '&payload=' + encodeURIComponent(JSON.stringify(payload)) + (fileType.filter ? '&filter=' + fileType.filter : ''), {
      trigger: true
    });
  },

  /**
   * Returns a promise which resolves to a page selected by the
   * user.
   *
   * Supported options:
   * - isAllowed: function which given a page returns true or false depending on
   *   whether the page is a valid selection
   */
  selectPage: function selectPage(options) {
    return this.pageSelectionView.selectPage(_objectSpread({}, options, {
      entry: state.entry
    }));
  },
  createFileSelectionHandler: function createFileSelectionHandler(handlerName, encodedPayload) {
    if (!this.fileSelectionHandlers[handlerName]) {
      throw 'Unknown FileSelectionHandler ' + handlerName;
    }

    var payloadJson = JSON.parse(decodeURIComponent(encodedPayload));
    return new this.fileSelectionHandlers[handlerName](_objectSpread({}, payloadJson, {
      entry: state.entry
    }));
  },
  createPageConfigurationEditorView: function createPageConfigurationEditorView(page, options) {
    var view = this.pageTypes.findByPage(page).createConfigurationEditorView(_$1.extend(options, {
      model: page.configuration
    }));
    this.commonPageConfigurationTabs.apply(view);
    return view;
  }
});

var editor$1 = new EditorApi();
var startEditor = function startEditor(options) {
  // In Webpack builds, I18n object from the i18n-js module is not
  // identical to window.I18n which is provided by the i18n-js gem via
  // the asset pipeline. Make translations provided via the asset
  // pipeline available in Webpack bundle.
  I18n$1.defaultLocale = window.I18n.defaultLocale;
  I18n$1.locale = window.I18n.locale;
  I18n$1.translations = window.I18n.translations;
  $(function () {
    $.when($.getJSON('/editor/entries/' + options.entryId + '/seed'), pageflow.browser.detectFeatures()).done(function (result) {
      app.start(result[0]);
    }).fail(function () {
      alert('Error while starting editor.');
    });
  });
};

/**
 * Mixins for Backbone models and collections that use entry type
 * specific editor controllers registered via the `editor_app` entry
 * type option.
 */

var entryTypeEditorControllerUrls = {
  /**
   * Mixins for Backbone collections that defines `url` method.
   *
   * @param {Object} options
   * @param {String} options.resources - Path suffix of the controller route
   *
   * @example
   *
   * import {editor, entryTypeEditorControllerUrls} from 'pageflow/editor';
   *
   * editor.registerEntryType('test', {
       // ...
     });
   *
   * export const ItemsCollection = Backbone.Collection.extend({
   *   mixins: [entryTypeEditorControllerUrls.forCollection({resources: 'items'})
   * });
   *
   * new ItemsCollection().url() // => '/editor/entries/10/test/items'
   */
  forCollection: function forCollection(_ref) {
    var resources = _ref.resources;
    return {
      url: function url() {
        return entryTypeEditorControllerUrl(resources);
      },
      urlSuffix: function urlSuffix() {
        return "/".concat(resources);
      }
    };
  },

  /**
   * Mixins for Backbone models that defines `urlRoot` method.
   *
   * @param {Object} options
   * @param {String} options.resources - Path suffix of the controller route
   *
   * @example
   *
   * import {editor, entryTypeEditorControllerUrls} from 'pageflow/editor';
   *
   * editor.registerEntryType('test', {
     // ...
     });
   *
   * export const Item = Backbone.Model.extend({
   *   mixins: [entryTypeEditorControllerUrls.forModel({resources: 'items'})
   * });
   *
   * new Item({id: 20}).url() // => '/editor/entries/10/test/items/20'
   */
  forModel: function forModel(_ref2) {
    var resources = _ref2.resources;
    return {
      urlRoot: function urlRoot() {
        return this.isNew() ? this.collection.url() : entryTypeEditorControllerUrl(resources);
      }
    };
  }
};

function entryTypeEditorControllerUrl(resources) {
  return [state.entry.url(), editor$1.entryType.name, resources].join('/');
}

var formDataUtils = {
  fromModel: function fromModel(model) {
    var object = {};
    object[model.modelName] = model.toJSON();
    return this.fromObject(object);
  },
  fromObject: function fromObject(object) {
    var queryString = $.param(object).replace(/\+/g, '%20');
    return _$1(queryString.split('&')).reduce(function (result, param) {
      var pair = param.split('=');
      result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      return result;
    }, {});
  }
};

var stylesheet = {
  reload: function reload(name) {
    var link = this.selectLink(name);

    if (!link.data('originalHref')) {
      link.data('originalHref', link.attr('href'));
    }

    link.attr('href', link.data('originalHref') + '&reload=' + new Date().getTime());
  },
  update: function update(name, stylesheetPath) {
    var link = this.selectLink(name);

    if (link.attr('href') !== stylesheetPath) {
      link.attr('href', stylesheetPath);
    }
  },
  selectLink: function selectLink(name) {
    return $('head link[data-name=' + name + ']');
  }
};

var SubsetCollection = Backbone.Collection.extend({
  constructor: function constructor(options) {
    var adding = false;
    var sorting = false;
    var parentSorting = false;
    options = options || {};

    this.filter = options.filter || function (item) {
      return true;
    };

    this.parent = options.parent;
    this.parentModel = options.parentModel;
    delete options.filter;
    delete options.parent;
    this.model = this.parent.model;
    this.comparator = options.comparator || this.parent.comparator;
    this.listenTo(this.parent, 'add', function (model, collection, options) {
      if (!adding && this.filter(model)) {
        this.add(model, options);
      }
    });
    this.listenTo(this.parent, 'remove', function (model) {
      this.remove(model);
    });
    this.listenTo(this, 'add', function (model, collection, options) {
      adding = true;
      this.parent.add(model);
      adding = false;
    });

    if (options.watchAttribute) {
      this.listenTo(this.parent, 'change:' + options.watchAttribute, function (model) {
        if (this.filter(model)) {
          this.add(model);
        } else {
          this.remove(model);
        }
      });
    }

    if (options.sortOnParentSort) {
      this.listenTo(this.parent, 'sort', function () {
        parentSorting = true;

        if (!sorting) {
          this.sort();
        }

        parentSorting = false;
      });
    }

    this.listenTo(this, 'sort', function () {
      sorting = true;

      if (!parentSorting) {
        this.parent.sort();
      }

      sorting = false;
    });
    Backbone.Collection.prototype.constructor.call(this, this.parent.filter(this.filter, this), options);
  },
  clear: function clear() {
    this.parent.remove(this.models);
    this.reset();
  },
  url: function url() {
    return this.parentModel.url() + (_$1.result(this.parent, 'urlSuffix') || _$1.result(this.parent, 'url'));
  },
  dispose: function dispose() {
    this.stopListening();
    this.reset();
  }
});

var FilesCollection = Backbone.Collection.extend({
  initialize: function initialize(models, options) {
    options = options || {};
    this.entry = options.entry;
    this.fileType = options.fileType;
    this.name = options.fileType.collectionName;
  },
  comparator: function comparator(file) {
    var fileName = file.get('file_name');
    return fileName && fileName.toLowerCase ? fileName.toLowerCase() : fileName;
  },
  url: function url() {
    return '/editor/entries/' + this.getEntry().get('id') + '/files/' + this.name;
  },
  fetch: function fetch(options) {
    options = _$1.extend({
      fileType: this.fileType
    }, options || {});
    return Backbone.Collection.prototype.fetch.call(this, options);
  },
  findOrCreateBy: function findOrCreateBy(attributes) {
    return this.findWhere(attributes) || this.create(attributes, {
      fileType: this.fileType,
      queryParams: {
        no_upload: true
      }
    });
  },
  getByPermaId: function getByPermaId(permaId) {
    return this.findWhere({
      perma_id: parseInt(permaId, 10)
    });
  },
  getEntry: function getEntry() {
    return this.entry || state.entry;
  },
  confirmable: function confirmable() {
    return new SubsetCollection({
      parent: this,
      watchAttribute: 'state',
      filter: function filter(item) {
        return item.get('state') === 'waiting_for_confirmation';
      }
    });
  },
  uploadable: function uploadable() {
    this._uploadableSubsetCollection = this._uploadableSubsetCollection || new SubsetCollection({
      parent: this,
      watchAttribute: 'state',
      filter: function filter(item) {
        return item.get('state') === 'uploadable';
      }
    });
    return this._uploadableSubsetCollection;
  },
  withFilter: function withFilter(filterName) {
    return new SubsetCollection({
      parent: this,
      watchAttribute: 'configuration',
      filter: this.fileType.getFilter(filterName).matches
    });
  }
});

FilesCollection.createForFileTypes = function (fileTypes, files, options) {
  return fileTypes.reduce(function (result, fileType) {
    result[fileType.collectionName] = FilesCollection.createForFileType(fileType, files[fileType.collectionName], options);
    return result;
  }, {});
};

FilesCollection.createForFileType = function (fileType, files, options) {
  return new FilesCollection(files, _$1.extend({
    fileType: fileType,
    model: fileType.model
  }, options || {}));
};

var OtherEntry = Backbone.Model.extend({
  paramRoot: 'entry',
  urlRoot: '/entries',
  modelName: 'entry',
  i18nKey: 'pageflow/entry',
  initialize: function initialize() {
    this.files = {};
  },
  getFileCollection: function getFileCollection(fileType) {
    if (!this.files[fileType.collectionName]) {
      this.files[fileType.collectionName] = FilesCollection.createForFileType(fileType, [], {
        entry: this
      });
    }

    return this.files[fileType.collectionName];
  },
  titleOrSlug: function titleOrSlug() {
    return this.get('title') || this.get('slug');
  }
});

var EditLock = Backbone.Model.extend({
  paramRoot: 'edit_lock',
  url: function url() {
    return '/entries/' + state.entry.get('id') + '/edit_lock?timestamp=' + new Date().getTime();
  },
  toJSON: function toJSON() {
    return {
      id: this.id,
      force: this.get('force')
    };
  }
});

var transientReferences = {
  initialize: function initialize() {
    this.transientReferences = {};
    this.pendingReferences = {};
  },
  getReference: function getReference(attribute, collection) {
    if (typeof collection === 'string') {
      var fileType = editor$1.fileTypes.findByCollectionName(collection);
      collection = state.entry.getFileCollection(fileType);
    }

    return this.transientReferences[attribute] || collection.getByPermaId(this.get(attribute));
  },
  setReference: function setReference(attribute, record) {
    this._cleanUpReference(attribute);

    this._setReference(attribute, record);

    this._listenForReady(attribute, record);
  },
  unsetReference: function unsetReference(attribute) {
    this._cleanUpReference(attribute);

    this.set(attribute, null);
  },
  _setReference: function _setReference(attribute, record) {
    if (record.isNew()) {
      this.transientReferences[attribute] = record;
      this.set(attribute, null);

      this._setPermaIdOnceSynced(attribute, record);
    } else {
      this.set(attribute, record.get('perma_id'));
    }
  },
  _setPermaIdOnceSynced: function _setPermaIdOnceSynced(attribute, record) {
    record.once('change:perma_id', function () {
      this._onceRecordCanBeFoundInCollection(record, function () {
        delete this.transientReferences[attribute];
        this.set(attribute, record.get('perma_id'));
      });
    }, this);
  },
  _onceRecordCanBeFoundInCollection: function _onceRecordCanBeFoundInCollection(record, callback) {
    // Backbone collections update their modelsById map in the change
    // event which is dispatched after the `change:<attribute>`
    // events.
    record.once('change', _$1.bind(callback, this));
  },
  _listenForReady: function _listenForReady(attribute, record) {
    if (!record.isReady()) {
      this.pendingReferences[attribute] = record;
      this.listenTo(record, 'change:state', function () {
        if (record.isReady()) {
          this._cleanUpReadyListener(attribute);

          this.trigger('change');
          this.trigger('change:' + attribute + ':ready');
        }
      });
    }
  },
  _cleanUpReference: function _cleanUpReference(attribute) {
    this._cleanUpSaveListener(attribute);

    this._cleanUpReadyListener(attribute);
  },
  _cleanUpSaveListener: function _cleanUpSaveListener(attribute) {
    if (this.transientReferences[attribute]) {
      this.stopListening(this.transientReferences[attribute], 'change:perma_id');
      delete this.transientReferences[attribute];
    }
  },
  _cleanUpReadyListener: function _cleanUpReadyListener(attribute) {
    if (this.pendingReferences[attribute]) {
      this.stopListening(this.pendingReferences[attribute], 'change:state');
      delete this.pendingReferences[attribute];
    }
  }
};

var Configuration = Backbone.Model.extend({
  modelName: 'page',
  i18nKey: 'pageflow/page',
  mixins: [transientReferences],
  defaults: {
    gradient_opacity: 100,
    display_in_navigation: true,
    transition: 'fade',
    text_position: 'left',
    invert: false,
    hide_title: false,
    autoplay: true
  },

  /**
   * Used by views (i.e. FileInputView) to get id which can be used in
   * routes to lookup configuration via its page.
   * @private
   */
  getRoutableId: function getRoutableId() {
    return this.parent.id;
  },
  getImageFileUrl: function getImageFileUrl(attribute, options) {
    options = options || {};
    var file = this.getImageFile(attribute);

    if (file && file.isReady()) {
      return file.get(options.styleGroup ? options.styleGroup + '_url' : 'url');
    }

    return '';
  },
  getImageFile: function getImageFile(attribute) {
    return this.getReference(attribute, state.imageFiles);
  },
  getFilePosition: function getFilePosition(attribute, coord) {
    var propertyName = this.filePositionProperty(attribute, coord);
    return this.has(propertyName) ? this.get(propertyName) : 50;
  },
  setFilePosition: function setFilePosition(attribute, coord, value) {
    var propertyName = this.filePositionProperty(attribute, coord);
    this.set(propertyName, value);
  },
  setFilePositions: function setFilePositions(attribute, x, y) {
    var attributes = {};
    attributes[this.filePositionProperty(attribute, 'x')] = x;
    attributes[this.filePositionProperty(attribute, 'y')] = y;
    this.set(attributes);
  },
  filePositionProperty: function filePositionProperty(attribute, coord) {
    return attribute.replace(/_id$/, '_' + coord);
  },
  getVideoFileSources: function getVideoFileSources(attribute) {
    var file = this.getVideoFile(attribute);

    if (file && file.isReady()) {
      return file.get('sources') ? this._appendSuffix(file.get('sources')) : '';
    }

    return '';
  },
  getVideoFile: function getVideoFile(attribute) {
    return this.getReference(attribute, state.videoFiles);
  },
  getAudioFileSources: function getAudioFileSources(attribute) {
    var file = this.getAudioFile(attribute);

    if (file && file.isReady()) {
      return file.get('sources') ? this._appendSuffix(file.get('sources')) : '';
    }

    return '';
  },
  getAudioFile: function getAudioFile(attribute) {
    return this.getReference(attribute, state.audioFiles);
  },
  getVideoPosterUrl: function getVideoPosterUrl() {
    var posterFile = this.getReference('poster_image_id', state.imageFiles),
        videoFile = this.getReference('video_file_id', state.videoFiles);

    if (posterFile) {
      return posterFile.get('url');
    } else if (videoFile) {
      return videoFile.get('poster_url');
    }

    return null;
  },
  _appendSuffix: function _appendSuffix(sources) {
    var parent = this.parent;

    if (!parent || !parent.id) {
      return sources;
    }

    return _$1.map(sources, function (source) {
      var clone = _$1.clone(source);

      clone.src = clone.src + '?e=' + parent.id + '&t=' + new Date().getTime();
      return clone;
    });
  }
});
app.on('mixin:configuration', function (mixin) {
  Cocktail.mixin(Configuration, mixin);
});

/**
 * Remove model from collection only after the `DELETE` request has
 * succeeded. Still allow tracking that the model is being destroyed
 * by triggering a `destroying` event and adding a `isDestroying`
 * method.
 */

var delayedDestroying = {
  initialize: function initialize() {
    this._destroying = false;
    this._destroyed = false;
  },

  /**
   * Trigger `destroying` event and send `DELETE` request. Only remove
   * model from collection once the request is done.
   */
  destroyWithDelay: function destroyWithDelay() {
    var model = this;
    this._destroying = true;
    this.trigger('destroying', this);
    return Backbone.Model.prototype.destroy.call(this, {
      wait: true,
      success: function success() {
        model._destroying = false;
        model._destroyed = true;
      },
      error: function error() {
        model._destroying = false;
      }
    });
  },

  /**
   * Get whether the model is currently being destroyed.
   */
  isDestroying: function isDestroying() {
    return this._destroying;
  },

  /**
   * Get whether the model has been destroyed.
   */
  isDestroyed: function isDestroyed() {
    return this._destroyed;
  }
};

/**
 * Mixin for Backbone models that shall be watched by {@link
 * modelLifecycleTrackingView} mixin.
 */
var failureTracking = {
  initialize: function initialize() {
    this._saveFailed = false;
    this.listenTo(this, 'sync', function () {
      this._saveFailed = false;
      this._failureMessage = null;
      this.trigger('change:failed');
    });
    this.listenTo(this, 'error', function (model, xhr) {
      this._saveFailed = true;
      this._failureMessage = this.translateStatus(xhr);
      this.trigger('change:failed');
    });
  },
  isFailed: function isFailed() {
    return this._saveFailed;
  },
  getFailureMessage: function getFailureMessage() {
    return this._failureMessage;
  },
  translateStatus: function translateStatus(xhr) {
    if (xhr.status === 401) {
      return 'Sie müssen angemeldet sein, um diese Aktion auszuführen.';
    } else if (xhr.status === 403) {
      return 'Sie sind nicht berechtigt diese Aktion auszuführen.';
    } else if (xhr.status === 404) {
      return 'Der Datensatz konnte auf dem Server nicht gefunden werden.';
    } else if (xhr.status === 409) {
      return 'Die Reportage wurde außerhalb dieses Editors bearbeitet.';
    } else if (xhr.status >= 500 && xhr.status < 600) {
      return 'Der Server hat einen internen Fehler gemeldet.';
    } else if (xhr.statusText === 'timeout') {
      return 'Der Server ist nicht erreichbar.';
    }

    return '';
  }
};

var Page = Backbone.Model.extend({
  modelName: 'page',
  paramRoot: 'page',
  i18nKey: 'pageflow/page',
  defaults: function defaults() {
    return {
      template: 'background_image',
      configuration: {},
      active: false,
      perma_id: ''
    };
  },
  mixins: [failureTracking, delayedDestroying],
  initialize: function initialize() {
    this.configuration = new Configuration(this.get('configuration') || {});
    this.configuration.parent = this.configuration.page = this;
    this.listenTo(this.configuration, 'change', function () {
      this.trigger('change:configuration', this);
    });
    this.listenTo(this.configuration, 'change:title', function () {
      this.trigger('change:title');
    });
    this.listenTo(this.configuration, 'change', function () {
      this.save();
    });
    this.listenTo(this, 'change:template', function () {
      this.save();
    });
  },
  urlRoot: function urlRoot() {
    return this.isNew() ? this.collection.url() : '/pages';
  },
  storylinePosition: function storylinePosition() {
    return this.chapter && this.chapter.storylinePosition() || -1;
  },
  chapterPosition: function chapterPosition() {
    return this.chapter && this.chapter.has('position') ? this.chapter.get('position') : -1;
  },
  isFirstPage: function isFirstPage() {
    return this.isChapterBeginning() && this.chapterPosition() === 0 && this.storylinePosition() === 1;
  },
  isChapterBeginning: function isChapterBeginning() {
    return this.get('position') === 0;
  },
  title: function title() {
    return this.configuration.get('title') || this.configuration.get('additional_title') || '';
  },
  thumbnailFile: function thumbnailFile() {
    var configuration = this.configuration;
    return _$1.reduce(this.pageType().thumbnailCandidates(), function (result, candidate) {
      if (candidate.condition && !conditionMet(candidate.condition, configuration)) {
        return result;
      }

      return result || configuration.getReference(candidate.attribute, candidate.file_collection);
    }, null);
  },
  pageLinks: function pageLinks() {
    return this.pageType().pageLinks(this.configuration);
  },
  pageType: function pageType() {
    return editor$1.pageTypes.findByName(this.get('template'));
  },
  toJSON: function toJSON() {
    return _$1.extend(_$1.clone(this.attributes), {
      configuration: this.configuration.toJSON()
    });
  },
  destroy: function destroy() {
    this.destroyWithDelay();
  }
});

function conditionMet(condition, configuration) {
  if (condition.negated) {
    return configuration.get(condition.attribute) != condition.value;
  } else {
    return configuration.get(condition.attribute) == condition.value;
  }
}

Page.linkedPagesLayouts = ['default', 'hero_top_left', 'hero_top_right'];
Page.textPositions = ['left', 'center', 'right'];
Page.textPositionsWithoutCenterOption = ['left', 'right'];
Page.scrollIndicatorModes = ['all', 'only_back', 'only_next', 'non'];
Page.scrollIndicatorOrientations = ['vertical', 'horizontal'];
Page.delayedTextFadeIn = ['no_fade', 'short', 'medium', 'long'];

var Scaffold = Object$1.extend({
  initialize: function initialize(parent, options) {
    this.parent = parent;
    this.options = options || {};
  },
  create: function create() {
    var scaffold = this;
    var query = this.options.depth ? '?depth=' + this.options.depth : '';
    this.model = this.build();
    Backbone.sync('create', this.model, {
      url: this.model.url() + '/scaffold' + query,
      success: function success(response) {
        scaffold.load(response);
        scaffold.model.trigger('sync', scaffold.model, response, {});
      }
    });
  },
  build: function build() {},
  load: function load() {}
});

var StorylineScaffold = Scaffold.extend({
  build: function build() {
    this.storyline = this.parent.buildStoryline(this.options.storylineAttributes);
    this.chapter = this.storyline.buildChapter();

    if (this.options.depth === 'page') {
      this.page = this.chapter.buildPage();
    }

    editor$1.trigger('scaffold:storyline', this.storyline);
    return this.storyline;
  },
  load: function load(response) {
    this.storyline.set(response.storyline);
    this.chapter.set(response.chapter);

    if (this.page) {
      this.page.set(response.page);
    }
  }
});

var FileReuse = Backbone.Model.extend({
  modelName: 'file_reuse',
  paramRoot: 'file_reuse',
  initialize: function initialize(attributes, options) {
    this.entry = options.entry;
    this.collectionName = options.fileType.collectionName;
  },
  url: function url() {
    return '/editor/entries/' + this.entry.get('id') + '/files/' + this.collectionName + '/reuse';
  }
});

FileReuse.submit = function (otherEntry, file, options) {
  new FileReuse({
    other_entry_id: otherEntry.get('id'),
    file_id: file.get('id')
  }, {
    entry: options.entry,
    fileType: file.fileType()
  }).save(null, options);
};

var FileConfiguration = Configuration.extend({
  defaults: {},
  applyUpdaters: function applyUpdaters(updaters, newAttributes) {
    _$1(updaters).each(function (updater) {
      updater(this, newAttributes);
    }, this);
  }
});

var NestedFilesCollection = SubsetCollection.extend({
  constructor: function constructor(options) {
    var parent = options.parent;
    var parentFile = options.parentFile;
    var modelType = parentFile.fileType().typeName;
    var nestedFilesOrder = parent.fileType.nestedFilesOrder;
    SubsetCollection.prototype.constructor.call(this, {
      parent: parent,
      parentModel: parentFile,
      filter: function filter(item) {
        return item.get('parent_file_id') === parentFile.get('id') && item.get('parent_file_model_type') === modelType;
      },
      comparator: nestedFilesOrder && nestedFilesOrder.comparator
    });

    if (nestedFilesOrder) {
      this.listenTo(this, 'change:configuration:' + nestedFilesOrder.binding, this.sort);
    }
  },
  getByPermaId: function getByPermaId(permaId) {
    return this.findWhere({
      perma_id: parseInt(permaId, 10)
    });
  }
});

var retryable = {
  retry: function retry(options) {
    options = options ? _$1.clone(options) : {};
    if (options.parse === void 0) options.parse = true;
    var model = this;

    options.success = function (resp) {
      if (!model.set(model.parse(resp, options), options)) return false;
      model.trigger('sync', model, resp, options);
    };

    options.error = function (resp) {
      model.trigger('error', model, resp, options);
    };

    options.url = this.url() + '/retry';
    return this.sync('create', this, options);
  }
};

var FileStage = Backbone.Model.extend({
  initialize: function initialize(attributes, options) {
    this.file = options.file;
    this.activeStates = options.activeStates || [];
    this.finishedStates = options.finishedStates || [];
    this.failedStates = options.failedStates || [];
    this.actionRequiredStates = options.actionRequiredStates || [];
    this.nonFinishedStates = this.activeStates.concat(this.failedStates, this.actionRequiredStates);
    this.update();
    this.listenTo(this.file, 'change:state', this.update);
    this.listenTo(this.file, 'change:' + this.get('name') + '_progress', this.update);
    this.listenTo(this.file, 'change:' + this.get('name') + '_error_message', this.update);
  },
  update: function update() {
    this.updateState();
    this.updateProgress();
    this.updateErrorMessage();
  },
  updateState: function updateState() {
    var state = this.file.get('state');
    this.set('active', this.activeStates.indexOf(state) >= 0);
    this.set('finished', this.finishedStates.indexOf(state) >= 0);
    this.set('failed', this.failedStates.indexOf(state) >= 0);
    this.set('action_required', this.actionRequiredStates.indexOf(state) >= 0);

    if (this.get('active')) {
      this.set('state', 'active');
    } else if (this.get('finished')) {
      this.set('state', 'finished');
    } else if (this.get('failed')) {
      this.set('state', 'failed');
    } else if (this.get('action_required')) {
      this.set('state', 'action_required');
    } else {
      this.set('state', 'pending');
    }
  },
  updateProgress: function updateProgress() {
    this.set('progress', this.file.get(this.get('name') + '_progress'));
  },
  updateErrorMessage: function updateErrorMessage() {
    var errorMessageAttribute = this.get('name') + '_error_message';
    this.set('error_message', this.file.get(errorMessageAttribute));
  },
  localizedDescription: function localizedDescription() {
    var prefix = 'pageflow.editor.files.stages.';
    var suffix = this.get('name') + '.' + this.get('state');
    return I18n$1.t(prefix + this.file.i18nKey + '.' + suffix, {
      defaultValue: I18n$1.t(prefix + suffix)
    });
  }
});

var stageProvider = {
  initialize: function initialize() {
    var finishedStates = [this.readyState];
    var stages = _$1.result(this, 'stages') || [];
    this.stages = new Backbone.Collection(_$1.chain(stages).slice().reverse().map(function (options) {
      var name = options.name;
      options.file = this;
      options.finishedStates = finishedStates;
      var fileStage = new FileStage({
        name: name
      }, options);
      finishedStates = finishedStates.concat(fileStage.nonFinishedStates);
      return fileStage;
    }, this).reverse().value());
    this.unfinishedStages = new SubsetCollection({
      parent: this.stages,
      watchAttribute: 'finished',
      filter: function filter(stage) {
        return !stage.get('finished');
      }
    });
  },
  currentStage: function currentStage() {
    return this.stages.find(function (stage) {
      return stage.get('active') || stage.get('action_required') || stage.get('failed');
    });
  }
};

var ReusableFile = Backbone.Model.extend({
  mixins: [stageProvider, retryable],
  initialize: function initialize(attributes, options) {
    this.options = options || {};
    this.configuration = new FileConfiguration(this.get('configuration') || {});
    this.configuration.i18nKey = this.i18nKey;
    this.configuration.parent = this;
    this.listenTo(this.configuration, 'change', function () {
      this.trigger('change:configuration', this);

      _$1.chain(this.configuration.changed).keys().each(function (name) {
        this.trigger('change:configuration:' + name, this, this.configuration.get(name));
      }, this);

      if (!this.isNew()) {
        this.save();
      }
    });
    this.listenTo(this, 'change:rights', function () {
      if (!this.isNew()) {
        this.save();
      }
    });
    this.listenTo(this, 'change', function (model, options) {
      if (options.applyConfigurationUpdaters) {
        this.configuration.applyUpdaters(this.fileType().configurationUpdaters, this.attributes.configuration);
      }
    });
  },
  urlRoot: function urlRoot() {
    return this.collection.url();
  },
  fileType: function fileType() {
    return this.options.fileType;
  },
  title: function title() {
    return this.get('file_name');
  },
  thumbnailFile: function thumbnailFile() {
    return this;
  },
  nestedFiles: function nestedFiles(supersetCollection) {
    if (typeof supersetCollection === 'function') {
      supersetCollection = supersetCollection();
    }

    var collectionName = supersetCollection.fileType.collectionName;
    this.nestedFilesCollections = this.nestedFilesCollections || {};
    this.nestedFilesCollections[collectionName] = this.nestedFilesCollections[collectionName] || new NestedFilesCollection({
      parent: supersetCollection,
      parentFile: this
    });
    return this.nestedFilesCollections[collectionName];
  },
  isUploading: function isUploading() {
    return this.get('state') === 'uploading';
  },
  isUploaded: function isUploaded() {
    return this.get('state') !== 'uploading' && this.get('state') !== 'uploading_failed';
  },
  isPending: function isPending() {
    return !this.isReady() && !this.isFailed();
  },
  isReady: function isReady() {
    return this.get('state') === this.readyState;
  },
  isFailed: function isFailed() {
    return this.get('state') && !!this.get('state').match(/_failed$/);
  },
  isRetryable: function isRetryable() {
    return !!this.get('retryable');
  },
  isConfirmable: function isConfirmable() {
    return false;
  },
  isPositionable: function isPositionable() {
    return false;
  },
  toJSON: function toJSON() {
    return _$1.extend(_$1.pick(this.attributes, 'file_name', 'rights', 'parent_file_id', 'parent_file_model_type', 'content_type', 'file_size'), {
      configuration: this.configuration.toJSON()
    });
  },
  cancelUpload: function cancelUpload() {
    if (this.get('state') === 'uploading') {
      this.trigger('uploadCancelled');
      this.destroy();
    }
  },
  uploadFailed: function uploadFailed() {
    this.set('state', 'uploading_failed');
    this.unset('uploading_progress');
    this.trigger('uploadFailed');
  },
  publish: function publish() {
    this.save({}, {
      url: this.url() + '/publish'
    });
  }
});

var UploadableFile = ReusableFile.extend({
  stages: function stages() {
    return [{
      name: 'uploading',
      activeStates: ['uploading'],
      failedStates: ['uploading_failed']
    }].concat(_$1.result(this, 'processingStages'));
  },
  processingStages: [],
  readyState: 'uploaded'
});

var EncodedFile = UploadableFile.extend({
  processingStages: function processingStages() {
    var stages = [];

    if (state.config.confirmEncodingJobs) {
      stages.push({
        name: 'fetching_meta_data',
        activeStates: ['waiting_for_meta_data', 'fetching_meta_data'],
        failedStates: ['fetching_meta_data_failed']
      });
    }

    stages.push({
      name: 'encoding',
      actionRequiredStates: ['waiting_for_confirmation'],
      activeStates: ['waiting_for_encoding', 'encoding'],
      failedStates: ['fetching_meta_data_failed', 'encoding_failed']
    });
    return stages;
  },
  readyState: 'encoded',
  isConfirmable: function isConfirmable() {
    return this.get('state') === 'waiting_for_confirmation';
  },
  isPositionable: function isPositionable() {
    return false;
  }
});

var VideoFile = EncodedFile.extend({
  getBackgroundPositioningImageUrl: function getBackgroundPositioningImageUrl() {
    return this.get('poster_url');
  },
  isPositionable: function isPositionable() {
    return this.isReady();
  }
});

var WidgetConfigurationFileSelectionHandler = function WidgetConfigurationFileSelectionHandler(options) {
  var widget = state.entry.widgets.get(options.id);

  this.call = function (file) {
    widget.configuration.setReference(options.attributeName, file);
  };

  this.getReferer = function () {
    return '/widgets/' + widget.id;
  };
};
editor$1.registerFileSelectionHandler('widgetConfiguration', WidgetConfigurationFileSelectionHandler);

var EncodingConfirmation = Backbone.Model.extend({
  paramRoot: 'encoding_confirmation',
  initialize: function initialize() {
    this.videoFiles = new Backbone.Collection();
    this.audioFiles = new Backbone.Collection();
    this.updateEmpty();
    this.watchCollections();
  },
  watchCollections: function watchCollections() {
    this.listenTo(this.videoFiles, 'add remove', this.check);
    this.listenTo(this.audioFiles, 'add remove', this.check);
    this.listenTo(this.videoFiles, 'reset', this.updateEmpty);
    this.listenTo(this.audioFiles, 'reset', this.updateEmpty);
  },
  check: function check() {
    var model = this;
    model.updateEmpty();
    model.set('checking', true);
    model.save({}, {
      url: model.url() + '/check',
      success: function success() {
        model.set('checking', false);
      },
      error: function error() {
        model.set('checking', false);
      }
    });
  },
  saveAndReset: function saveAndReset() {
    var model = this;
    model.save({}, {
      success: function success() {
        model.set('summary_html', '');
        model.videoFiles.reset();
        model.audioFiles.reset();
      }
    });
  },
  updateEmpty: function updateEmpty() {
    this.set('empty', this.videoFiles.length === 0 && this.audioFiles.length === 0);
  },
  url: function url() {
    return '/editor/entries/' + state.entry.get('id') + '/encoding_confirmations';
  },
  toJSON: function toJSON() {
    return {
      video_file_ids: this.videoFiles.pluck('id'),
      audio_file_ids: this.audioFiles.pluck('id')
    };
  }
});

EncodingConfirmation.createWithPreselection = function (options) {
  var model = new EncodingConfirmation();

  if (options.fileId) {
    if (options.fileType === 'video_file') {
      model.videoFiles.add(state.videoFiles.get(options.fileId));
    } else {
      model.audioFiles.add(state.audioFiles.get(options.fileId));
    }
  }

  return model;
};

var Theme = Backbone.Model.extend({
  title: function title() {
    return I18n$1.t('pageflow.' + this.get('name') + '_theme.name');
  },
  thumbnailUrl: function thumbnailUrl() {
    return this.get('preview_thumbnail_url');
  },
  hasHomeButton: function hasHomeButton() {
    return this.get('home_button');
  },
  hasOverviewButton: function hasOverviewButton() {
    return this.get('overview_button');
  },
  supportsEmphasizedPages: function supportsEmphasizedPages() {
    return this.get('emphasized_pages');
  },
  supportsScrollIndicatorModes: function supportsScrollIndicatorModes() {
    return this.get('scroll_indicator_modes');
  }
});

var WidgetConfiguration = Configuration.extend({
  i18nKey: 'pageflow/widget',
  defaults: {}
});

var AudioFile = EncodedFile.extend({
  thumbnailPictogram: 'audio',
  getSources: function getSources(attribute) {
    if (this.isReady()) {
      return this.get('sources') ? this.get('sources') : '';
    }

    return '';
  }
});

var EntryMetadataConfiguration = Configuration.extend({
  modelName: 'entry_metadata_configuration',
  i18nKey: 'pageflow/entry_metadata_configuration',
  defaults: {}
});

var EntryMetadata = Configuration.extend({
  modelName: 'entry',
  i18nKey: 'pageflow/entry',
  defaults: {},
  initialize: function initialize(attributes, options) {
    Configuration.prototype.initialize.apply(this, attributes, options);
    this.configuration = new EntryMetadataConfiguration(_$1.clone(attributes.configuration) || {});
    this.listenTo(this.configuration, 'change', function () {
      this.trigger('change');
      this.parent.save();
    });
  }
});

var StorylineConfiguration = Configuration.extend({
  modelName: 'storyline',
  i18nKey: 'pageflow/storyline',
  defaults: {},
  initialize: function initialize() {
    this.listenTo(this, 'change:main', function (model, value) {
      if (value) {
        this.unset('parent_page_perma_id');
      }
    });
  }
});

var TextTrackFile = UploadableFile.extend({
  defaults: {
    configuration: {
      kind: 'captions'
    }
  },
  processingStages: [{
    name: 'processing',
    activeStates: ['processing'],
    failedStates: ['processing_failed']
  }],
  readyState: 'processed',
  initialize: function initialize(attributes, options) {
    ReusableFile.prototype.initialize.apply(this, arguments);

    if (this.isNew() && !this.configuration.get('srclang')) {
      this.configuration.set('srclang', this.extractLanguageCodeFromFilename());
    }
  },
  displayLabel: function displayLabel() {
    return this.configuration.get('label') || this.inferredLabel() || I18n$1.t('pageflow.editor.text_track_files.label_missing');
  },
  inferredLabel: function inferredLabel() {
    var srclang = this.configuration.get('srclang');

    if (srclang) {
      return I18n$1.t('pageflow.languages.' + srclang, {
        defaultValue: ''
      });
    }
  },
  extractLanguageCodeFromFilename: function extractLanguageCodeFromFilename() {
    var matches = /\S+\.([a-z]{2})_[A-Z]{2}\.[a-z]+/.exec(this.get('file_name'));
    return matches && matches[1];
  }
});
TextTrackFile.displayLabelBinding = 'srclang';

var StorylineOrdering = function StorylineOrdering(storylines, pages) {
  var storylinesByParent;

  this.watch = function () {
    storylines.on('add change:configuration', function () {
      this.sort();
    }, this);
    pages.on('change:position change:chapter_id', function () {
      this.sort();
    }, this);
  };

  this.sort = function (options) {
    prepare();
    visit(storylinesWithoutParent(), 1, 0);
    storylines.sort(options);
  };

  function visit(storylines, offset, level) {
    return _$1(storylines).reduce(function (position, storyline, index) {
      storyline.set('position', position);
      storyline.set('level', level);
      return visit(children(storyline), position + 1, level + 1);
    }, offset);
  }

  function storylinesWithoutParent() {
    return storylinesByParent[-1];
  }

  function children(storyline) {
    return storylinesByParent[storyline.cid] || [];
  }

  function prepare() {
    storylinesByParent = _$1(groupStorylinesByParentStoryline()).reduce(function (result, storylines, key) {
      result[key] = storylines.sort(compareStorylines);
      return result;
    }, {});
  }

  function groupStorylinesByParentStoryline() {
    return storylines.groupBy(function (storyline) {
      var parentPage = getParentPage(storyline);
      return parentPage && parentPage.chapter ? parentPage.chapter.storyline.cid : -1;
    });
  }

  function compareStorylines(storylineA, storylineB) {
    return compareByMainFlag(storylineA, storylineB) || compareByParentPagePosition(storylineA, storylineB) || compareByLane(storylineA, storylineB) || compareByRow(storylineA, storylineB) || compareByTitle(storylineA, storylineB);
  }

  function compareByMainFlag(storylineA, storylineB) {
    return compare(storylineA.isMain() ? -1 : 1, storylineB.isMain() ? -1 : 1);
  }

  function compareByParentPagePosition(storylineA, storylineB) {
    return compare(getParentPagePosition(storylineA), getParentPagePosition(storylineB));
  }

  function compareByLane(storylineA, storylineB) {
    return compare(storylineA.lane(), storylineB.lane());
  }

  function compareByRow(storylineA, storylineB) {
    return compare(storylineA.row(), storylineB.row());
  }

  function compareByTitle(storylineA, storylineB) {
    return compare(storylineA.title(), storylineB.title());
  }

  function compare(a, b) {
    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    } else {
      return 0;
    }
  }

  function getParentPagePosition(storyline) {
    var parentPage = getParentPage(storyline);
    return parentPage && parentPage.get('position');
  }

  function getParentPage(storyline) {
    return pages.getByPermaId(storyline.parentPagePermaId());
  }
};

var PageConfigurationFileSelectionHandler = function PageConfigurationFileSelectionHandler(options) {
  var page = state.pages.get(options.id);

  this.call = function (file) {
    page.configuration.setReference(options.attributeName, file);
  };

  this.getReferer = function () {
    return '/pages/' + page.id + '/' + (options.returnToTab || 'files');
  };
};
editor$1.registerFileSelectionHandler('pageConfiguration', PageConfigurationFileSelectionHandler);

var ImageFile = ReusableFile.extend({
  stages: [{
    name: 'uploading',
    activeStates: ['uploading'],
    failedStates: ['uploading_failed']
  }, {
    name: 'processing',
    activeStates: ['processing'],
    finishedStates: ['processed'],
    failedStates: ['processing_failed']
  }],
  readyState: 'processed',
  getBackgroundPositioningImageUrl: function getBackgroundPositioningImageUrl() {
    return this.get('url');
  },
  isPositionable: function isPositionable() {
    return this.isReady();
  }
});

var EntryMetadataFileSelectionHandler = function EntryMetadataFileSelectionHandler(options) {
  this.call = function (file) {
    state.entry.metadata.setReference(options.attributeName, file);
  };

  this.getReferer = function () {
    return '/meta_data/' + (options.returnToTab || 'general');
  };
};
editor$1.registerFileSelectionHandler('entryMetadata', EntryMetadataFileSelectionHandler);

var EntryPublication = Backbone.Model.extend({
  paramRoot: 'entry_publication',
  quota: function quota() {
    return new Backbone.Model(this.get('quota') || {});
  },
  check: function check() {
    var model = this;
    this.set('checking', true);
    this.save({}, {
      url: this.url() + '/check',
      success: function success() {
        model.set('checking', false);
      },
      error: function error() {
        model.set('checking', false);
      }
    });
  },
  publish: function publish(attributes) {
    return this.save(attributes, {
      success: function success(model) {
        state.entry.parse(model.get('entry'));
      },
      error: function error(model, xhr) {
        model.set(xhr.responseJSON);
      }
    });
  },
  url: function url() {
    return '/editor/entries/' + state.entry.get('id') + '/entry_publications';
  }
});

var ChapterScaffold = Scaffold.extend({
  build: function build() {
    this.chapter = this.parent.buildChapter(this.options.chapterAttributes);
    this.page = this.chapter.buildPage();
    return this.chapter;
  },
  load: function load(response) {
    this.chapter.set(response.chapter);
    this.page.set(response.page);
  }
});

// https://github.com/jashkenas/backbone/issues/2601

function BaseObject(options) {
  this.initialize.apply(this, arguments);
}

_$1.extend(BaseObject.prototype, Backbone.Events, {
  initialize: function initialize(options) {}
}); // The self-propagating extend function that Backbone classes use.


BaseObject.extend = Backbone.Model.extend;

var EntryData = BaseObject.extend({
  getThemingOption: function getThemingOption(name) {
    throw 'Not implemented';
  },
  getFile: function getFile(collectionName, id) {
    throw 'Not implemented';
  },
  getPageConfiguration: function getPageConfiguration(permaId) {
    throw 'Not implemented';
  },
  getPagePosition: function getPagePosition(permaId) {
    throw 'Not implemented';
  },
  getChapterConfiguration: function getChapterConfiguration(id) {
    throw 'Not implemented';
  },
  getStorylineConfiguration: function getStorylineConfiguration(id) {
    throw 'Not implemented';
  },
  getChapterIdByPagePermaId: function getChapterIdByPagePermaId(permaId) {
    throw 'Not implemented';
  },
  getStorylineIdByChapterId: function getStorylineIdByChapterId(permaId) {
    throw 'Not implemented';
  },
  getChapterPagePermaIds: function getChapterPagePermaIds(id) {
    throw 'Not implemented';
  },
  getParentPagePermaIdByPagePermaId: function getParentPagePermaIdByPagePermaId(permaId) {
    var storylineId = this.getStorylineIdByPagePermaId(permaId);
    return this.getParentPagePermaId(storylineId);
  },
  getStorylineIdByPagePermaId: function getStorylineIdByPagePermaId(permaId) {
    var chapterId = this.getChapterIdByPagePermaId(permaId);
    return this.getStorylineIdByChapterId(chapterId);
  },
  getParentStorylineId: function getParentStorylineId(storylineId) {
    var parentPagePermaId = this.getParentPagePermaId(storylineId);
    return parentPagePermaId && this.getStorylineIdByPagePermaId(parentPagePermaId);
  },
  getParentChapterId: function getParentChapterId(chapterId) {
    var storylineId = this.getStorylineIdByChapterId(chapterId);
    var pagePermaId = this.getParentPagePermaId(storylineId);
    return pagePermaId && this.getChapterIdByPagePermaId(pagePermaId);
  },
  getParentPagePermaId: function getParentPagePermaId(storylineId) {
    return this.getStorylineConfiguration(storylineId).parent_page_perma_id;
  },
  getStorylineLevel: function getStorylineLevel(storylineId) {
    var parentStorylineId = this.getParentStorylineId(storylineId);

    if (parentStorylineId) {
      return this.getStorylineLevel(parentStorylineId) + 1;
    } else {
      return 0;
    }
  }
});

var PreviewEntryData = EntryData.extend({
  initialize: function initialize(options) {
    this.entry = options.entry;
    this.storylines = options.storylines;
    this.chapters = options.chapters;
    this.pages = options.pages;
  },
  getThemingOption: function getThemingOption(name) {
    return this.entry.getTheme().get(name);
  },
  getFile: function getFile(collectionName, permaId) {
    var file = this.entry.getFileCollection(collectionName).getByPermaId(permaId);
    return file && file.attributes;
  },
  getStorylineConfiguration: function getStorylineConfiguration(id) {
    var storyline = this.storylines.get(id);
    return storyline ? storyline.configuration.attributes : {};
  },
  getChapterConfiguration: function getChapterConfiguration(id) {
    var chapter = this.chapters.get(id);
    return chapter ? chapter.configuration.attributes : {};
  },
  getChapterPagePermaIds: function getChapterPagePermaIds(id) {
    var chapter = this.chapters.get(id);
    return chapter ? chapter.pages.pluck('perma_id') : [];
  },
  getStorylineIdByChapterId: function getStorylineIdByChapterId(id) {
    var chapter = this.chapters.get(id);
    return chapter && chapter.get('storyline_id');
  },
  getChapterIdByPagePermaId: function getChapterIdByPagePermaId(permaId) {
    var page = this.pages.getByPermaId(permaId);
    return page && page.get('chapter_id');
  },
  getPageConfiguration: function getPageConfiguration(permaId) {
    var page = this.pages.getByPermaId(permaId);
    return page ? page.configuration.attributes : {};
  },
  getPagePosition: function getPagePosition(permaId) {
    return this.pages.indexOf(this.pages.getByPermaId(permaId));
  }
});

var EditLockContainer = Backbone.Model.extend({
  initialize: function initialize() {
    this.storageKey = 'pageflow.edit_lock.' + state.entry.id;
  },
  acquire: function acquire(options) {
    options = options || {};
    var container = this;
    var lock = new EditLock({
      id: options.force ? null : sessionStorage[this.storageKey],
      force: options.force
    });
    lock.save(null, {
      polling: !!options.polling,
      success: function success(lock) {
        sessionStorage[container.storageKey] = lock.id;
        container.lock = lock;
        container.trigger('acquired');
        container.startPolling();
      }
    });
  },
  startPolling: function startPolling() {
    if (!this.pollingInteval) {
      this.pollingInteval = setInterval(_$1.bind(function () {
        this.acquire({
          polling: true
        });
      }, this), state.config.editLockPollingIntervalInSeconds * 1000);
    }
  },
  stopPolling: function stopPolling() {
    if (this.pollingInteval) {
      clearInterval(this.pollingInteval);
      this.pollingInteval = null;
    }
  },
  watchForErrors: function watchForErrors() {
    var container = this;
    $(document).ajaxSend(function (event, xhr) {
      if (container.lock) {
        xhr.setRequestHeader("X-Edit-Lock", container.lock.id);
      }
    });
    $(document).ajaxError(function (event, xhr, settings) {
      switch (xhr.status) {
        case 409:
          container.handleConflict(xhr, settings);
          break;

        case 401:
        case 422:
          container.handleUnauthenticated();
          break;

        default:
          container.handleError();
      }
    });
  },
  release: function release() {
    if (this.lock) {
      var promise = this.lock.destroy();
      delete sessionStorage[this.storageKey];
      this.lock = null;
      return promise;
    }
  },
  handleConflict: function handleConflict(xhr, settings) {
    this.lock = null;
    this.trigger('locked', xhr.responseJSON || {}, {
      context: settings.url.match(/\/edit_lock/) && !settings.polling ? 'acquire' : 'other'
    });
    this.stopPolling();
  },
  handleUnauthenticated: function handleUnauthenticated() {
    this.stopPolling();
    this.trigger('unauthenticated');
  },
  handleError: function handleError() {}
});

var Theming = Backbone.Model.extend({
  modelName: 'theming',
  i18nKey: 'pageflow/theming',
  collectionName: 'themings'
});

var ChapterConfiguration = Configuration.extend({
  modelName: 'chapter',
  i18nKey: 'pageflow/chapter',
  defaults: {}
});

var Widget = Backbone.Model.extend({
  paramRoot: 'widget',
  i18nKey: 'pageflow/widget',
  initialize: function initialize(attributes, options) {
    this.widgetTypes = options.widgetTypes;
    this.configuration = new WidgetConfiguration(this.get('configuration') || {});
    this.configuration.parent = this;
    this.listenTo(this.configuration, 'change', function () {
      this.trigger('change:configuration', this);
    });
  },
  widgetType: function widgetType() {
    return this.get('type_name') && this.widgetTypes.findByName(this.get('type_name'));
  },
  hasConfiguration: function hasConfiguration() {
    return !!(this.widgetType() && this.widgetType().hasConfiguration());
  },
  role: function role() {
    return this.id;
  },
  urlRoot: function urlRoot() {
    return this.collection.url();
  },
  toJSON: function toJSON() {
    return {
      role: this.role(),
      type_name: this.get('type_name'),
      configuration: this.configuration.toJSON()
    };
  }
});

var StorylineTransitiveChildPages = function StorylineTransitiveChildPages(storyline, storylines, pages) {
  var isTranstiveChildStoryline;

  this.contain = function (page) {
    if (!isTranstiveChildStoryline) {
      search();
    }

    return !!isTranstiveChildStoryline[page.chapter.storyline.id];
  };

  function search() {
    isTranstiveChildStoryline = storylines.reduce(function (memo, other) {
      var current = other;

      while (current) {
        if (current === storyline || memo[current.id]) {
          memo[other.id] = true;
          return memo;
        }

        current = parentStoryline(current);
      }

      return memo;
    }, {});
  }

  function parentStoryline(storyline) {
    var parentPage = pages.getByPermaId(storyline.parentPagePermaId());
    return parentPage && parentPage.chapter && parentPage.chapter.storyline;
  }
};

var FileUploader = Object$1.extend({
  initialize: function initialize(options) {
    this.fileTypes = options.fileTypes;
    this.entry = options.entry;
    this.deferreds = [];
  },
  add: function add(upload, options) {
    options = options || {};
    var editor = options.editor || editor$1;
    var fileType = this.fileTypes.findByUpload(upload);
    var file = new fileType.model({
      state: 'uploadable',
      file_name: upload.name,
      content_type: upload.type,
      file_size: upload.size
    }, {
      fileType: fileType
    });
    var setTargetFile = editor.nextUploadTargetFile;

    if (setTargetFile) {
      if (fileType.topLevelType || !setTargetFile.fileType().nestedFileTypes.contains(fileType)) {
        throw new InvalidNestedTypeError(upload, {
          editor: editor,
          fileType: fileType
        });
      }

      file.set({
        parent_file_id: setTargetFile.get('id'),
        parent_file_model_type: setTargetFile.fileType().typeName
      });
    } else if (!fileType.topLevelType) {
      throw new NestedTypeError(upload, {
        fileType: fileType,
        fileTypes: this.fileTypes
      });
    }

    this.entry.getFileCollection(fileType).add(file);
    var deferred = new $.Deferred();

    if (setTargetFile) {
      deferred.resolve();
    } else {
      this.deferreds.push(deferred);

      if (this.deferreds.length == 1) {
        this.trigger('new:batch');
      }
    }

    return deferred.promise().then(function () {
      file.set('state', 'uploading');
      return file;
    }, function () {
      file.destroy();
    });
  },
  submit: function submit() {
    _$1(this.deferreds).invoke('resolve');

    this.deferreds = [];
  },
  abort: function abort() {
    _$1(this.deferreds).invoke('reject');

    this.deferreds = [];
  }
});

var orderedCollection = {
  initialize: function initialize() {
    if (this.autoConsolidatePositions !== false) {
      this.listenTo(this, 'remove', function () {
        this.consolidatePositions();
        this.saveOrder();
      });
    }
  },
  consolidatePositions: function consolidatePositions() {
    this.each(function (item, index) {
      item.set('position', index);
    });
  },
  saveOrder: function saveOrder() {
    var parentModel = this.parentModel;
    var collection = this;

    if (collection.isEmpty()) {
      return $.Deferred().resolve().promise();
    }

    return Backbone.sync('update', parentModel, {
      url: collection.url() + '/order',
      attrs: {
        ids: collection.pluck('id')
      },
      success: function success(response) {
        parentModel.trigger('sync', parentModel, response, {});
        parentModel.trigger('sync:order', parentModel, response, {});
      },
      error: function error(jqXHR, textStatus, errorThrown) {
        editor$1.failures.add(new OrderingFailure(parentModel, collection));
      }
    });
  }
};

var ChapterPagesCollection = SubsetCollection.extend({
  mixins: [orderedCollection],
  constructor: function constructor(options) {
    var chapter = options.chapter;
    SubsetCollection.prototype.constructor.call(this, {
      parent: options.pages,
      parentModel: chapter,
      filter: function filter(item) {
        return !chapter.isNew() && item.get('chapter_id') === chapter.id;
      },
      comparator: function comparator(item) {
        return item.get('position');
      }
    });
    this.each(function (page) {
      page.chapter = chapter;
    });
    this.listenTo(this, 'add', function (model) {
      model.chapter = chapter;
      model.set('chapter_id', chapter.id);
      editor$1.trigger('add:page', model);
    });
    this.listenTo(this, 'remove', function (model) {
      model.chapter = null;
    });
    this.listenTo(chapter, 'destroy', function () {
      this.clear();
    });
  }
});

var Chapter = Backbone.Model.extend({
  modelName: 'chapter',
  paramRoot: 'chapter',
  i18nKey: 'pageflow/chapter',
  mixins: [failureTracking, delayedDestroying],
  initialize: function initialize(attributes, options) {
    this.pages = new ChapterPagesCollection({
      pages: options.pages || state.pages,
      chapter: this
    });
    this.listenTo(this, 'change:title', function () {
      this.save();
    });
    this.configuration = new ChapterConfiguration(this.get('configuration') || {});
    this.listenTo(this.configuration, 'change', function () {
      this.save();
      this.trigger('change:configuration', this);
    });
    return attributes;
  },
  urlRoot: function urlRoot() {
    return this.isNew() ? this.collection.url() : '/chapters';
  },
  storylinePosition: function storylinePosition() {
    return this.storyline && this.storyline.get('position') || -1;
  },
  addPage: function addPage(attributes) {
    var page = this.buildPage(attributes);
    page.save();
    return page;
  },
  buildPage: function buildPage(attributes) {
    var defaults = {
      chapter_id: this.id,
      position: this.pages.length
    };
    return this.pages.addAndReturnModel(_$1.extend(defaults, attributes));
  },
  toJSON: function toJSON() {
    return _$1.extend(_$1.clone(this.attributes), {
      configuration: this.configuration.toJSON()
    });
  },
  destroy: function destroy() {
    this.destroyWithDelay();
  }
});

var StorylineChaptersCollection = SubsetCollection.extend({
  mixins: [orderedCollection],
  constructor: function constructor(options) {
    var storyline = options.storyline;
    SubsetCollection.prototype.constructor.call(this, {
      parent: options.chapters,
      parentModel: storyline,
      filter: function filter(item) {
        return !storyline.isNew() && item.get('storyline_id') === storyline.id;
      },
      comparator: function comparator(item) {
        return item.get('position');
      }
    });
    this.each(function (chapter) {
      chapter.storyline = storyline;
    });
    this.listenTo(this, 'add', function (model) {
      model.storyline = storyline;
      model.set('storyline_id', storyline.id);
      editor$1.trigger('add:chapter', model);
    });
    this.listenTo(this, 'remove', function (model) {
      model.storyline = null;
    });
  }
});

var Storyline = Backbone.Model.extend({
  modelName: 'storyline',
  paramRoot: 'storyline',
  i18nKey: 'pageflow/storyline',
  mixins: [failureTracking, delayedDestroying],
  initialize: function initialize(attributes, options) {
    this.chapters = new StorylineChaptersCollection({
      chapters: options.chapters || state.chapters,
      storyline: this
    });
    this.configuration = new StorylineConfiguration(this.get('configuration') || {});
    this.listenTo(this.configuration, 'change', function () {
      if (!this.isNew()) {
        this.save();
      }

      this.trigger('change:configuration', this);
    });
    this.listenTo(this.configuration, 'change:main', function (model, value) {
      this.trigger('change:main', this, value);
    });
  },
  urlRoot: function urlRoot() {
    return this.isNew() ? this.collection.url() : '/storylines';
  },
  displayTitle: function displayTitle() {
    return _$1([this.title() || !this.isMain() && I18n$1.t('pageflow.storylines.untitled'), this.isMain() && I18n$1.t('pageflow.storylines.main')]).compact().join(' - ');
  },
  title: function title() {
    return this.configuration.get('title');
  },
  isMain: function isMain() {
    return !!this.configuration.get('main');
  },
  lane: function lane() {
    return this.configuration.get('lane');
  },
  row: function row() {
    return this.configuration.get('row');
  },
  parentPagePermaId: function parentPagePermaId() {
    return this.configuration.get('parent_page_perma_id');
  },
  parentPage: function parentPage() {
    return state.pages.getByPermaId(this.parentPagePermaId());
  },
  transitiveChildPages: function transitiveChildPages() {
    return new StorylineTransitiveChildPages(this, state.storylines, state.pages);
  },
  addChapter: function addChapter(attributes) {
    var chapter = this.buildChapter(attributes);
    chapter.save();
    return chapter;
  },
  buildChapter: function buildChapter(attributes) {
    var defaults = {
      storyline_id: this.id,
      title: '',
      position: this.chapters.length
    };
    return this.chapters.addAndReturnModel(_$1.extend(defaults, attributes));
  },
  scaffoldChapter: function scaffoldChapter(options) {
    var scaffold = new ChapterScaffold(this, options);
    scaffold.create();
    return scaffold;
  },
  toJSON: function toJSON() {
    return {
      configuration: this.configuration.toJSON()
    };
  },
  destroy: function destroy() {
    this.destroyWithDelay();
  }
});

var PageLink = Backbone.Model.extend({
  mixins: [transientReferences],
  i18nKey: 'pageflow/page_link',
  targetPage: function targetPage() {
    return state.pages.getByPermaId(this.get('target_page_id'));
  },
  label: function label() {
    return this.get('label');
  },
  editPath: function editPath() {
    return '/page_links/' + this.id;
  },
  getPageId: function getPageId() {
    return this.collection.page.id;
  },
  toSerializedJSON: function toSerializedJSON() {
    return _$1.omit(this.attributes, 'highlighted', 'position');
  },
  highlight: function highlight() {
    this.set('highlighted', true);
  },
  resetHighlight: function resetHighlight() {
    this.unset('highlighted');
  },
  remove: function remove() {
    this.collection.remove(this);
  }
});

var PageLinkFileSelectionHandler = function PageLinkFileSelectionHandler(options) {
  var page = state.pages.getByPermaId(options.id.split(':')[0]);
  var pageLink = page.pageLinks().get(options.id);

  this.call = function (file) {
    pageLink.setReference(options.attributeName, file);
  };

  this.getReferer = function () {
    return '/page_links/' + pageLink.id;
  };
};
editor$1.registerFileSelectionHandler('pageLink', PageLinkFileSelectionHandler);

/**
 * Mixins for models with a nested configuration model.
 *
 * Triggers events on the parent model of the form
 * `change:configuration` and `change:configuration:<attribute>`, when
 * the configuration changes.
 *
 * @param {Object} [options]
 * @param {Function} [options.configurationModel] -
 *   Backbone model to use for nested configuration model.
 * @param {Boolean} [options.autoSave] -
 *   Save model when configuration changes.
 * @param {Boolean|Array<String>} [options.includeAttributesInJSON] -
 *   Include all or specific attributes of the parent model in the
 *   data returned by `toJSON` besides the `configuration` property.
 * @returns {Object} - Mixin to be included in model.
 *
 * @example
 *
 * import {configurationContainer} from 'pageflow/editor';
 *
 * const Section = Backbone.Model.extend({
 *   mixins: [configurationContainer({autoSave: true})]
 * });
 *
 * const section = new Section({configuration: {some: 'value'}});
 * section.configuration.get('some') // => 'value';
 */

function configurationContainer() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      configurationModel = _ref.configurationModel,
      autoSave = _ref.autoSave,
      includeAttributesInJSON = _ref.includeAttributesInJSON;

  configurationModel = configurationModel || Configuration.extend({
    defaults: {}
  });
  return {
    initialize: function initialize() {
      this.configuration = new configurationModel(this.get('configuration'));
      this.configuration.parent = this;
      this.listenTo(this.configuration, 'change', function () {
        if (!this.isNew() && (!this.isDestroying || !this.isDestroying()) && (!this.isDestroyed || !this.isDestroyed()) && autoSave) {
          this.save();
        }

        this.trigger('change:configuration', this);

        _$1.chain(this.configuration.changed).keys().each(function (name) {
          this.trigger('change:configuration:' + name, this, this.configuration.get(name));
        }, this);
      });
    },
    toJSON: function toJSON() {
      var attributes = {};

      if (includeAttributesInJSON === true) {
        attributes = _$1.clone(this.attributes);
      } else if (includeAttributesInJSON) {
        attributes = _$1.pick(this.attributes, includeAttributesInJSON);
      }

      return _$1.extend(attributes, {
        configuration: this.configuration.toJSON()
      });
    }
  };
}

var persistedPromise = {
  persisted: function persisted() {
    var model = this;
    this._persistedDeferred = this._persistedDeferred || $.Deferred(function (deferred) {
      if (model.isNew()) {
        model.once('change:id', deferred.resolve);
      } else {
        deferred.resolve();
      }
    });
    return this._persistedDeferred.promise();
  }
};
Cocktail.mixin(Backbone.Model, persistedPromise);

var filesCountWatcher = {
  watchFileCollection: function watchFileCollection(name, collection) {
    this.watchedFileCollectionNames = this.watchedFileCollectionNames || [];
    this.watchedFileCollectionNames.push(name);
    this.listenTo(collection, 'change:state', function (model) {
      this.updateFilesCounts(name, collection);
    });
    this.listenTo(collection, 'add', function () {
      this.updateFilesCounts(name, collection);
    });
    this.listenTo(collection, 'remove', function () {
      this.updateFilesCounts(name, collection);
    });
    this.updateFilesCounts(name, collection);
  },
  updateFilesCounts: function updateFilesCounts(name, collection) {
    this.updateFilesCount('uploading', name, collection, function (file) {
      return file.isUploading();
    });
    this.updateFilesCount('confirmable', name, collection, function (file) {
      return file.isConfirmable();
    });
    this.updateFilesCount('pending', name, collection, function (file) {
      return file.isPending();
    });
  },
  updateFilesCount: function updateFilesCount(trait, name, collection, filter) {
    this.set(trait + '_' + name + '_count', collection.filter(filter).length);
    this.set(trait + '_files_count', _$1.reduce(this.watchedFileCollectionNames, function (sum, name) {
      return sum + this.get(trait + '_' + name + '_count');
    }, 0, this));
  }
};

var fileWithType = {};

var polling = {
  togglePolling: function togglePolling(enabled) {
    if (enabled) {
      this.startPolling();
    } else {
      this.stopPolling();
    }
  },
  startPolling: function startPolling() {
    if (!this.pollingInterval) {
      this.pollingInterval = setInterval(_$1.bind(function () {
        this.fetch();
      }, this), 1000);
    }
  },
  stopPolling: function stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
};

var Entry = Backbone.Model.extend({
  paramRoot: 'entry',
  urlRoot: '/editor/entries',
  modelName: 'entry',
  i18nKey: 'pageflow/entry',
  collectionName: 'entries',
  mixins: [filesCountWatcher, polling, failureTracking],
  initialize: function initialize(attributes, options) {
    options = options || {};
    this.metadata = new EntryMetadata(this.get('metadata') || {});
    this.metadata.parent = this; // In 15.1 `entry.configuration` was turned into a new `Metadata`
    // model. Some of the entry type specific data (like
    // `home_button_enabled`) was extraced into
    // `entry.metadata.configuration`. Attributes like `title` or `locale`
    // which used to live in `entry.configuration` now live in
    // entry.metadata. Since some plugins (e.g. `pageflow-vr`) depend on
    // reading the locale from `entry.configuration`, this `configuration`
    // keeps backwards compatibility.

    this.configuration = this.metadata;
    this.themes = options.themes || state.themes;
    this.files = options.files || state.files;
    this.fileTypes = options.fileTypes || editor$1.fileTypes;
    this.storylines = options.storylines || state.storylines;
    this.storylines.parentModel = this;
    this.chapters = options.chapters || state.chapters;
    this.chapters.parentModel = this;
    this.pages = state.pages;
    this.widgets = options.widgets;
    this.imageFiles = state.imageFiles;
    this.videoFiles = state.videoFiles;
    this.audioFiles = state.audioFiles;
    this.fileTypes.each(function (fileType) {
      this.watchFileCollection(fileType.collectionName, this.getFileCollection(fileType));
    }, this);
    this.listenTo(this.storylines, 'sort', function () {
      this.pages.sort();
    });
    this.listenTo(this.chapters, 'sort', function () {
      this.pages.sort();
    });
    this.listenTo(this.metadata, 'change', function () {
      this.trigger('change:metadata');
      this.save();
    });
    this.listenTo(this.metadata, 'change:locale', function () {
      this.once('sync', function () {
        // No other way of updating page templates used in
        // EntryPreviewView at the moment.
        location.reload();
      });
    });
  },
  getTheme: function getTheme() {
    return this.themes.findByName(this.metadata.get('theme_name'));
  },
  addStoryline: function addStoryline(attributes) {
    var storyline = this.buildStoryline(attributes);
    storyline.save();
    return storyline;
  },
  buildStoryline: function buildStoryline(attributes) {
    var defaults = {
      title: ''
    };
    return this.storylines.addAndReturnModel(_$1.extend(defaults, attributes));
  },
  scaffoldStoryline: function scaffoldStoryline(options) {
    var scaffold = new StorylineScaffold(this, options);
    scaffold.create();
    return scaffold;
  },
  addChapterInNewStoryline: function addChapterInNewStoryline(options) {
    return this.scaffoldStoryline(_$1.extend({
      depth: 'chapter'
    }, options)).chapter;
  },
  addPageInNewStoryline: function addPageInNewStoryline(options) {
    return this.scaffoldStoryline(_$1.extend({
      depth: 'page'
    }, options)).page;
  },
  reuseFile: function reuseFile(otherEntry, file) {
    var entry = this;
    FileReuse.submit(otherEntry, file, {
      entry: entry,
      success: function success(model, response) {
        entry._setFiles(response, {
          merge: false,
          remove: false
        });

        entry.trigger('use:files');
      }
    });
  },
  getFileCollection: function getFileCollection(fileTypeOrFileTypeName) {
    return this.files[fileTypeOrFileTypeName.collectionName || fileTypeOrFileTypeName];
  },
  pollForPendingFiles: function pollForPendingFiles() {
    this.listenTo(this, 'change:pending_files_count', function (model, value) {
      this.togglePolling(value > 0);
    });
    this.togglePolling(this.get('pending_files_count') > 0);
  },
  parse: function parse(response, options) {
    if (response) {
      this.set(_$1.pick(response, 'published', 'published_until', 'password_protected'));

      this._setFiles(response, {
        add: false,
        remove: false,
        applyConfigurationUpdaters: true
      });
    }

    return response;
  },
  _setFiles: function _setFiles(response, options) {
    this.fileTypes.each(function (fileType) {
      var filesAttributes = response[fileType.collectionName]; // Temporary solution until rights attributes is moved to
      // configuration hash. If we are polling, prevent overwriting
      // the rights attribute.

      if (options.merge !== false) {
        filesAttributes = _$1.map(filesAttributes, function (fileAttributes) {
          return _$1.omit(fileAttributes, 'rights');
        });
      }

      this.getFileCollection(fileType).set(filesAttributes, _$1.extend({
        fileType: fileType
      }, options));
      delete response[fileType.collectionName];
    }, this);
  },
  toJSON: function toJSON() {
    var metadataJSON = this.metadata.toJSON();
    var configJSON = this.metadata.configuration.toJSON();
    metadataJSON.configuration = configJSON;
    return metadataJSON;
  }
});

var AuthenticationProvider = Object$1.extend({
  authenticate: function authenticate(parent, provider) {
    this.authenticationPopup('/auth/' + provider, 800, 600);
    this.authParent = parent;
  },
  authenticationPopup: function authenticationPopup(linkUrl, width, height) {
    var sep = linkUrl.indexOf('?') !== -1 ? '&' : '?',
        url = linkUrl + sep + 'popup=true',
        left = (screen.width - width) / 2 - 16,
        top = (screen.height - height) / 2 - 50,
        windowFeatures = 'menubar=no,toolbar=no,status=no,width=' + width + ',height=' + height + ',left=' + left + ',top=' + top;
    return window.open(url, 'authPopup', windowFeatures);
  },
  authenticateCallback: function authenticateCallback() {
    this.authParent.authenticateCallback();
  }
});
var authenticationProvider = new AuthenticationProvider();

var FileImport = Backbone.Model.extend({
  modelName: 'file_import',
  action: 'search',
  url: function url() {
    var slug = this.get('currentEntry').get('slug');
    return '/editor/entries/' + slug + '/file_import/' + this.importer.key + '/' + this.action;
  },
  initialize: function initialize(options) {
    this.importer = options.importer;
    this.set('selectedFiles', []);
    this.set('currentEntry', options.currentEntry);
    this.authenticationInterval = setInterval(this.authenticate.bind(this), 2000);
  },
  authenticate: function authenticate() {
    if (!this.popUped) {
      if (this.importer.authenticationRequired) {
        authenticationProvider.authenticate(this, this.importer.authenticationProvider);
        this.popUped = true;
      } else {
        this.authenticateCallback();
      }
    }
  },
  authenticateCallback: function authenticateCallback() {
    clearInterval(this.authenticationInterval);
    this.set('isAuthenticated', true);
    this.importer.authenticationRequired = false;
    this.popUped = false;
  },
  createFileImportDialogView: function createFileImportDialogView() {
    return this.importer.createFileImportDialogView(this);
  },
  select: function select(options) {
    if (options instanceof Backbone.Model) {
      this.get('selectedFiles').push(options);
      this.trigger('change');
    }
  },
  unselect: function unselect(options) {
    var index = this.get('selectedFiles').indexOf(options);
    this.get('selectedFiles').splice(index, 1);
    this.trigger('change');
  },
  clearSelections: function clearSelections() {
    this.set('selectedFiles', []);
  },
  search: function search(query) {
    this.action = 'search/?query=' + query;
    return this.fetchData();
  },
  fetchData: function fetchData(options) {
    return this.fetch(options).then(function (data) {
      if (data && data.data) {
        return data.data;
      }
    });
  },
  getFilesMetaData: function getFilesMetaData(options) {
    this.action = 'files_meta_data';
    var selectedFiles = this.get('selectedFiles');

    for (var i = 0; i < selectedFiles.length; i++) {
      selectedFiles[i] = selectedFiles[i].toJSON();
    }

    return this.fetch({
      data: {
        files: selectedFiles
      },
      postData: true,
      type: 'POST'
    }).then(function (data) {
      if (data && data.data) {
        return data.data;
      } else {
        return undefined;
      }
    });
  },
  cancelImport: function cancelImport(collectionName) {
    var selections = state.files[collectionName].uploadable();
    selections.each(function (selection) {
      selection.destroy();
    });
    selections.clear();
  },
  startImportJob: function startImportJob(collectionName) {
    this.action = 'start_import_job';
    var selections = state.files[collectionName].uploadable();
    var jsonSelections = selections.toJSON();
    jsonSelections.forEach(function (selection, index) {
      selection['url'] = selections.at(index).get('source_url');
    });
    var currentEntry = this.get('currentEntry');
    this.fetch({
      data: {
        collection: collectionName,
        files: jsonSelections
      },
      postData: true,
      type: 'POST'
    }).then(function (data) {
      if (data && data.data) {
        var files = data.data;

        if (files && files.length > 0) {
          files.forEach(function (file) {
            var localFile = selections.find(function (cFile) {
              return cFile.get('attachment_on_s3_file_name') == file.file_name && cFile.get('source_url') == file.source_url && cFile.get('state') == 'uploadable';
            });

            if (localFile) {
              state.files[collectionName].remove(localFile);
              var fileType = editor$1.fileTypes.findByUpload(file);
              var file = new fileType.model(file, {
                fileType: fileType
              });
              currentEntry.getFileCollection(fileType).add(file);
              file.set('state', 'uploading');
            }
          });
        }
      }
    });
  }
});

var ChaptersCollection = Backbone.Collection.extend({
  model: Chapter,
  url: '/chapters',
  comparator: function comparator(chapter) {
    return chapter.get('position');
  }
});

/**
 * A Backbone collection that is automatically updated to only
 * contain models with a foreign key matching the id of a parent
 * model.
 *
 * @param {Object} options
 * @param {Backbone.Model} options.parentModel -
 *   Model whose id is compared to foreign keys.
 * @param {Backbone.Collection} options.parent -
 *   Collection to filter items with matching foreign key from.
 * @param {String} options.foreignKeyAttribute -
 *   Attribute to compare to id of parent model.
 * @param {String} options.parentReferenceAttribute -
 *   Set reference to parent model on models in collection.
 *
 * @since 15.1
 */

var ForeignKeySubsetCollection = SubsetCollection.extend({
  mixins: [orderedCollection],
  constructor: function constructor(options) {
    var parent = options.parent;
    var parentModel = options.parentModel;
    SubsetCollection.prototype.constructor.call(this, {
      parent: parent,
      parentModel: parentModel,
      filter: function filter(item) {
        return !parentModel.isNew() && item.get(options.foreignKeyAttribute) === parentModel.id;
      },
      comparator: function comparator(item) {
        return item.get('position');
      }
    });
    this.listenTo(this, 'add', function (model) {
      if (options.parentReferenceAttribute) {
        model[options.parentReferenceAttribute] = parentModel;
      }

      model.set(options.foreignKeyAttribute, parentModel.id);
    });
    this.listenTo(parentModel, 'destroy', function () {
      this.clear();
    });

    if (options.parentReferenceAttribute) {
      this.each(function (model) {
        return model[options.parentReferenceAttribute] = parentModel;
      });
      this.listenTo(this, 'remove', function (model) {
        model[options.parentReferenceAttribute] = null;
      });
    }
  }
});

var PageLinksCollection = Backbone.Collection.extend({
  model: PageLink,
  initialize: function initialize(models, options) {
    this.configuration = options.configuration;
    this.page = options.configuration.page;
    this.load();
    this.listenTo(this, 'add remove change', this.save);
    this.listenTo(this.configuration, 'change:page_links', this.load);
  },
  addLink: function addLink(targetPageId) {
    this.addWithPosition(this.defaultPosition(), targetPageId);
  },
  canAddLink: function canAddLink(targetPageId) {
    return true;
  },
  updateLink: function updateLink(link, targetPageId) {
    link.set('target_page_id', targetPageId);
  },
  removeLink: function removeLink(link) {
    this.remove(link);
  },
  addWithPosition: function addWithPosition(position, targetPageId) {
    this.add(this.pageLinkAttributes(position, targetPageId));
  },
  removeByPosition: function removeByPosition(position) {
    this.remove(this.findByPosition(position));
  },
  findByPosition: function findByPosition(position) {
    return this.findWhere({
      position: position
    });
  },
  load: function load() {
    this.set(this.pageLinksAttributes());
  },
  save: function save() {
    this.configuration.set('page_links', this.map(function (pageLink) {
      return pageLink.toSerializedJSON();
    }));
  },
  defaultPosition: function defaultPosition() {
    return Math.max(0, _$1.max(this.map(function (pageLink) {
      return pageLink.get('position');
    }))) + 1;
  },
  pageLinksAttributes: function pageLinksAttributes() {
    return this.configuration.get('page_links') || [];
  },
  pageLinkAttributes: function pageLinkAttributes(position, targetPageId, id) {
    return {
      id: id || this.getUniqueId(),
      target_page_id: targetPageId,
      position: position
    };
  },

  /** @private */
  getUniqueId: function getUniqueId() {
    var maxId = Math.max(0, _$1.max(this.map(function (pageLink) {
      return parseInt(pageLink.id.split(':').pop(), 10);
    })));
    return this.configuration.page.get('perma_id') + ':' + (maxId + 1);
  }
});

var OtherEntriesCollection = Backbone.Collection.extend({
  model: OtherEntry,
  url: '/editor/entries',
  initialize: function initialize(models, options) {
    options = options || {};
    this.excludeEntry = options.excludeEntry;
  },
  // override parse method to exclude the entry being edited. This is the collection
  // of the "other" entries, after all.
  parse: function parse(response) {
    var excludeEntry = this.getExcludeEntry(),
        filteredResponse = _$1.filter(response, function (entry) {
      return entry.id != excludeEntry.id;
    });

    return Backbone.Collection.prototype.parse.call(this, filteredResponse);
  },
  getExcludeEntry: function getExcludeEntry() {
    return this.excludeEntry || state.entry;
  }
});

var StorylinesCollection = Backbone.Collection.extend({
  autoConsolidatePositions: false,
  mixins: [orderedCollection],
  model: Storyline,
  url: function url() {
    return '/entries/' + state.entry.get('id') + '/storylines';
  },
  initialize: function initialize() {
    this.listenTo(this, 'change:main', function (model, value) {
      if (value) {
        this.each(function (storyline) {
          if (storyline.isMain() && storyline !== model) {
            storyline.configuration.unset('main');
          }
        });
      }
    });
  },
  main: function main() {
    return this.find(function (storyline) {
      return storyline.configuration.get('main');
    }) || this.first();
  },
  comparator: function comparator(chapter) {
    return chapter.get('position');
  }
});

var OrderedPageLinksCollection = PageLinksCollection.extend({
  comparator: 'position',
  saveOrder: function saveOrder() {
    this.save();
  }
});

var PagesCollection = Backbone.Collection.extend({
  model: Page,
  url: '/pages',
  comparator: function comparator(pageA, pageB) {
    if (pageA.storylinePosition() > pageB.storylinePosition()) {
      return 1;
    } else if (pageA.storylinePosition() < pageB.storylinePosition()) {
      return -1;
    } else if (pageA.chapterPosition() > pageB.chapterPosition()) {
      return 1;
    } else if (pageA.chapterPosition() < pageB.chapterPosition()) {
      return -1;
    } else if (pageA.get('position') > pageB.get('position')) {
      return 1;
    } else if (pageA.get('position') < pageB.get('position')) {
      return -1;
    } else {
      return 0;
    }
  },
  getByPermaId: function getByPermaId(permaId) {
    return this.findWhere({
      perma_id: parseInt(permaId, 10)
    });
  },
  persisted: function persisted() {
    if (!this._persisted) {
      this._persisted = new SubsetCollection({
        parent: this,
        sortOnParentSort: true,
        filter: function filter(page) {
          return !page.isNew();
        }
      });
      this.listenTo(this, 'change:id', function (model) {
        setTimeout(_$1.bind(function () {
          this._persisted.add(model);
        }, this), 0);
      });
    }

    return this._persisted;
  }
});

var ThemesCollection = Backbone.Collection.extend({
  model: Theme,
  findByName: function findByName(name) {
    var theme = this.findWhere({
      name: name
    });

    if (!theme) {
      throw new Error('Found no theme by name ' + name);
    }

    return theme;
  }
});

var WidgetsCollection = Backbone.Collection.extend({
  model: Widget,
  initialize: function initialize() {
    this.listenTo(this, 'change:type_name change:configuration', function () {
      this.batchSave();
    });
  },
  url: function url() {
    return '/editor/subjects/entries/' + this.subject.id + '/widgets';
  },
  batchSave: function batchSave(options) {
    var subject = this.subject;
    return Backbone.sync('patch', subject, _$1.extend(options || {}, {
      url: this.url() + '/batch',
      attrs: {
        widgets: this.map(function (widget) {
          return widget.toJSON();
        })
      },
      success: function success(response) {
        subject.trigger('sync:widgets', subject, response, {});
      }
    }));
  }
});

var addAndReturnModel = {
  // Backbone's add does not return the added model. push returns the
  // model but does not trigger sort.
  addAndReturnModel: function addAndReturnModel(model, options) {
    model = this._prepareModel(model, options);
    this.add(model, options);
    return model;
  }
};
Cocktail.mixin(Backbone.Collection, addAndReturnModel);

var SidebarRouter = Marionette.AppRouter.extend({
  appRoutes: {
    'page_links/:id': 'pageLink',
    'pages/:id': 'page',
    'pages/:id/:tab': 'page',
    'chapters/:id': 'chapter',
    'storylines/:id': 'storyline',
    'widgets/:id': 'widget',
    'files/:collectionName?handler=:handler&payload=:payload&filter=:filter': 'files',
    'files/:collectionName?handler=:handler&payload=:payload': 'files',
    'files/:collectionName': 'files',
    'files': 'files',
    'confirmable_files?type=:type&id=:id': 'confirmableFiles',
    'confirmable_files': 'confirmableFiles',
    'meta_data': 'metaData',
    'meta_data/:tab': 'metaData',
    'publish': 'publish',
    '?storyline=:id': 'index',
    '.*': 'index'
  }
});

function template$3(data) {
var __t, __p = '';
__p += '<a class="back">' +
((__t = ( I18n.t('pageflow.editor.templates.back_button_decorator.outline') )) == null ? '' : __t) +
'</a>\n<div class="outlet"></div>\n';
return __p
}

var BackButtonDecoratorView = Marionette.Layout.extend({
  template: template$3,
  className: 'back_button_decorator',
  events: {
    'click a.back': 'goBack'
  },
  regions: {
    outlet: '.outlet'
  },
  onRender: function onRender() {
    this.outlet.show(this.options.view);
  },
  goBack: function goBack() {
    this.options.view.onGoBack && this.options.view.onGoBack();
    editor$1.navigate('/', {
      trigger: true
    });
  }
});

function template$4(data) {
var __t, __p = '';
__p += '<input type="checkbox">\n<label class="file_name"></label>\n<span class="duration"></span>\n\n<div class="actions">\n  <a class="remove" title="' +
((__t = ( I18n.t('pageflow.editor.templates.confirmable_file_item.remove') )) == null ? '' : __t) +
'"></a>\n</div>\n';
return __p
}

var ConfirmableFileItemView = Marionette.ItemView.extend({
  tagName: 'li',
  template: template$4,
  ui: {
    fileName: '.file_name',
    duration: '.duration',
    label: 'label',
    checkBox: 'input',
    removeButton: '.remove'
  },
  events: {
    'click .remove': 'destroy',
    'change input': 'updateSelection'
  },
  onRender: function onRender() {
    this.ui.label.attr('for', this.cid);
    this.ui.checkBox.attr('id', this.cid);
    this.ui.checkBox.prop('checked', this.options.selectedFiles.contains(this.model));
    this.ui.fileName.text(this.model.get('file_name') || '(Unbekannt)');
    this.ui.duration.text(this.model.get('duration') || '-');
  },
  destroy: function destroy() {
    if (confirm("Datei wirklich wirklich löschen?")) {
      this.model.destroy();
    }
  },
  updateSelection: function updateSelection() {
    if (this.ui.checkBox.is(':checked')) {
      this.options.selectedFiles.add(this.model);
    } else {
      this.options.selectedFiles.remove(this.model);
    }
  }
});

function template$5(data) {
var __t, __p = '';
__p += '<div class="blank_slate">\n  <p>\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.confirm_encoding.all_released') )) == null ? '' : __t) +
'\n  </p>\n  <p>\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.confirm_encoding.link_to_progress', {
            link: '<a href="#/files/video_files">'+I18n.t('pageflow.editor.templates.confirm_encoding.manage_files')+'</a>'})
      )) == null ? '' : __t) +
'\n  </p>\n</div>\n\n<div class="video_files_panel">\n  <h2>' +
((__t = ( I18n.t('pageflow.editor.templates.confirm_encoding.videos_tab') )) == null ? '' : __t) +
'</h2>\n</div>\n\n<div class="audio_files_panel">\n  <h2>' +
((__t = ( I18n.t('pageflow.editor.templates.confirm_encoding.audios_tab') )) == null ? '' : __t) +
'</h2>\n</div>\n\n<div class="summary">\n</div>\n<button class="confirm">' +
((__t = ( I18n.t('pageflow.editor.templates.confirm_encoding.confirm_button') )) == null ? '' : __t) +
'</button>\n';
return __p
}

var ConfirmEncodingView = Marionette.ItemView.extend({
  template: template$5,
  className: 'confirm_encoding',
  ui: {
    blankSlate: '.blank_slate',
    videoFilesPanel: '.video_files_panel',
    audioFilesPanel: '.audio_files_panel',
    summary: '.summary',
    confirmButton: 'button'
  },
  events: {
    'click button': function clickButton() {
      this.model.saveAndReset();
    }
  },
  initialize: function initialize() {
    this.confirmableVideoFiles = state.videoFiles.confirmable();
    this.confirmableAudioFiles = state.audioFiles.confirmable();
  },
  onRender: function onRender() {
    this.listenTo(this.model, 'change', this.updateSummary);
    this.listenTo(this.confirmableAudioFiles, 'add remove', this.updateBlankSlate);
    this.listenTo(this.confirmableVideoFiles, 'add remove', this.updateBlankSlate);
    this.ui.videoFilesPanel.append(this.subview(new CollectionView({
      tagName: 'ul',
      className: 'confirmable_files',
      collection: this.confirmableVideoFiles,
      itemViewConstructor: ConfirmableFileItemView,
      itemViewOptions: {
        selectedFiles: this.model.videoFiles
      }
    })).el);
    this.ui.audioFilesPanel.append(this.subview(new CollectionView({
      tagName: 'ul',
      className: 'confirmable_files',
      collection: this.confirmableAudioFiles,
      itemViewConstructor: ConfirmableFileItemView,
      itemViewOptions: {
        selectedFiles: this.model.audioFiles
      }
    })).el);
    this.update();
  },
  update: function update() {
    this.updateBlankSlate();
    this.updateSummary();
  },
  updateBlankSlate: function updateBlankSlate() {
    this.ui.blankSlate.toggle(!this.confirmableVideoFiles.length && !this.confirmableAudioFiles.length);
    this.ui.videoFilesPanel.toggle(!!this.confirmableVideoFiles.length);
    this.ui.audioFilesPanel.toggle(!!this.confirmableAudioFiles.length);
  },
  updateSummary: function updateSummary(enabled) {
    this.ui.summary.html(this.model.get('summary_html'));
    this.ui.confirmButton.toggleClass('checking', !!this.model.get('checking'));

    if (this.model.get('empty') || this.model.get('exceeding') || this.model.get('checking')) {
      this.ui.confirmButton.attr('disabled', true);
    } else {
      this.ui.confirmButton.removeAttr('disabled');
    }
  }
});

ConfirmEncodingView.create = function (options) {
  return new BackButtonDecoratorView({
    view: new ConfirmEncodingView(options)
  });
};

/**
 * Mixin for Marionette Views that sets css class names according to
 * life cycle events of its model.
 *
 * @param {Object} options
 * @param {Object} options.classNames
 * @param {String} options.classNames.creating -
 *   Class name to add to root element while model is still being created.
 * @param {String} options.classNames.destroying -
 *   Class name to add to root element while model is being destroyed.
 * @param {String} options.classNames.failed -
 *   Class name to add to root element while model is in failed state.
 *   Model needs to include {@link failureTracking} mixin.
 * @param {String} options.classNames.failureMessage -
 *   Class name of the element that shall be updated with the failure
 *   message. Model needs to include {@link failureTracking} mixin.
 * @param {String} options.classNames.retryButton -
 *   Class name of the element that shall act as a retry button.
 */

function modelLifecycleTrackingView(_ref) {
  var classNames = _ref.classNames;
  return {
    events: _defineProperty({}, "click .".concat(classNames.retryButton), function click() {
      editor$1.failures.retry();
      return false;
    }),
    initialize: function initialize() {
      var _this = this;

      if (classNames.creating) {
        this.listenTo(this.model, 'change:id', function () {
          this.$el.removeClass(classNames.creating);
        });
      }

      if (classNames.destroying) {
        this.listenTo(this.model, 'destroying', function () {
          this.$el.addClass(classNames.destroying);
        });
        this.listenTo(this.model, 'error', function () {
          this.$el.removeClass(classNames.destroying);
        });
      }

      if (classNames.failed || classNames.failureMessage) {
        this.listenTo(this.model, 'change:failed', function () {
          return _this.updateFailIndicator();
        });
      }
    },
    render: function render() {
      if (this.model.isNew()) {
        this.$el.addClass(classNames.creating);
      }

      if (this.model.isDestroying && this.model.isDestroying()) {
        this.$el.addClass(classNames.destroying);
      }

      this.updateFailIndicator();
    },
    updateFailIndicator: function updateFailIndicator() {
      if (classNames.failed) {
        this.$el.toggleClass(classNames.failed, this.model.isFailed());
      }

      if (classNames.failureMessage) {
        this.$el.find(".".concat(classNames.failureMessage)).text(this.model.getFailureMessage());
      }
    }
  };
}

var failureIndicatingView = modelLifecycleTrackingView({
  classNames: {
    failed: 'failed',
    failureMessage: 'failure .message',
    retryButton: 'retry'
  }
});

function template$6(data) {
var __t, __p = '';
__p += '<a class="back">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_chapter.outline') )) == null ? '' : __t) +
'</a>\n<a class="destroy">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_chapter.destroy') )) == null ? '' : __t) +
'</a>\n\n<div class="failure">\n  <p>' +
((__t = ( I18n.t('pageflow.editor.templates.edit_chapter.save_error') )) == null ? '' : __t) +
'</p>\n  <p class="message"></p>\n  <a class="retry" href="">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_chapter.retry') )) == null ? '' : __t) +
'</a>\n</div>\n\n<div class="form_container"></div>';
return __p
}

var EditChapterView = Marionette.Layout.extend({
  template: template$6,
  className: 'edit_chapter',
  mixins: [failureIndicatingView],
  regions: {
    formContainer: '.form_container'
  },
  events: {
    'click a.back': 'goBack',
    'click a.destroy': 'destroy'
  },
  onRender: function onRender() {
    var configurationEditor = new ConfigurationEditorView({
      model: this.model.configuration
    });
    this.configure(configurationEditor);
    this.formContainer.show(configurationEditor);
  },
  configure: function configure(configurationEditor) {
    var view = this;
    configurationEditor.tab('general', function () {
      this.input('title', TextInputView, {
        model: view.model
      });

      if (pageflow.features.isEnabled('chapter_hierachy')) {
        this.input('display_parent_page_button', CheckBoxInputView);
      }
    });
  },
  destroy: function destroy() {
    if (confirm(I18n$1.t('pageflow.editor.views.edit_chapter_view.confirm_destroy'))) {
      this.model.destroy();
      this.goBack();
    }
  },
  goBack: function goBack() {
    editor$1.navigate('/', {
      trigger: true
    });
  }
});

function template$7(data) {
var __t, __p = '';
__p += '<a class="close" href="#">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_entry.close') )) == null ? '' : __t) +
'</a>\n<a class="publish" href="#" data-tooltip-align="bottom right">\n  ' +
((__t = ( I18n.t('pageflow.editor.templates.edit_entry.publish') )) == null ? '' : __t) +
'\n</a>\n\n<ul class="menu">\n  <li>\n    <a class="edit_entry_meta_data" href="#" data-path="/meta_data">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_entry.metadata') )) == null ? '' : __t) +
'</a>\n    <span class="failure_icon" title="' +
((__t = ( I18n.t('pageflow.editor.templates.edit_entry.save_error') )) == null ? '' : __t) +
'" />\n  </li>\n  <li>\n    <a class="manage_files" href="#" data-path="/files">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_entry.manage_files') )) == null ? '' : __t) +
'</a>\n  </li>\n</ul>\n\n<div class="edit_entry_outline_region"></div>\n';
return __p
}

var EditEntryView = Marionette.Layout.extend({
  template: template$7,
  mixins: [failureIndicatingView, tooltipContainer],
  ui: {
    publishButton: 'a.publish',
    publicationStateButton: 'a.publication_state',
    menu: '.menu'
  },
  regions: {
    outlineRegion: '.edit_entry_outline_region'
  },
  events: {
    'click a.close': function clickAClose() {
      $.when(state.editLock.release()).then(function () {
        window.location = '/admin/entries/' + state.entry.id;
      });
    },
    'click a.publish': function clickAPublish() {
      if (!this.ui.publishButton.hasClass('disabled')) {
        editor$1.navigate('/publish', {
          trigger: true
        });
      }

      return false;
    },
    'click .menu a': function clickMenuA(event) {
      editor$1.navigate($(event.target).data('path'), {
        trigger: true
      });
      return false;
    }
  },
  onRender: function onRender() {
    this._addMenuItems();

    this._updatePublishButton();

    this.outlineRegion.show(new editor$1.entryType.outlineView({
      entry: state.entry,
      navigatable: true,
      editable: true,
      displayInNavigationHint: true,
      rememberLastSelection: true,
      storylineId: this.options.storylineId
    }));
  },
  _updatePublishButton: function _updatePublishButton() {
    var disabled = !this.model.get('publishable');
    this.ui.publishButton.toggleClass('disabled', disabled);

    if (disabled) {
      this.ui.publishButton.attr('data-tooltip', 'pageflow.editor.views.edit_entry_view.cannot_publish');
    } else {
      this.ui.publishButton.removeAttr('data-tooltip');
    }
  },
  _addMenuItems: function _addMenuItems() {
    var view = this;

    _$1.each(editor$1.mainMenuItems, function (options) {
      var item = $('<li><a href="#"></a></li>');
      var link = item.find('a');

      if (options.path) {
        link.data('path', options.path);
      }

      link.text(I18n$1.t(options.translationKey));

      if (options.click) {
        $(link).click(options.click);
      }

      view.ui.menu.append(item);
    });
  }
});

function template$8(data) {
var __t, __p = '';
__p += '<div class="widget_type">\n</div>\n<a class="settings" title="' +
((__t = ( I18n.t('pageflow.editor.templates.widget_item.settings') )) == null ? '' : __t) +
'"></a>\n';
return __p
}

var WidgetItemView = Marionette.Layout.extend({
  template: template$8,
  tagName: 'li',
  className: 'widget_item',
  regions: {
    widgetTypeContainer: '.widget_type'
  },
  ui: {
    role: 'h2'
  },
  modelEvents: {
    'change:type_name': 'update'
  },
  events: {
    'click .settings': function clickSettings() {
      editor$1.navigate('/widgets/' + this.model.role(), {
        trigger: true
      });
      return false;
    }
  },
  onRender: function onRender() {
    var widgetTypes = this.options.widgetTypes.findAllByRole(this.model.role()) || [];
    var isOptional = this.options.widgetTypes.isOptional(this.model.role());
    this.widgetTypeContainer.show(new SelectInputView({
      model: this.model,
      propertyName: 'type_name',
      label: I18n$1.t('pageflow.widgets.roles.' + this.model.role()),
      collection: widgetTypes,
      valueProperty: 'name',
      translationKeyProperty: 'translationKey',
      includeBlank: isOptional || !this.model.get('type_name')
    }));
    this.$el.toggleClass('is_hidden', widgetTypes.length <= 1 && !this.model.hasConfiguration() && !isOptional);
    this.update();
  },
  update: function update() {
    this.$el.toggleClass('has_settings', this.model.hasConfiguration());
  }
});

function template$9(data) {
var __p = '';
__p += '<ol class="widgets">\n</ol>\n';
return __p
}

var EditWidgetsView = Marionette.Layout.extend({
  template: template$9,
  ui: {
    widgets: '.widgets'
  },
  onRender: function onRender() {
    this.subview(new CollectionView({
      el: this.ui.widgets,
      collection: this.model.widgets,
      itemViewConstructor: WidgetItemView,
      itemViewOptions: {
        widgetTypes: this.options.widgetTypes
      }
    }).render());
  }
});

function template$a(data) {
var __p = '';
__p += '<div class="image"></div>\n<div class="label"></div>\n';
return __p
}

var BackgroundPositioningPreviewView = Marionette.ItemView.extend({
  template: template$a,
  className: 'preview',
  modelEvents: {
    change: 'update'
  },
  ui: {
    image: '.image',
    label: '.label'
  },
  onRender: function onRender() {
    this.update();
  },
  update: function update() {
    var ratio = this.options.ratio;
    var max = this.options.maxSize;
    var width = ratio > 1 ? max : max * ratio;
    var height = ratio > 1 ? max / ratio : max;
    this.ui.image.css({
      width: width + 'px',
      height: height + 'px',
      backgroundImage: this.imageValue(),
      backgroundPosition: this.model.getFilePosition(this.options.propertyName, 'x') + '% ' + this.model.getFilePosition(this.options.propertyName, 'y') + '%'
    });
    this.ui.label.text(this.options.label);
  },
  imageValue: function imageValue() {
    var file = this.model.getReference(this.options.propertyName, this.options.filesCollection);
    return file ? 'url("' + file.getBackgroundPositioningImageUrl() + '")' : 'none';
  }
});

function template$b(data) {
var __p = '';
__p += '<div class="container">\n  <div class="slider horizontal">\n  </div>\n  <div class="slider vertical">\n  </div>\n  <div class="percent horizontal">\n    <input type="number" min="0" max="100">\n    %\n  </div>\n  <div class="percent vertical">\n    <input type="number" min="0" max="100">\n    %\n  </div>\n</div>\n';
return __p
}

var BackgroundPositioningSlidersView = Marionette.ItemView.extend({
  template: template$b,
  className: '',
  ui: {
    container: '.container',
    sliderHorizontal: '.horizontal.slider',
    sliderVertical: '.vertical.slider',
    inputHorizontal: '.percent.horizontal input',
    inputVertical: '.percent.vertical input'
  },
  events: {
    'mousedown img': function mousedownImg(event) {
      var view = this;
      view.saveFromEvent(event);

      function onMove(event) {
        view.saveFromEvent(event);
      }

      function onUp() {
        $('.background_positioning.dialog').off('mousemove', onMove).off('mouseup', onUp);
      }

      $('.background_positioning.dialog').on('mousemove', onMove).on('mouseup', onUp);
    },
    'dragstart img': function dragstartImg(event) {
      event.preventDefault();
    }
  },
  modelEvents: {
    change: 'update'
  },
  onRender: function onRender() {
    var view = this;
    var file = this.model.getReference(this.options.propertyName, this.options.filesCollection),
        image = $('<img />').attr('src', file.getBackgroundPositioningImageUrl());
    this.ui.container.append(image);
    this.ui.sliderVertical.slider({
      orientation: 'vertical',
      change: function change(event, ui) {
        view.save('y', 100 - ui.value);
      },
      slide: function slide(event, ui) {
        view.save('y', 100 - ui.value);
      }
    });
    this.ui.sliderHorizontal.slider({
      orientation: 'horizontal',
      change: function change(event, ui) {
        view.save('x', ui.value);
      },
      slide: function slide(event, ui) {
        view.save('x', ui.value);
      }
    });
    this.ui.inputVertical.on('change', function () {
      view.save('y', $(this).val());
    });
    this.ui.inputHorizontal.on('change', function () {
      view.save('x', $(this).val());
    });
    this.update();
  },
  update: function update() {
    var x = this.model.getFilePosition(this.options.propertyName, 'x');
    var y = this.model.getFilePosition(this.options.propertyName, 'y');
    this.ui.sliderVertical.slider('value', 100 - y);
    this.ui.sliderHorizontal.slider('value', x);
    this.ui.inputVertical.val(y);
    this.ui.inputHorizontal.val(x);
  },
  saveFromEvent: function saveFromEvent(event) {
    var x = event.pageX - this.ui.container.offset().left;
    var y = event.pageY - this.ui.container.offset().top;
    this.save('x', Math.round(x / this.ui.container.width() * 100));
    this.save('y', Math.round(y / this.ui.container.width() * 100));
  },
  save: function save(coord, value) {
    this.model.setFilePosition(this.options.propertyName, coord, Math.min(100, Math.max(0, value)));
  }
});

function template$c(data) {
var __t, __p = '';
__p += '<div class="box">\n  <h2>' +
((__t = ( I18n.t('pageflow.editor.templates.background_positioning.title') )) == null ? '' : __t) +
'</h2>\n  <p>' +
((__t = ( I18n.t('pageflow.editor.templates.background_positioning.help') )) == null ? '' : __t) +
'</p>\n\n  <div class="wrapper">\n  </div>\n\n  <h3>' +
((__t = ( I18n.t('pageflow.editor.templates.background_positioning.preview_title') )) == null ? '' : __t) +
'</h3>\n  <div class="previews">\n    <div>\n    </div>\n  </div>\n\n  <div class="footer">\n    <a href="" class="save">' +
((__t = ( I18n.t('pageflow.editor.templates.background_positioning.save') )) == null ? '' : __t) +
'</a>\n    <a href="" class="close">' +
((__t = ( I18n.t('pageflow.editor.templates.background_positioning.cancel') )) == null ? '' : __t) +
'</a>\n  </div>\n</div>\n';
return __p
}

var BackgroundPositioningView = Marionette.ItemView.extend({
  template: template$c,
  className: 'background_positioning dialog',
  mixins: [dialogView],
  ui: {
    previews: '.previews > div',
    wrapper: '.wrapper'
  },
  previews: {
    ratio16to9: 16 / 9,
    ratio16to9Portrait: 9 / 16,
    ratio4to3: 4 / 3,
    ratio4to3Portrait: 3 / 4,
    banner: 5 / 1
  },
  events: {
    'click .save': function clickSave() {
      this.save();
      this.close();
    }
  },
  initialize: function initialize() {
    this.transientModel = this.model.clone();
  },
  onRender: function onRender() {
    this.ui.wrapper.append(this.subview(new BackgroundPositioningSlidersView({
      model: this.transientModel,
      propertyName: this.options.propertyName,
      filesCollection: this.options.filesCollection
    })).el);
    this.createPreviews();
  },
  save: function save() {
    this.model.setFilePositions(this.options.propertyName, this.transientModel.getFilePosition(this.options.propertyName, 'x'), this.transientModel.getFilePosition(this.options.propertyName, 'y'));
  },
  createPreviews: function createPreviews() {
    var view = this;

    _$1.each(view.previews, function (ratio, name) {
      view.ui.previews.append(view.subview(new BackgroundPositioningPreviewView({
        model: view.transientModel,
        propertyName: view.options.propertyName,
        filesCollection: view.options.filesCollection,
        ratio: ratio,
        maxSize: 200,
        label: I18n$1.t('pageflow.editor.templates.background_positioning.previews.' + name)
      })).el);
    });
  }
});

BackgroundPositioningView.open = function (options) {
  app.dialogRegion.show(new BackgroundPositioningView(options));
};

function template$d(data) {
var __p = '';
__p += '<div class="label"></div>\n<a href="#"></a>\n';
return __p
}

var DropDownButtonItemView = Marionette.ItemView.extend({
  template: template$d,
  tagName: 'li',
  className: 'drop_down_button_item',
  ui: {
    link: '> a',
    label: '> .label'
  },
  events: {
    'click > a': function clickA() {
      if (!this.model.get('disabled')) {
        this.model.selected();
      }

      return false;
    }
  },
  modelEvents: {
    change: 'update'
  },
  onRender: function onRender() {
    this.update();

    if (this.model.get('items')) {
      this.appendSubview(new this.options.listView({
        items: this.model.get('items')
      }));
    }
  },
  update: function update() {
    this.ui.link.text(this.model.get('label'));
    this.ui.label.text(this.model.get('label'));
    this.$el.toggleClass('is_selectable', !!this.model.selected);
    this.$el.toggleClass('is_disabled', !!this.model.get('disabled'));
    this.$el.toggleClass('is_checked', !!this.model.get('checked'));
    this.$el.data('name', this.model.get('name'));
  }
});

var DropDownButtonItemListView = function DropDownButtonItemListView(options) {
  return new CollectionView({
    tagName: 'ul',
    className: 'drop_down_button_items',
    collection: options.items,
    itemViewConstructor: DropDownButtonItemView,
    itemViewOptions: {
      listView: DropDownButtonItemListView
    }
  });
};

function template$e(data) {
var __p = '';
__p += '<button></button>\n\n<div class="drop_down_button_menu">\n</div>\n';
return __p
}

/**
 * A button that displays a drop down menu on hover.
 *
 * @param {Object} options
 *
 * @param {String} options.label
 *   Button text.
 *
 * @param {Backbone.Collection} options.items
 *   Collection of menu items. See below for supported attributes.
 *
 * ## Item Models
 *
 * The following model attributes can be used to control the
 * appearance of a menu item:
 *
 * - `name` - A name for the menu item which is not displayed.
 * - `label` - Used as menu item label.
 * - `disabled` - Make the menu item inactive.
 * - `checked` - Display a check mark in front of the item
 * - `items` - A Backbone collection of nested menu items.
 *
 * If the menu item model provdised a `selected` method, it is called
 * when the menu item is clicked.
 *
 * @class
 */

var DropDownButtonView = Marionette.ItemView.extend({
  template: template$e,
  className: 'drop_down_button',
  ui: {
    button: '> button',
    menu: '.drop_down_button_menu'
  },
  events: {
    'mouseenter': function mouseenter() {
      this.positionMenu();
      this.showMenu();
    },
    'mouseleave': function mouseleave() {
      this.scheduleHideMenu();
    }
  },
  onRender: function onRender() {
    var view = this;
    this.ui.button.toggleClass('has_icon_and_text', !!this.options.label);
    this.ui.button.toggleClass('has_icon_only', !this.options.label);
    this.ui.button.text(this.options.label);
    this.ui.menu.append(this.subview(new DropDownButtonItemListView({
      items: this.options.items
    })).el);
    this.ui.menu.on({
      'mouseenter': function mouseenter() {
        view.showMenu();
      },
      'mouseleave': function mouseleave() {
        view.scheduleHideMenu();
      }
    });
    this.ui.menu.appendTo('#editor_menu_container');
  },
  onClose: function onClose() {
    this.ui.menu.remove();
  },
  positionMenu: function positionMenu() {
    var offset = this.$el.offset();
    this.ui.menu.css({
      top: offset.top + this.$el.height(),
      left: offset.left
    });
  },
  showMenu: function showMenu() {
    this.ensureOnlyOneDropDownButtonShowsMenu();
    clearTimeout(this.hideMenuTimeout);
    this.ui.menu.addClass('is_visible');
  },
  ensureOnlyOneDropDownButtonShowsMenu: function ensureOnlyOneDropDownButtonShowsMenu() {
    if (DropDownButtonView.currentlyShowingMenu) {
      DropDownButtonView.currentlyShowingMenu.hideMenu();
    }

    DropDownButtonView.currentlyShowingMenu = this;
  },
  hideMenu: function hideMenu() {
    clearTimeout(this.hideMenuTimeout);

    if (!this.isClosed) {
      this.ui.menu.removeClass('is_visible');
    }
  },
  scheduleHideMenu: function scheduleHideMenu() {
    this.hideMenuTimeout = setTimeout(_$1.bind(this.hideMenu, this), 300);
  }
});

function template$f(data) {
var __p = '';
__p += '<div class="pictogram"></div>\n';
return __p
}

var FileThumbnailView = Marionette.ItemView.extend({
  className: 'file_thumbnail',
  template: template$f,
  modelEvents: {
    'change:state': 'update'
  },
  ui: {
    pictogram: '.pictogram'
  },
  onRender: function onRender() {
    this.update();
  },
  update: function update() {
    if (this.model) {
      var stage = this.model.currentStage();

      if (stage) {
        this.setStageClassName(stage.get('name'));
        this.ui.pictogram.toggleClass('action_required', stage.get('action_required'));
        this.ui.pictogram.toggleClass('failed', stage.get('failed'));
      } else {
        this.ui.pictogram.removeClass(this.model.stages.pluck('name').join(' '));
      }

      this.ui.pictogram.addClass(this.model.thumbnailPictogram);
      this.$el.css('background-image', this._imageUrl() ? 'url(' + this._imageUrl() + ')' : '');
      this.$el.removeClass('empty').toggleClass('always_picogram', !!this.model.thumbnailPictogram).toggleClass('ready', this.model.isReady());
    } else {
      this.$el.css('background-image', '');
      this.$el.removeClass('ready');
      this.ui.pictogram.addClass('empty');
    }
  },
  setStageClassName: function setStageClassName(name) {
    if (!this.$el.hasClass(name)) {
      this.ui.pictogram.removeClass('empty');
      this.ui.pictogram.removeClass(this.model.stages.pluck('name').join(' '));
      this.ui.pictogram.addClass(name);
    }
  },
  _imageUrl: function _imageUrl() {
    return this.model.get(this.options.imageUrlPropertyName || 'thumbnail_url');
  }
});

function template$g(data) {
var __t, __p = '';
__p += '<label>\n  <span class="name"></span>\n  <span class="inline_help"></span>\n</label>\n<div class="file_thumbnail"></div>\n<div class="file_name"></div>\n\n<a href="" class="unset" title="' +
((__t = ( I18n.t('pageflow.ui.templates.inputs.file_input.reset') )) == null ? '' : __t) +
'"></a>\n<a href="" class="choose" title="' +
((__t = ( I18n.t('pageflow.ui.templates.inputs.file_input.edit') )) == null ? '' : __t) +
'"></a>\n';
return __p
}

/**
 * Input view to reference a file.
 *
 * @class
 */

var FileInputView = Marionette.ItemView.extend({
  mixins: [inputView],
  template: template$g,
  className: 'file_input',
  ui: {
    fileName: '.file_name',
    thumbnail: '.file_thumbnail'
  },
  events: {
    'click .choose': function clickChoose() {
      editor$1.selectFile({
        name: this.options.collection.name,
        filter: this.options.filter
      }, this.options.fileSelectionHandler || 'pageConfiguration', _$1.extend({
        id: this.model.getRoutableId ? this.model.getRoutableId() : this.model.id,
        attributeName: this.options.propertyName,
        returnToTab: this.options.parentTab
      }, this.options.fileSelectionHandlerOptions || {}));
      return false;
    },
    'click .unset': function clickUnset() {
      this.model.unsetReference(this.options.propertyName);
      return false;
    }
  },
  initialize: function initialize() {
    this.options = _$1.extend({
      positioning: true,
      textTrackFiles: state.textTrackFiles
    }, this.options);

    if (typeof this.options.collection === 'string') {
      this.options.collection = state.entry.getFileCollection(editor$1.fileTypes.findByCollectionName(this.options.collection));
    }

    this.textTrackMenuItems = new Backbone.Collection();
  },
  onRender: function onRender() {
    this.update();
    this.listenTo(this.model, 'change:' + this.options.propertyName, this.update);

    var dropDownMenuItems = this._dropDownMenuItems();

    if (dropDownMenuItems.length) {
      this.appendSubview(new DropDownButtonView({
        items: dropDownMenuItems
      }));
    }
  },
  update: function update() {
    var file = this._getFile();

    this._listenToNestedTextTrackFiles(file);

    this.$el.toggleClass('is_unset', !file);
    this.ui.fileName.text(file ? file.get('file_name') : I18n$1.t('pageflow.ui.views.inputs.file_input_view.none'));
    this.subview(new FileThumbnailView({
      el: this.ui.thumbnail,
      model: file
    }));
  },
  _dropDownMenuItems: function _dropDownMenuItems() {
    var file = this._getFile(file);

    var items = new Backbone.Collection();

    if (this.options.defaultTextTrackFilePropertyName && file) {
      items.add({
        name: 'default_text_track',
        label: I18n$1.t('pageflow.editor.views.inputs.file_input.default_text_track'),
        items: this.textTrackMenuItems
      });
    }

    if (this.options.positioning && file && file.isPositionable()) {
      items.add(new FileInputView.EditBackgroundPositioningMenuItem({
        name: 'edit_background_positioning',
        label: I18n$1.t('pageflow.editor.views.inputs.file_input.edit_background_positioning')
      }, {
        inputModel: this.model,
        propertyName: this.options.propertyName,
        filesCollection: this.options.collection
      }));
    }

    if (file) {
      items.add(new FileInputView.EditFileSettingsMenuItem({
        name: 'edit_file_settings',
        label: I18n$1.t('pageflow.editor.views.inputs.file_input.edit_file_settings')
      }, {
        file: file
      }));
    }

    return items;
  },
  _listenToNestedTextTrackFiles: function _listenToNestedTextTrackFiles(file) {
    if (this.textTrackFiles) {
      this.stopListening(this.textTrackFiles);
      this.textTrackFiles = null;
    }

    if (file && this.options.defaultTextTrackFilePropertyName) {
      this.textTrackFiles = file.nestedFiles(this.options.textTrackFiles);
      this.listenTo(this.textTrackFiles, 'add remove', this._updateTextTrackMenuItems);

      this._updateTextTrackMenuItems();
    }
  },
  _updateTextTrackMenuItems: function update() {
    var models = [null].concat(this.textTrackFiles.toArray());
    this.textTrackMenuItems.set(models.map(function (textTrackFile) {
      return new FileInputView.DefaultTextTrackFileMenuItem({}, {
        textTrackFiles: this.textTrackFiles,
        textTrackFile: textTrackFile,
        inputModel: this.model,
        propertyName: this.options.defaultTextTrackFilePropertyName
      });
    }, this));
  },
  _getFile: function _getFile() {
    return this.model.getReference(this.options.propertyName, this.options.collection);
  }
});
FileInputView.EditBackgroundPositioningMenuItem = Backbone.Model.extend({
  initialize: function initialize(attributes, options) {
    this.options = options;
  },
  selected: function selected() {
    BackgroundPositioningView.open({
      model: this.options.inputModel,
      propertyName: this.options.propertyName,
      filesCollection: this.options.filesCollection
    });
  }
});
FileInputView.EditFileSettingsMenuItem = Backbone.Model.extend({
  initialize: function initialize(attributes, options) {
    this.options = options;
  },
  selected: function selected() {
    FileSettingsDialogView.open({
      model: this.options.file
    });
  }
});
FileInputView.DefaultTextTrackFileMenuItem = Backbone.Model.extend({
  initialize: function initialize(attributes, options) {
    this.options = options;
    this.listenTo(this.options.inputModel, 'change:' + this.options.propertyName, this.update);

    if (this.options.textTrackFile) {
      this.listenTo(this.options.textTrackFile, 'change:configuration', this.update);
    }

    this.update();
  },
  update: function update() {
    this.set('checked', this.options.textTrackFile == this.getDefaultTextTrackFile());
    this.set('name', this.options.textTrackFile ? null : 'no_default_text_track');
    this.set('label', this.options.textTrackFile ? this.options.textTrackFile.displayLabel() : this.options.textTrackFiles.length ? I18n$1.t('pageflow.editor.views.inputs.file_input.auto_default_text_track') : I18n$1.t('pageflow.editor.views.inputs.file_input.no_default_text_track'));
  },
  selected: function selected() {
    if (this.options.textTrackFile) {
      this.options.inputModel.setReference(this.options.propertyName, this.options.textTrackFile);
    } else {
      this.options.inputModel.unsetReference(this.options.propertyName);
    }
  },
  getDefaultTextTrackFile: function getDefaultTextTrackFile() {
    return this.options.inputModel.getReference(this.options.propertyName, this.options.textTrackFiles);
  }
});

function template$h(data) {
var __p = '';
__p += '<div class="spinner">\n  <div class="rect1"></div>\n  <div class="rect2"></div>\n  <div class="rect3"></div>\n  <div class="rect4"></div>\n  <div class="rect5"></div>\n</div>\n';
return __p
}

var LoadingView = Marionette.ItemView.extend({
  template: template$h,
  className: 'loading',
  tagName: 'li'
});

var selectableView = {
  initialize: function initialize() {
    this.selectionAttribute = this.selectionAttribute || this.model.modelName;
    this.listenTo(this.options.selection, 'change:' + this.selectionAttribute, function (selection, selectedModel) {
      this.$el.toggleClass('active', selectedModel === this.model);
    });
    this.$el.toggleClass('active', this.options.selection.get(this.selectionAttribute) === this.model);
  },
  select: function select() {
    this.options.selection.set(this.selectionAttribute, this.model);
  },
  onClose: function onClose() {
    if (this.options.selection.get(this.selectionAttribute) === this.model) {
      this.options.selection.set(this.selectionAttribute, null);
    }
  }
};

function template$i(data) {
var __t, __p = '';
__p += '<span class="theme_name"></span>\n<span class="button_or_checkmark">\n  <p class="theme_in_use"></p>\n  <a class="use_theme">' +
((__t = ( I18n.t('pageflow.editor.templates.theme.use') )) == null ? '' : __t) +
'</a>\n</span>\n';
return __p
}

var ThemeItemView = Marionette.ItemView.extend({
  tagName: 'li',
  template: template$i,
  className: 'theme_item',
  mixins: [selectableView],
  selectionAttribute: 'theme',
  ui: {
    themeName: '.theme_name',
    useButton: '.use_theme',
    inUseRegion: '.theme_in_use'
  },
  events: {
    'click .use_theme': function clickUse_theme() {
      this.options.onUse(this.model);
    },
    'mouseenter': 'select',
    'click': 'select'
  },
  onRender: function onRender() {
    this.$el.data('themeName', this.model.get('name'));
    this.ui.themeName.text(this.model.title());

    if (this.inUse()) {
      this.ui.inUseRegion.text('✓');
    }

    this.ui.useButton.toggle(!this.inUse());
  },
  inUse: function inUse() {
    return this.model.get('name') === this.options.themeInUse;
  }
});

function template$j(data) {
var __t, __p = '';
__p += '<div class="box">\n  <div class="content">\n    <div>\n      <h2 class="themes_header">' +
((__t = ( I18n.t('pageflow.editor.templates.change_theme_dialog.header') )) == null ? '' : __t) +
'</h2>\n      <div class="themes_panel">\n      </div>\n      <div class="preview_panel">\n        <h2 class="preview_header">' +
((__t = ( I18n.t('pageflow.editor.templates.change_theme_dialog.preview_header_prefix') )) == null ? '' : __t) +
'\n          <span class="preview_header_theme_name"></span>' +
((__t = ( I18n.t('pageflow.editor.templates.change_theme_dialog.preview_header_suffix') )) == null ? '' : __t) +
'\n        </h2>\n        <div class="preview_image_region">\n          <img class="preview_image" src="default_template.png">\n        </div>\n      </div>\n    </div>\n  </div>\n\n  <div class="footer">\n    <a href="" class="close">\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.change_theme_dialog.close') )) == null ? '' : __t) +
'\n    </a>\n  </div>\n</div>\n';
return __p
}

var ChangeThemeDialogView = Marionette.ItemView.extend({
  template: template$j,
  className: 'change_theme dialog editor',
  mixins: [dialogView],
  ui: {
    content: '.content',
    themesPanel: '.themes_panel',
    previewPanel: '.preview_panel',
    previewImageRegion: '.preview_image_region',
    previewImage: '.preview_image',
    previewHeaderThemeName: '.preview_header_theme_name'
  },
  initialize: function initialize(options) {
    this.selection = new Backbone.Model();
    var themeInUse = this.options.themes.findByName(this.options.themeInUse);
    this.selection.set('theme', themeInUse);
    this.listenTo(this.selection, 'change:theme', function () {
      if (!this.selection.get('theme')) {
        this.selection.set('theme', themeInUse);
      }

      this.update();
    });
  },
  onRender: function onRender() {
    var themes = this.options.themes;
    this.themesView = new CollectionView({
      collection: themes,
      tagName: 'ul',
      itemViewConstructor: ThemeItemView,
      itemViewOptions: {
        selection: this.selection,
        onUse: this.options.onUse,
        themes: themes,
        themeInUse: this.options.themeInUse
      }
    });
    this.ui.themesPanel.append(this.subview(this.themesView).el);
    this.ui.previewPanel.append(this.subview(new LoadingView({
      tagName: 'div'
    })).el);
    this.update();
  },
  update: function update() {
    var that = this;
    var selectedTheme = this.options.themes.findByName(that.selection.get('theme').get('name'));
    this.ui.previewImage.hide();
    this.ui.previewImage.one('load', function () {
      $(this).show();
    });
    this.ui.previewImage.attr('src', selectedTheme.get('preview_image_url'));
    this.ui.previewHeaderThemeName.text(selectedTheme.title());
  }
});

ChangeThemeDialogView.changeTheme = function (options) {
  return $.Deferred(function (deferred) {
    options.onUse = function (theme) {
      deferred.resolve(theme);
      view.close();
    };

    var view = new ChangeThemeDialogView(options);
    view.on('close', function () {
      deferred.reject();
    });
    app.dialogRegion.show(view.render());
  }).promise();
};

function template$k(data) {
var __p = '';
__p += '\n';
return __p
}

var StaticThumbnailView = Marionette.ItemView.extend({
  template: template$k,
  className: 'static_thumbnail',
  modelEvents: {
    'change:configuration': 'update'
  },
  onRender: function onRender() {
    this.update();
  },
  update: function update() {
    this.$el.css('background-image', 'url(' + this._imageUrl() + ')');
  },
  _imageUrl: function _imageUrl() {
    return this.model.thumbnailUrl();
  }
});

/**
 * Base thumbnail view for models supporting a `thumbnailFile` method.
 *
 * @class
 */

var ModelThumbnailView = Marionette.View.extend({
  className: 'model_thumbnail',
  modelEvents: {
    'change:configuration': 'update'
  },
  render: function render() {
    this.update();
    return this;
  },
  update: function update() {
    if (this.model) {
      if (_$1.isFunction(this.model.thumbnailFile)) {
        var file = this.model && this.model.thumbnailFile();

        if (this.thumbnailView && this.currentFileThumbnail == file) {
          return;
        }

        this.currentFileThumbnail = file;
        this.newThumbnailView = new FileThumbnailView({
          model: file,
          className: 'thumbnail file_thumbnail',
          imageUrlPropertyName: this.options.imageUrlPropertyName
        });
      } else {
        this.newThumbnailView = this.newThumbnailView || new StaticThumbnailView({
          model: this.model
        });
      }
    }

    if (this.thumbnailView) {
      this.thumbnailView.close();
    }

    if (this.model) {
      this.thumbnailView = this.subview(this.newThumbnailView);
      this.$el.append(this.thumbnailView.el);
    }
  }
});

function template$l(data) {
var __p = '';
__p += '<label>\n  <span class="name"></span>\n  <span class="inline_help"></span>\n</label>\n<div class="title"></div>\n<button class="unset"></button>\n<button class="choose"></button>\n';
return __p
}

/**
 * Base class for input views that reference models.
 *
 * @class
 */

var ReferenceInputView = Marionette.ItemView.extend(
/** @lends ReferenceInputView.prototype */
{
  mixins: [inputView],
  template: template$l,
  className: 'reference_input',
  ui: {
    title: '.title',
    chooseButton: '.choose',
    unsetButton: '.unset',
    buttons: 'button'
  },
  events: {
    'click .choose': function clickChoose() {
      var view = this;
      this.chooseValue().then(function (id) {
        view.model.set(view.options.propertyName, id);
      });
      return false;
    },
    'click .unset': function clickUnset() {
      this.model.unset(this.options.propertyName);
      return false;
    }
  },
  initialize: function initialize() {
    this.listenTo(this.model, 'change:' + this.options.propertyName, this.update);
  },
  onRender: function onRender() {
    this.update();
    this.listenTo(this.model, 'change:' + this.options.propertyName, this.update);
  },

  /**
   * Returns a promise for some identifying attribute.
   *
   * Default attribute name is perma_id. If the attribute is named
   * differently, you can have your specific ReferenceInputView
   * implement `chooseValue()` accordingly.
   *
   * Will be used to set the chosen Model for this View.
   */
  chooseValue: function chooseValue() {
    return this.choose().then(function (model) {
      return model.get('perma_id');
    });
  },
  choose: function choose() {
    throw 'Not implemented: Override ReferenceInputView#choose to return a promise';
  },
  getTarget: function getTarget(targetId) {
    throw 'Not implemented: Override ReferenceInputView#getTarget';
  },
  createThumbnailView: function createThumbnailView(target) {
    return new ModelThumbnailView({
      model: target
    });
  },
  update: function update() {
    if (this.isClosed) {
      return;
    }

    var target = this.getTarget(this.model.get(this.options.propertyName));
    this.ui.title.text(target ? target.title() : I18n$1.t('pageflow.editor.views.inputs.reference_input_view.none'));
    this.ui.unsetButton.toggle(!!target && !this.options.hideUnsetButton);
    this.ui.unsetButton.attr('title', this.options.unsetButtonTitle || I18n$1.t('pageflow.editor.views.inputs.reference_input_view.unset'));
    this.ui.chooseButton.attr('title', this.options.chooseButtonTitle || I18n$1.t('pageflow.editor.views.inputs.reference_input_view.choose'));
    this.updateDisabledAttribute(this.ui.buttons);

    if (this.thumbnailView) {
      this.thumbnailView.close();
    }

    this.thumbnailView = this.subview(this.createThumbnailView(target));
    this.ui.title.before(this.thumbnailView.el);
  }
});

var ThemeInputView = ReferenceInputView.extend({
  options: function options() {
    return {
      chooseButtonTitle: I18n$1.t('pageflow.editor.views.inputs.theme_input_view.choose'),
      hideUnsetButton: true
    };
  },
  choose: function choose() {
    return ChangeThemeDialogView.changeTheme({
      model: this.model,
      themes: this.options.themes,
      themeInUse: this.model.get(this.options.propertyName)
    });
  },
  chooseValue: function chooseValue() {
    return this.choose().then(function (model) {
      return model.get('name');
    });
  },
  getTarget: function getTarget(themeName) {
    return this.options.themes.findByName(themeName);
  }
});

function template$m(data) {
var __t, __p = '';
__p += '<a class="back">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_meta_data.outline') )) == null ? '' : __t) +
'</a>\n\n<div class="failure">\n  <p>' +
((__t = ( I18n.t('pageflow.editor.templates.edit_meta_data.save_error') )) == null ? '' : __t) +
'</p>\n  <p class="message"></p>\n  <a class="retry" href="">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_meta_data.retry') )) == null ? '' : __t) +
'</a>\n</div>\n\n<div class="form_fields"></div>\n';
return __p
}

var EditMetaDataView = Marionette.Layout.extend({
  template: template$m,
  className: 'edit_meta_data',
  mixins: [failureIndicatingView],
  regions: {
    formContainer: '.form_fields'
  },
  events: {
    'click a.back': 'goBack'
  },
  onRender: function onRender() {
    var entry = this.model;
    var state = this.options.state || {};
    var features = this.options.features || {};
    var editor = this.options.editor || {};
    var configurationEditor = new ConfigurationEditorView({
      model: entry.metadata.configuration,
      tab: this.options.tab,
      attributeTranslationKeyPrefixes: ['pageflow.entry_types.' + editor.entryType.name + '.editor.entry_metadata_configuration_attributes']
    });
    configurationEditor.tab('general', function () {
      this.input('title', TextInputView, {
        placeholder: entry.get('entry_title'),
        model: entry.metadata
      });
      this.input('locale', SelectInputView, {
        values: state.config.availablePublicLocales,
        texts: _$1.map(state.config.availablePublicLocales, function (locale) {
          return I18n$1.t('pageflow.public._language', {
            locale: locale
          });
        }),
        model: entry.metadata
      });
      this.input('credits', TextAreaInputView, {
        model: entry.metadata
      });
      this.input('author', TextInputView, {
        placeholder: state.config.defaultAuthorMetaTag,
        model: entry.metadata
      });
      this.input('publisher', TextInputView, {
        placeholder: state.config.defaultPublisherMetaTag,
        model: entry.metadata
      });
      this.input('keywords', TextInputView, {
        placeholder: state.config.defaultKeywordsMetaTag,
        model: entry.metadata
      });
    });
    configurationEditor.tab('widgets', function () {
      editor.entryType.appearanceInputs && editor.entryType.appearanceInputs(this, {
        entry: entry,
        theming: state.theming
      });
      entry.widgets && this.view(EditWidgetsView, {
        model: entry,
        widgetTypes: editor.widgetTypes
      });

      if (features.isEnabled && features.isEnabled('selectable_themes') && state.themes.length > 1) {
        this.view(ThemeInputView, {
          themes: state.themes,
          propertyName: 'theme_name',
          model: entry.metadata
        });
      }
    });
    configurationEditor.tab('social', function () {
      this.input('share_image_id', FileInputView, {
        collection: state.imageFiles,
        fileSelectionHandler: 'entryMetadata',
        model: entry.metadata
      });
      this.input('summary', TextAreaInputView, {
        disableRichtext: true,
        disableLinks: true,
        model: entry.metadata
      });
      this.input('share_url', TextInputView, {
        placeholder: state.entry.get('pretty_url'),
        model: entry.metadata
      });
      this.input('share_providers', CheckBoxGroupInputView, {
        values: state.config.availableShareProviders,
        translationKeyPrefix: 'activerecord.values.pageflow/entry.share_providers',
        model: entry.metadata
      });
    });
    this.listenTo(entry.metadata, 'change:theme_name', function () {
      configurationEditor.refresh();
    });
    this.formContainer.show(configurationEditor);
  },
  goBack: function goBack() {
    editor.navigate('/', {
      trigger: true
    });
  }
});

function template$n(data) {
var __t, __p = '';
__p += '<a class="back">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_page_link.back') )) == null ? '' : __t) +
'</a>\n<a class="destroy">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_page_link.destroy') )) == null ? '' : __t) +
'</a>\n<div class="form_container"></div>\n';
return __p
}

var EditPageLinkView = Marionette.Layout.extend({
  template: template$n,
  regions: {
    formContainer: '.form_container'
  },
  ui: {
    backButton: 'a.back'
  },
  events: {
    'click a.back': 'goBack',
    'click a.destroy': 'destroy'
  },
  onRender: function onRender() {
    var pageType = this.options.api.pageTypes.findByPage(this.options.page);
    var configurationEditor = pageType.createPageLinkConfigurationEditorView({
      model: this.model,
      page: this.options.page
    });
    this.formContainer.show(configurationEditor);
    this.highlight();
  },
  highlight: function highlight() {
    this.model.highlight();
    this.listenTo(this, 'close', function () {
      this.model.resetHighlight();
    });
  },
  destroy: function destroy() {
    if (confirm(I18n$1.t('pageflow.internal_links.editor.views.edit_page_link_view.confirm_destroy'))) {
      this.model.remove();
      this.goBack();
    }
  },
  goBack: function goBack() {
    editor$1.navigate('/pages/' + this.options.page.id + '/links', {
      trigger: true
    });
  }
});

function template$o(data) {
var __t, __p = '';
__p += '<a class="back">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_page.outline') )) == null ? '' : __t) +
'</a>\n<a class="destroy">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_page.destroy') )) == null ? '' : __t) +
'</a>\n\n<div class="failure">\n  <p>' +
((__t = ( I18n.t('pageflow.editor.templates.edit_page.save_error') )) == null ? '' : __t) +
'</p>\n  <p class="message"></p>\n  <a class="retry" href="">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_page.retry') )) == null ? '' : __t) +
'</a>\n</div>\n\n<div class="page_type"></div>\n\n<div class="configuration_container"></div>';
return __p
}

var EditPageView = Marionette.Layout.extend({
  template: template$o,
  className: 'edit_page',
  mixins: [failureIndicatingView],
  regions: {
    pageTypeContainer: '.page_type',
    configurationContainer: '.configuration_container'
  },
  events: {
    'click a.back': 'goBack',
    'click a.destroy': 'destroy'
  },
  modelEvents: {
    'change:template': 'load'
  },
  onRender: function onRender() {
    this.pageTypeContainer.show(new ExtendedSelectInputView({
      model: this.model,
      propertyName: 'template',
      collection: this.options.api.pageTypes.pluck('seed'),
      valueProperty: 'name',
      translationKeyProperty: 'translation_key',
      groupTranslationKeyProperty: 'category_translation_key',
      descriptionTranslationKeyProperty: 'description_translation_key',
      pictogramClass: 'type_pictogram',
      helpLinkClicked: function helpLinkClicked(value) {
        var pageType = this.options.api.pageTypes.findByName(value);
        app.trigger('toggle-help', pageType.seed.help_entry_translation_key);
      }
    }));
    this.load();
    this.model.trigger('edit', this.model);
  },
  onShow: function onShow() {
    this.configurationEditor.refreshScroller();
  },
  load: function load() {
    this.configurationEditor = this.options.api.createPageConfigurationEditorView(this.model, {
      tab: this.options.tab
    });
    this.configurationContainer.show(this.configurationEditor);
  },
  destroy: function destroy() {
    if (confirm(I18n$1.t('pageflow.editor.views.edit_page_view.confirm_destroy'))) {
      this.model.destroy();
      this.goBack();
    }
  },
  goBack: function goBack() {
    editor$1.navigate('/', {
      trigger: true
    });
  }
});

var PageLinkInputView = ReferenceInputView.extend({
  choose: function choose() {
    return editor$1.selectPage({
      isAllowed: this.options.isAllowed
    });
  },
  getTarget: function getTarget(permaId) {
    return state.pages.getByPermaId(permaId);
  }
});

function template$p(data) {
var __t, __p = '';
__p += '<a class="back">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_storyline.outline') )) == null ? '' : __t) +
'</a>\n<a class="destroy" data-tooltip-align="bottom right">\n  ' +
((__t = ( I18n.t('pageflow.editor.templates.edit_storyline.destroy') )) == null ? '' : __t) +
'\n</a>\n\n<div class="failure">\n  <p>' +
((__t = ( I18n.t('pageflow.editor.templates.edit_storyline.save_error') )) == null ? '' : __t) +
'</p>\n  <p class="message"></p>\n  <a class="retry" href="">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_storyline.retry') )) == null ? '' : __t) +
'</a>\n</div>\n\n<div class="form_container"></div>\n';
return __p
}

var EditStorylineView = Marionette.Layout.extend({
  template: template$p,
  className: 'edit_storyline',
  mixins: [failureIndicatingView, tooltipContainer],
  regions: {
    formContainer: '.form_container'
  },
  ui: {
    destroyButton: 'a.destroy'
  },
  events: {
    'click a.back': 'goBack',
    'click a.destroy': 'destroy'
  },
  onRender: function onRender() {
    var configurationEditor = new ConfigurationEditorView({
      model: this.model.configuration,
      attributeTranslationKeyPrefixes: ['pageflow.storyline_attributes']
    });
    this.configure(configurationEditor, this.model.transitiveChildPages());
    this.formContainer.show(configurationEditor);
    this.updateDestroyButton();
  },
  updateDestroyButton: function updateDestroyButton() {
    var disabled = this.model.chapters.length > 0;
    this.ui.destroyButton.toggleClass('disabled', disabled);

    if (disabled) {
      this.ui.destroyButton.attr('data-tooltip', 'pageflow.editor.views.edit_storyline_view.cannot_destroy');
    } else {
      this.ui.destroyButton.removeAttr('data-tooltip');
    }
  },
  configure: function configure(configurationEditor, storylineChildPages) {
    configurationEditor.tab('general', function () {
      this.input('title', TextInputView);
      this.input('main', CheckBoxInputView, {
        disabled: true,
        visibleBinding: 'main'
      });
      this.group('page_transitions', {
        includeBlank: true
      });
      this.input('main', CheckBoxInputView, {
        visibleBinding: 'main',
        visible: function visible(isMain) {
          return !isMain;
        }
      });
      this.input('parent_page_perma_id', PageLinkInputView, {
        visibleBinding: 'main',
        visible: function visible(isMain) {
          return !isMain && state.storylines.length > 1;
        },
        isAllowed: function isAllowed(page) {
          return !storylineChildPages.contain(page);
        }
      });
      this.input('scroll_successor_id', PageLinkInputView);

      if (pageflow.features.isEnabled('chapter_hierachy')) {
        this.input('navigation_bar_mode', SelectInputView, {
          values: pageflow.ChapterFilter.strategies
        });
      }
    });
  },
  destroy: function destroy() {
    if (this.model.chapters.length) {
      return;
    }

    if (confirm(I18n$1.t('pageflow.editor.views.edit_storyline_view.confirm_destroy'))) {
      this.model.destroy();
      this.goBack();
    }
  },
  goBack: function goBack() {
    editor$1.navigate('/?storyline=' + this.model.id, {
      trigger: true
    });
  }
});

function template$q(data) {
var __t, __p = '';
__p += '<a class="back">' +
((__t = ( I18n.t('pageflow.editor.templates.edit_widget.back') )) == null ? '' : __t) +
'</a>\n';
return __p
}

var EditWidgetView = Marionette.ItemView.extend({
  template: template$q,
  className: 'edit_widget',
  events: {
    'click a.back': function clickABack() {
      editor$1.navigate('/meta_data/widgets', {
        trigger: true
      });
    }
  },
  initialize: function initialize() {
    this.model.set('editing', true);
  },
  onClose: function onClose() {
    Marionette.ItemView.prototype.onClose.call(this);
    this.model.set('editing', false);
  },
  onRender: function onRender() {
    var configurationEditor = this.model.widgetType().createConfigurationEditorView({
      model: this.model.configuration,
      tab: this.options.tab
    });
    this.appendSubview(configurationEditor);
  }
});

var loadable = modelLifecycleTrackingView({
  classNames: {
    creating: 'creating',
    destroying: 'destroying'
  }
});

function template$r(data) {
var __p = '';
__p += '<span class="file_thumbnail"></span>\n\n<span class="file_name"></span>\n';
return __p
}

var ExplorerFileItemView = Marionette.ItemView.extend({
  tagName: 'li',
  template: template$r,
  mixins: [loadable, selectableView],
  selectionAttribute: 'file',
  ui: {
    fileName: '.file_name',
    thumbnail: '.file_thumbnail'
  },
  events: {
    'click': function click() {
      if (!this.$el.hasClass('disabled')) {
        this.select();
      }
    }
  },
  modelEvents: {
    'change': 'update'
  },
  onRender: function onRender() {
    this.update();
    this.subview(new FileThumbnailView({
      el: this.ui.thumbnail,
      model: this.model
    }));
  },
  update: function update() {
    if (this.isDisabled()) {
      this.$el.addClass('disabled');
    }

    this.$el.attr('data-id', this.model.id);
    this.ui.fileName.text(this.model.get('file_name') || '(Unbekannt)');
  },
  isDisabled: function isDisabled() {
    return this.options.disabledIds && _$1.contains(this.options.disabledIds, this.model.get('id'));
  }
});

function template$s(data) {
var __p = '';
__p += '<a href="">\n  <span class="title"></span>\n</a>\n';
return __p
}

var OtherEntryItemView = Marionette.ItemView.extend({
  template: template$s,
  className: 'other_entry_item',
  tagName: 'li',
  mixins: [selectableView],
  ui: {
    title: '.title'
  },
  events: {
    'click': 'select'
  },
  onRender: function onRender() {
    this.ui.title.text(this.model.titleOrSlug());
  }
});

function template$t(data) {
var __t, __p = '';
__p +=
((__t = ( I18n.t('pageflow.editor.templates.other_entries_blank_slate.none_available') )) == null ? '' : __t) +
'\n';
return __p
}

var OtherEntriesCollectionView = Marionette.View.extend({
  initialize: function initialize() {
    this.otherEntries = new OtherEntriesCollection();
    this.listenTo(this.otherEntries, 'sync', function () {
      if (this.otherEntries.length === 1) {
        this.options.selection.set('entry', this.otherEntries.first());
      }
    });
  },
  render: function render() {
    this.subview(new CollectionView({
      el: this.el,
      collection: this.otherEntries,
      itemViewConstructor: OtherEntryItemView,
      itemViewOptions: {
        selection: this.options.selection
      },
      blankSlateViewConstructor: Marionette.ItemView.extend({
        template: template$t,
        tagName: 'li',
        className: 'blank_slate'
      }),
      loadingViewConstructor: LoadingView
    }));
    this.otherEntries.fetch();
    return this;
  }
});

function template$u(data) {
var __t, __p = '';
__p += '<div class="box">\n  <h2>' +
((__t = ( I18n.t('pageflow.editor.templates.files_explorer.reuse_files') )) == null ? '' : __t) +
'</h2>\n\n  <div class="panels">\n    <ul class="entries_panel">\n    </ul>\n\n    <div class="files_panel">\n    </div>\n  </div>\n\n  <div class="footer">\n    <button class="ok">' +
((__t = ( I18n.t('pageflow.editor.templates.files_explorer.ok') )) == null ? '' : __t) +
'</button>\n    <button class="close">' +
((__t = ( I18n.t('pageflow.editor.templates.files_explorer.cancel') )) == null ? '' : __t) +
'</button>\n  </div>\n</div>\n';
return __p
}

function filesGalleryBlankSlateTemplate(data) {
var __t, __p = '';
__p += '<li class="blank_slate">' +
((__t = ( I18n.t('pageflow.editor.templates.files_gallery_blank_slate.no_files') )) == null ? '' : __t) +
'<li>\n';
return __p
}

function filesExplorerBlankSlateTemplate(data) {
var __t, __p = '';
__p += '<li class="blank_slate">' +
((__t = ( I18n.t('pageflow.editor.templates.files_explorer_blank_slate.choose_hint') )) == null ? '' : __t) +
'<li>\n';
return __p
}

var FilesExplorerView = Marionette.ItemView.extend({
  template: template$u,
  className: 'files_explorer editor dialog',
  mixins: [dialogView],
  ui: {
    entriesPanel: '.entries_panel',
    filesPanel: '.files_panel',
    okButton: '.ok'
  },
  events: {
    'click .ok': function clickOk() {
      if (this.options.callback) {
        this.options.callback(this.selection.get('entry'), this.selection.get('file'));
      }

      this.close();
    }
  },
  initialize: function initialize() {
    this.selection = new Backbone.Model();
    this.listenTo(this.selection, 'change:entry', function () {
      this.tabsView.refresh();
    }); // check if the OK button should be enabled.

    this.listenTo(this.selection, 'change', function (selection, options) {
      this.ui.okButton.prop('disabled', !this.selection.get('file'));
    });
  },
  onRender: function onRender() {
    this.subview(new OtherEntriesCollectionView({
      el: this.ui.entriesPanel,
      selection: this.selection
    }));
    this.tabsView = new TabsView({
      model: this.model,
      i18n: 'pageflow.editor.files.tabs',
      defaultTab: this.options.tabName
    });
    editor$1.fileTypes.each(function (fileType) {
      if (fileType.topLevelType) {
        this.tab(fileType);
      }
    }, this);
    this.ui.filesPanel.append(this.subview(this.tabsView).el);
    this.ui.okButton.prop('disabled', true);
  },
  tab: function tab(fileType) {
    this.tabsView.tab(fileType.collectionName, _$1.bind(function () {
      var collection = this._collection(fileType);

      var disabledIds = state.entry.getFileCollection(fileType).pluck('id');
      return new CollectionView({
        tagName: 'ul',
        className: 'files_gallery',
        collection: collection,
        itemViewConstructor: ExplorerFileItemView,
        itemViewOptions: {
          selection: this.selection,
          disabledIds: disabledIds
        },
        blankSlateViewConstructor: this._blankSlateConstructor()
      });
    }, this));
  },
  _collection: function _collection(fileType) {
    var collection,
        entry = this.selection.get('entry');

    if (entry) {
      collection = entry.getFileCollection(fileType);
      collection.fetch();
    } else {
      collection = new Backbone.Collection();
    }

    return collection;
  },
  _blankSlateConstructor: function _blankSlateConstructor() {
    return Marionette.ItemView.extend({
      template: this.selection.get('entry') ? filesGalleryBlankSlateTemplate : filesExplorerBlankSlateTemplate
    });
  }
});

FilesExplorerView.open = function (options) {
  app.dialogRegion.show(new FilesExplorerView(options));
};

function template$v(data) {
var __p = '';
__p += '<th></th>\n<td></td>';
return __p
}

var FileMetaDataItemView = Marionette.ItemView.extend({
  tagName: 'tr',
  template: template$v,
  ui: {
    label: 'th',
    value: 'td'
  },
  onRender: function onRender() {
    this.subview(new this.options.valueView(_$1.extend({
      el: this.ui.value,
      model: this.model,
      name: this.options.name
    }, this.options.valueViewOptions || {})));
    this.ui.label.text(this.labelText());
  },
  labelText: function labelText() {
    return i18nUtils.attributeTranslation(this.options.name, 'label', {
      prefixes: ['pageflow.editor.files.attributes.' + this.model.fileType().collectionName, 'pageflow.editor.files.common_attributes'],
      fallbackPrefix: 'activerecord.attributes',
      fallbackModelI18nKey: this.model.i18nKey
    });
  }
});

function template$w(data) {
var __p = '';
__p += '<p class="percent"></p>\n<p class="description"></p>\n<p class="error_message"></p>';
return __p
}

var FileStageItemView = Marionette.ItemView.extend({
  tagName: 'li',
  className: 'file_stage_item',
  template: template$w,
  ui: {
    description: '.description',
    percent: '.percent',
    errorMessage: '.error_message'
  },
  modelEvents: {
    'change': 'update'
  },
  onRender: function onRender() {
    this.update();
    this.$el.addClass(this.model.get('name'));

    if (this.options.standAlone) {
      this.$el.addClass('stand_alone');
    } else {
      this.$el.addClass('indented');
    }
  },
  update: function update() {
    this.ui.description.text(this.model.localizedDescription());

    if (typeof this.model.get('progress') === 'number' && this.model.get('active')) {
      this.ui.percent.text(this.model.get('progress') + '%');
    } else {
      this.ui.percent.text('');
    }

    this.ui.errorMessage.toggle(!!this.model.get('error_message')).text(this._translatedErrorMessage());
    this.$el.toggleClass('active', this.model.get('active'));
    this.$el.toggleClass('finished', this.model.get('finished'));
    this.$el.toggleClass('failed', this.model.get('failed'));
    this.$el.toggleClass('action_required', this.model.get('action_required'));
  },
  _translatedErrorMessage: function _translatedErrorMessage() {
    return this.model.get('error_message') && I18n$1.t(this.model.get('error_message'), {
      defaultValue: this.model.get('error_message')
    });
  }
});

function template$x(data) {
var __t, __p = '';
__p += '<span class="file_thumbnail"></span>\n\n<span class="file_name"></span>\n<a class="select">' +
((__t = ( I18n.t('pageflow.editor.templates.file_item.select') )) == null ? '' : __t) +
'</a>\n\n<div class="actions">\n  <a class="settings" title="' +
((__t = ( I18n.t('pageflow.editor.templates.file_item.settings') )) == null ? '' : __t) +
'"></a>\n  <a class="confirm" title="' +
((__t = ( I18n.t('pageflow.editor.templates.file_item.confirm') )) == null ? '' : __t) +
'"></a>\n  <a class="retry" title="' +
((__t = ( I18n.t('pageflow.editor.templates.file_item.retry') )) == null ? '' : __t) +
'"></a>\n  <a class="remove" title="' +
((__t = ( I18n.t('pageflow.editor.templates.file_item.destroy') )) == null ? '' : __t) +
'"></a>\n  <a class="cancel" title="' +
((__t = ( I18n.t('pageflow.editor.templates.file_item.cancel') )) == null ? '' : __t) +
'"></a>\n</div>\n\n<div class="details">\n  <ul class="file_stage_items"></ul>\n\n  <div class="file_meta_data">\n    <table cellpadding="0" cellspacing="0">\n      <tbody class="attributes">\n      </tbody>\n      <tbody class="downloads">\n        <tr>\n          <th>' +
((__t = ( I18n.t('pageflow.editor.templates.file_item.source') )) == null ? '' : __t) +
'</th>\n          <td><a class="original" href="#" download target="_blank">' +
((__t = ( I18n.t('pageflow.editor.templates.file_item.download') )) == null ? '' : __t) +
'</a></td>\n        </tr>\n      <tbody>\n    </table>\n  </div>\n</div>\n';
return __p
}

var FileItemView = Marionette.ItemView.extend({
  tagName: 'li',
  template: template$x,
  mixins: [loadable],
  ui: {
    fileName: '.file_name',
    selectButton: '.select',
    settingsButton: '.settings',
    removeButton: '.remove',
    confirmButton: '.confirm',
    cancelButton: '.cancel',
    retryButton: '.retry',
    thumbnail: '.file_thumbnail',
    stageItems: '.file_stage_items',
    metaData: 'tbody.attributes',
    downloads: 'tbody.downloads',
    downloadLink: 'a.original'
  },
  events: {
    'click .select': function clickSelect() {
      var result = this.options.selectionHandler.call(this.model);

      if (result !== false) {
        editor$1.navigate(this.options.selectionHandler.getReferer(), {
          trigger: true
        });
      }

      return false;
    },
    'click .settings': function clickSettings() {
      FileSettingsDialogView.open({
        model: this.model
      });
    },
    'click .cancel': 'cancel',
    'click .confirm': 'confirm',
    'click .remove': 'destroy',
    'click .retry': 'retry',
    'click .file_thumbnail': 'toggleExpanded'
  },
  modelEvents: {
    'change': 'update'
  },
  onRender: function onRender() {
    this.update();
    this.subview(new FileThumbnailView({
      el: this.ui.thumbnail,
      model: this.model
    }));
    this.subview(new CollectionView({
      el: this.ui.stageItems,
      collection: this.model.stages,
      itemViewConstructor: FileStageItemView
    }));

    _$1.each(this.metaDataViews(), function (view) {
      this.ui.metaData.append(this.subview(view).el);
    }, this);
  },
  update: function update() {
    if (this.isClosed) {
      return;
    }

    this.$el.attr('data-id', this.model.id);
    this.ui.fileName.text(this.model.get('file_name') || '(Unbekannt)');
    this.ui.downloadLink.attr('href', this.model.get('original_url'));
    this.ui.downloads.toggle(this.model.isUploaded() && !_$1.isEmpty(this.model.get('original_url')));
    this.ui.selectButton.toggle(!!this.options.selectionHandler);
    this.ui.settingsButton.toggle(!this.model.isNew());
    this.ui.cancelButton.toggle(this.model.isUploading());
    this.ui.confirmButton.toggle(this.model.isConfirmable());
    this.ui.removeButton.toggle(!this.model.isUploading());
    this.ui.retryButton.toggle(this.model.isRetryable());
    this.updateToggleTitle();
  },
  metaDataViews: function metaDataViews() {
    var model = this.model;
    return _$1.map(this.options.metaDataAttributes, function (options) {
      if (typeof options === 'string') {
        options = {
          name: options,
          valueView: TextFileMetaDataItemValueView
        };
      }

      return new FileMetaDataItemView(_$1.extend({
        model: model
      }, options));
    });
  },
  toggleExpanded: function toggleExpanded() {
    this.$el.toggleClass('expanded');
    this.updateToggleTitle();
  },
  updateToggleTitle: function updateToggleTitle() {
    this.ui.thumbnail.attr('title', this.$el.hasClass('expanded') ? 'Details ausblenden' : 'Details einblenden');
  },
  destroy: function destroy() {
    if (confirm("Datei wirklich wirklich löschen?")) {
      this.model.destroy();
    }
  },
  cancel: function cancel() {
    this.model.cancelUpload();
  },
  confirm: function confirm() {
    editor$1.navigate('/confirmable_files?type=' + this.model.modelName + '&id=' + this.model.id, {
      trigger: true
    });
  },
  retry: function retry() {
    this.model.retry();
  }
});

function template$y(data) {
var __t, __p = '';
__p += '<div class="filtered_files-banner">\n  <span class="filtered_files-banner_prefix">\n    ' +
((__t = ( I18n.t('pageflow.editor.views.filtered_files_view.banner_prefix') )) == null ? '' : __t) +
'\n  </span>\n  <span class="filtered_files-filter_name"></span>\n  <a href=""\n     class="filtered_files-reset_filter"\n     title="' +
((__t = ( I18n.t('pageflow.editor.views.filtered_files_view.reset_filter') )) == null ? '' : __t) +
'">\n  </a>\n</div>\n';
return __p
}

function blankSlateTemplate(data) {
var __t, __p = '';
__p += '<li class="blank_slate">' +
((__t = ( data.text )) == null ? '' : __t) +
'</li>\n';
return __p
}

var FilteredFilesView = Marionette.ItemView.extend({
  template: template$y,
  className: 'filtered_files',
  ui: {
    banner: '.filtered_files-banner',
    filterName: '.filtered_files-filter_name'
  },
  events: {
    'click .filtered_files-reset_filter': function clickFiltered_filesReset_filter() {
      editor$1.navigate('/files/' + this.options.fileType.collectionName, {
        trigger: true
      });
      return false;
    }
  },
  onRender: function onRender() {
    var entry = this.options.entry;
    var fileType = this.options.fileType;
    var collection = entry.getFileCollection(fileType);
    var blankSlateText = I18n$1.t('pageflow.editor.templates.files_blank_slate.no_files');

    if (this.options.filterName) {
      if (this.filteredCollection) {
        this.filteredCollection.dispose();
      }

      collection = this.filteredCollection = collection.withFilter(this.options.filterName);
      blankSlateText = this.filterTranslation('blank_slate');
    }

    this.appendSubview(new CollectionView({
      tagName: 'ul',
      className: 'files expandable',
      collection: collection,
      itemViewConstructor: FileItemView,
      itemViewOptions: {
        metaDataAttributes: fileType.metaDataAttributes,
        selectionHandler: this.options.selectionHandler
      },
      blankSlateViewConstructor: Marionette.ItemView.extend({
        template: blankSlateTemplate,
        serializeData: function serializeData() {
          return {
            text: blankSlateText
          };
        }
      })
    }));
    this.ui.banner.toggle(!!this.options.filterName);

    if (this.options.filterName) {
      this.ui.filterName.text(this.filterTranslation('name'));
    }
  },
  filterTranslation: function filterTranslation(keyName, options) {
    var filterName = this.options.filterName;
    return i18nUtils.findTranslation(['pageflow.editor.files.filters.' + this.options.fileType.collectionName + '.' + filterName + '.' + keyName, 'pageflow.editor.files.common_filters.' + keyName], options);
  },
  onClose: function onClose() {
    if (this.filteredCollection) {
      this.filteredCollection.dispose();
    }
  }
});

function template$z(data) {
var __t, __p = '';
__p += '<div class="box choose_importer_box">\n  <h1 class="dialog-header">' +
((__t = ( I18n.t('pageflow.editor.views.files_view.importer.heading') )) == null ? '' : __t) +
'</h1>\n\n  <div class="content">\n    <ul class="importers_panel">\n    </ul>\n  </div>\n\n  <div class="footer">\n    <button class="close">' +
((__t = ( I18n.t('pageflow.editor.templates.files_explorer.cancel') )) == null ? '' : __t) +
'</button>\n  </div>\n</div>\n';
return __p
}

function template$A(data) {
var __t, __p = '';
__p += '<button class=\'importer\' data-key=\'' +
((__t = ( data.fileImporter.key )) == null ? '' : __t) +
'\'>\n  <div class="logo">\n    <img alt="Free high resolution images" src="' +
((__t = ( data.fileImporter.logoSource )) == null ? '' : __t) +
'">\n  </div>\n  <div class="text">\n    <h3 class="name">' +
((__t = ( I18n.t('pageflow.editor.file_importers.'+data.fileImporter.key+'.select_title'))) == null ? '' : __t) +
'</h3>\n    <p class="select_label">' +
((__t = ( I18n.t('pageflow.editor.file_importers.'+data.fileImporter.key+'.select_label'))) == null ? '' : __t) +
'</p>\n  </div>\n</button>';
return __p
}

var ImporterSelectView = Marionette.ItemView.extend({
  template: template$A,
  className: 'importer_select',
  tagName: 'li',
  events: {
    'click .importer': function clickImporter(event) {
      this.options.parentView.importerSelected(this.options.importer);
    }
  },
  initialize: function initialize(options) {},
  serializeData: function serializeData() {
    return {
      fileImporter: this.options.importer
    };
  }
});

var ChooseImporterView = Marionette.ItemView.extend({
  template: template$z,
  className: 'choose_importer editor dialog',
  mixins: [dialogView],
  ui: {
    importersList: '.importers_panel',
    closeButton: '.close'
  },
  events: {
    'click .close': function clickClose() {
      this.close();
    }
  },
  importerSelected: function importerSelected(importer) {
    if (this.options.callback) {
      this.options.callback(importer);
    }

    this.close();
  },
  onRender: function onRender() {
    var self = this;
    editor$1.fileImporters.values().forEach(function (fileImporter) {
      var importerSelectView = new ImporterSelectView({
        importer: fileImporter,
        parentView: self
      }).render();
      self.ui.importersList.append(importerSelectView.$el);
    });
  }
});

ChooseImporterView.open = function (options) {
  app.dialogRegion.show(new ChooseImporterView(options).render());
};

function template$B(data) {
var __t, __p = '';
__p += '<div class="box file_importer_box">\n  <h1 class="dialog-header">' +
((__t = ( I18n.t('pageflow.editor.file_importers.'+data.importerKey+'.dialog_label') )) == null ? '' : __t) +
'</h1>\n\n  <div class="content_panel">\n    \n  </div>\n\n  <div class="footer">\n    <div class="disclaimer">\n      <p>' +
((__t = ( I18n.t('pageflow.editor.file_importers.'+data.importerKey+'.disclaimer') )) == null ? '' : __t) +
'</p>\n    </div>\n    <button class="import">' +
((__t = ( I18n.t('pageflow.editor.views.files_view.import') )) == null ? '' : __t) +
'</button>\n    <button class="close">' +
((__t = ( I18n.t('pageflow.editor.templates.files_explorer.cancel') )) == null ? '' : __t) +
'</button>\n  </div>\n</div>\n';
return __p
}

function template$C(data) {
var __t, __p = '';
__p += '<div class="box">\n  <h1 class="dialog-header">' +
((__t = ( I18n.t('pageflow.editor.templates.confirm_upload.header') )) == null ? '' : __t) +
'</h1>\n  <p class="dialog-hint">' +
((__t = ( I18n.t('pageflow.editor.templates.confirm_upload.hint') )) == null ? '' : __t) +
'</p>\n\n  <div class="files_panel">\n  </div>\n\n  <div class="selected_file_panel">\n    <h2>' +
((__t = ( I18n.t('pageflow.editor.templates.confirm_upload.edit_file_header') )) == null ? '' : __t) +
'</h2>\n    <div class="selected_file_region">\n    </div>\n  </div>\n\n  <div class="footer">\n    <button class="upload">' +
((__t = ( I18n.t('pageflow.editor.templates.confirm_upload.upload') )) == null ? '' : __t) +
'</button>\n    <button class="close">' +
((__t = ( I18n.t('pageflow.editor.templates.confirm_upload.close') )) == null ? '' : __t) +
'</button>\n  </div>\n</div>\n';
return __p
}

function template$D(data) {
var __p = '';
__p += '<h2></h2>\n';
return __p
}

var UploadableFilesView = Marionette.ItemView.extend({
  template: template$D,
  className: 'uploadable_files',
  ui: {
    header: 'h2'
  },
  initialize: function initialize() {
    this.uploadableFiles = this.collection.uploadable();

    if (!this.options.selection.has('file')) {
      this.options.selection.set('file', this.uploadableFiles.first());
    }
  },
  onRender: function onRender() {
    this.ui.header.text(I18n$1.t('pageflow.editor.files.tabs.' + this.options.fileType.collectionName));
    this.appendSubview(new TableView({
      collection: this.uploadableFiles,
      attributeTranslationKeyPrefixes: ['pageflow.editor.files.attributes.' + this.options.fileType.collectionName, 'pageflow.editor.files.common_attributes'],
      columns: this.commonColumns().concat(this.fileTypeColumns()),
      selection: this.options.selection,
      selectionAttribute: 'file'
    }));
    this.listenTo(this.uploadableFiles, 'add remove', this.update);
    this.update();
  },
  update: function update() {
    this.$el.toggleClass('is_empty', this.uploadableFiles.length === 0);
  },
  commonColumns: function commonColumns() {
    return [{
      name: 'file_name',
      cellView: TextTableCellView
    }, {
      name: 'rights',
      cellView: PresenceTableCellView
    }];
  },
  fileTypeColumns: function fileTypeColumns() {
    return _$1(this.options.fileType.confirmUploadTableColumns).map(function (column) {
      return _$1.extend({}, column, {
        configurationAttribute: true
      });
    });
  }
});

var ConfirmFileImportUploadView = Marionette.Layout.extend({
  template: template$C,
  className: 'confirm_upload editor dialog',
  mixins: [dialogView],
  regions: {
    selectedFileRegion: '.selected_file_region'
  },
  ui: {
    filesPanel: '.files_panel'
  },
  events: {
    'click .upload': function clickUpload() {
      this.onImport();
    },
    'click .close': function clickClose() {
      this.closeMe();
    }
  },
  getSelectedFiles: function getSelectedFiles() {
    var files = [];

    for (var key in state.files) {
      if (state.files.hasOwnProperty(key)) {
        var collection = state.files[key];

        if (collection.length > 0) {
          files = files.concat(collection.toJSON());
        }
      }
    }

    return files;
  },
  initialize: function initialize() {
    this.selection = new Backbone.Model();
    this.listenTo(this.selection, 'change', this.update);
  },
  onRender: function onRender() {
    this.options.fileTypes.each(function (fileType) {
      this.ui.filesPanel.append(this.subview(new UploadableFilesView({
        collection: this.options.files[fileType.collectionName],
        fileType: fileType,
        selection: this.selection
      })).el);
    }, this);
    this.update();
  },
  onImport: function onImport() {
    var cName = this.options.fileImportModel.get('metaData').collection;
    this.options.fileImportModel.get('importer').startImportJob(cName);
    this.close();
  },
  closeMe: function closeMe() {
    var cName = this.options.fileImportModel.get('metaData').collection;
    this.options.fileImportModel.get('importer').cancelImport(cName);
    this.close();
  },
  update: function update() {
    var file = this.selection.get('file');

    if (file) {
      this.selectedFileRegion.show(new pageflow.EditFileView({
        model: file
      }));
    } else {
      this.selectedFileRegion.close();
    }
  }
});

ConfirmFileImportUploadView.open = function (options) {
  app.dialogRegion.show(new ConfirmFileImportUploadView(options));
};

var FilesImporterView = Marionette.ItemView.extend({
  template: template$B,
  className: 'files_importer editor dialog',
  mixins: [dialogView],
  ui: {
    contentPanel: '.content_panel',
    spinner: '.lds-spinner',
    importButton: '.import',
    closeButton: '.close'
  },
  events: {
    'click .import': function clickImport() {
      this.getMetaData();
    }
  },
  initialize: function initialize(options) {
    this.model = new Backbone.Model({
      importerKey: options.importer.key,
      importer: new FileImport({
        importer: options.importer,
        currentEntry: state.entry
      })
    });
    this.listenTo(this.model.get('importer'), "change", function (event) {
      this.updateImportButton();

      if (!this.isInitialized) {
        this.updateAuthenticationView();
      }
    });
  },
  updateAuthenticationView: function updateAuthenticationView() {
    var importer = this.model.get('importer');

    if (importer.get('isAuthenticated')) {
      this.ui.contentPanel.empty();
      this.ui.contentPanel.append(this.model.get('importer').createFileImportDialogView().render().el);
      this.isInitialized = true;
    }
  },
  updateImportButton: function updateImportButton() {
    var importer = this.model.get('importer');
    this.ui.importButton.prop('disabled', importer.get('selectedFiles').length < 1);
  },
  getMetaData: function getMetaData() {
    var self = this;
    this.model.get('importer').getFilesMetaData().then(function (metaData) {
      if (metaData) {
        self.model.set('metaData', metaData); // add each selected file meta to state.files

        for (var i = 0; i < metaData.files.length; i++) {
          var file = metaData.files[i];
          var fileType = editor$1.fileTypes.findByUpload(file);
          var file = new fileType.model({
            state: 'uploadable',
            file_name: file.name,
            content_type: file.type,
            file_size: -1,
            rights: file.rights,
            source_url: file.url
          }, {
            fileType: fileType
          });
          state.entry.getFileCollection(fileType).add(file);
        }

        ConfirmFileImportUploadView.open({
          fileTypes: editor$1.fileTypes,
          fileImportModel: self.model,
          files: state.files
        });
      }
    });
    this.close();
  },
  onRender: function onRender() {
    if (!this.isInitialized) {
      this.ui.contentPanel.append(this.subview(new LoadingView({
        tagName: 'div'
      })).el);
    }
  }
});

FilesImporterView.open = function (options) {
  app.dialogRegion.show(new FilesImporterView(options).render());
};

function template$E(data) {
var __t, __p = '';
__p += '<button class="">\n  <span class="label">' +
((__t = ( I18n.t('pageflow.editor.templates.select_button.select') )) == null ? '' : __t) +
'</span>\n</button>\n\n<div class="dropdown">\n  <ul class="dropdown-menu" role="menu">\n  </ul>\n</div>\n';
return __p
}

var SelectButtonView = Marionette.ItemView.extend({
  template: template$E,
  className: 'select_button',
  ui: {
    button: 'button',
    label: 'button .label',
    menu: '.dropdown-menu',
    dropdown: '.dropdown'
  },
  events: {
    'click .dropdown-menu li': function clickDropdownMenuLi(e, x) {
      e.preventDefault();
      var index = getClickedIndex(e.target);
      this.model.get('options')[index].handler();

      function getClickedIndex(target) {
        var $target = $(target),
            index = parseInt($target.data('index'), 10);

        if (isNaN(index)) {
          index = parseInt($target.find('a').data('index'), 10);
        }

        return index;
      }
    }
  },
  onRender: function onRender() {
    this.ui.label.text(this.model.get('label'));
    this.model.get('options').forEach(this.addOption.bind(this));
  },
  addOption: function addOption(option, index) {
    this.ui.menu.append('<li><a href="#" data-index="' + index + '">' + option.label + '</a></li>');
  }
});

function template$F(data) {
var __t, __p = '';
__p += '<a class="back">' +
((__t = ( I18n.t('pageflow.editor.templates.files.back') )) == null ? '' : __t) +
'</a>\n';
return __p
}

var FilesView = Marionette.ItemView.extend({
  template: template$F,
  className: 'manage_files',
  events: {
    'click a.back': 'goBack',
    'file-selected': 'updatePage'
  },
  onRender: function onRender() {
    var menuOptions = [{
      label: I18n$1.t('pageflow.editor.views.files_view.upload'),
      handler: this.upload.bind(this)
    }, {
      label: I18n$1.t('pageflow.editor.views.files_view.reuse'),
      handler: function handler() {
        FilesExplorerView.open({
          callback: function callback(otherEntry, file) {
            state.entry.reuseFile(otherEntry, file);
          }
        });
      }
    }];

    if (editor$1.fileImporters.keys().length > 0) {
      menuOptions.push({
        label: I18n$1.t('pageflow.editor.views.files_view.import'),
        handler: function handler() {
          ChooseImporterView.open({
            callback: function callback(importer) {
              FilesImporterView.open({
                importer: importer
              });
            }
          });
        }
      });
    }

    this.addFileModel = new Backbone.Model({
      label: I18n$1.t('pageflow.editor.views.files_view.add'),
      options: menuOptions
    });
    this.$el.append(this.subview(new SelectButtonView({
      model: this.addFileModel
    })).el);
    this.tabsView = new TabsView({
      model: this.model,
      i18n: 'pageflow.editor.files.tabs',
      defaultTab: this.options.tabName
    });
    editor$1.fileTypes.each(function (fileType) {
      if (fileType.topLevelType) {
        this.tab(fileType);
      }
    }, this);
    this.$el.append(this.subview(this.tabsView).el);
  },
  tab: function tab(fileType) {
    var selectionMode = this.options.tabName === fileType.collectionName;
    this.tabsView.tab(fileType.collectionName, _$1.bind(function () {
      return this.subview(new FilteredFilesView({
        entry: state.entry,
        fileType: fileType,
        selectionHandler: selectionMode && this.options.selectionHandler,
        filterName: selectionMode && this.options.filterName
      }));
    }, this));
    this.listenTo(this.model, 'change:uploading_' + fileType.collectionName + '_count', function (model, value) {
      this.tabsView.toggleSpinnerOnTab(fileType.collectionName, value > 0);
    });
  },
  goBack: function goBack() {
    if (this.options.selectionHandler) {
      editor$1.navigate(this.options.selectionHandler.getReferer(), {
        trigger: true
      });
    } else {
      editor$1.navigate('/', {
        trigger: true
      });
    }
  },
  upload: function upload() {
    app.trigger('request-upload');
  }
});

function template$G(data) {
var __p = '';
__p += '<div class="quota_state">\n</div>\n<div class="outlet">\n</div>\n<div class="exhausted_message">\n</div>\n';
return __p
}

var EntryPublicationQuotaDecoratorView = Marionette.Layout.extend({
  template: template$G,
  className: 'quota_decorator',
  regions: {
    outlet: '.outlet'
  },
  ui: {
    state: '.quota_state',
    exhaustedMessage: '.exhausted_message'
  },
  modelEvents: {
    'change:exceeding change:checking change:quota': 'update'
  },
  onRender: function onRender() {
    this.model.check();
  },
  update: function update() {
    var view = this;

    if (this.model.get('checking')) {
      view.ui.state.text(I18n$1.t('pageflow.editor.quotas.loading'));
      view.ui.exhaustedMessage.hide().html('');
      view.outlet.close();
    } else {
      if (view.model.get('exceeding')) {
        view.ui.state.hide();
        view.ui.exhaustedMessage.show().html(view.model.get('exhausted_html'));
        view.outlet.close();
      } else {
        if (view.model.quota().get('state_description')) {
          view.ui.state.text(view.model.quota().get('state_description'));
          view.ui.state.show();
        } else {
          view.ui.state.hide();
        }

        view.outlet.show(view.options.view);
      }
    }
  }
});

function template$H(data) {
var __t, __p = '';
__p += '<div class="files_pending notice">\n  <p>' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.files_pending_notice') )) == null ? '' : __t) +
'</p>\n  <p><a href="#files">' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.show_files') )) == null ? '' : __t) +
'</a></p>\n</div>\n\n<div>\n  <div class="published notice">\n    <p>' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.published_notice') )) == null ? '' : __t) +
'</p>\n    <p><a href="" target="_blank">' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.view_revisions') )) == null ? '' : __t) +
'</a></p>\n  </div>\n\n  <div class="not_published notice">\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.not_published_notice') )) == null ? '' : __t) +
'\n  </div>\n\n  <h2>' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.publish_current') )) == null ? '' : __t) +
'</h2>\n\n  <div class="radio_input">\n    <input id="publish_entry_forever" type="radio" name="mode" value="publish_forever">\n    <label for="publish_entry_forever">' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.unlimited') )) == null ? '' : __t) +
'</label>\n  </div>\n\n  <div class="radio_input">\n    <input id="publish_entry_until" type="radio" name="mode" value="publish_until">\n    <label for="publish_entry_until">' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.until_including') )) == null ? '' : __t) +
'</label>\n  </div>\n\n  <div class="publish_until_fields disabled">\n    <label>\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.date') )) == null ? '' : __t) +
'\n      <input type="text" name="publish_until">\n    </label>\n\n    <label>\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.time') )) == null ? '' : __t) +
'\n      <input type="text" name="publish_until_time" value="00:00">\n    </label>\n  </div>\n\n  <div class="check_box_input">\n    <input id="publish_password_protected" type="checkbox" name="password_protected" value="1">\n    <label for="publish_password_protected">\n      <span class="name">\n        ' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.password_protected') )) == null ? '' : __t) +
'\n      </span>\n      <span class="inline_help">\n        ' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.password_help') )) == null ? '' : __t) +
'\n      </span>\n    </label>\n  </div>\n\n  <div class="password_fields disabled">\n    <label>\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.user_name') )) == null ? '' : __t) +
'\n      <input type="text" name="user_name" disabled>\n    </label>\n\n    <label>\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.password') )) == null ? '' : __t) +
'\n      <input type="text" name="password">\n    </label>\n\n    <p class="already_published_with_password">\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.already_published_with_password_help') )) == null ? '' : __t) +
'\n    </p>\n    <p class="previously_published_with_password">\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.previously_published_with_password_help') )) == null ? '' : __t) +
'\n    </p>\n    <p class="already_published_without_password">\n      ' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.already_published_without_password_help') )) == null ? '' : __t) +
'\n    </p>\n  </div>\n\n  <button class="save" disabled>' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.publish') )) == null ? '' : __t) +
'</a>\n</div>\n\n<div class="success notice">\n  <p>' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.publish_success') )) == null ? '' : __t) +
'</p>\n  <p>' +
((__t = ( I18n.t('pageflow.editor.templates.publish_entry.published_url_hint') )) == null ? '' : __t) +
'</p>\n  <p><a href="" target="_blank"></a></p>\n</div>\n';
return __p
}

var PublishEntryView = Marionette.ItemView.extend({
  template: template$H,
  className: 'publish_entry',
  ui: {
    publishUntilFields: '.publish_until_fields',
    publishUntilField: 'input[name=publish_until]',
    publishUntilTimeField: 'input[name=publish_until_time]',
    publishUntilRadioBox: '#publish_entry_until',
    publishForeverRadioBox: 'input[value=publish_forever]',
    passwordProtectedCheckBox: 'input[name=password_protected]',
    passwordFields: '.password_fields',
    userNameField: 'input[name=user_name]',
    passwordField: 'input[name=password]',
    alreadyPublishedWithPassword: '.already_published_with_password',
    previouslyPublishedWithPassword: '.previously_published_with_password',
    alreadyPublishedWithoutPassword: '.already_published_without_password',
    revisionsLink: '.published.notice a',
    publishedNotice: '.published.notice',
    saveButton: 'button.save',
    successNotice: '.success',
    successLink: '.success a'
  },
  events: {
    'click button.save': 'save',
    'click input#publish_entry_forever': 'enablePublishForever',
    'click input#publish_entry_until': 'enablePublishUntilFields',
    'focus .publish_until_fields input': 'enablePublishUntilFields',
    'change .publish_until_fields input': 'checkForm',
    'click input#publish_password_protected': 'togglePasswordFields',
    'keyup input[name=password]': 'checkForm',
    'change input[name=password]': 'checkForm'
  },
  modelEvents: {
    'change': 'update',
    'change:published': function changePublished(model, value) {
      if (value) {
        this.ui.publishedNotice.effect('highlight', {
          duration: 'slow'
        });
      }
    }
  },
  onRender: function onRender() {
    this.ui.publishUntilField.datepicker({
      dateFormat: 'dd.mm.yy',
      constrainInput: true,
      defaultDate: new Date(),
      minDate: new Date()
    });
    this.update();
  },
  update: function update() {
    this.$el.toggleClass('files_pending', this.model.get('uploading_files_count') > 0 || this.model.get('pending_files_count') > 0);
    this.$el.toggleClass('published', this.model.get('published'));
    this.ui.revisionsLink.attr('href', '/admin/entries/' + this.model.id);
    this.ui.successLink.attr('href', this.model.get('pretty_url'));
    this.ui.successLink.text(this.model.get('pretty_url'));
    var publishedUntil = new Date(this.model.get('published_until'));

    if (publishedUntil > new Date()) {
      this.ui.publishUntilField.datepicker('setDate', publishedUntil);
      this.ui.publishUntilTimeField.val(timeStr(publishedUntil));
    } else {
      this.ui.publishUntilField.datepicker('setDate', oneYearFromNow());
    }

    this.ui.userNameField.val(state.account.get('name'));

    if (this.model.get('password_protected')) {
      this.ui.passwordProtectedCheckBox.prop('checked', true);
      this.togglePasswordFields();
    } else {
      this.ui.passwordField.val(this.randomPassword());
    }

    this.ui.alreadyPublishedWithPassword.toggle(this.model.get('published') && this.model.get('password_protected'));
    this.ui.previouslyPublishedWithPassword.toggle(!this.model.get('published') && this.model.get('password_protected'));
    this.ui.alreadyPublishedWithoutPassword.toggle(this.model.get('published') && !this.model.get('password_protected')); // Helpers

    function timeStr(date) {
      return twoDigits(date.getHours()) + ':' + twoDigits(date.getMinutes());

      function twoDigits(val) {
        return ("0" + val).slice(-2);
      }
    }

    function oneYearFromNow() {
      var date = new Date();
      date.setFullYear(date.getFullYear() + 1);
      return date;
    }
  },
  save: function save() {
    var publishedUntil = null;

    if (this.$el.hasClass('publishing')) {
      return;
    }

    if (this.ui.publishUntilRadioBox.is(':checked')) {
      publishedUntil = this.ui.publishUntilField.datepicker('getDate');
      setTime(publishedUntil, this.ui.publishUntilTimeField.val());

      if (!this.checkPublishUntilTime()) {
        alert('Bitte legen Sie einen gültigen Depublikationszeitpunkt fest.');
        this.ui.publishUntilTimeField.focus();
        return;
      }

      if (!publishedUntil || !checkDate(publishedUntil)) {
        alert('Bitte legen Sie ein Depublikationsdatum fest.');
        this.ui.publishUntilField.focus();
        return;
      }
    }

    var that = this;
    this.options.entryPublication.publish({
      published_until: publishedUntil,
      password_protected: this.ui.passwordProtectedCheckBox.is(':checked'),
      password: this.ui.passwordField.val()
    }).fail(function () {
      alert('Beim Veröffentlichen ist ein Fehler aufgetreten');
    }).always(function () {
      if (that.isClosed) {
        return;
      }

      that.$el.removeClass('publishing');
      that.$el.addClass('succeeded');
      that.$('input').removeAttr('disabled');
      var publishedMessage = that.options.entryPublication.get('published_message_html');

      if (publishedMessage) {
        that.ui.successNotice.append(publishedMessage);
      }

      that.enableSave();
    });
    this.$el.addClass('publishing');
    this.$('input').attr('disabled', '1');
    this.disableSave(); // Helpers

    function setTime(date, time) {
      date.setHours.apply(date, parseTime(time));
    }

    function parseTime(str) {
      return str.split(':').map(function (number) {
        return parseInt(number, 10);
      });
    }

    function checkDate(date) {
      if (Object.prototype.toString.call(date) === "[object Date]") {
        if (isNaN(date.getTime())) {
          return false;
        }

        return true;
      }

      return false;
    }
  },
  enableSave: function enableSave() {
    this.ui.saveButton.removeAttr('disabled');
  },
  disableSave: function disableSave() {
    this.ui.saveButton.attr('disabled', true);
  },
  enablePublishUntilFields: function enablePublishUntilFields() {
    this.ui.publishForeverRadioBox[0].checked = false;
    this.ui.publishUntilRadioBox[0].checked = true;
    this.ui.publishUntilFields.removeClass('disabled');
    this.checkForm();
  },
  disablePublishUntilFields: function disablePublishUntilFields() {
    this.ui.publishUntilRadioBox[0].checked = false;
    this.ui.publishUntilFields.addClass('disabled');
    this.checkForm();

    if (!this.checkPublishUntilTime()) {
      this.ui.publishUntilTimeField.val('00:00');
    }

    this.ui.publishUntilTimeField.removeClass('invalid');
    this.ui.publishUntilField.removeClass('invalid');
  },
  enablePublishForever: function enablePublishForever() {
    this.disablePublishUntilFields();
    this.ui.publishForeverRadioBox[0].checked = true;
    this.enableSave();
  },
  checkForm: function checkForm() {
    if (_$1.all([this.checkPublishUntil(), this.checkPassword()])) {
      this.enableSave();
    } else {
      this.disableSave();
    }
  },
  checkPublishUntil: function checkPublishUntil() {
    return this.ui.publishForeverRadioBox.is(':checked') || this.ui.publishUntilRadioBox.is(':checked') && _$1.all([this.checkPublishUntilDate(), this.checkPublishUntilTime()]);
  },
  checkPublishUntilDate: function checkPublishUntilDate() {
    if (this.ui.publishUntilField.datepicker('getDate')) {
      this.ui.publishUntilField.removeClass('invalid');
      return true;
    } else {
      this.ui.publishUntilField.addClass('invalid');
      return false;
    }
  },
  checkPublishUntilTime: function checkPublishUntilTime() {
    if (!this.ui.publishUntilTimeField.val().match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      this.ui.publishUntilTimeField.addClass('invalid');
      return false;
    }

    this.ui.publishUntilTimeField.removeClass('invalid');
    return true;
  },
  togglePasswordFields: function togglePasswordFields() {
    this.ui.passwordFields.toggleClass('disabled', !this.ui.passwordProtectedCheckBox.is(':checked'));
    this.checkForm();
  },
  checkPassword: function checkPassword() {
    if (this.ui.passwordField.val().length === 0 && !this.model.get('password_protected') && this.ui.passwordProtectedCheckBox.is(':checked')) {
      this.ui.passwordField.addClass('invalid');
      return false;
    } else {
      this.ui.passwordField.removeClass('invalid');
      return true;
    }
  },
  randomPassword: function randomPassword() {
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return _$1(10).times(function () {
      return possible.charAt(Math.floor(Math.random() * possible.length));
    }).join('');
  }
});

PublishEntryView.create = function (options) {
  return new BackButtonDecoratorView({
    view: new EntryPublicationQuotaDecoratorView({
      model: options.entryPublication,
      view: new PublishEntryView(options)
    })
  });
};

var SidebarController = Marionette.Controller.extend({
  initialize: function initialize(options) {
    this.region = options.region;
    this.entry = options.entry;
  },
  index: function index(storylineId) {
    this.region.show(new EditEntryView({
      model: this.entry,
      storylineId: storylineId
    }));
  },
  files: function files(collectionName, handler, payload, filterName) {
    this.region.show(new FilesView({
      model: this.entry,
      selectionHandler: handler && editor$1.createFileSelectionHandler(handler, payload),
      tabName: collectionName,
      filterName: filterName
    }));
    editor$1.setDefaultHelpEntry('pageflow.help_entries.files');
  },
  confirmableFiles: function confirmableFiles(preselectedFileType, preselectedFileId) {
    this.region.show(ConfirmEncodingView.create({
      model: EncodingConfirmation.createWithPreselection({
        fileType: preselectedFileType,
        fileId: preselectedFileId
      })
    }));
  },
  metaData: function metaData(tab) {
    this.region.show(new EditMetaDataView({
      model: this.entry,
      tab: tab,
      state: state,
      features: pageflow.features,
      editor: editor$1
    }));
  },
  publish: function publish() {
    this.region.show(PublishEntryView.create({
      model: this.entry,
      entryPublication: new EntryPublication()
    }));
    editor$1.setDefaultHelpEntry('pageflow.help_entries.publish');
  },
  storyline: function storyline(id) {
    this.region.show(new EditStorylineView({
      model: this.entry.storylines.get(id)
    }));
  },
  chapter: function chapter(id) {
    this.region.show(new EditChapterView({
      model: this.entry.chapters.get(id)
    }));
  },
  page: function page(id, tab) {
    var page = this.entry.pages.get(id);
    this.region.show(new EditPageView({
      model: page,
      api: editor$1,
      tab: tab
    }));
    editor$1.setDefaultHelpEntry(page.pageType().help_entry_translation_key);
  },
  pageLink: function pageLink(linkId) {
    var pageId = linkId.split(':')[0];
    var page = state.pages.getByPermaId(pageId);
    this.region.show(new EditPageLinkView({
      model: page.pageLinks().get(linkId),
      page: page,
      api: editor$1
    }));
  },
  widget: function widget(id) {
    this.region.show(new EditWidgetView({
      model: this.entry.widgets.get(id)
    }));
  }
});

var UploaderView = Marionette.View.extend({
  el: 'form#upload',
  initialize: function initialize() {
    this.listenTo(app, 'request-upload', this.openFileDialog);
  },
  render: function render() {
    var that = this;
    this.$el.fileupload({
      type: 'POST',
      paramName: 'file',
      dataType: 'XML',
      acceptFileTypes: new RegExp('(\\.|\\/)(bmp|gif|jpe?g|png|ti?f|wmv|mp4|mpg|mov|asf|asx|avi|' + 'm?v|mpeg|qt|3g2|3gp|3ivx|divx|3vx|vob|flv|dvx|xvid|mkv|vtt)$', 'i'),
      add: function add(event, data) {
        try {
          state.fileUploader.add(data.files[0]).then(function (record) {
            data.record = record;
            record.save(null, {
              success: function success() {
                var directUploadConfig = data.record.get('direct_upload_config');
                data.url = directUploadConfig.url;
                data.formData = directUploadConfig.fields;
                var xhr = data.submit();
                that.listenTo(data.record, 'uploadCancelled', function () {
                  xhr.abort();
                });
              }
            });
          });
        } catch (e) {
          if (e instanceof UploadError) {
            app.trigger('error', e);
          } else {
            throw e;
          }
        }
      },
      progress: function progress(event, data) {
        data.record.set('uploading_progress', parseInt(data.loaded / data.total * 100, 10));
      },
      done: function done(event, data) {
        data.record.unset('uploading_progress');
        data.record.publish();
      },
      fail: function fail(event, data) {
        if (data.errorThrown !== 'abort') {
          data.record.uploadFailed();
        }
      },
      always: function always(event, data) {
        that.stopListening(data.record);
      }
    });
    return this;
  },
  openFileDialog: function openFileDialog() {
    this.$('input:file').click();
  }
});

var ScrollingView = Marionette.View.extend({
  events: {
    scroll: function scroll() {
      if (this._isChapterView()) {
        this.scrollpos = this.$el.scrollTop();
      }
    }
  },
  initialize: function initialize() {
    this.scrollpos = 0;
    this.listenTo(this.options.region, 'show', function () {
      if (this._isChapterView()) {
        this.$el.scrollTop(this.scrollpos);
      }
    });
  },
  _isChapterView: function _isChapterView() {
    return !Backbone.history.getFragment();
  }
});

function template$I(data) {
var __t, __p = '';
__p += '<div class="box">\n  <h2>' +
((__t = ( I18n.t('pageflow.editor.templates.help.title') )) == null ? '' : __t) +
'</h2>\n\n  <div class="placeholder"></div>\n\n  <div class="footer">\n    <a class="close" href="">' +
((__t = ( I18n.t('pageflow.editor.templates.help.close') )) == null ? '' : __t) +
'</a>\n  </div>\n</div>\n';
return __p
}

var HelpView = Marionette.ItemView.extend({
  template: template$I,
  className: 'help',
  ui: {
    placeholder: '.placeholder',
    sections: 'section',
    menuItems: 'li'
  },
  events: {
    'click .close': function clickClose() {
      this.toggle();
    },
    'click .expandable > a': function clickExpandableA(event) {
      $(event.currentTarget).parents('.expandable').toggleClass('expanded');
    },
    'click a': function clickA(event) {
      var link = $(event.currentTarget);

      if (link.attr('href').indexOf('#') === 0) {
        this.showSection(link.attr('href').substring(1), {
          scrollIntoView: !link.parents('nav').length
        });
      } else if (link.attr('href').match(/^http/)) {
        window.open(link.attr('href'), '_blank');
      }

      return false;
    },
    'click .box': function clickBox() {
      return false;
    },
    'click': function click() {
      this.toggle();
    }
  },
  initialize: function initialize() {
    this.listenTo(app, 'toggle-help', function (name) {
      this.toggle();
      this.showSection(name || editor$1.defaultHelpEntry || this.defaultHelpEntry(), {
        scrollIntoView: true
      });
    });
  },
  onRender: function onRender() {
    this.ui.placeholder.replaceWith($('#help_entries_seed').html());
    this.bindUIElements();
  },
  toggle: function toggle() {
    this.$el.toggle();
  },
  defaultHelpEntry: function defaultHelpEntry() {
    return this.ui.sections.first().data('name');
  },
  showSection: function showSection(name, options) {
    this.ui.menuItems.each(function () {
      var menuItem = $(this);
      var active = menuItem.find('a').attr('href') === '#' + name;
      menuItem.toggleClass('active', active);

      if (active) {
        menuItem.parents('.expandable').addClass('expanded');

        if (options.scrollIntoView) {
          menuItem[0].scrollIntoView();
        }
      }
    });
    this.ui.sections.each(function () {
      var section = $(this);
      section.toggle(section.data('name') === name);
    });
  }
});

var PageThumbnailView = ModelThumbnailView.extend({
  className: 'model_thumbnail page_thumbnail'
});

function template$J(data) {
var __t, __p = '';
__p += '<div>\n  <span class="missing_page_thumbnail"></span>\n  <span class="page_thumbnail"></span>\n  <div class="title"></div>\n  <div class="label"></div>\n  <a class="remove" title="' +
((__t = ( I18n.t('pageflow.editor.templates.page_link_item.remove') )) == null ? '' : __t) +
'"></a>\n  <a class="edit" title="' +
((__t = ( I18n.t('pageflow.editor.templates.page_link_item.edit') )) == null ? '' : __t) +
'"></a>\n<div>\n';
return __p
}

var PageLinkItemView = Marionette.ItemView.extend({
  template: template$J,
  tagName: 'li',
  className: 'page_link',
  ui: {
    thumbnail: '.page_thumbnail',
    title: '.title',
    label: '.label',
    editButton: '.edit',
    removeButton: '.remove'
  },
  events: {
    'click .edit': function clickEdit() {
      editor$1.navigate(this.model.editPath(), {
        trigger: true
      });
      return false;
    },
    'mouseenter': function mouseenter() {
      this.model.highlight(true);
    },
    'mouseleave': function mouseleave() {
      this.model.resetHighlight(false);
    },
    'click .remove': function clickRemove() {
      if (confirm(I18n$1.t('pageflow.internal_links.editor.views.edit_page_link_view.confirm_destroy'))) {
        this.model.remove();
      }
    }
  },
  onRender: function onRender() {
    var page = this.model.targetPage();

    if (page) {
      this.subview(new PageThumbnailView({
        el: this.ui.thumbnail,
        model: page
      }));
      this.$el.addClass(page.get('template'));
      this.ui.title.text(page.title() || I18n$1.t('pageflow.editor.views.page_link_item_view.unnamed'));
    } else {
      this.ui.title.text(I18n$1.t('pageflow.editor.views.page_link_item_view.no_page'));
    }

    this.ui.label.text(this.model.label());
    this.ui.label.toggle(!!this.model.label());
    this.ui.editButton.toggle(!!this.model.editPath());
    this.$el.toggleClass('dangling', !page);
  }
});

function template$K(data) {
var __t, __p = '';
__p += '<label>\n  <span class="name">' +
((__t = ( I18n.t('pageflow.editor.templates.page_links.label') )) == null ? '' : __t) +
'</span>\n</label>\n<ul class="links outline"></ul>\n\n<a href="" class="add_link">' +
((__t = ( I18n.t('pageflow.editor.templates.page_links.add') )) == null ? '' : __t) +
'</a>\n';
return __p
}

var PageLinksView = Marionette.ItemView.extend({
  template: template$K,
  className: 'page_links',
  ui: {
    links: 'ul.links',
    addButton: '.add_link'
  },
  events: {
    'click .add_link': function clickAdd_link() {
      var view = this;
      editor$1.selectPage().then(function (page) {
        view.model.pageLinks().addLink(page.get('perma_id'));
      });
      return false;
    }
  },
  onRender: function onRender() {
    var pageLinks = this.model.pageLinks();
    var collectionViewConstructor = pageLinks.saveOrder ? SortableCollectionView : CollectionView;
    this.subview(new collectionViewConstructor({
      el: this.ui.links,
      collection: pageLinks,
      itemViewConstructor: PageLinkItemView,
      itemViewOptions: {
        pageLinks: pageLinks
      }
    }));
    this.listenTo(pageLinks, 'add remove', function () {
      this.updateAddButton(pageLinks);
    });
    this.updateAddButton(pageLinks);
  },
  updateAddButton: function updateAddButton(pageLinks) {
    this.ui.addButton.css('display', pageLinks.canAddLink() ? 'inline-block' : 'none');
  }
});

function template$L(data) {
var __t, __p = '';
__p += '<div class="emulation_mode_button-menu">\n  <div class="emulation_mode_button-menu_header">\n    ' +
((__t = ( I18n.t('pageflow.editor.templates.emulation_mode_button.header') )) == null ? '' : __t) +
'\n  </div>\n  <ul>\n    <li class="emulation_mode_button-menu_item emulation_mode_button-desktop">\n      <a class="emulation_mode_button-menu_link">\n        ' +
((__t = ( I18n.t('pageflow.editor.templates.emulation_mode_button.desktop') )) == null ? '' : __t) +
'\n      </a>\n    </li>\n    <li class="emulation_mode_button-menu_item emulation_mode_button-phone">\n      <a class="emulation_mode_button-menu_link">\n        ' +
((__t = ( I18n.t('pageflow.editor.templates.emulation_mode_button.phone') )) == null ? '' : __t) +
'\n        <div class="emulation_mode_button-disabled_hint">\n          ' +
((__t = ( I18n.t('pageflow.editor.templates.emulation_mode_button.disabled_hint') )) == null ? '' : __t) +
'\n        </div>\n      </a>\n    </li>\n  </ul>\n</div>\n<div class="emulation_mode_button-display emulation_mode_button-desktop">\n  ' +
((__t = ( I18n.t('pageflow.editor.templates.emulation_mode_button.desktop') )) == null ? '' : __t) +
'\n</div>\n<div class="emulation_mode_button-display emulation_mode_button-phone">\n  ' +
((__t = ( I18n.t('pageflow.editor.templates.emulation_mode_button.phone') )) == null ? '' : __t) +
'\n</div>\n';
return __p
}

var EmulationModeButtonView = Marionette.ItemView.extend({
  template: template$L,
  className: 'emulation_mode_button',
  ui: {
    phoneItem: '.emulation_mode_button-phone',
    desktopItem: '.emulation_mode_button-desktop',
    phoneDisplay: '.emulation_mode_button-display.emulation_mode_button-phone',
    desktopDisplay: '.emulation_mode_button-display.emulation_mode_button-desktop'
  },
  events: {
    'click .emulation_mode_button-desktop a': function clickEmulation_mode_buttonDesktopA() {
      this.model.unset('emulation_mode');
    },
    'click .emulation_mode_button-phone a': function clickEmulation_mode_buttonPhoneA() {
      if (!this.model.get('current_page_supports_emulation_mode')) {
        return;
      }

      this.model.set('emulation_mode', 'phone');
    }
  },
  modelEvents: {
    'change:emulation_mode change:current_page_supports_emulation_mode': 'update'
  },
  onRender: function onRender() {
    this.update();
  },
  update: function update() {
    this.ui.phoneItem.toggleClass('disabled', !this.model.get('current_page_supports_emulation_mode'));
    this.ui.phoneItem.toggleClass('active', this.model.has('emulation_mode'));
    this.ui.desktopItem.toggleClass('active', !this.model.has('emulation_mode'));
    this.ui.phoneDisplay.toggleClass('active', this.model.has('emulation_mode'));
    this.ui.desktopDisplay.toggleClass('active', !this.model.has('emulation_mode'));
  }
});

function template$M(data) {
var __t, __p = '';
__p +=
((__t = ( I18n.t('pageflow.editor.templates.help_button.open_help') )) == null ? '' : __t);
return __p
}

var HelpButtonView = Marionette.ItemView.extend({
  template: template$M,
  className: 'help_button',
  events: {
    'click': function click() {
      app.trigger('toggle-help');
    }
  }
});

var SidebarFooterView = Marionette.View.extend({
  className: 'sidebar_footer',
  render: function render() {
    if (pageflow.features.isEnabled('editor_emulation_mode')) {
      this.appendSubview(new EmulationModeButtonView({
        model: this.model
      }));
    }

    this.appendSubview(new HelpButtonView());
    return this;
  }
});

var HelpImageView = Marionette.View.extend({
  tagName: 'img',
  className: 'help_image',
  render: function render() {
    this.$el.attr('src', state.editorAssetUrls.help[this.options.imageName]);
    return this;
  }
});

var InfoBoxView = Marionette.View.extend({
  className: 'info_box',
  render: function render() {
    this.$el.html(this.options.text);
    return this;
  }
});

function template$N(data) {
var __t, __p = '';
__p += '<span class="list_item_thumbnail"></span>\n<span class="list_item_missing_thumbnail"></span>\n<span class="list_item_type_pictogram type_pictogram"></span>\n\n<div class="list_item_title"></div>\n<div class="list_item_description"></div>\n\n<div class="list_item_buttons">\n  <a class="list_item_edit_button" title="' +
((__t = ( I18n.t('pageflow.editor.templates.list_item.edit') )) == null ? '' : __t) +
'"></a>\n  <a class="list_item_remove_button" title="' +
((__t = ( I18n.t('pageflow.editor.templates.list_item.remove') )) == null ? '' : __t) +
'"></a>\n</div>\n';
return __p
}

var ListItemView = Marionette.ItemView.extend({
  template: template$N,
  tagName: 'li',
  className: 'list_item',
  ui: {
    thumbnail: '.list_item_thumbnail',
    typePictogram: '.list_item_type_pictogram',
    title: '.list_item_title',
    description: '.list_item_description',
    editButton: '.list_item_edit_button',
    removeButton: '.list_item_remove_button'
  },
  events: {
    'click .list_item_edit_button': function clickList_item_edit_button() {
      this.options.onEdit(this.model);
      return false;
    },
    'click .list_item_remove_button': function clickList_item_remove_button() {
      this.options.onRemove(this.model);
      return false;
    },
    'mouseenter': function mouseenter() {
      if (this.options.highlight) {
        this.model.highlight();
      }
    },
    'mouseleave': function mouseleave() {
      if (this.options.highlight) {
        this.model.resetHighlight();
      }
    }
  },
  modelEvents: {
    'change': 'update'
  },
  onRender: function onRender() {
    this.subview(new ModelThumbnailView({
      el: this.ui.thumbnail,
      model: this.model
    }));

    if (this.options.typeName) {
      this.$el.addClass(this.typeName());
    }

    this.ui.editButton.toggleClass('is_available', !!this.options.onEdit);
    this.ui.removeButton.toggleClass('is_available', !!this.options.onRemove);
    this.update();
  },
  update: function update() {
    this.ui.typePictogram.attr('title', this.typeDescription());
    this.ui.title.text(this.model.title() || I18n$1.t('pageflow.editor.views.page_link_item_view.unnamed'));
    this.ui.description.text(this.description());
    this.ui.description.toggle(!!this.description());
    this.$el.toggleClass('is_invalid', !!this.getOptionResult('isInvalid'));
  },
  onClose: function onClose() {
    if (this.options.highlight) {
      this.model.resetHighlight();
    }
  },
  description: function description() {
    return this.getOptionResult('description');
  },
  typeName: function typeName() {
    return this.getOptionResult('typeName');
  },
  typeDescription: function typeDescription() {
    return this.getOptionResult('typeDescription');
  },
  getOptionResult: function getOptionResult(name) {
    return typeof this.options[name] === 'function' ? this.options[name](this.model) : this.options[name];
  }
});

function template$O(data) {
var __t, __p = '';
__p += '<div class="checking notice">\n  <p>' +
((__t = ( I18n.t('pageflow.editor.templates.locked.loading') )) == null ? '' : __t) +
'</p>\n\n  <a class="close" href="#">' +
((__t = ( I18n.t('pageflow.editor.templates.locked.close') )) == null ? '' : __t) +
'</a>\n</div>\n\n<div class="error notice">\n  <div class="message"></div>\n\n  <a class="close" href="#">' +
((__t = ( I18n.t('pageflow.editor.templates.locked.close') )) == null ? '' : __t) +
'</a>\n  <a class="break" href="#">' +
((__t = ( I18n.t('pageflow.editor.templates.locked.open_here') )) == null ? '' : __t) +
'</a>\n</div>\n\n';
return __p
}

var LockedView = Marionette.ItemView.extend({
  template: template$O,
  className: 'locked checking',
  ui: {
    breakButton: '.break',
    message: '.error .message'
  },
  events: {
    'click .close': 'goBack',
    'click .break': 'breakLock'
  },
  modelEvents: {
    acquired: 'hide',
    locked: 'show',
    unauthenticated: 'goBack'
  },
  breakLock: function breakLock() {
    this.model.acquire({
      force: true
    });
  },
  goBack: function goBack() {
    window.location = "/admin/entries/" + state.entry.id;
  },
  show: function show(info, options) {
    var key = info.error + '.' + options.context;
    this.ui.message.html(I18n$1.t('pageflow.edit_locks.errors.' + key + '_html', {
      user_name: info.held_by
    }));
    this.ui.message.attr('data-error', key);
    this.ui.breakButton.text(I18n$1.t('pageflow.edit_locks.break_action.acquire'));
    this.$el.removeClass('checking');
    this.$el.show();
  },
  hide: function hide() {
    this.ui.message.attr('data-error', null);
    this.$el.removeClass('checking');
    this.$el.hide();
  }
});

var EditorView = Backbone.View.extend({
  scrollNavigationKeys: _$1.values({
    pageUp: 33,
    pageDown: 34,
    end: 35,
    home: 36,
    left: 37,
    up: 38,
    right: 39,
    down: 40
  }),
  events: {
    'click a': function clickA(event) {
      // prevent default for all links
      if (!$(event.currentTarget).attr('target') && !$(event.currentTarget).attr('download') && !$(event.currentTarget).attr('href')) {
        return false;
      }
    },
    'keydown sidebar': function keydownSidebar(event) {
      this.preventScrollingPreviewWhileFocusInSidebar(event);
    }
  },
  initialize: function initialize() {
    $(window).on('beforeunload', function (event) {
      if (state.entry.get('uploading_files_count') > 0) {
        return I18n$1.t('pageflow.editor.views.editor_views.files_pending_warning');
      }
    });
  },
  render: function render() {
    this.$el.layout({
      minSize: 300,
      togglerTip_closed: I18n$1.t('pageflow.editor.views.editor_views.show_editor'),
      togglerTip_open: I18n$1.t('pageflow.editor.views.editor_views.hide_editor'),
      resizerTip: I18n$1.t('pageflow.editor.views.editor_views.resize_editor'),
      enableCursorHotkey: false,
      fxName: 'none',
      maskIframesOnResize: true,
      onresize: function onresize() {
        app.trigger('resize');
      }
    });
    new UploaderView().render();
    this.$el.append(new LockedView({
      model: state.editLock
    }).render().el);
    this.$el.append(new HelpView().render().el);
  },
  preventScrollingPreviewWhileFocusInSidebar: function preventScrollingPreviewWhileFocusInSidebar(event) {
    if (this.scrollNavigationKeys.indexOf(event.which) >= 0) {
      event.stopPropagation();
    }
  }
});

var BackgroundImageEmbeddedView = Marionette.View.extend({
  modelEvents: {
    'change': 'update'
  },
  render: function render() {
    this.update();
    return this;
  },
  update: function update() {
    if (this.options.useInlineStyles !== false) {
      this.updateInlineStyle();
    } else {
      this.updateClassName();
    }

    if (this.options.dataSizeAttributes) {
      this.updateDataSizeAttributes();
    }
  },
  updateClassName: function updateClassName() {
    this.$el.addClass('load_image');
    var propertyName = this.options.propertyName.call ? this.options.propertyName() : this.options.propertyName;
    var id = this.model.get(propertyName);
    var prefix = this.options.backgroundImageClassNamePrefix.call ? this.options.backgroundImageClassNamePrefix() : this.options.backgroundImageClassNamePrefix;
    prefix = prefix || 'image';
    var backgroundImageClassName = id && prefix + '_' + id;

    if (this.currentBackgroundImageClassName !== backgroundImageClassName) {
      this.$el.removeClass(this.currentBackgroundImageClassName);
      this.$el.addClass(backgroundImageClassName);
      this.currentBackgroundImageClassName = backgroundImageClassName;
    }
  },
  updateInlineStyle: function updateInlineStyle() {
    this.$el.css({
      backgroundImage: this.imageValue(),
      backgroundPosition: this.model.getFilePosition(this.options.propertyName, 'x') + '% ' + this.model.getFilePosition(this.options.propertyName, 'y') + '%'
    });
  },
  updateDataSizeAttributes: function updateDataSizeAttributes() {
    var imageFile = this.model.getImageFile(this.options.propertyName);

    if (imageFile && imageFile.isReady()) {
      this.$el.attr('data-width', imageFile.get('width'));
      this.$el.attr('data-height', imageFile.get('height'));
    } else {
      this.$el.attr('data-width', '16');
      this.$el.attr('data-height', '9');
    }

    this.$el.css({
      backgroundPosition: '0 0'
    });
  },
  imageValue: function imageValue() {
    var url = this.model.getImageFileUrl(this.options.propertyName, {
      styleGroup: this.$el.data('styleGroup')
    });
    return url ? 'url("' + url + '")' : 'none';
  }
});

var LazyVideoEmbeddedView = Marionette.View.extend({
  modelEvents: {
    'change': 'update'
  },
  render: function render() {
    this.videoPlayer = this.$el.data('videoPlayer');
    this.videoPlayer.ready(_$1.bind(function () {
      this.videoPlayer.src(this.model.getVideoFileSources(this.options.propertyName));
    }, this));
    this.update();
    return this;
  },
  update: function update() {
    if (this.videoPlayer.isPresent() && this.model.hasChanged(this.options.propertyName)) {
      var paused = this.videoPlayer.paused();
      this.videoPlayer.src(this.model.getVideoFileSources(this.options.propertyName));

      if (!paused) {
        this.videoPlayer.play();
      }
    }

    if (this.options.dataSizeAttributes) {
      var videoFile = this.model.getVideoFile(this.options.propertyName);

      if (videoFile && videoFile.isReady()) {
        this.$el.attr('data-width', videoFile.get('width'));
        this.$el.attr('data-height', videoFile.get('height'));
      } else {
        this.$el.attr('data-width', '16');
        this.$el.attr('data-height', '9');
      }
    }
  }
});

function template$P(data) {
var __t, __p = '';
__p += '<li class="uploading"><span class="count">0</span>' +
((__t = ( I18n.t('pageflow.editor.templates.notification.upload_pending') )) == null ? '' : __t) +
'</li>\n<li class="failed"><span class="count">0</span> <span class="description">' +
((__t = ( I18n.t('pageflow.editor.templates.notification.save_error') )) == null ? '' : __t) +
'</span> <a class="retry">' +
((__t = ( I18n.t('pageflow.editor.templates.notification.retry') )) == null ? '' : __t) +
'</a></li>\n<li class="saving">' +
((__t = ( I18n.t('pageflow.editor.templates.notification.saving') )) == null ? '' : __t) +
'</li>\n<li class="saved">' +
((__t = ( I18n.t('pageflow.editor.templates.notification.saved') )) == null ? '' : __t) +
'</li>\n\n<li class="confirmable_files">\n  ' +
((__t = ( I18n.t('pageflow.editor.templates.notification.approve_files', {num_files: '<span class="count">0</span>'}) )) == null ? '' : __t) +
'\n  <a href="#/confirmable_files" class="display_confirmable_files">' +
((__t = ( I18n.t('pageflow.editor.templates.notification.show') )) == null ? '' : __t) +
'</a>\n</li>\n';
return __p
}

var NotificationsView = Marionette.ItemView.extend({
  className: 'notifications',
  tagName: 'ul',
  template: template$P,
  ui: {
    failedCount: '.failed .count',
    uploadingCount: '.uploading .count',
    confirmableFilesCount: '.confirmable_files .count'
  },
  events: {
    'click .retry': function clickRetry() {
      editor$1.failures.retry();
    }
  },
  onRender: function onRender() {
    this.listenTo(state.entry, 'change:uploading_files_count', this.notifyUploadCount);
    this.listenTo(state.entry, 'change:confirmable_files_count', this.notifyConfirmableFilesCount);
    this.listenTo(editor$1.savingRecords, 'add', this.update);
    this.listenTo(editor$1.savingRecords, 'remove', this.update);
    this.listenTo(editor$1.failures, 'add', this.update);
    this.listenTo(editor$1.failures, 'remove', this.update);
    this.update();
    this.notifyConfirmableFilesCount();
  },
  update: function update() {
    this.$el.toggleClass('failed', !editor$1.failures.isEmpty());
    this.$el.toggleClass('saving', !editor$1.savingRecords.isEmpty());
    this.ui.failedCount.text(editor$1.failures.count());
  },
  notifyUploadCount: function notifyUploadCount(model, uploadCount) {
    this.$el.toggleClass('uploading', uploadCount > 0);
    this.ui.uploadingCount.text(uploadCount);
  },
  notifyConfirmableFilesCount: function notifyConfirmableFilesCount() {
    var confirmableFilesCount = state.entry.get('confirmable_files_count');
    this.$el.toggleClass('has_confirmable_files', confirmableFilesCount > 0);
    this.ui.confirmableFilesCount.text(confirmableFilesCount);
  }
});

var FileProcessingStateDisplayView = Marionette.View.extend({
  className: 'file_processing_state_display',
  mixins: [inputView],
  initialize: function initialize() {
    if (typeof this.options.collection === 'string') {
      this.options.collection = state.entry.getFileCollection(editor$1.fileTypes.findByCollectionName(this.options.collection));
    }

    this.listenTo(this.model, 'change:' + this.options.propertyName, this._update);
  },
  render: function render() {
    this._update();

    return this;
  },
  _update: function _update() {
    if (this.fileStagesView) {
      this.stopListening(this.file.unfinishedStages);
      this.fileStagesView.close();
      this.fileStagesView = null;
    }

    this.file = this._getFile();

    if (this.file) {
      this.listenTo(this.file.unfinishedStages, 'add remove', this._updateClassNames);
      this.fileStagesView = new CollectionView({
        tagName: 'ul',
        collection: this.file.unfinishedStages,
        itemViewConstructor: FileStageItemView,
        itemViewOptions: {
          standAlone: true
        }
      });
      this.appendSubview(this.fileStagesView);
    }

    this._updateClassNames();
  },
  _updateClassNames: function _updateClassNames() {
    this.$el.toggleClass('file_processing_state_display-empty', !this._hasItems());
  },
  _hasItems: function _hasItems() {
    return this.file && this.file.unfinishedStages.length;
  },
  _getFile: function _getFile() {
    return this.model.getReference(this.options.propertyName, this.options.collection);
  }
});

function template$Q(data) {
var __p = '';
__p += '<h2></h2>\n';
return __p
}

var NestedFilesView = Marionette.ItemView.extend({
  template: template$Q,
  className: 'nested_files',
  ui: {
    header: 'h2'
  },
  initialize: function initialize() {
    if (!this.options.selection.has('file')) {
      this.options.selection.set('file', this.collection.first());
      this.options.selection.set('nextFile', this.collection.at(1));
    }

    this.listenTo(this.collection, 'add', this.selectNewFile);
    this.listenTo(this.collection, 'remove', this.selectNextFileIfSelectionDeleted);
    this.listenTo(this.options.selection, 'change', this.setNextFile);
    this.listenTo(this.collection, 'add', this.update);
    this.listenTo(this.collection, 'remove', this.update);
    this.listenTo(this.collection, 'request', this.update);
    this.listenTo(this.collection, 'sync', this.update);
  },
  onRender: function onRender() {
    this.ui.header.text(this.collection.parentModel.get('file_name'));
    this.appendSubview(new TableView({
      collection: this.collection,
      attributeTranslationKeyPrefixes: ['pageflow.editor.nested_files.' + this.options.fileType.collectionName],
      columns: this.columns(this.options.fileType),
      selection: this.options.selection,
      selectionAttribute: 'file',
      blankSlateText: this.options.tableBlankSlateText
    }));
    this.update();
  },
  update: function update() {
    this.$el.toggleClass('is_empty', this.collection.length === 0);
  },
  columns: function columns(fileType) {
    var nestedFilesColumns = _$1(fileType.nestedFileTableColumns).map(function (column) {
      return _$1.extend({}, column, {
        configurationAttribute: true
      });
    });

    nestedFilesColumns.push({
      name: 'delete',
      cellView: DeleteRowTableCellView,
      cellViewOptions: {
        toggleDeleteButton: 'isUploading',
        invertToggleDeleteButton: true
      }
    });
    return nestedFilesColumns;
  },
  selectNewFile: function selectNewFile(file) {
    this.options.selection.set('file', file);
    this.setNextFile();
  },
  selectNextFileIfSelectionDeleted: function selectNextFileIfSelectionDeleted() {
    var fileIndex = this.collection.indexOf(this.options.selection.get('file'));

    if (fileIndex === -1) {
      var nextFile = this.options.selection.get('nextFile');
      this.options.selection.set('file', nextFile);
    }
  },
  setNextFile: _$1.debounce(function () {
    var fileIndex = this.collection.indexOf(this.options.selection.get('file'));

    if (typeof this.collection.at(fileIndex + 1) !== 'undefined') {
      this.options.selection.set('nextFile', this.collection.at(fileIndex + 1));
    } else if (typeof this.collection.at(fileIndex - 1) !== 'undefined') {
      this.options.selection.set('nextFile', this.collection.at(fileIndex - 1));
    } else {
      this.options.selection.set('nextFile', undefined);
    }
  }, 200)
});

function template$R(data) {
var __t, __p = '';
__p += '<div class="text_tracks_container">\n  <div class="files_upload_panel">\n    <div class="files_panel">\n    </div>\n    <a class="upload" href="">' +
((__t = ( I18n.t('pageflow.editor.templates.text_tracks.upload') )) == null ? '' : __t) +
'</a>\n  </div>\n\n  <div class="selected_file_panel">\n    <h2 class="selected_file_header">' +
((__t = ( I18n.t('pageflow.editor.templates.text_tracks.edit_file_header') )) == null ? '' : __t) +
'</h2>\n    <div class="selected_file_region">\n    </div>\n  </div>\n</div>\n';
return __p
}

var TextTracksView = Marionette.Layout.extend({
  template: template$R,
  className: 'text_tracks',
  regions: {
    selectedFileRegion: '.selected_file_region'
  },
  ui: {
    filesPanel: '.files_panel',
    selectedFileHeader: '.selected_file_header'
  },
  events: {
    'click a.upload': 'upload'
  },
  initialize: function initialize(options) {
    this.options = options || {};
    this.selection = new Backbone.Model();
    this.listenTo(this.selection, 'change', this.update);
  },
  onRender: function onRender() {
    this.nestedFilesView = new NestedFilesView({
      collection: this.model.nestedFiles(this.options.supersetCollection),
      fileType: editor$1.fileTypes.findByCollectionName('text_track_files'),
      selection: this.selection,
      model: this.model,
      tableBlankSlateText: I18n$1.t('pageflow.editor.nested_files.text_track_files.no_files_blank_slate')
    });
    this.ui.filesPanel.append(this.subview(this.nestedFilesView).el);
    this.update();
    editor$1.setUploadTargetFile(this.model);
  },
  onClose: function onClose() {
    editor$1.setUploadTargetFile(undefined);
  },
  update: function update() {
    var selectedFile = this.selection.get('file');

    if (selectedFile) {
      this.selectedFileRegion.show(new EditFileView({
        model: selectedFile,
        attributeTranslationKeyPrefixes: ['pageflow.editor.nested_files.text_track_files']
      }));
      this.ui.selectedFileHeader.toggle(true);
    } else {
      this.selectedFileRegion.close();
      this.ui.selectedFileHeader.toggle(false);
    }
  },
  upload: function upload() {
    app.trigger('request-upload');
  }
});

var TextTracksFileMetaDataItemValueView = FileMetaDataItemValueView.extend({
  initialize: function initialize() {
    this.textTrackFiles = this.model.nestedFiles(state.textTrackFiles);
    this.listenTo(this.textTrackFiles, 'add remove change:configuration', this.update);
  },
  getText: function getText() {
    return this.textTrackFiles.map(function (textTrackFile) {
      return textTrackFile.displayLabel();
    }).join(', ');
  }
});

var DisabledAtmoIndicatorView = Marionette.View.extend({
  className: 'disabled_atmo_indicator',
  events: {
    'click': function click() {
      pageflow.atmo.enable();
    }
  },
  initialize: function initialize() {
    this.listenTo(pageflow.events, 'atmo:disabled', function () {
      this.$el.show();
    });
    this.listenTo(pageflow.events, 'atmo:enabled', function () {
      this.$el.hide();
    });
    this.$el.toggle(!!pageflow.atmo && pageflow.atmo.disabled);
  },
  render: function render() {
    this.$el.attr('title', I18n$1.t('pageflow.editor.atmo.disabled'));
    return this;
  }
});

function template$S(data) {
var __p = '';
__p += '<label>\n  <span class="list_label"></span>\n</label>\n\n<ul class="list_items"></ul>\n';
return __p
}

function blankSlateTemplate$1(data) {
var __t, __p = '';
__p +=
((__t = ( I18n.t('pageflow.editor.templates.list_blank_slate.text') )) == null ? '' : __t) +
'\n';
return __p
}

/**
 * A generic list view with items consisting of a thumbnail, text and
 * possibly some buttons or a navigation arrow.
 *
 * Models inside the collection must implement the following methods:
 *
 * @param {Backbone.Collection} options.collection
 *
 * @param {Object} options
 *
 * @param {string} options.label
 *   Text of the label to display above the list.
 *
 * @param {boolean} [options.highlight=false]
 *
 * @param {boolean} [options.sortable=false]
 *
 * @param {string|function} [options.itemDescription]
 *
 * @param {string|function} [options.itemTypeName]
 *
 * @param {string|function} [options.itemTypeDescription]
 *
 * @param {string|function} [options.itemIsInvalid]
 *
 * @param {function} [options.onEdit]
 *
 * @param {function} [options.onRemove]
 *
 * @class
 */

var ListView = Marionette.ItemView.extend({
  template: template$S,
  className: 'list',
  ui: {
    label: '.list_label',
    items: '.list_items'
  },
  onRender: function onRender() {
    var collectionViewConstructor = this.options.sortable ? SortableCollectionView : CollectionView;
    this.subview(new collectionViewConstructor({
      el: this.ui.items,
      collection: this.collection,
      itemViewConstructor: ListItemView,
      itemViewOptions: _$1.extend({
        description: this.options.itemDescription,
        typeName: this.options.itemTypeName,
        typeDescription: this.options.itemTypeDescription,
        isInvalid: this.options.itemIsInvalid
      }, _$1(this.options).pick('onEdit', 'onRemove', 'highlight')),
      blankSlateViewConstructor: Marionette.ItemView.extend({
        tagName: 'li',
        className: 'list_blank_slate',
        template: blankSlateTemplate$1
      })
    }));
    this.ui.label.text(this.options.label);
    this.$el.toggleClass('with_type_pictogram', !!this.options.itemTypeName);
  }
});

var ConfirmUploadView = Marionette.Layout.extend({
  template: template$C,
  className: 'confirm_upload editor dialog',
  mixins: [dialogView],
  regions: {
    selectedFileRegion: '.selected_file_region'
  },
  ui: {
    filesPanel: '.files_panel'
  },
  events: {
    'click .upload': function clickUpload() {
      this.options.fileUploader.submit();
      this.close();
    }
  },
  initialize: function initialize() {
    this.selection = new Backbone.Model();
    this.listenTo(this.selection, 'change', this.update);
  },
  onRender: function onRender() {
    this.options.fileTypes.each(function (fileType) {
      this.ui.filesPanel.append(this.subview(new UploadableFilesView({
        collection: this.options.files[fileType.collectionName],
        fileType: fileType,
        selection: this.selection
      })).el);
    }, this);
    this.update();
  },
  onClose: function onClose() {
    this.options.fileUploader.abort();
  },
  update: function update() {
    var file = this.selection.get('file');

    if (file) {
      this.selectedFileRegion.show(new EditFileView({
        model: file
      }));
    } else {
      this.selectedFileRegion.close();
    }
  }
});

ConfirmUploadView.watch = function (fileUploader, fileTypes, files) {
  fileUploader.on('new:batch', function () {
    ConfirmUploadView.open({
      fileUploader: fileUploader,
      fileTypes: fileTypes,
      files: files
    });
  });
};

ConfirmUploadView.open = function (options) {
  app.dialogRegion.show(new ConfirmUploadView(options));
};

/**
 * Base view to edit configuration container models.  Extend and
 * override the `configure` method which receives a {@link
 * ConfigurationEditorView} to define the tabs and inputs that shall
 * be displayed.
 *
 * Add a `translationKeyPrefix` property to the prototype and define
 * the following translations:
 *
 * * `<translationKeyPrefix>.tabs`: used as `tabTranslationKeyPrefix`
 *   of the `ConfigurationEditorView`.
 *
 * * `<translationKeyPrefix>.attributes`: used as one of the
 *   `attributeTranslationKeyPrefixes` of the
 *   `ConfigurationEditorView`.
 *
 * * `<translationKeyPrefix>.back` (optional): Back button label.
 *
 * * `<translationKeyPrefix>.destroy` (optional): Destroy button
 *   label.
 *
 * * `<translationKeyPrefix>.confirm_destroy` (optional): Confirm
 *   message displayed before destroying.
 *
 * * `<translationKeyPrefix>.save_error` (optional): Header of the
 *   failure message that is displayed if the model cannot be saved.
 *
 * * `<translationKeyPrefix>.retry` (optional): Label of the retry
 *   button of the failure message.
 *
 * @param {Object} options
 * @param {Backbone.Model} options.model -
 *   Model including the {@link configurationContainer},
 *   {@link failureTracking} and {@link delayedDestroying} mixins.
 *
 * @since 15.1
 */

var EditConfigurationView = Marionette.Layout.extend({
  className: 'edit_configuration_view',
  template: function template(_ref) {
    var t = _ref.t;
    return "\n    <a class=\"back\">".concat(t('back'), "</a>\n    <a class=\"destroy\">").concat(t('destroy'), "</a>\n\n    <div class=\"failure\">\n      <p>").concat(t('save_error'), "</p>\n      <p class=\"message\"></p>\n      <a class=\"retry\" href=\"\">").concat(t('retry'), "</a>\n    </div>\n\n    <div class=\"configuration_container\"></div>\n  ");
  },
  serializeData: function serializeData() {
    var _this = this;

    return {
      t: function t(key) {
        return _this.t(key);
      }
    };
  },
  mixins: [failureIndicatingView],
  regions: {
    configurationContainer: '.configuration_container'
  },
  events: {
    'click a.back': 'goBack',
    'click a.destroy': 'destroy'
  },
  onRender: function onRender() {
    var translationKeyPrefix = _$1.result(this, 'translationKeyPrefix');

    this.configurationEditor = new ConfigurationEditorView({
      tabTranslationKeyPrefix: "".concat(translationKeyPrefix, ".tabs"),
      attributeTranslationKeyPrefixes: ["".concat(translationKeyPrefix, ".attributes")],
      model: this.model.configuration
    });
    this.configure(this.configurationEditor);
    this.configurationContainer.show(this.configurationEditor);
  },
  onShow: function onShow() {
    this.configurationEditor.refreshScroller();
  },
  destroy: function destroy() {
    if (window.confirm(this.t('confirm_destroy'))) {
      this.model.destroyWithDelay();
      this.goBack();
    }
  },
  goBack: function goBack() {
    editor$1.navigate('/', {
      trigger: true
    });
  },
  t: function t(suffix) {
    var translationKeyPrefix = _$1.result(this, 'translationKeyPrefix');

    return I18n$1.t("".concat(translationKeyPrefix, ".").concat(suffix), {
      defaultValue: I18n$1.t("pageflow.editor.views.edit_configuration.".concat(suffix))
    });
  }
});

ConfigurationEditorView.register('audio', {
  configure: function configure() {
    this.tab('general', function () {
      this.group('general', {
        supportsTextPositionCenter: true
      });
      this.input('additional_title', TextInputView);
      this.input('additional_description', TextAreaInputView, {
        size: 'short'
      });
    });
    this.tab('files', function () {
      this.input('audio_file_id', FileInputView, {
        collection: state.audioFiles,
        defaultTextTrackFilePropertyName: 'default_text_track_file_id'
      });
      this.group('background');
      this.input('thumbnail_image_id', FileInputView, {
        collection: state.imageFiles,
        positioning: false
      });
    });
    this.tab('options', function () {
      if (pageflow.features.isEnabled('waveform_player_controls')) {
        this.input('audio_player_controls_variant', SelectInputView, {
          values: ['default', 'waveform']
        });
      }

      this.input('waveform_color', ColorInputView, {
        visibleBinding: 'audio_player_controls_variant',
        visibleBindingValue: 'waveform',
        defaultValue: pageflow.theme.mainColor(),
        swatches: usedWaveformColors()
      });
      this.input('autoplay', CheckBoxInputView);
      this.group('options', {
        canPauseAtmo: true
      });
    });

    function usedWaveformColors() {
      return _$1.chain(state.pages.map(function (page) {
        return page.configuration.get('waveform_color');
      })).uniq().compact().value();
    }
  }
});

ConfigurationEditorView.register('background_image', {
  configure: function configure() {
    this.tab('general', function () {
      this.group('general', {
        supportsTextPositionCenter: true
      });
    });
    this.tab('files', function () {
      this.group('background');
      this.input('thumbnail_image_id', FileInputView, {
        collection: state.imageFiles,
        positioning: false
      });
    });
    this.tab('options', function () {
      this.group('options');
    });
  }
});

ConfigurationEditorView.register('video', {
  configure: function configure() {
    this.tab('general', function () {
      this.group('general', {
        supportsTextPositionCenter: true
      });
      this.input('additional_title', TextInputView);
      this.input('additional_description', TextAreaInputView, {
        size: 'short'
      });
    });
    this.tab('files', function () {
      this.input('video_file_id', FileInputView, {
        collection: state.videoFiles,
        positioning: false,
        defaultTextTrackFilePropertyName: 'default_text_track_file_id'
      });
      this.input('poster_image_id', FileInputView, {
        collection: state.imageFiles,
        positioning: false
      });
      this.input('mobile_poster_image_id', FileInputView, {
        collection: state.imageFiles,
        positioning: true
      });
      this.input('thumbnail_image_id', FileInputView, {
        collection: state.imageFiles,
        positioning: false
      });
    });
    this.tab('options', function () {
      this.input('autoplay', CheckBoxInputView);

      if (pageflow.features.isEnabled('auto_change_page')) {
        this.input('auto_change_page_on_ended', CheckBoxInputView);
      }

      this.group('options', {
        canPauseAtmo: true
      });
    });
  }
});

ConfigurationEditorTabView.groups.define('background', function (options) {
  options = options || {};
  var prefix = options.propertyNamePrefix ? options.propertyNamePrefix + '_' : '';
  var backgroundTypeProperty = prefix + 'background_type';
  this.input(backgroundTypeProperty, SelectInputView, {
    values: ['image', 'video'],
    ensureValueDefined: true
  });
  this.input(prefix + 'background_image_id', FileInputView, {
    collection: state.imageFiles,
    visibleBinding: backgroundTypeProperty,
    visibleBindingValue: 'image',
    fileSelectionHandlerOptions: options
  });
  this.input(prefix + 'video_file_id', FileInputView, {
    collection: state.videoFiles,
    visibleBinding: backgroundTypeProperty,
    visibleBindingValue: 'video',
    fileSelectionHandlerOptions: options
  });
  this.input(prefix + 'poster_image_id', FileInputView, {
    collection: state.imageFiles,
    visibleBinding: backgroundTypeProperty,
    visibleBindingValue: 'video',
    fileSelectionHandlerOptions: options
  });
  this.input(prefix + 'mobile_poster_image_id', FileInputView, {
    collection: state.imageFiles,
    visibleBinding: backgroundTypeProperty,
    visibleBindingValue: 'video',
    fileSelectionHandlerOptions: options
  });
});

ConfigurationEditorTabView.groups.define('general', function (options) {
  this.input('title', TextInputView, {
    required: true,
    maxLength: 5000
  });
  this.input('hide_title', CheckBoxInputView);
  this.input('tagline', TextInputView, {
    maxLength: 5000
  });
  this.input('subtitle', TextInputView, {
    maxLength: 5000
  });
  this.input('text', TextAreaInputView, {
    fragmentLinkInputView: PageLinkInputView,
    enableLists: true
  });
  this.input('text_position', SelectInputView, {
    values: options.supportsTextPositionCenter ? Page.textPositions : Page.textPositionsWithoutCenterOption
  });
  this.input('gradient_opacity', SliderInputView);
  this.input('invert', CheckBoxInputView);
});

ConfigurationEditorTabView.groups.define('page_link', function () {
  this.input('label', TextInputView);
  this.input('target_page_id', PageLinkInputView);
  this.group('page_transitions', {
    includeBlank: true
  });
});

ConfigurationEditorTabView.groups.define('page_transitions', function (options) {
  var inputOptions = {
    translationKeyPrefix: 'pageflow.page_transitions',
    blankTranslationKey: 'pageflow.page_transitions.default',
    values: pageflow.pageTransitions.names()
  };

  if (pageflow.navigationDirection.isHorizontalOnPhone()) {
    inputOptions.additionalInlineHelpText = I18n$1.t('pageflow.editor.phone_horizontal_slideshow_mode.page_transitions_inline_help');
  }

  this.input(options.propertyName || 'page_transition', SelectInputView, _$1.extend(inputOptions, options));
});

ConfigurationEditorTabView.groups.define('options', function (options) {
  var theme = state.entry.getTheme();
  this.input('display_in_navigation', CheckBoxInputView);

  if (theme.supportsEmphasizedPages()) {
    this.input('emphasize_in_navigation', CheckBoxInputView);
  }

  this.group('page_transitions', {
    propertyName: 'transition'
  });

  if (pageflow.features.isEnabled('delayed_text_fade_in')) {
    this.input('delayed_text_fade_in', SelectInputView, {
      values: Page.delayedTextFadeIn
    });
  }

  this.input('description', TextAreaInputView, {
    size: 'short',
    disableLinks: true
  });
  this.input('atmo_audio_file_id', FileInputView, {
    collection: state.audioFiles
  });

  if (options.canPauseAtmo) {
    this.input('atmo_during_playback', SelectInputView, {
      values: pageflow.Atmo.duringPlaybackModes
    });
  }

  if (theme.supportsScrollIndicatorModes()) {
    this.input('scroll_indicator_mode', SelectInputView, {
      values: Page.scrollIndicatorModes
    });
    this.input('scroll_indicator_orientation', SelectInputView, {
      values: Page.scrollIndicatorOrientations
    });
  }
});

editor$1.widgetTypes.register('classic_loading_spinner', {
  configurationEditorView: ConfigurationEditorView.extend({
    configure: function configure() {
      this.tab('loading_spinner', function () {
        this.view(InfoBoxView, {
          text: I18n$1.t('pageflow.editor.classic_loading_spinner.widget_type_info_box_text')
        });
      });
    }
  })
});

editor$1.widgetTypes.registerRole('cookie_notice', {
  isOptional: true
});
editor$1.widgetTypes.register('cookie_notice_bar', {
  configurationEditorView: ConfigurationEditorView.extend({
    configure: function configure() {
      this.tab('cookie_notice_bar', function () {
        this.view(InfoBoxView, {
          text: I18n$1.t('pageflow.editor.cookie_notice_bar.widget_type_info_box_text')
        });
      });
    }
  })
});

editor$1.widgetTypes.register('media_loading_spinner', {
  configurationEditorView: ConfigurationEditorView.extend({
    configure: function configure() {
      this.tab('loading_spinner', function () {
        this.view(InfoBoxView, {
          text: I18n$1.t('pageflow.editor.media_loading_spinner.widget_type_info_box_text')
        });
        this.input('custom_background_image_id', FileInputView, {
          collection: 'image_files',
          fileSelectionHandler: 'widgetConfiguration'
        });
        this.input('invert', CheckBoxInputView);
        this.input('remove_logo', CheckBoxInputView);
        this.input('blur_strength', SliderInputView);
      });
    }
  })
});

editor$1.widgetTypes.register('phone_horizontal_slideshow_mode', {
  configurationEditorView: ConfigurationEditorView.extend({
    configure: function configure() {
      this.tab('phone_horizontal_slideshow_mode', function () {
        this.view(InfoBoxView, {
          text: I18n$1.t('pageflow.editor.phone_horizontal_slideshow_mode.widget_type_info_box_text')
        });
        this.view(HelpImageView, {
          imageName: 'phone_horizontal_slideshow_mode'
        });
      });
    }
  })
});

editor$1.widgetTypes.register('title_loading_spinner', {
  configurationEditorView: ConfigurationEditorView.extend({
    configure: function configure() {
      this.tab('loading_spinner', function () {
        this.view(InfoBoxView, {
          text: I18n$1.t('pageflow.editor.title_loading_spinner.widget_type_info_box_text')
        });
        this.input('title', TextInputView, {
          placeholder: state.entry.metadata.get('title') || state.entry.get('entry_title')
        });
        this.input('subtitle', TextInputView);
        this.input('custom_background_image_id', FileInputView, {
          collection: 'image_files',
          fileSelectionHandler: 'widgetConfiguration'
        });
        this.input('invert', CheckBoxInputView);
        this.input('remove_logo', CheckBoxInputView);
        this.input('blur_strength', SliderInputView);
      });
    }
  })
});

app.addInitializer(function (options) {
  state.config = options.config;
});

app.addInitializer(function (options) {
  state.editorAssetUrls = options.asset_urls;
});

app.addInitializer(function (options) {
  state.seed = options.common;
});

app.addInitializer(function (options) {
  pageflow.features.enable('editor', options.entry.enabled_feature_names);
});

app.addInitializer(function (options) {
  pageflow.Audio.setup({
    getSources: function getSources(audioFileId) {
      var file = state.audioFiles.getByPermaId(audioFileId);
      return file ? file.getSources() : '';
    }
  });
});

app.addInitializer(function () {
  Backbone.history.on('route', function () {
    editor$1.applyDefaultHelpEntry();
  });
});

app.addInitializer(function (options) {
  var textTracksMetaDataAttribute = {
    name: 'text_tracks',
    valueView: TextTracksFileMetaDataItemValueView,
    valueViewOptions: {
      settingsDialogTabLink: 'text_tracks'
    }
  };
  var textTracksSettingsDialogTab = {
    name: 'text_tracks',
    view: TextTracksView,
    viewOptions: {
      supersetCollection: function supersetCollection() {
        return state.textTrackFiles;
      }
    }
  };
  var altMetaDataAttribute = {
    name: 'alt',
    valueView: TextFileMetaDataItemValueView,
    valueViewOptions: {
      fromConfiguration: true,
      settingsDialogTabLink: 'general'
    }
  };
  editor$1.fileTypes.register('image_files', {
    model: ImageFile,
    metaDataAttributes: ['dimensions', altMetaDataAttribute],
    matchUpload: /^image/,
    configurationEditorInputs: [{
      name: 'alt',
      inputView: TextInputView
    }]
  });
  editor$1.fileTypes.register('video_files', {
    model: VideoFile,
    metaDataAttributes: ['format', 'dimensions', 'duration', textTracksMetaDataAttribute, altMetaDataAttribute],
    matchUpload: /^video/,
    configurationEditorInputs: [{
      name: 'alt',
      inputView: TextInputView
    }],
    settingsDialogTabs: [textTracksSettingsDialogTab]
  });
  editor$1.fileTypes.register('audio_files', {
    model: AudioFile,
    metaDataAttributes: ['format', 'duration', textTracksMetaDataAttribute, altMetaDataAttribute],
    matchUpload: /^audio/,
    configurationEditorInputs: [{
      name: 'alt',
      inputView: TextInputView
    }],
    settingsDialogTabs: [textTracksSettingsDialogTab]
  });
  editor$1.fileTypes.register('text_track_files', {
    model: TextTrackFile,
    matchUpload: function matchUpload(upload) {
      return upload.name.match(/\.vtt$/) || upload.name.match(/\.srt$/);
    },
    skipUploadConfirmation: true,
    configurationEditorInputs: [{
      name: 'label',
      inputView: TextInputView,
      inputViewOptions: {
        placeholder: function placeholder(configuration) {
          var textTrackFile = configuration.parent;
          return textTrackFile.inferredLabel();
        },
        placeholderBinding: TextTrackFile.displayLabelBinding
      }
    }, {
      name: 'kind',
      inputView: SelectInputView,
      inputViewOptions: {
        values: state.config.availableTextTrackKinds,
        translationKeyPrefix: 'pageflow.config.text_track_kind'
      }
    }, {
      name: 'srclang',
      inputView: TextInputView,
      inputViewOptions: {
        required: true
      }
    }],
    nestedFileTableColumns: [{
      name: 'label',
      cellView: TextTableCellView,
      value: function value(textTrackFile) {
        return textTrackFile.displayLabel();
      },
      contentBinding: TextTrackFile.displayLabelBinding
    }, {
      name: 'srclang',
      cellView: TextTableCellView,
      "default": I18n$1.t('pageflow.editor.text_track_files.srclang_missing')
    }, {
      name: 'kind',
      cellView: IconTableCellView,
      cellViewOptions: {
        icons: state.config.availableTextTrackKinds
      }
    }],
    nestedFilesOrder: {
      comparator: function comparator(textTrackFile) {
        return textTrackFile.displayLabel().toLowerCase();
      },
      binding: 'label'
    }
  });
  editor$1.fileTypes.setup(options.config.fileTypes);
});

app.addInitializer(function (options) {
  editor$1.widgetTypes.registerRole('navigation', {
    isOptional: true
  });
  editor$1.widgetTypes.setup(options.widget_types);
});

app.addInitializer(function (options) {
  state.files = FilesCollection.createForFileTypes(editor$1.fileTypes, options.files);
  state.imageFiles = state.files.image_files;
  state.videoFiles = state.files.video_files;
  state.audioFiles = state.files.audio_files;
  state.textTrackFiles = state.files.text_track_files;
  var widgets = new WidgetsCollection(options.widgets, {
    widgetTypes: editor$1.widgetTypes
  });
  state.themes = new ThemesCollection(options.themes);
  state.pages = new PagesCollection(options.pages);
  state.chapters = new ChaptersCollection(options.chapters);
  state.storylines = new StorylinesCollection(options.storylines);
  state.entry = editor$1.createEntryModel(options, {
    widgets: widgets
  });
  state.theming = new Theming(options.theming);
  state.account = new Backbone.Model(options.account);
  widgets.subject = state.entry;
  state.entryData = new PreviewEntryData({
    entry: state.entry,
    storylines: state.storylines,
    chapters: state.chapters,
    pages: state.pages
  });
  state.storylineOrdering = new StorylineOrdering(state.storylines, state.pages);
  state.storylineOrdering.sort({
    silent: true
  });
  state.storylineOrdering.watch();
  state.pages.sort();
  state.storylines.on('sort', _$1.debounce(function () {
    state.storylines.saveOrder();
  }, 100));
  editor$1.failures.watch(state.entry);
  editor$1.failures.watch(state.pages);
  editor$1.failures.watch(state.chapters);
  editor$1.savingRecords.watch(state.pages);
  editor$1.savingRecords.watch(state.chapters);
  pageflow.events.trigger('seed:loaded');
});

app.addInitializer(function (options) {
  state.fileUploader = new FileUploader({
    entry: state.entry,
    fileTypes: editor$1.fileTypes
  });
  ConfirmUploadView.watch(state.fileUploader, editor$1.fileTypes, state.files);
});

app.addInitializer(function (options) {
  editor$1.pageTypes.setup(options.page_types);
});

app.addInitializer(function (options) {
  var KEY_A = 65;
  var KEY_X = 88;
  $(document).on('keydown', function (event) {
    if (event.altKey && event.which === KEY_A) {
      if (pageflow.atmo.disabled) {
        pageflow.atmo.enable();
      } else {
        pageflow.atmo.disable();
      }
    } else if (event.altKey && event.which === KEY_X) {
      editor$1.navigate('pages/' + pageflow.slides.currentPage().data('id'), {
        trigger: true
      });
    }
  });
});

app.addInitializer(function (options) {
  editor$1.fileImporters.setup(options.config.fileImporters);
});

app.addInitializer(function (options) {
  state.editLock = new EditLockContainer();
  state.editLock.watchForErrors();
  state.editLock.acquire();
});

app.addInitializer(function (options) {
  state.entry.pollForPendingFiles();
});

app.addInitializer(function (options) {
  state.entry.on('change:pending_files_count', function (model, value) {
    if (value < state.entry.previous('pending_files_count')) {
      pageflow.stylesheet.reload('entry');
    }
  });
  state.entry.on('use:files', function () {
    pageflow.stylesheet.reload('entry');
  });
  state.entry.metadata.on('change:theme_name', function () {
    var theme = state.entry.getTheme();
    pageflow.stylesheet.update('theme', theme.get('stylesheet_path'));
  });
});

app.addInitializer(function () {
  _$1.each(editor$1.sideBarRoutings, function (options) {
    new options.router({
      controller: new options.controller({
        region: app.sidebarRegion,
        entry: state.entry
      })
    });
  });

  editor$1.router = new SidebarRouter({
    controller: new SidebarController({
      region: app.sidebarRegion,
      entry: state.entry
    })
  });
  window.editor = editor$1.router;
});

app.addInitializer(function () {
  app.on('error', function (e) {
    if (e.message) {
      alert(e.message);
    } else {
      alert(I18n$1.t(e.name, {
        scope: 'pageflow.editor.errors',
        defaultValue: I18n$1.t('pageflow.editor.errors.unknown')
      }));
    }
  });
});

app.addInitializer(function ()
/* args */
{
  var context = this;
  var args = arguments;

  _$1.each(editor$1.initializers, function (fn) {
    fn.call(context, args);
  });
});

app.addInitializer(function (options) {
  new EditorView({
    el: $('body')
  }).render();
  new ScrollingView({
    el: $('sidebar .scrolling'),
    region: app.sidebarRegion
  }).render();
  app.previewRegion.show(new editor$1.entryType.previewView({
    model: state.entry
  }));
  app.indicatorsRegion.show(new DisabledAtmoIndicatorView());
  app.notificationsRegion.show(new NotificationsView());
  app.sidebarFooterRegion.show(new SidebarFooterView({
    model: state.entry
  }));
  Backbone.history.start({
    root: options.root
  });
});
app.addRegions({
  previewRegion: '#entry_preview',
  mainRegion: '#main_content',
  indicatorsRegion: '#editor_indicators',
  sidebarRegion: 'sidebar .container',
  dialogRegion: '.dialog_container',
  notificationsRegion: 'sidebar .notifications_container',
  sidebarFooterRegion: 'sidebar .sidebar_footer_container'
});

export { AudioFile, BackButtonDecoratorView, BackgroundImageEmbeddedView, BackgroundPositioningPreviewView, BackgroundPositioningSlidersView, BackgroundPositioningView, ChangeThemeDialogView, Chapter, ChapterConfiguration, ChapterPagesCollection, ChapterScaffold, ChaptersCollection, ChooseImporterView, Configuration, ConfirmEncodingView, ConfirmFileImportUploadView, ConfirmUploadView, ConfirmableFileItemView, DisabledAtmoIndicatorView, DropDownButtonItemListView, DropDownButtonItemView, DropDownButtonView, EditChapterView, EditConfigurationView, EditEntryView, EditFileView, EditLock, EditLockContainer, EditMetaDataView, EditPageLinkView, EditPageView, EditStorylineView, EditWidgetView, EditWidgetsView, EditorApi, EditorView, EmulationModeButtonView, EncodedFile, EncodingConfirmation, Entry, EntryMetadata, EntryMetadataFileSelectionHandler, EntryPublication, EntryPublicationQuotaDecoratorView, ExplorerFileItemView, Failure, FileConfiguration, FileImport, FileInputView, FileItemView, FileMetaDataItemValueView, FileMetaDataItemView, FileProcessingStateDisplayView, FileReuse, FileSettingsDialogView, FileStage, FileStageItemView, FileThumbnailView, FileTypes, FileTypesCollection, FileUploader, FilesCollection, FilesExplorerView, FilesImporterView, FilesView, FilteredFilesView, ForeignKeySubsetCollection, HelpButtonView, HelpImageView, HelpView, ImageFile, InfoBoxView, InvalidNestedTypeError, LazyVideoEmbeddedView, ListItemView, ListView, LoadingView, LockedView, ModelThumbnailView, NestedFilesCollection, NestedFilesView, NestedTypeError, NotificationsView, OrderedPageLinksCollection, OtherEntriesCollection, OtherEntriesCollectionView, OtherEntry, OtherEntryItemView, Page, PageConfigurationFileSelectionHandler, PageLink, PageLinkConfigurationEditorView, PageLinkFileSelectionHandler, PageLinkInputView, PageLinkItemView, PageLinksCollection, PageLinksView, PageThumbnailView, PagesCollection, PreviewEntryData, PublishEntryView, ReferenceInputView, ReusableFile, Scaffold, ScrollingView, SelectButtonView, SidebarController, SidebarFooterView, SidebarRouter, StaticThumbnailView, Storyline, StorylineChaptersCollection, StorylineConfiguration, StorylineOrdering, StorylineScaffold, StorylineTransitiveChildPages, StorylinesCollection, SubsetCollection, TextFileMetaDataItemValueView, TextTrackFile, TextTracksFileMetaDataItemValueView, TextTracksView, Theme, ThemeInputView, ThemeItemView, ThemesCollection, Theming, UnmatchedUploadError, UploadError, UploadableFile, UploadableFilesView, UploaderView, VideoFile, Widget, WidgetConfiguration, WidgetConfigurationFileSelectionHandler, WidgetItemView, WidgetTypes, WidgetsCollection, addAndReturnModel, app, authenticationProvider, configurationContainer, delayedDestroying, dialogView, editor$1 as editor, entryTypeEditorControllerUrls, failureIndicatingView, failureTracking, fileWithType, filesCountWatcher, formDataUtils, loadable, modelLifecycleTrackingView, orderedCollection, persistedPromise, polling, retryable, selectableView, stageProvider, startEditor, state, stylesheet, transientReferences, validFileTypeTranslationList };
