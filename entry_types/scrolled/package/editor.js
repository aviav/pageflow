import * as globalInterop from 'pageflow/editor';
import { configurationContainer, delayedDestroying, entryTypeEditorControllerUrls, failureTracking, ForeignKeySubsetCollection, orderedCollection, Configuration, editor as editor$1, Entry, modelLifecycleTrackingView, EditConfigurationView, FileInputView, ColorInputView, CollectionView, BackButtonDecoratorView } from 'pageflow/editor';
import Backbone$1 from 'backbone';
import Marionette from 'backbone.marionette';
import I18n from 'i18n-js';
import { cssModulesUtils, SortableCollectionView, TextInputView, TextAreaInputView, SelectInputView, CheckBoxInputView } from 'pageflow/ui';
import React from 'react';
import ReactDOM from 'react-dom';
import { SectionThumbnail } from 'pageflow-scrolled/frontend';
import $ from 'jquery';
import { editor as editor$2 } from 'pageflow-scrolled/editor';

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

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var Chapter = Backbone$1.Model.extend({
  mixins: [configurationContainer({
    autoSave: true,
    includeAttributesInJSON: ['position']
  }), delayedDestroying, entryTypeEditorControllerUrls.forModel({
    resources: 'chapters'
  }), failureTracking],
  initialize: function initialize(attributes, options) {
    this.sections = new ForeignKeySubsetCollection({
      parent: options.sections,
      parentModel: this,
      foreignKeyAttribute: 'chapterId',
      parentReferenceAttribute: 'chapter'
    });
    this.entry = options.entry;
  },
  addSection: function addSection(attributes) {
    var section = this.sections.create(_objectSpread({
      position: this.sections.length,
      chapterId: this.id
    }, attributes), {
      contentElements: this.entry.contentElements
    });
    section.once('sync', function () {
      section.contentElements.create({
        typeName: 'heading',
        configuration: {
          children: 'Neuer Abschnitt'
        }
      });
    });
  }
});

var ChaptersCollection = Backbone$1.Collection.extend({
  model: Chapter,
  mixins: [entryTypeEditorControllerUrls.forCollection({
    resources: 'chapters'
  }), orderedCollection],
  comparator: function comparator(chapter) {
    return chapter.get('position');
  }
});

var SectionConfiguration = Configuration.extend({
  defaults: {
    transition: 'scroll',
    backdrop: {
      image: '#fff'
    }
  },
  get: function get(name) {
    if (name === 'backdropImage') {
      return this.attributes.backdrop && this.attributes.backdrop.image;
    }

    if (name === 'backdropType') {
      return Configuration.prototype.get.apply(this, arguments) || (this.attributes.backdrop && this.attributes.backdrop.image.toString().startsWith('#') ? 'color' : 'image');
    }

    return Configuration.prototype.get.apply(this, arguments);
  },
  set: function set(name, value) {
    if (name === 'backdropImage' && value) {
      this.set('backdrop', {
        image: value
      });
    }

    return Configuration.prototype.set.apply(this, arguments);
  }
});
var FileSelectionHandler = function FileSelectionHandler(options) {
  var contentElement = options.entry.sections.get(options.id);

  this.call = function (file) {
    contentElement.configuration.setReference(options.attributeName, file);
  };

  this.getReferer = function () {
    return '/scrolled/sections/' + contentElement.id;
  };
};
editor$1.registerFileSelectionHandler('sectionConfiguration', FileSelectionHandler);

var Section = Backbone$1.Model.extend({
  mixins: [configurationContainer({
    autoSave: true,
    includeAttributesInJSON: ['position'],
    configurationModel: SectionConfiguration
  }), delayedDestroying, entryTypeEditorControllerUrls.forModel({
    resources: 'sections'
  }), failureTracking],
  initialize: function initialize(attributes, options) {
    this.contentElements = new ForeignKeySubsetCollection({
      parent: options.contentElements,
      parentModel: this,
      foreignKeyAttribute: 'sectionId',
      parentReferenceAttribute: 'section'
    });
  },
  chapterPosition: function chapterPosition() {
    return this.chapter && this.chapter.has('position') ? this.chapter.get('position') : -1;
  }
});

var SectionsCollection = Backbone$1.Collection.extend({
  model: Section,
  mixins: [entryTypeEditorControllerUrls.forCollection({
    resources: 'sections'
  })],
  comparator: function comparator(sectionA, sectionB) {
    if (sectionA.chapterPosition() > sectionB.chapterPosition()) {
      return 1;
    } else if (sectionA.chapterPosition() < sectionB.chapterPosition()) {
      return -1;
    } else if (sectionA.get('position') > sectionB.get('position')) {
      return 1;
    } else if (sectionA.get('position') < sectionB.get('position')) {
      return -1;
    } else {
      return 0;
    }
  }
});

var ContentElement = Backbone$1.Model.extend({
  paramRoot: 'content_element',
  mixins: [configurationContainer({
    autoSave: true,
    includeAttributesInJSON: ['position', 'typeName']
  }), delayedDestroying, entryTypeEditorControllerUrls.forModel({
    resources: 'content_elements'
  }), failureTracking]
});

var ContentElementsCollection = Backbone$1.Collection.extend({
  model: ContentElement,
  mixins: [entryTypeEditorControllerUrls.forCollection({
    resources: 'content_elements'
  })],
  comparator: 'position'
});

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var ScrolledEntry = Entry.extend({
  setupFromEntryTypeSeed: function setupFromEntryTypeSeed(seed) {
    this.contentElements = new ContentElementsCollection(seed.collections.contentElements);
    this.sections = new SectionsCollection(seed.collections.sections, {
      contentElements: this.contentElements
    });
    this.chapters = new ChaptersCollection(seed.collections.chapters, {
      sections: this.sections,
      entry: this
    });
    this.chapters.parentModel = this;
    this.sections.sort();
    editor$1.failures.watch(this.contentElements);
    editor$1.failures.watch(this.sections);
    editor$1.failures.watch(this.chapters);
    editor$1.savingRecords.watch(this.contentElements);
    editor$1.savingRecords.watch(this.sections);
    editor$1.savingRecords.watch(this.chapters);
    this.scrolledSeed = seed;
  },
  addChapter: function addChapter(attributes) {
    this.chapters.create(_objectSpread$1({
      position: this.chapters.length
    }, attributes), {
      entry: this,
      sections: this.sections
    });
  },
  insertContentElement: function insertContentElement(attributes, _ref) {
    var _this = this;

    var position = _ref.position,
        id = _ref.id;
    var sibling = this.contentElements.get(id);
    var section = sibling.section;
    var delta = 0;
    section.contentElements.each(function (contentElement, index) {
      if (contentElement === sibling && position === 'before') {
        delta = 1;
      }

      contentElement.set('position', index + delta);

      if (contentElement === sibling && position === 'after') {
        delta = 1;
      }
    });
    var newContentElement = section.contentElements.create(_objectSpread$1({
      position: sibling.get('position') + (position === 'before' ? -1 : 1)
    }, attributes, {
      configuration: {
        position: sibling.configuration.get('position')
      }
    }));
    section.contentElements.sort();
    newContentElement.once('sync', function () {
      section.contentElements.saveOrder();

      _this.trigger('selectContentElement', newContentElement);
    });
  }
});

var ContentElementFileSelectionHandler = function ContentElementFileSelectionHandler(options) {
  var contentElement = options.entry.contentElements.get(options.id);

  this.call = function (file) {
    contentElement.configuration.setReference(options.attributeName, file);
  };

  this.getReferer = function () {
    return '/scrolled/content_elements/' + contentElement.id;
  };
};

var PREFIX = 'PAGEFLOW_SCROLLED_COLLECTION';
var RESET = "".concat(PREFIX, "_RESET");
var ADD = "".concat(PREFIX, "_ADD");
var CHANGE = "".concat(PREFIX, "_CHANGE");
var REMOVE = "".concat(PREFIX, "_REMOVE");
var SORT = "".concat(PREFIX, "_SORT");

function watchCollection(collection, _ref2) {
  var name = _ref2.name,
      dispatch = _ref2.dispatch,
      attributes = _ref2.attributes,
      includeConfiguration = _ref2.includeConfiguration,
      _ref2$keyAttribute = _ref2.keyAttribute,
      keyAttribute = _ref2$keyAttribute === void 0 ? 'id' : _ref2$keyAttribute;
  var handle = {};
  var options = {
    attributeNames: attributes,
    includeConfiguration: includeConfiguration
  };
  var tearingDown = false;
  var watchedAttributeNames = getWatchedAttributeNames(attributes);
  dispatch({
    type: RESET,
    payload: {
      collectionName: name,
      keyAttribute: keyAttribute,
      items: collection.map(function (model) {
        return getAttributes(model, options);
      })
    }
  });
  collection.on('add change:id', function (model) {
    if (!model.isNew()) {
      dispatch({
        type: ADD,
        payload: {
          collectionName: name,
          keyAttribute: keyAttribute,
          order: collection.pluck(keyAttribute),
          attributes: getAttributes(model, options)
        }
      });
    }
  }, handle);
  collection.on('change', function (model) {
    if (hasChangedAttributes(model, watchedAttributeNames)) {
      dispatch({
        type: CHANGE,
        payload: {
          collectionName: name,
          keyAttribute: keyAttribute,
          attributes: getAttributes(model, options)
        }
      });
    }
  }, handle);

  if (includeConfiguration) {
    collection.on('change:configuration', function (model) {
      return dispatch({
        type: CHANGE,
        payload: {
          collectionName: name,
          keyAttribute: keyAttribute,
          attributes: getAttributes(model, options)
        }
      });
    }, handle);
  }

  collection.on('remove', function (model) {
    if (!tearingDown) {
      dispatch({
        type: REMOVE,
        payload: {
          collectionName: name,
          order: collection.pluck(keyAttribute),
          key: model.attributes[keyAttribute]
        }
      });
    }
  }, handle);
  collection.on('sort', function (model) {
    return dispatch({
      type: SORT,
      payload: {
        collectionName: name,
        order: collection.pluck(keyAttribute).filter(Boolean)
      }
    });
  }, handle);
  return function () {
    tearingDown = true;
    collection.off(null, null, handle);
  };
}

function hasChangedAttributes(model, attributeNames) {
  return attributeNames.some(function (attributeName) {
    return model.hasChanged(attributeName);
  });
}

function getWatchedAttributeNames(attributeNames) {
  return attributeNames.map(function (attributeName) {
    return typeof attributeName == 'object' ? mappedAttributeSource(attributeName) : attributeName;
  });
}

function mappedAttributeSource(attributeName) {
  return attributeName[Object.keys(attributeName)[0]];
}

function getAttributes(model, _ref3) {
  var attributeNames = _ref3.attributeNames,
      includeConfiguration = _ref3.includeConfiguration;
  var result = attributeNames.reduce(function (result, attributeName) {
    if (typeof attributeName == 'object') {
      var key = Object.keys(attributeName)[0];
      var value = attributeName[key];

      if (typeof value == 'function') {
        result[key] = value();
      } else {
        result[key] = model.get(value);
      }
    } else {
      result[attributeName] = model.get(attributeName);
    }

    return result;
  }, {});

  if (includeConfiguration) {
    result.configuration = model.configuration.attributes;
  }
  return result;
}

var Context = React.createContext();

function watchCollections(entry, _ref) {
  var dispatch = _ref.dispatch;
  var chapters = entry.chapters,
      sections = entry.sections,
      contentElements = entry.contentElements,
      files = entry.files;
  var teardownFns = [];
  teardownFns.push(watchCollection(new Backbone.Collection([entry.metadata]), {
    name: 'entries',
    attributes: ['locale', {
      permaId: function permaId() {
        return entry.id;
      }
    }, // Make sure key attribute is present
    {
      shareProviders: 'share_providers'
    }, {
      shareUrl: 'share_url'
    }, 'credits'],
    keyAttribute: 'permaId',
    dispatch: dispatch
  }));
  teardownFns.push(watchCollection(chapters, {
    name: 'chapters',
    attributes: ['id', 'permaId'],
    keyAttribute: 'permaId',
    includeConfiguration: true,
    dispatch: dispatch
  }));
  teardownFns.push(watchCollection(sections, {
    name: 'sections',
    attributes: ['id', 'permaId', 'chapterId'],
    keyAttribute: 'permaId',
    includeConfiguration: true,
    dispatch: dispatch
  }));
  teardownFns.push(watchCollection(contentElements, {
    name: 'contentElements',
    attributes: ['id', 'permaId', 'typeName', 'sectionId'],
    keyAttribute: 'permaId',
    includeConfiguration: true,
    dispatch: dispatch
  }));
  Object.keys(files).forEach(function (collectionName) {
    teardownFns.push(watchCollection(files[collectionName], {
      name: camelize(collectionName),
      attributes: ['id', {
        permaId: 'perma_id'
      }, 'width', 'height', 'basename', 'rights'],
      keyAttribute: 'permaId',
      includeConfiguration: true,
      dispatch: dispatch
    }));
  });
  return function () {
    teardownFns.forEach(function (fn) {
      return fn();
    });
  };
}

function camelize(snakeCase) {
  return snakeCase.replace(/_[a-z]/g, function (match) {
    return match[1].toUpperCase();
  });
}

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

var css = ".icons-module_icon__16IVx::before {\n  font-family: \"entypo\";\n}.icons-module_arrowsCcw__3_nrJ,\n.icons-module_attention__1sssG,\n.icons-module_plusCircled__20FlJ,\n.icons-module_rightOpen__9vsOG,\n.icons-module_trash__DH1EH {\n}.icons-module_arrowsCcw__3_nrJ::before {\n  content: \"\\1F504\";\n}.icons-module_attention__1sssG::before {\n  content: \"\\26A0\";\n}.icons-module_plusCircled__20FlJ::before {\n  content: \"\\2795\";\n}.icons-module_rightOpen__9vsOG::before {\n  content: \"\\E75E\"\n}.icons-module_trash__DH1EH::before {\n  content: \"\\E729\";\n}@keyframes animations-module_blink__32C5j {\n  0% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.3;\n  }\n  100% {\n    opacity: 1;\n  }\n}.animations-module_blink__32C5j {\n  animation: animations-module_blink__32C5j 1.5s ease infinite;\n}.outline-module_indicator__2dw_X {\n  display: none;\n  position: absolute;\n  right: 14px;\n  top: 7px;\n  width: 30px;\n  height: 30px;\n  font-size: 19px;\n  color: #888;\n}.outline-module_creatingIndicator__3O7Rw {\n}.outline-module_destroyingIndicator__2-mKh {\n}.outline-module_failedIndicator__2QK1F {\n  color: #d00;\n}\n\n.SectionItemView-module_root__1Pp0d {\n  position: relative;\n  border: solid 3px transparent;\n  padding: 3px 3px 0 3px;\n  margin-bottom: 4px;\n  max-width: 270px;\n  text-align: right;\n  background-color: #eee;\n}\n\n.SectionItemView-module_active__1tLN5 {\n  border: solid 3px #1c86fe;\n}\n\n.SectionItemView-module_thumbnailContainer__1Xe7C {\n  position: relative;\n}\n\n.SectionItemView-module_thumbnail__1ecBT {\n  border: solid 1px #888;\n  padding-top: 50%;\n  position: relative;\n  text-align: initial;\n}\n\n.SectionItemView-module_clickMask__2JYEH {\n  position: absolute;\n  top: 0;\n  left: 0;\n  bottom: 0;\n  right: 0;\n  cursor: pointer;\n}\n\n.SectionItemView-module_editLink__2mHqk {\n  display: inline-block;\n  position: relative;\n  width: 30px;\n  height: 25px;\n}\n\n.SectionItemView-module_editLink__2mHqk::before {\n  font-family: 'entypo';\n  content: \"\\270E\";\n  position: absolute;\n  top: 50%;\n  left: 50%;\n  transform: translateX(-50%) translateY(-50%);\n  color: #555;\n  font-size: 15px;\n}\n\n.SectionItemView-module_creating__3Pjx9 .SectionItemView-module_creatingIndicator__1GnKq     { display: block; }\n.SectionItemView-module_destroying__1m53s .SectionItemView-module_destroyingIndicator__HtKWF { display: block; }\n.SectionItemView-module_failed__1CR2R .SectionItemView-module_failedIndicator__1HVHn         { display: block; }\n\n.SectionItemView-module_creatingIndicator__1GnKq   { }\n.SectionItemView-module_destroyingIndicator__HtKWF {  }\n.SectionItemView-module_failedIndicator__1HVHn     { }\n";
var styles = {"selectionColor":"#1c86fe","selectionWidth":"3px","root":"SectionItemView-module_root__1Pp0d","active":"SectionItemView-module_active__1tLN5","thumbnailContainer":"SectionItemView-module_thumbnailContainer__1Xe7C","thumbnail":"SectionItemView-module_thumbnail__1ecBT","clickMask":"SectionItemView-module_clickMask__2JYEH","editLink":"SectionItemView-module_editLink__2mHqk","creating":"SectionItemView-module_creating__3Pjx9","creatingIndicator":"SectionItemView-module_creatingIndicator__1GnKq outline-module_creatingIndicator__3O7Rw outline-module_indicator__2dw_X icons-module_arrowsCcw__3_nrJ icons-module_icon__16IVx animations-module_blink__32C5j","destroying":"SectionItemView-module_destroying__1m53s","destroyingIndicator":"SectionItemView-module_destroyingIndicator__HtKWF outline-module_destroyingIndicator__2-mKh outline-module_indicator__2dw_X icons-module_trash__DH1EH icons-module_icon__16IVx animations-module_blink__32C5j","failed":"SectionItemView-module_failed__1CR2R","failedIndicator":"SectionItemView-module_failedIndicator__1HVHn outline-module_failedIndicator__2QK1F outline-module_indicator__2dw_X icons-module_attention__1sssG icons-module_icon__16IVx"};
styleInject(css);

var _events;
var SectionItemView = Marionette.ItemView.extend({
  tagName: 'li',
  className: styles.root,
  mixins: [modelLifecycleTrackingView({
    classNames: styles
  })],
  template: function template(data) {
    return "\n    <div class=\"".concat(styles.thumbnailContainer, "\">\n      <div class=\"").concat(styles.thumbnail, "\"></div>\n      <div class=\"").concat(styles.clickMask, "\"></div>\n    </div>\n       <span class=\"").concat(styles.creatingIndicator, "\" />\n       <span class=\"").concat(styles.destroyingIndicator, "\" />\n       <span class=\"").concat(styles.failedIndicator, "\"\n             title=\"").concat(I18n.t('pageflow_scrolled.editor.section_item.save_error'), "\" />\n    <a href=\"\" class=\"").concat(styles.editLink, "\" title=\"").concat(I18n.t('pageflow_scrolled.editor.section_item.edit'), "\"></a>\n  ");
  },
  ui: cssModulesUtils.ui(styles, 'thumbnail'),
  events: (_events = {}, _defineProperty(_events, "click .".concat(styles.clickMask), function click() {
    this.options.entry.trigger('scrollToSection', this.model);
  }), _defineProperty(_events, "click .".concat(styles.editLink), function click() {
    if (!this.model.isNew() && !this.model.isDestroying()) {
      this.options.entry.trigger('scrollToSection', this.model);
      editor$1.navigate("/scrolled/sections/".concat(this.model.id), {
        trigger: true
      });
    }

    return false;
  }), _events),
  modelEvents: {
    'change:id': 'renderThumbnail'
  },
  initialize: function initialize() {
    var _this = this;

    this.listenTo(this.options.entry, 'change:currentSectionIndex', function () {
      var active = _this.options.entry.sections.indexOf(_this.model) === _this.options.entry.get('currentSectionIndex');

      _this.$el.toggleClass(styles.active, active);

      if (active) {
        _this.$el[0].scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    });
  },
  onRender: function onRender() {
    var _this2 = this;

    this.timeout = setTimeout(function () {
      _this2.renderThumbnail();
    }, 100);
  },
  onClose: function onClose() {
    clearTimeout(this.timeout);
    ReactDOM.unmountComponentAtNode(this.ui.thumbnail[0]);
  },
  renderThumbnail: function renderThumbnail() {
    var _this3 = this;

    if (!this.model.isNew()) {
      ReactDOM.render(React.createElement(SectionThumbnail, {
        sectionPermaId: this.model.get('permaId'),
        seed: this.options.entry.scrolledSeed,
        subscribe: function subscribe(dispatch) {
          return watchCollections(_this3.options.entry, {
            dispatch: dispatch
          });
        }
      }), this.ui.thumbnail[0]);
    }
  }
});

var css$1 = ".icons-module_icon__16IVx::before {\n  font-family: \"entypo\";\n}.icons-module_arrowsCcw__3_nrJ,\n.icons-module_attention__1sssG,\n.icons-module_plusCircled__20FlJ,\n.icons-module_rightOpen__9vsOG,\n.icons-module_trash__DH1EH {\n}.icons-module_arrowsCcw__3_nrJ::before {\n  content: \"\\1F504\";\n}.icons-module_attention__1sssG::before {\n  content: \"\\26A0\";\n}.icons-module_plusCircled__20FlJ::before {\n  content: \"\\2795\";\n}.icons-module_rightOpen__9vsOG::before {\n  content: \"\\E75E\"\n}.icons-module_trash__DH1EH::before {\n  content: \"\\E729\";\n}@keyframes animations-module_blink__32C5j {\n  0% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.3;\n  }\n  100% {\n    opacity: 1;\n  }\n}.animations-module_blink__32C5j {\n  animation: animations-module_blink__32C5j 1.5s ease infinite;\n}.outline-module_indicator__2dw_X {\n  display: none;\n  position: absolute;\n  right: 14px;\n  top: 7px;\n  width: 30px;\n  height: 30px;\n  font-size: 19px;\n  color: #888;\n}.outline-module_creatingIndicator__3O7Rw {\n}.outline-module_destroyingIndicator__2-mKh {\n}.outline-module_failedIndicator__2QK1F {\n  color: #d00;\n}.buttons-module_iconButton__3ZSFV {\n  /* see app/assets/stylesheets/pageflow/editor/composable.scss */\n}.buttons-module_addButton__2pN-g {\n}\n\n.ChapterItemView-module_root__19GIF {\n  background-color: #fff;\n  margin-bottom: 10px;\n  padding: 0 10px 10px 10px;\n}\n\n.ChapterItemView-module_link__2dj_z {\n  display: block;\n  position: relative;\n  margin: 0 -10px 0 -10px;\n  padding: 10px 10px 10px 30px;\n  background-color: #efefef;\n}\n\n.ChapterItemView-module_link__2dj_z::before {\n  position: absolute;\n  right: 7px;\n  top: 7px;\n  font-size: 19px;\n  color: #888;\n}\n\n.ChapterItemView-module_number__1GjyC {\n  font-weight: bold;\n}\n\n.ChapterItemView-module_title__3jVXE {}\n\n.ChapterItemView-module_sections__3zg2a {\n  margin: 10px 0 10px 0;\n  min-height: 20px;\n}\n\n.ChapterItemView-module_creating__c1q2b .ChapterItemView-module_creatingIndicator__2zOEN     { display: block; }\n.ChapterItemView-module_destroying__2PP1l .ChapterItemView-module_destroyingIndicator__2YZaB { display: block; }\n.ChapterItemView-module_failed__2MtQW .ChapterItemView-module_failedIndicator__2s6Xk         { display: block; }\n\n\n.ChapterItemView-module_creatingIndicator__2zOEN   { }\n.ChapterItemView-module_destroyingIndicator__2YZaB {  }\n.ChapterItemView-module_failedIndicator__2s6Xk     { }\n\n.ChapterItemView-module_addSection__3XQvI {\n}\n";
var styles$1 = {"indicatorIconColor":"#888","root":"ChapterItemView-module_root__19GIF","link":"ChapterItemView-module_link__2dj_z icons-module_rightOpen__9vsOG icons-module_icon__16IVx","number":"ChapterItemView-module_number__1GjyC","title":"ChapterItemView-module_title__3jVXE","sections":"ChapterItemView-module_sections__3zg2a","creating":"ChapterItemView-module_creating__c1q2b","creatingIndicator":"ChapterItemView-module_creatingIndicator__2zOEN outline-module_creatingIndicator__3O7Rw outline-module_indicator__2dw_X icons-module_arrowsCcw__3_nrJ icons-module_icon__16IVx animations-module_blink__32C5j","destroying":"ChapterItemView-module_destroying__2PP1l","destroyingIndicator":"ChapterItemView-module_destroyingIndicator__2YZaB outline-module_destroyingIndicator__2-mKh outline-module_indicator__2dw_X icons-module_trash__DH1EH icons-module_icon__16IVx animations-module_blink__32C5j","failed":"ChapterItemView-module_failed__2MtQW","failedIndicator":"ChapterItemView-module_failedIndicator__2s6Xk outline-module_failedIndicator__2QK1F outline-module_indicator__2dw_X icons-module_attention__1sssG icons-module_icon__16IVx","addSection":"ChapterItemView-module_addSection__3XQvI buttons-module_addButton__2pN-g buttons-module_iconButton__3ZSFV icon_button icons-module_plusCircled__20FlJ icons-module_icon__16IVx"};
styleInject(css$1);

var ChapterItemView = Marionette.Layout.extend({
  tagName: 'li',
  className: styles$1.root,
  mixins: [modelLifecycleTrackingView({
    classNames: styles$1
  })],
  template: function template() {
    return "\n     <a class=\"".concat(styles$1.link, "\" href=\"\">\n       <span class=\"").concat(styles$1.number, "\"></span>\n       <span class=\"").concat(styles$1.title, "\"></span>\n       <span class=\"").concat(styles$1.creatingIndicator, "\" />\n       <span class=\"").concat(styles$1.destroyingIndicator, "\" />\n       <span class=\"").concat(styles$1.failedIndicator, "\"\n             title=\"").concat(I18n.t('pageflow_scrolled.editor.chapter_item.save_error'), "\" />\n     </a>\n\n     <ul class=\"").concat(styles$1.sections, "\"></ul>\n\n     <a href=\"\" class=\"").concat(styles$1.addSection, "\">").concat(I18n.t('pageflow_scrolled.editor.chapter_item.add_section'), "</a>\n  ");
  },
  ui: cssModulesUtils.ui(styles$1, 'title', 'number', 'sections'),
  events: cssModulesUtils.events(styles$1, {
    'click addSection': function clickAddSection() {
      this.model.addSection();
    },
    'click link': function clickLink() {
      if (!this.model.isNew() && !this.model.isDestroying()) {
        editor$1.navigate('/scrolled/chapters/' + this.model.get('id'), {
          trigger: true
        });
      }

      return false;
    }
  }),
  modelEvents: {
    change: 'update'
  },
  onRender: function onRender() {
    this.subview(new SortableCollectionView({
      el: this.ui.sections,
      collection: this.model.sections,
      itemViewConstructor: SectionItemView,
      itemViewOptions: {
        entry: this.options.entry
      },
      connectWith: cssModulesUtils.selector(styles$1, 'sections')
    }));
    this.update();
  },
  update: function update() {
    this.ui.title.text(this.model.configuration.get('title') || I18n.t('pageflow.editor.views.chapter_item_view.unnamed'));
    this.ui.number.text(I18n.t('pageflow.editor.views.chapter_item_view.chapter') + ' ' + (this.model.get('position') + 1));
  }
});

var css$2 = ".icons-module_icon__16IVx::before {\n  font-family: \"entypo\";\n}.icons-module_arrowsCcw__3_nrJ,\n.icons-module_attention__1sssG,\n.icons-module_plusCircled__20FlJ,\n.icons-module_rightOpen__9vsOG,\n.icons-module_trash__DH1EH {\n}.icons-module_arrowsCcw__3_nrJ::before {\n  content: \"\\1F504\";\n}.icons-module_attention__1sssG::before {\n  content: \"\\26A0\";\n}.icons-module_plusCircled__20FlJ::before {\n  content: \"\\2795\";\n}.icons-module_rightOpen__9vsOG::before {\n  content: \"\\E75E\"\n}.icons-module_trash__DH1EH::before {\n  content: \"\\E729\";\n}.buttons-module_iconButton__3ZSFV {\n  /* see app/assets/stylesheets/pageflow/editor/composable.scss */\n}.buttons-module_addButton__2pN-g {\n}\n\n.EntryOutlineView-module_root__3NBUB {}\n\n.EntryOutlineView-module_chapters__3Gr1l {}\n\n.EntryOutlineView-module_addChapter__3_M-b {\n}\n";
var styles$2 = {"root":"EntryOutlineView-module_root__3NBUB","chapters":"EntryOutlineView-module_chapters__3Gr1l","addChapter":"EntryOutlineView-module_addChapter__3_M-b buttons-module_addButton__2pN-g buttons-module_iconButton__3ZSFV icon_button icons-module_plusCircled__20FlJ icons-module_icon__16IVx"};
styleInject(css$2);

var EntryOutlineView = Marionette.Layout.extend({
  tagName: 'nav',
  className: styles$2.root,
  template: function template() {
    return "\n    <h2>".concat(I18n.t('pageflow_scrolled.editor.entry_outline.header'), "</h2>\n    <ul class=\"").concat(styles$2.chapters, "\"></ul>\n\n    <a class=\"").concat(styles$2.addChapter, "\" href=\"\">\n      ").concat(I18n.t('pageflow_scrolled.editor.entry_outline.add_chapter'), "\n    </a>\n  ");
  },
  ui: cssModulesUtils.ui(styles$2, 'chapters'),
  events: cssModulesUtils.events(styles$2, {
    'click addChapter': function clickAddChapter() {
      this.options.entry.addChapter();
    }
  }),
  onRender: function onRender() {
    this.subview(new SortableCollectionView({
      el: this.ui.chapters,
      collection: this.options.entry.chapters,
      itemViewConstructor: ChapterItemView,
      itemViewOptions: {
        entry: this.options.entry
      }
    }));
  }
});

var css$3 = ".EntryPreviewView-module_root__1Nb6e {\n  height: 100%;\n}\n\n.EntryPreviewView-module_iframe__1leJC {\n  border: none;\n  width: 100%;\n  height: 100%;\n}\n";
var styles$3 = {"root":"EntryPreviewView-module_root__1Nb6e","iframe":"EntryPreviewView-module_iframe__1leJC"};
styleInject(css$3);

var EntryPreviewView = Marionette.ItemView.extend({
  template: function template() {
    return "\n     <iframe class=\"".concat(styles$3.iframe, "\" />\n  ");
  },
  className: styles$3.root,
  ui: cssModulesUtils.ui(styles$3, 'iframe'),
  initialize: function initialize() {
    this.messageListener = this.onMessage.bind(this);
  },
  onShow: function onShow() {
    window.addEventListener('message', this.messageListener);
    inject(this.ui.iframe[0], unescape($('[data-template="iframe_seed"]').html()));
  },
  onClose: function onClose() {
    window.removeEventListener('message', this.messageListener);
  },
  onMessage: function onMessage(message) {
    var _this = this;

    if (window.location.href.indexOf(message.origin) === 0) {
      if (message.data.type === 'READY') {
        var postMessage = function postMessage(message) {
          _this.ui.iframe[0].contentWindow.postMessage(message, window.location.origin);
        };

        watchCollections(this.model, {
          dispatch: function dispatch(action) {
            return postMessage({
              type: 'ACTION',
              payload: action
            });
          }
        });
        this.listenTo(this.model, 'scrollToSection', function (section) {
          return postMessage({
            type: 'SCROLL_TO_SECTION',
            payload: {
              index: _this.model.sections.indexOf(section)
            }
          });
        });
        this.listenTo(this.model, 'selectContentElement', function (contentElement) {
          return postMessage({
            type: 'SELECT',
            payload: {
              id: contentElement.id,
              type: 'contentElement'
            }
          });
        });
        this.listenTo(this.model, 'resetSelection', function (contentElement) {
          return postMessage({
            type: 'SELECT',
            payload: null
          });
        });
      } else if (message.data.type === 'CHANGE_SECTION') {
        this.model.set('currentSectionIndex', message.data.payload.index);
      } else if (message.data.type === 'SELECTED') {
        var _message$data$payload = message.data.payload,
            id = _message$data$payload.id,
            type = _message$data$payload.type;
        var editor = this.options.editor;

        if (type === 'contentElement') {
          editor.navigate("/scrolled/content_elements/".concat(id), {
            trigger: true
          });
        } else if (type === 'before' || type === 'after') {
          editor.navigate("/scrolled/content_elements/insert?position=".concat(type, "&id=").concat(id), {
            trigger: true
          });
        } else {
          editor.navigate('/', {
            trigger: true
          });
        }
      }
    }
  }
});

function inject(iframe, html) {
  var doc = iframe.document || iframe.contentDocument || iframe.contentWindow.document;
  doc.open();
  doc.writeln(html);
  doc.close();
}

function unescape(text) {
  return text.replace(/<\\\//g, '</');
}

var SideBarRouter = Marionette.AppRouter.extend({
  appRoutes: {
    'scrolled/chapters/:id': 'chapter',
    'scrolled/sections/:id': 'section',
    'scrolled/content_elements/insert?position=:position&id=:id': 'insertContentElement',
    'scrolled/content_elements/:id': 'contentElement'
  }
});

var EditChapterView = EditConfigurationView.extend({
  translationKeyPrefix: 'pageflow_scrolled.editor.edit_chapter',
  configure: function configure(configurationEditor) {
    configurationEditor.tab('chapter', function () {
      this.input('title', TextInputView);
      this.input('summary', TextAreaInputView, {
        disableLinks: true
      });
    });
  }
});

var EditSectionView = EditConfigurationView.extend({
  translationKeyPrefix: 'pageflow_scrolled.editor.edit_section',
  configure: function configure(configurationEditor) {
    configurationEditor.tab('section', function () {
      this.input('layout', SelectInputView, {
        values: ['left', 'right', 'center']
      });
      this.input('backdropType', SelectInputView, {
        values: ['image', 'color'],
        texts: ['Bild', 'Farbe']
      });
      this.input('backdropImage', FileInputView, {
        collection: 'image_files',
        fileSelectionHandler: 'sectionConfiguration',
        visibleBinding: 'backdropType',
        visibleBindingValue: 'image'
      });
      this.input('backdropImage', ColorInputView, {
        visibleBinding: 'backdropType',
        visibleBindingValue: 'color'
      });
      this.input('invert', CheckBoxInputView);
    });
  }
});

var EditContentElementView = EditConfigurationView.extend({
  translationKeyPrefix: function translationKeyPrefix() {
    return "pageflow_scrolled.editor.content_elements.".concat(this.model.get('typeName'));
  },
  configure: function configure(configurationEditor) {
    this.options.editor.contentElementTypes.setupConfigurationEditor(this.model.get('typeName'), configurationEditor);
  }
});

var css$4 = ".InsertContentElementView-module_item__1EIxA a {\n  display: block;\n  padding: 10px;\n  margin-bottom: 2px;\n  background-color: #efefef;\n}\n";
var styles$4 = {"item":"InsertContentElementView-module_item__1EIxA"};
styleInject(css$4);

var InsertContentElementView = Marionette.ItemView.extend({
  template: function template() {
    return "\n    <h2>".concat(I18n.t('pageflow_scrolled.editor.insert_content_element.header'), "</h2>\n    <ul></ul>\n  ");
  },
  ui: {
    items: 'ul'
  },
  onRender: function onRender() {
    this.subview(new CollectionView({
      el: this.ui.items,
      collection: new Backbone$1.Collection(this.options.editor.contentElementTypes.toArray()),
      itemViewConstructor: ItemView,
      itemViewOptions: {
        entry: this.options.entry,
        insertOptions: this.options.insertOptions
      }
    }));
  },
  onGoBack: function onGoBack() {
    this.options.entry.trigger('resetSelection');
  }
});
var ItemView = Marionette.ItemView.extend({
  tagName: 'li',
  className: styles$4.item,
  template: function template(_ref) {
    var displayName = _ref.displayName;
    return "\n    <a href=\"\">".concat(displayName, "</a>\n  ");
  },
  events: {
    'click a': function clickA() {
      this.options.entry.insertContentElement({
        typeName: this.model.get('typeName')
      }, this.options.insertOptions);
    }
  }
});

InsertContentElementView.create = function (options) {
  return new BackButtonDecoratorView({
    view: new InsertContentElementView(options)
  });
};

var SideBarController = Marionette.Controller.extend({
  initialize: function initialize(options) {
    this.region = options.region;
    this.entry = options.entry;
  },
  chapter: function chapter(id, tab) {
    this.region.show(new EditChapterView({
      entry: this.entry,
      model: this.entry.chapters.get(id),
      editor: editor$2
    }));
  },
  section: function section(id, tab) {
    this.region.show(new EditSectionView({
      entry: this.entry,
      model: this.entry.sections.get(id),
      editor: editor$2
    }));
  },
  contentElement: function contentElement(id, tab) {
    this.region.show(new EditContentElementView({
      entry: this.entry,
      model: this.entry.contentElements.get(id),
      editor: editor$2
    }));
  },
  insertContentElement: function insertContentElement(position, id) {
    this.region.show(InsertContentElementView.create({
      entry: this.entry,
      insertOptions: {
        position: position,
        id: id
      },
      editor: editor$2
    }));
  }
});

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

/**
 * Integrate new content types into the editor.
 * @name editor_contentElementTypes
 */

var ContentElementTypeRegistry =
/*#__PURE__*/
function () {
  function ContentElementTypeRegistry() {
    _classCallCheck(this, ContentElementTypeRegistry);

    this.contentElementTypes = {};
  }
  /**
   * Register a new type of content element in the editor.
   *
   * @param {string} typeName - Name of the content element type.
   * @param {Object} options
   * @param {Function} options.configurationEditor -
   *   Function that is evaluated in the context of a
   *   `ConfigurationEditorView` (see `pageflow/ui`) which will
   *   be used to edit the configuration of content elements of
   *   this type.
   * @memberof editor_contentElementTypes
   *
   * @example
   *
   * // editor.js
   * editor.contentElementTypes.register('inlineImage', {
   *   configurationEditor() {
   *     this.tab('general', function() {
   *       this.input('caption', TextInputView);
   *     });
   *   }
   * });
   */


  _createClass(ContentElementTypeRegistry, [{
    key: "register",
    value: function register(typeName, options) {
      this.contentElementTypes[typeName] = options;
    }
  }, {
    key: "setupConfigurationEditor",
    value: function setupConfigurationEditor(name, configurationEditorView, options) {
      if (!this.contentElementTypes[name]) {
        throw new Error("Unknown content element type ".concat(name));
      }

      return this.contentElementTypes[name].configurationEditor.call(configurationEditorView, options);
    }
  }, {
    key: "toArray",
    value: function toArray() {
      return Object.keys(this.contentElementTypes).map(function (typeName) {
        return {
          typeName: typeName,
          displayName: I18n.t("pageflow_scrolled.editor.content_elements.".concat(typeName, ".name"))
        };
      });
    }
  }]);

  return ContentElementTypeRegistry;
}();

function extend(api) {
  return Object.assign(api, {
    contentElementTypes: new ContentElementTypeRegistry()
  });
}
var editor = extend(editor$1);

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$2(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
Object.assign(pageflow, globalInterop);
editor.registerEntryType('scrolled', {
  entryModel: ScrolledEntry,
  previewView: function previewView(options) {
    return new EntryPreviewView(_objectSpread$2({}, options, {
      editor: editor
    }));
  },
  outlineView: EntryOutlineView
});
editor.registerSideBarRouting({
  router: SideBarRouter,
  controller: SideBarController
});
editor.registerFileSelectionHandler('contentElementConfiguration', ContentElementFileSelectionHandler);

export { editor };
