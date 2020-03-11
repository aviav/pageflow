import React, { useRef, useLayoutEffect, useEffect, useReducer, useMemo, useContext, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import ReactTooltip from 'react-tooltip';
import I18n from 'i18n-js';

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

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) {
    return;
  }

  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

// from https://github.com/n8tb1t/use-scroll-position
var isBrowser = typeof window !== "undefined";

function getScrollPosition(_ref) {
  var element = _ref.element,
      useWindow = _ref.useWindow;
  if (!isBrowser) return {
    x: 0,
    y: 0
  };
  var target = element ? element.current : document.body;
  var position = target.getBoundingClientRect();
  return useWindow ? {
    x: window.scrollX,
    y: window.scrollY
  } : {
    x: position.left,
    y: position.top
  };
}

function useScrollPosition(effect, deps, element, useWindow, wait) {
  var position = useRef(getScrollPosition({
    useWindow: useWindow
  }));
  var throttleTimeout = null;

  var callBack = function callBack() {
    var currPos = getScrollPosition({
      element: element,
      useWindow: useWindow
    });
    effect({
      prevPos: position.current,
      currPos: currPos
    });
    position.current = currPos;
    throttleTimeout = null;
  };

  useLayoutEffect(function () {
    if (!isBrowser) {
      return;
    }

    var handleScroll = function handleScroll() {
      if (wait) {
        if (throttleTimeout === null) {
          // Todo: store in useRef hook?
          throttleTimeout = setTimeout(callBack, wait);
        }
      } else {
        callBack();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return function () {
      return window.removeEventListener('scroll', handleScroll);
    };
  }, deps);
}
useScrollPosition.defaultProps = {
  deps: [],
  element: false,
  useWindow: false,
  wait: null
};

function useNativeScrollPrevention(ref) {
  useEffect(function () {
    function preventNativeScroll(e) {
      e.preventDefault();
    }

    var current = ref.current;

    if (current) {
      current.addEventListener('touchmove', preventNativeScroll);
      current.addEventListener('mousewheel', preventNativeScroll);
    }

    return function () {
      if (current) {
        current.removeEventListener('touchmove', preventNativeScroll);
        current.removeEventListener('mousewheel', preventNativeScroll);
      }
    };
  }, [ref]);
}

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var PREFIX = 'PAGEFLOW_SCROLLED_COLLECTION';
var RESET = "".concat(PREFIX, "_RESET");
var ADD = "".concat(PREFIX, "_ADD");
var CHANGE = "".concat(PREFIX, "_CHANGE");
var REMOVE = "".concat(PREFIX, "_REMOVE");
var SORT = "".concat(PREFIX, "_SORT");
function useCollections() {
  var seed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      keyAttribute = _ref.keyAttribute;

  return useReducer(reducer, Object.keys(seed).reduce(function (result, key) {
    result[key] = init(seed[key], keyAttribute);
    return result;
  }, {}));
}

function reducer(state, action) {
  var collectionName = action.payload.collectionName;
  var keyAttribute = action.payload.keyAttribute;

  switch (action.type) {
    case RESET:
      return _objectSpread({}, state, _defineProperty({}, collectionName, init(action.payload.items, keyAttribute)));

    case ADD:
      return _objectSpread({}, state, _defineProperty({}, collectionName, {
        order: action.payload.order,
        items: _objectSpread({}, state[collectionName].items, _defineProperty({}, action.payload.attributes[keyAttribute], action.payload.attributes))
      }));

    case CHANGE:
      return _objectSpread({}, state, _defineProperty({}, collectionName, {
        order: state[collectionName].order,
        items: _objectSpread({}, state[collectionName].items, _defineProperty({}, action.payload.attributes[keyAttribute], action.payload.attributes))
      }));

    case REMOVE:
      var clonedItems = _objectSpread({}, state[collectionName].items);

      delete clonedItems[action.payload.key];
      return _objectSpread({}, state, _defineProperty({}, collectionName, {
        order: action.payload.order,
        items: clonedItems
      }));

    case SORT:
      return _objectSpread({}, state, _defineProperty({}, collectionName, {
        order: action.payload.order,
        items: state[collectionName].items
      }));

    default:
      return state;
  }
}

function init(items) {
  var keyAttribute = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'id';
  items = items.filter(function (item) {
    return item[keyAttribute];
  });
  return {
    order: items.map(function (item) {
      return item[keyAttribute];
    }),
    items: items.reduce(function (result, item) {
      result[item[keyAttribute]] = item;
      return result;
    }, {})
  };
}

function getItems(state, collectionName) {
  if (state[collectionName]) {
    var items = state[collectionName].items;
    return state[collectionName].order.map(function (key) {
      return items[key];
    });
  } else {
    return [];
  }
}
function getItem(state, collectionName, key) {
  if (state[collectionName]) {
    return state[collectionName].items[key];
  }
}

var Context = React.createContext();
function EntryStateProvider(_ref) {
  var seed = _ref.seed,
      children = _ref.children;

  var _useCollections = useCollections(seed.collections, {
    keyAttribute: 'permaId'
  }),
      _useCollections2 = _slicedToArray(_useCollections, 2),
      collections = _useCollections2[0],
      dispatch = _useCollections2[1];

  var value = useMemo(function () {
    return {
      entryState: {
        collections: collections,
        config: seed.config
      },
      dispatch: dispatch
    };
  }, [collections, dispatch, seed]);
  return React.createElement(Context.Provider, {
    value: value
  }, children);
}
function useEntryState() {
  var value = useContext(Context);
  return value.entryState;
}
function useEntryStateDispatch() {
  var value = useContext(Context);
  return value.dispatch;
}

/**
 * Returns a nested data structure representing the metadata of the entry.
 *
 * @example
 *
 * const metaData = useEntryMetadata();
 * metaData // =>
 *   {
 *     id: 5,
 *     locale: 'en',
 *     shareProviders: {email: false, facebook: true},
 *     share_url: 'http://test.host/test',
 *     credits: 'Credits: Pageflow'
 *   }
 */

function useEntryMetadata() {
  var entryState = useEntryState();
  return useMemo(function () {
    return getItems(entryState.collections, 'entries')[0];
  }, [entryState]);
}

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}
var EmailIcon = (function (_ref) {
  var _ref$styles = _ref.styles,
      props = _objectWithoutProperties(_ref, ["styles"]);

  return React.createElement("svg", _extends({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 612 612"
  }, props), React.createElement("path", {
    d: "M573.75 57.375H38.25C17.136 57.375 0 74.511 0 95.625v420.75c0 21.133 17.136 38.25 38.25 38.25h535.5c21.133 0 38.25-17.117 38.25-38.25V95.625c0-21.114-17.117-38.25-38.25-38.25zM554.625 497.25H57.375V204.657l224.03 187.999c7.134 5.967 15.874 8.97 24.595 8.97 8.74 0 17.461-3.003 24.595-8.97l224.03-187.999V497.25zm0-367.487L306 338.379 57.375 129.763V114.75h497.25v15.013z"
  }));
});

function _extends$1() {
  _extends$1 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$1.apply(this, arguments);
}
var FacebookIcon = (function (_ref) {
  var _ref$styles = _ref.styles,
      props = _objectWithoutProperties(_ref, ["styles"]);

  return React.createElement("svg", _extends$1({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 430.113 430.114"
  }, props), React.createElement("path", {
    d: "M158.081 83.3v59.218h-43.385v72.412h43.385v215.183h89.122V214.936h59.805s5.601-34.721 8.316-72.685H247.54V92.74c0-7.4 9.717-17.354 19.321-17.354h48.557V.001h-66.021C155.878-.004 158.081 72.48 158.081 83.3z"
  }));
});

function _extends$2() {
  _extends$2 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$2.apply(this, arguments);
}
var LinkedInIcon = (function (_ref) {
  var _ref$styles = _ref.styles,
      props = _objectWithoutProperties(_ref, ["styles"]);

  return React.createElement("svg", _extends$2({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 430.117 430.117"
  }, props), React.createElement("path", {
    d: "M430.117 261.543V420.56h-92.188V272.193c0-37.271-13.334-62.707-46.703-62.707-25.473 0-40.632 17.142-47.301 33.724-2.432 5.928-3.058 14.179-3.058 22.477V420.56h-92.219s1.242-251.285 0-277.32h92.21v39.309c-.187.294-.43.611-.606.896h.606v-.896c12.251-18.869 34.13-45.824 83.102-45.824 60.673-.001 106.157 39.636 106.157 124.818zM52.183 9.558C20.635 9.558 0 30.251 0 57.463c0 26.619 20.038 47.94 50.959 47.94h.616c32.159 0 52.159-21.317 52.159-47.94-.606-27.212-20-47.905-51.551-47.905zM5.477 420.56h92.184V143.24H5.477v277.32z"
  }));
});

function _extends$3() {
  _extends$3 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$3.apply(this, arguments);
}
var TelegramIcon = (function (_ref) {
  var _ref$styles = _ref.styles,
      props = _objectWithoutProperties(_ref, ["styles"]);

  return React.createElement("svg", _extends$3({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 512.004 512.004"
  }, props), React.createElement("path", {
    d: "M508.194 20.517c-4.43-4.96-11.42-6.29-17.21-3.76l-482 211a15.01 15.01 0 00-8.98 13.41 15.005 15.005 0 008.38 13.79l115.09 56.6 28.68 172.06c.93 6.53 6.06 11.78 12.74 12.73 4.8.69 9.57-1 12.87-4.4l90.86-90.86 129.66 92.62a15.02 15.02 0 0014.24 1.74 15.01 15.01 0 009.19-11.01l90-451c.89-4.47-.26-9.26-3.52-12.92zm-372.84 263.45l-84.75-41.68 334.82-146.57-250.07 188.25zm46.94 44.59l-13.95 69.75-15.05-90.3 183.97-138.49-150.88 151.39c-2.12 2.12-3.53 4.88-4.09 7.65zm9.13 107.3l15.74-78.67 36.71 26.22-52.45 52.45zm205.41 19.94l-176.73-126.23 252.47-253.31-75.74 379.54z"
  }));
});

function _extends$4() {
  _extends$4 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$4.apply(this, arguments);
}
var TwitterIcon = (function (_ref) {
  var _ref$styles = _ref.styles,
      props = _objectWithoutProperties(_ref, ["styles"]);

  return React.createElement("svg", _extends$4({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 612 612"
  }, props), React.createElement("path", {
    d: "M612 116.258a250.714 250.714 0 01-72.088 19.772c25.929-15.527 45.777-40.155 55.184-69.411-24.322 14.379-51.169 24.82-79.775 30.48-22.907-24.437-55.49-39.658-91.63-39.658-69.334 0-125.551 56.217-125.551 125.513 0 9.828 1.109 19.427 3.251 28.606-104.326-5.24-196.835-55.223-258.75-131.174-10.823 18.51-16.98 40.078-16.98 63.101 0 43.559 22.181 81.993 55.835 104.479a125.556 125.556 0 01-56.867-15.756v1.568c0 60.806 43.291 111.554 100.693 123.104-10.517 2.83-21.607 4.398-33.08 4.398-8.107 0-15.947-.803-23.634-2.333 15.985 49.907 62.336 86.199 117.253 87.194-42.947 33.654-97.099 53.655-155.916 53.655-10.134 0-20.116-.612-29.944-1.721 55.567 35.681 121.536 56.485 192.438 56.485 230.948 0 357.188-191.291 357.188-357.188l-.421-16.253c24.666-17.593 46.005-39.697 62.794-64.861z"
  }));
});

function _extends$5() {
  _extends$5 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$5.apply(this, arguments);
}
var WhatsAppIcon = (function (_ref) {
  var _ref$styles = _ref.styles,
      props = _objectWithoutProperties(_ref, ["styles"]);

  return React.createElement("svg", _extends$5({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 90 90"
  }, props), React.createElement("path", {
    d: "M90 43.841c0 24.213-19.779 43.841-44.182 43.841a44.256 44.256 0 01-21.357-5.455L0 90l7.975-23.522a43.38 43.38 0 01-6.34-22.637C1.635 19.628 21.416 0 45.818 0 70.223 0 90 19.628 90 43.841zM45.818 6.982c-20.484 0-37.146 16.535-37.146 36.859 0 8.065 2.629 15.534 7.076 21.61L11.107 79.14l14.275-4.537A37.122 37.122 0 0045.819 80.7c20.481 0 37.146-16.533 37.146-36.857S66.301 6.982 45.818 6.982zm22.311 46.956c-.273-.447-.994-.717-2.076-1.254-1.084-.537-6.41-3.138-7.4-3.495-.993-.358-1.717-.538-2.438.537-.721 1.076-2.797 3.495-3.43 4.212-.632.719-1.263.809-2.347.271-1.082-.537-4.571-1.673-8.708-5.333-3.219-2.848-5.393-6.364-6.025-7.441-.631-1.075-.066-1.656.475-2.191.488-.482 1.084-1.255 1.625-1.882.543-.628.723-1.075 1.082-1.793.363-.717.182-1.344-.09-1.883-.27-.537-2.438-5.825-3.34-7.977-.902-2.15-1.803-1.792-2.436-1.792-.631 0-1.354-.09-2.076-.09s-1.896.269-2.889 1.344c-.992 1.076-3.789 3.676-3.789 8.963 0 5.288 3.879 10.397 4.422 11.113.541.716 7.49 11.92 18.5 16.223C58.2 65.771 58.2 64.336 60.186 64.156c1.984-.179 6.406-2.599 7.312-5.107.9-2.512.9-4.663.631-5.111z"
  }));
});

/**
 * Returns a list of attributes (icon, name and url) of all configured share providers of the entry.
 * The url provides a %{url} placeholder where the link can be inserted.
 *
 * @example
 *
 * const shareProviders = useShareProviders();
 * shareProviders // =>
 *   [
 *     {
 *       icon: <FacebookSVGIcon />,
 *       name: 'Facebook',
 *       url: http://www.facebook.com/sharer/sharer.php?u=%{url}
 *     },
 *     {
 *       icon: <TwitterSVGIcon />,
 *       name: 'Twitter',
 *       url: https://twitter.com/intent/tweet?url=%{url}
 *     }
 *   ]
 */

function useShareProviders() {
  var entryState = useEntryState();
  var entryMetadata = useEntryMetadata();
  var shareProviders = entryMetadata ? entryMetadata.shareProviders : {};
  var urlTemplates = entryState.config.shareUrlTemplates;
  var sharing = {
    email: {
      icon: EmailIcon,
      name: 'Email',
      url: urlTemplates.email
    },
    facebook: {
      icon: FacebookIcon,
      name: 'Facebook',
      url: urlTemplates.facebook
    },
    linked_in: {
      icon: LinkedInIcon,
      name: 'LinkedIn',
      url: urlTemplates.linked_in
    },
    telegram: {
      icon: TelegramIcon,
      name: 'Telegram',
      url: urlTemplates.telegram
    },
    twitter: {
      icon: TwitterIcon,
      name: 'Twitter',
      url: urlTemplates.twitter
    },
    whats_app: {
      icon: WhatsAppIcon,
      name: 'WhatsApp',
      url: urlTemplates.whats_app
    }
  };
  return useMemo(function () {
    return activeShareProviders(shareProviders).map(function (provider) {
      var config = sharing[provider];
      return {
        name: config.name,
        icon: config.icon,
        url: config.url
      };
    });
  }, [shareProviders]);
}

function activeShareProviders(shareProvidersConfig) {
  return Object.keys(shareProvidersConfig).filter(function (provider) {
    return shareProvidersConfig[provider] !== false;
  });
}
/**
 * Returns the share url of the entry.
 *
 * @example
 *
 * const shareUrl = useShareUrl();
 * shareUrl // => "http://test.host/test"
 */


function useShareUrl() {
  var entryMetadata = useEntryMetadata();
  var entryState = useEntryState();

  if (entryMetadata) {
    return entryMetadata.shareUrl ? entryMetadata.shareUrl : entryState.config.prettyUrl;
  } else {
    return entryState.config.shareUrl;
  }
}

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
/**
 * Returns a nested data structure representing the chapters, sections
 * and content elements of the entry.
 *
 * @example
 *
 * const structure = useEntryStructure();
 * structure // =>
 *   [
 *     {
 *       permaId: 5,
 *       title: 'Chapter 1',
 *       summary: 'An introductory chapter',
 *       sections: [
 *         {
 *           permaId: 101,
 *           sectionIndex: 0,
 *           transition: 'scroll',
 *
 *           // references to adjacent section objects
 *           previousSection: { ... },
 *           nextSection: { ... },
 *
 *           foreground: [
 *             {
 *               type: 'heading',
 *               props: {
 *                 children: 'Heading'
 *               }
 *             },
 *             {
 *               type: 'textBlock',
 *               props: {
 *                 children: 'Some text'
 *               }
 *             }
 *           ]
 *         }
 *       ],
 *     }
 *   ]
 */

function useEntryStructure() {
  var entryState = useEntryState();
  return useMemo(function () {
    var sections = [];
    var chapters = getItems(entryState.collections, 'chapters').map(function (chapter) {
      return _objectSpread$1({
        permaId: chapter.permaId
      }, chapter.configuration, {
        sections: getItems(entryState.collections, 'sections').filter(function (item) {
          return item.chapterId === chapter.id;
        }).map(function (section) {
          var result = sectionStructure(entryState.collections, section);
          sections.push(result);
          return result;
        })
      });
    });
    sections.forEach(function (section, index) {
      section.sectionIndex = index;
      section.previousSection = sections[index - 1];
      section.nextSection = sections[index + 1];
    });
    return chapters;
  }, [entryState]);
}
/**
 * Returns a nested data structure representing the content elements
 * of section.
 *
 * @param {Object} options
 * @param {number} options.sectionPermaId
 *
 * @example
 *
 * const section = useSectionStructure({sectionPermaId: 4});
 * section // =>
 *   {
 *     permaId: 4,
 *     transition: 'scroll',
 *     foreground: [
 *       {
 *         type: 'heading',
 *         props: {
 *           children: 'Heading'
 *         }
 *       },
 *       {
 *         type: 'textBlock',
 *         props: {
 *           children: 'Some text'
 *         }
 *       }
 *     ]
 *   }
 */

function useSectionStructure(_ref) {
  var sectionPermaId = _ref.sectionPermaId;
  var entryState = useEntryState();
  var section = getItem(entryState.collections, 'sections', sectionPermaId);
  return sectionStructure(entryState.collections, section);
}

function sectionStructure(collections, section) {
  return section && _objectSpread$1({
    permaId: section.permaId
  }, section.configuration, {
    foreground: getItems(collections, 'contentElements').filter(function (item) {
      return item.sectionId === section.id;
    }).map(function (item) {
      return {
        id: item.id,
        type: item.typeName,
        position: item.configuration.position,
        props: item.configuration
      };
    })
  });
}

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$2(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function expandUrls(collectionName, file, urlTemplates) {
  if (!file) {
    return null;
  }

  if (!urlTemplates[collectionName]) {
    throw new Error("No file url templates found for ".concat(collectionName));
  }

  var variants = file.variants || Object.keys(urlTemplates[collectionName]);
  var urls = variants.reduce(function (result, variant) {
    var url = getFileUrl(collectionName, file, variant, urlTemplates);

    if (url) {
      result[variant] = url;
    }

    return result;
  }, {});
  return _objectSpread$2({
    urls: urls
  }, file);
}

function getFileUrl(collectionName, file, quality, urlTemplates) {
  var templates = urlTemplates[collectionName];
  var template = templates[quality];

  if (template) {
    return template.replace(':id_partition', idPartition(file.id)).replace(':basename', file.basename);
  }
}

function idPartition(id) {
  return partition(pad(id, 9));
}

function partition(string, separator) {
  return string.replace(/./g, function (c, i, a) {
    return i && (a.length - i) % 3 === 0 ? '/' + c : c;
  });
}

function pad(string, size) {
  return (Array(size).fill(0).join('') + string).slice(-size);
}

/**
 * Look up a file by its collection and perma id.
 *
 * @param {Object} options
 * @param {String} options.collectionName - Collection name of file type to look for (in camel case).
 * @param {String} options.permaId - Perma id of file look up
 *
 * @example
 * const imageFile = useFile({collectionName: 'imageFiles', permaId: 5});
 * imageFile // =>
 *   {
 *     id: 102,
 *     permaId: 5,
 *     width: 1000,
 *     height: 500,
 *     urls: {
 *       large: 'https://...'
 *     },
 *   }
 */

function useFile(_ref) {
  var collectionName = _ref.collectionName,
      permaId = _ref.permaId;
  var entryState = useEntryState();
  return expandUrls(collectionName, getItem(entryState.collections, collectionName, permaId), entryState.config.fileUrlTemplates);
}

/**
 * Returns a string (comma-separated list) of copyrights of
 * all images used in the entry.
 * If none of the images has a rights attribute configured,
 * it falls back to the default file rights of the entry's account,
 * otherwise returns an empty string
 *
 * @example
 *
 * const fileRights = useFileRights();
 * fileRights // => "author of image 1, author of image 2"
 */

function useFileRights() {
  var entryState = useEntryState();
  var defaultFileRights = entryState.config.defaultFileRights;
  var imageFiles = getItems(entryState.collections, 'imageFiles');
  var imageFileRights = imageFiles.map(function (imageConfig) {
    return imageConfig.rights ? imageConfig.rights.trim() : undefined;
  }).filter(Boolean).join(', ');
  var fileRights = !!imageFileRights ? imageFileRights : defaultFileRights.trim();
  var fileRightsString = !!fileRights ? 'Bildrechte: ' + fileRights : '';
  return fileRightsString;
}
/**
 * Returns a nested data structure representing the legal info of the entry.
 * Each legal info is separated into label and url to use in links.
 * Both label and url can be blank, depending on the configuration.
 *
 * @example
 *
 * const legalInfo = useLegalInfo();
 * legalInfo // =>
 *   {
 *     imprint: {
 *       label: '',
 *       url: ''
 *     },
 *     copyright: {
 *       label: '',
 *       url: ''
 *     },
 *     privacy: {
 *       label: '',
 *       url: ''
 *     }
 *   }
 */

function useLegalInfo() {
  var entryState = useEntryState();
  return entryState.config.legalInfo;
}
/**
 * Returns the credits string (rich text) of the entry.
 *
 * @example
 *
 * const credits = useCredits();
 * credits // => "Credits: <a href="http://pageflow.com">pageflow.com</a>"
 */

function useCredits() {
  var entryMetadata = useEntryMetadata();
  var credits = '';

  if (entryMetadata) {
    credits = entryMetadata.credits;
  }

  return credits;
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

var css = "header svg {\n  fill: #c2c2c2;\n  cursor: pointer;\n}\n\nheader svg:hover {\n  fill: rgb(0, 55, 90);;\n}\n\n.AppHeader-module_navigationBar__2EFHw {\n  font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\",\n    \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\",\n    sans-serif;\n  position: sticky;\n  top: -50px;\n  transition: top .15s;\n  z-index: 10000;\n  width: 100%;\n  text-align: center;\n}\n\n.AppHeader-module_navigationBarExpanded__18nbf {\n  top: 0;\n}\n\n.AppHeader-module_navigationBarContentWrapper__2Sf8y {\n  position: relative;\n  z-index: 2;\n  background-color: #fff;\n  height: 50px;\n}\n\n.AppHeader-module_menuIcon__5JKuj {\n  position: absolute;\n}\n\n.AppHeader-module_contextIcons__23I_3 {\n  position: absolute;\n  top: 0px;\n  right: 0px;\n  width: 80px;\n  height: 50px;\n  padding: 0px 12px;\n}\n\n.AppHeader-module_contextIcon__157kW {\n  float: right;\n  width: 40px;\n  height: 50px;\n}\n\n.AppHeader-module_wdrLogo__3XGNI {\n  top: 12px;\n  left: 15px;\n  width: 80px;\n}\n\n.AppHeader-module_chapterList__2lMMD {\n  padding: 0;\n  margin: 0;\n  list-style: none;\n}\n\n.AppHeader-module_chapterListItem__28zrc {\n  position: relative;\n  display: inline-block;\n  padding: 0 15px;\n  border-right: 1px solid #e9e9e9;\n}\n\n.AppHeader-module_chapterListItem__28zrc:last-of-type {\n  border-right: none;\n}\n\n.AppHeader-module_navigationTooltip__1EvCy {\n  opacity: 1 !important;\n  box-shadow: 0 0 0.3125rem rgba(0,0,0,.2);\n}\n\n.AppHeader-module_progressBar__17IVu {\n  background-color: rgba(194,194,194,0.8);\n  height: 8px;\n  width: 100%;\n}\n\n.AppHeader-module_progressIndicator__3SlYz {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 0vw;\n  height: 100%;\n  background-color: #e10028;\n}\n\n/* mobile view */\n@media (max-width: 780px) {\n  .AppHeader-module_wdrLogo__3XGNI {\n    position: inherit;\n  }\n\n  .AppHeader-module_navigationChapters__1dzyV {\n    touch-action: none;\n    display: block;\n    position: fixed;\n    top: 60px;\n    left: 0px;\n    background: rgba(255, 255, 255, 0.95);\n    width: 100vw;\n    height: 100vh;\n  }\n\n  .AppHeader-module_navigationChaptersHidden__8AEPA {\n    display: none;\n  }\n\n  .AppHeader-module_chapterList__2lMMD {\n    margin-top: 50px;\n  }\n\n  .AppHeader-module_chapterListItem__28zrc {\n    display: list-item;\n    width: 80vw;\n    padding: 25px 10vw;\n    border-right: none;\n  }\n\n  .AppHeader-module_chapterListItem__28zrc::before,\n  .AppHeader-module_chapterListItem__28zrc::after {\n    display: table;\n    content: \" \";\n    border-top: 1px solid rgb(100, 100, 100);\n    width: 14%;\n    margin: 0 43%;\n    transition: width .15s, margin .15s;\n  }\n\n  .AppHeader-module_chapterListItem__28zrc:hover::before,\n  .AppHeader-module_chapterListItem__28zrc:hover::after {\n    border-top: 1px solid rgb(0, 55, 90);\n    width: 80%;\n    margin: 0 10%;\n  }\n\n  .AppHeader-module_chapterListItem__28zrc p {\n    margin-top: 0;\n  }\n\n  .AppHeader-module_progressBar__17IVu {\n    height: 10px;\n  }\n}\n";
var styles = {"navigationBar":"AppHeader-module_navigationBar__2EFHw","navigationBarExpanded":"AppHeader-module_navigationBarExpanded__18nbf","navigationBarContentWrapper":"AppHeader-module_navigationBarContentWrapper__2Sf8y","menuIcon":"AppHeader-module_menuIcon__5JKuj","contextIcons":"AppHeader-module_contextIcons__23I_3","contextIcon":"AppHeader-module_contextIcon__157kW","wdrLogo":"AppHeader-module_wdrLogo__3XGNI","chapterList":"AppHeader-module_chapterList__2lMMD","chapterListItem":"AppHeader-module_chapterListItem__28zrc","navigationTooltip":"AppHeader-module_navigationTooltip__1EvCy","progressBar":"AppHeader-module_progressBar__17IVu","progressIndicator":"AppHeader-module_progressIndicator__3SlYz","navigationChapters":"AppHeader-module_navigationChapters__1dzyV","navigationChaptersHidden":"AppHeader-module_navigationChaptersHidden__8AEPA"};
styleInject(css);

var css$1 = ".HamburgerIcon-module_burgerMenuIconContainer__26RY4 {\n  display: none;\n}\n\n.HamburgerIcon-module_burgerMenuIcon__24t-5 {\n  top: 12px;\n  left: 12px;\n  outline: none;\n}\n\n/* mobile view */\n@media (max-width: 780px) {\n  .HamburgerIcon-module_burgerMenuIconContainer__26RY4 {\n    display: block;\n  }\n}\n";
var styles$1 = {"burgerMenuIconContainer":"HamburgerIcon-module_burgerMenuIconContainer__26RY4","burgerMenuIcon":"HamburgerIcon-module_burgerMenuIcon__24t-5"};
styleInject(css$1);

var css$2 = "/*!\n * Hamburgers\n * @description Tasty CSS-animated hamburgers\n * @author Jonathan Suh @jonsuh\n * @site https://jonsuh.com/hamburgers\n * @link https://github.com/jonsuh/hamburgers\n */\n.HamburgerIcons-module_hamburger__NnCze {\n  display: inline-block;\n  cursor: pointer;\n  transition-property: opacity, filter;\n  transition-duration: 0.15s;\n  transition-timing-function: linear;\n  font: inherit;\n  color: inherit;\n  text-transform: none;\n  background-color: transparent;\n  border: 0;\n  margin: 0;\n  overflow: visible;\n}\n\n.HamburgerIcons-module_hamburger__NnCze.HamburgerIcons-module_is-active__10qoY .HamburgerIcons-module_hamburger-inner__187lg,\n.HamburgerIcons-module_hamburger__NnCze.HamburgerIcons-module_is-active__10qoY .HamburgerIcons-module_hamburger-inner__187lg::before,\n.HamburgerIcons-module_hamburger__NnCze.HamburgerIcons-module_is-active__10qoY .HamburgerIcons-module_hamburger-inner__187lg::after {\n  background-color: #e10028;\n}\n\n.HamburgerIcons-module_hamburger-box__34rgF {\n  width: 40px;\n  height: 24px;\n  display: inline-block;\n  position: relative;\n}\n\n.HamburgerIcons-module_hamburger-inner__187lg {\n  display: block;\n  top: 50%;\n  margin-top: -2px;\n}\n\n.HamburgerIcons-module_hamburger-inner__187lg, .HamburgerIcons-module_hamburger-inner__187lg::before, .HamburgerIcons-module_hamburger-inner__187lg::after {\n  width: 30px;\n  height: 4px;\n  background-color: rgb(0, 55, 90);\n  border-radius: 4px;\n  position: absolute;\n  transition-property: transform;\n  transition-duration: 0.15s;\n  transition-timing-function: ease;\n}\n\n.HamburgerIcons-module_hamburger-inner__187lg::before, .HamburgerIcons-module_hamburger-inner__187lg::after {\n  content: \"\";\n  display: block;\n}\n\n.HamburgerIcons-module_hamburger-inner__187lg::before {\n  top: -10px;\n}\n\n.HamburgerIcons-module_hamburger-inner__187lg::after {\n  bottom: -10px;\n}\n\n/*\n * Collapse\n */\n.HamburgerIcons-module_hamburger--collapse__gRQFa .HamburgerIcons-module_hamburger-inner__187lg {\n  top: auto;\n  bottom: 0;\n  transition-duration: 0.13s;\n  transition-delay: 0.13s;\n  transition-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);\n}\n\n.HamburgerIcons-module_hamburger--collapse__gRQFa .HamburgerIcons-module_hamburger-inner__187lg::after {\n  top: -20px;\n  transition: top 0.2s 0.2s cubic-bezier(0.33333, 0.66667, 0.66667, 1), opacity 0.1s linear;\n}\n\n.HamburgerIcons-module_hamburger--collapse__gRQFa .HamburgerIcons-module_hamburger-inner__187lg::before {\n  transition: top 0.12s 0.2s cubic-bezier(0.33333, 0.66667, 0.66667, 1), transform 0.13s cubic-bezier(0.55, 0.055, 0.675, 0.19);\n}\n\n.HamburgerIcons-module_hamburger--collapse__gRQFa.HamburgerIcons-module_is-active__10qoY .HamburgerIcons-module_hamburger-inner__187lg {\n  transform: translate3d(0, -10px, 0) rotate(-45deg);\n  transition-delay: 0.22s;\n  transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);\n}\n\n.HamburgerIcons-module_hamburger--collapse__gRQFa.HamburgerIcons-module_is-active__10qoY .HamburgerIcons-module_hamburger-inner__187lg::after {\n  top: 0;\n  opacity: 0;\n  transition: top 0.2s cubic-bezier(0.33333, 0, 0.66667, 0.33333), opacity 0.1s 0.22s linear;\n}\n\n.HamburgerIcons-module_hamburger--collapse__gRQFa.HamburgerIcons-module_is-active__10qoY .HamburgerIcons-module_hamburger-inner__187lg::before {\n  top: 0;\n  transform: rotate(-90deg);\n  transition: top 0.1s 0.16s cubic-bezier(0.33333, 0, 0.66667, 0.33333), transform 0.13s 0.25s cubic-bezier(0.215, 0.61, 0.355, 1);\n}\n";
var hamburgerIconStyles = {"hamburger":"HamburgerIcons-module_hamburger__NnCze","is-active":"HamburgerIcons-module_is-active__10qoY","hamburger-inner":"HamburgerIcons-module_hamburger-inner__187lg","hamburger-box":"HamburgerIcons-module_hamburger-box__34rgF","hamburger--collapse":"HamburgerIcons-module_hamburger--collapse__gRQFa"};
styleInject(css$2);

function HamburgerIcon(props) {
  return React.createElement("div", {
    className: styles$1.burgerMenuIconContainer
  }, React.createElement("button", {
    className: classNames(styles.menuIcon, styles$1.burgerMenuIcon, hamburgerIconStyles.hamburger, hamburgerIconStyles['hamburger--collapse'], _defineProperty({}, hamburgerIconStyles['is-active'], !props.mobileNavHidden)),
    type: "button",
    onClick: props.onClick
  }, React.createElement("span", {
    className: hamburgerIconStyles['hamburger-box']
  }, React.createElement("span", {
    className: hamburgerIconStyles['hamburger-inner']
  }))));
}

var css$3 = ".ChapterLink-module_chapterLink__v5VRl {\n  line-height: 3rem;\n  color: rgb(0, 55, 90);\n  text-decoration: none;\n  position: relative;\n  display: block;\n  font-family: inherit;\n  font-weight: 700;\n  font-size: 1rem;\n  height: 50px;\n}\n\n.ChapterLink-module_chapterLink__v5VRl:hover,\n.ChapterLink-module_chapterLinkActive__jl4h5 {\n  color: #e10028;\n}\n\n.ChapterLink-module_summary__17aoW {\n  display: none;\n}\n\n/* mobile view */\n@media (max-width: 780px) {\n  .ChapterLink-module_summary__17aoW {\n    display: block;\n  }\n}";
var styles$2 = {"chapterLink":"ChapterLink-module_chapterLink__v5VRl","chapterLinkActive":"ChapterLink-module_chapterLinkActive__jl4h5","summary":"ChapterLink-module_summary__17aoW"};
styleInject(css$3);

var css$4 = ".ChapterLinkTooltip-module_chapterLinkTooltip__cCfsw {\n  border-bottom: 3px solid #e10028;\n  width: 200px;\n}\n\n.ChapterLinkTooltip-module_tooltipHeadline__reew_ {\n  margin: 5px 0 0px;\n  color: #e10028;\n}\n\n@media (max-width: 780px) {\n  .ChapterLinkTooltip-module_chapterLinkTooltip__cCfsw {\n    display: none !important;\n  }\n}\n";
var styles$3 = {"chapterLinkTooltip":"ChapterLinkTooltip-module_chapterLinkTooltip__cCfsw","tooltipHeadline":"ChapterLinkTooltip-module_tooltipHeadline__reew_"};
styleInject(css$4);

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$3(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
function setupI18n(_ref) {
  var defaultLocale = _ref.defaultLocale,
      locale = _ref.locale,
      translations = _ref.translations;
  I18n.defaultLocale = defaultLocale;
  I18n.locale = locale;
  I18n.translations = translations;
}
/**
 * Use translations in frontend elements. Uses the configured locale
 * of the current entry by default. Note that only translation keys
 * from the `pageflow_scrolled.public` scope are universally
 * available.
 *
 * to render translations for inline editing controls in the editor
 * preview, you can pass `"ui"` as `locale` option and use
 * translations from the `pageflow_scrolled.inline_editing` scope.
 *
 * @param {Object} [options]
 * @param {string} [locale="entry"] -
 *   Pass `"ui"` to use the locale of the editor interface instead.
 *
 * @example
 * const {t} = useI18n();
 * t('pagelow_scrolled.public.some.key')
 *
 * const {t} = useI18n({locale: 'ui'});
 * t('pagelow_scrolled.inline_editing.some.key')
 */

function useI18n() {
  var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      scope = _ref2.locale;

  var _useEntryMetadata = useEntryMetadata(),
      locale = _useEntryMetadata.locale;

  return {
    t: function t(key, options) {
      return I18n.t(key, _objectSpread$3({}, options, {
        locale: scope !== 'ui' && locale
      }));
    }
  };
}

function ChapterLinkTooltip(props) {
  var _useI18n = useI18n(),
      t = _useI18n.t;

  return React.createElement(ReactTooltip, {
    id: props.chapterLinkId,
    type: "light",
    place: "bottom",
    effect: "solid",
    className: classNames(styles.navigationTooltip, styles$3.chapterLinkTooltip)
  }, React.createElement("div", null, React.createElement("h3", {
    className: styles$3.tooltipHeadline
  }, t('pageflow_scrolled.public.navigation.chapter'), " ", props.chapterIndex), React.createElement("p", {
    dangerouslySetInnerHTML: {
      __html: props.summary
    }
  })));
}

function ChapterLink(props) {
  return React.createElement("div", null, React.createElement("a", {
    className: classNames(styles$2.chapterLink, _defineProperty({}, styles$2.chapterLinkActive, props.active)),
    href: "#chapter-".concat(props.permaId),
    onClick: function onClick() {
      return props.handleMenuClick(props.chapterLinkId);
    },
    "data-tip": true,
    "data-for": props.chapterLinkId
  }, props.title), React.createElement("p", {
    className: styles$2.summary,
    dangerouslySetInnerHTML: {
      __html: props.summary
    }
  }), React.createElement(ChapterLinkTooltip, Object.assign({
    chapterIndex: props.chapterIndex,
    chapterLinkId: props.chapterLinkId
  }, props)));
}

var css$5 = ".LegalInfoMenu-module_infoIcon__1kTnt svg {\n  width: 26px;\n  height: 26px;\n  margin: 12px 0px;\n}\n\n";
var styles$4 = {"infoIcon":"LegalInfoMenu-module_infoIcon__1kTnt"};
styleInject(css$5);

function _extends$6() {
  _extends$6 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$6.apply(this, arguments);
}
var InfoIcon = (function (_ref) {
  var _ref$styles = _ref.styles,
      props = _objectWithoutProperties(_ref, ["styles"]);

  return React.createElement("svg", _extends$6({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 330 330"
  }, props), React.createElement("path", {
    d: "M165 0C74.019 0 0 74.02 0 165.001 0 255.982 74.019 330 165 330s165-74.018 165-164.999S255.981 0 165 0zm0 300c-74.44 0-135-60.56-135-134.999S90.56 30 165 30s135 60.562 135 135.001C300 239.44 239.439 300 165 300z"
  }), React.createElement("path", {
    d: "M164.998 70c-11.026 0-19.996 8.976-19.996 20.009 0 11.023 8.97 19.991 19.996 19.991 11.026 0 19.996-8.968 19.996-19.991 0-11.033-8.97-20.009-19.996-20.009zm.002 70c-8.284 0-15 6.716-15 15v90c0 8.284 6.716 15 15 15 8.284 0 15-6.716 15-15v-90c0-8.284-6.716-15-15-15z"
  }));
});

var css$6 = ".LegalInfoTooltip-module_legalInfoTooltip__ChzOS {\n  width: 200px;\n  max-width: 200px;\n  text-align: left;\n}\n\n.LegalInfoTooltip-module_legalInfoTooltip__ChzOS:after {\n  left: 90% !important;\n}\n\n.LegalInfoTooltip-module_legalInfoTooltip__ChzOS p {\n  margin: 0 0 0.5em;\n}\n\n.LegalInfoTooltip-module_legalInfoTooltip__ChzOS a {\n  color: #e10028;\n}\n";
var styles$5 = {"legalInfoTooltip":"LegalInfoTooltip-module_legalInfoTooltip__ChzOS"};
styleInject(css$6);

function LegalInfoLink(props) {
  return React.createElement("div", null, props.label && props.url && React.createElement("a", {
    target: "_blank",
    href: props.url,
    dangerouslySetInnerHTML: {
      __html: props.label
    }
  }));
}

function LegalInfoTooltip() {
  var fileRights = useFileRights();
  var legalInfo = useLegalInfo();
  var credits = useCredits();
  return React.createElement(ReactTooltip, {
    id: 'legalInfoTooltip',
    type: 'light',
    place: 'bottom',
    effect: 'solid',
    event: 'click',
    globalEventOff: 'click',
    clickable: true,
    offset: {
      right: -97
    },
    className: classNames(styles.navigationTooltip, styles$5.legalInfoTooltip)
  }, React.createElement("div", {
    onMouseLeave: function onMouseLeave() {
      ReactTooltip.hide();
    }
  }, credits && React.createElement("p", {
    dangerouslySetInnerHTML: {
      __html: credits
    }
  }), fileRights && React.createElement("p", null, fileRights), React.createElement(LegalInfoLink, legalInfo.imprint), React.createElement(LegalInfoLink, legalInfo.copyright), React.createElement(LegalInfoLink, legalInfo.privacy)));
}

function LegalInfoMenu(props) {
  return React.createElement("div", null, React.createElement("a", {
    className: classNames(styles.contextIcon, styles$4.infoIcon),
    "data-tip": true,
    "data-for": 'legalInfoTooltip',
    onMouseEnter: function onMouseEnter() {
      ReactTooltip.hide();
    }
  }, React.createElement(InfoIcon, null)), React.createElement(LegalInfoTooltip, null));
}

var css$7 = ".SharingMenu-module_shareIcon__1AlDL svg {\n  width: 40px;\n  height: 40px;\n  margin: 5px 0px;\n}";
var styles$6 = {"shareIcon":"SharingMenu-module_shareIcon__1AlDL"};
styleInject(css$7);

function _extends$7() {
  _extends$7 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$7.apply(this, arguments);
}
var ShareIcon = (function (_ref) {
  var _ref$styles = _ref.styles,
      props = _objectWithoutProperties(_ref, ["styles"]);

  return React.createElement("svg", _extends$7({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 96 96"
  }, props), React.createElement("path", {
    d: "M67.5 18c-5.1 0-9.3 4.2-9.3 9.3 0 .5.1 1.1.2 1.6l-23 12.9c-1.7-1.8-4.1-3-6.8-3-5.1 0-9.3 4.1-9.3 9.3 0 5.1 4.1 9.3 9.3 9.3 2.7 0 5.2-1.2 6.9-3.1l22.8 13.4c0 .4-.1.7-.1 1.1 0 5.1 4.1 9.3 9.3 9.3 5.1 0 9.3-4.1 9.3-9.3 0-5.1-4.1-9.3-9.3-9.3-2.8 0-5.4 1.3-7.1 3.3L37.7 49.4c.1-.4.1-.9.1-1.3 0-.5 0-1-.1-1.5l23.1-13c1.7 1.8 4.1 3 6.8 3 5.1 0 9.3-4.1 9.3-9.3-.1-5.1-4.3-9.3-9.4-9.3z"
  }));
});

var css$8 = "header .share svg {\n  fill: rgb(0, 55, 90);\n}\n\nheader .share:hover svg {\n  fill: #e10028;\n}\n\n.SharingTooltip-module_sharingTooltip__1cljv {\n  width: 160px;\n  padding: 0 !important;\n}\n\n.SharingTooltip-module_sharingTooltip__1cljv:after {\n  left: 90% !important;\n}\n\n.SharingTooltip-module_shareLinkContainer__2MnKN {\n  display: inline-block;\n  width: 80px;\n  height: 60px;\n  cursor: pointer;\n  color: transparent;\n  text-align: center;\n}\n\n.SharingTooltip-module_shareLink__2ySSX {\n  position: relative;\n  color: rgb(0, 55, 90);\n  text-decoration: none;\n}\n\n.SharingTooltip-module_shareLink__2ySSX:hover {\n  color: #e10028;\n}\n\n.SharingTooltip-module_shareIcon__3igrs {\n  width: 80px;\n  height: 25px;\n  margin-top: 5px;\n  margin-bottom: 3px;\n}\n";
var styles$7 = {"sharingTooltip":"SharingTooltip-module_sharingTooltip__1cljv","shareLinkContainer":"SharingTooltip-module_shareLinkContainer__2MnKN","shareLink":"SharingTooltip-module_shareLink__2ySSX","shareIcon":"SharingTooltip-module_shareIcon__3igrs"};
styleInject(css$8);

function SharingTooltip() {
  var shareUrl = useShareUrl();
  var shareProviders = useShareProviders();

  function renderShareLinks(shareProviders) {
    return shareProviders.map(function (shareProvider) {
      var Icon = shareProvider.icon;
      return React.createElement("div", {
        key: shareProvider.name,
        className: styles$7.shareLinkContainer
      }, React.createElement("a", {
        className: classNames('share', styles$7.shareLink),
        href: shareProvider.url.replace('%{url}', shareUrl),
        target: '_blank'
      }, React.createElement(Icon, {
        className: styles$7.shareIcon
      }), shareProvider.name));
    });
  }
  return React.createElement(ReactTooltip, {
    id: 'sharingTooltip',
    type: 'light',
    place: 'bottom',
    effect: 'solid',
    event: 'click',
    globalEventOff: 'click',
    clickable: true,
    offset: {
      right: -64
    },
    className: classNames(styles.navigationTooltip, styles$7.sharingTooltip)
  }, React.createElement("div", {
    onMouseLeave: function onMouseLeave() {
      ReactTooltip.hide();
    }
  }, renderShareLinks(shareProviders)));
}

function SharingMenu() {
  var shareProviders = useShareProviders();

  if (shareProviders.length > 0) {
    return React.createElement("div", null, React.createElement("a", {
      className: classNames(styles.contextIcon, styles$6.shareIcon),
      "data-tip": true,
      "data-for": 'sharingTooltip',
      onMouseEnter: function onMouseEnter() {
        ReactTooltip.hide();
      }
    }, React.createElement(ShareIcon, null)), React.createElement(SharingTooltip, null));
  } else {
    return null;
  }
}

function _extends$8() {
  _extends$8 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$8.apply(this, arguments);
}
var WDRlogo = (function (_ref) {
  var _ref$styles = _ref.styles,
      props = _objectWithoutProperties(_ref, ["styles"]);

  return React.createElement("svg", _extends$8({
    viewBox: "-0.445 -0.445 51.921 15.721"
  }, props), React.createElement("path", {
    d: "M31.189 14.83h3.731v-4.772h.285c.425 0 1.496-.023 2.079.919l2.292 3.854h4.015l-2.088-3.509c-.69-1.176-1.258-1.806-1.704-2.13v-.039c1.259-.446 2.636-1.522 2.636-3.715 0-2.716-1.946-4.116-5.394-4.116H31.19v4.689h-.038c-.708-2.829-3.095-4.689-7.453-4.689h-8.253l-1.257 5.516a42.42 42.42 0 00-.488 2.578h-.04s-.284-1.603-.547-2.74l-1.077-5.354h-4.53L6.43 6.676c-.264 1.137-.547 2.74-.547 2.74H5.84s-.222-1.442-.486-2.578L4.097 1.322H0L3.61 14.83h4.121L9.78 6.169h.041l2.048 8.662h4.056L18.93 3.614h.04v11.217h4.606c4.42 0 6.86-2.028 7.577-4.927h.036v4.927zm-7.309-3.062h-1.135V4.384h1.034c2.475 0 3.59 1.095 3.59 3.612 0 2.473-1.115 3.772-3.489 3.772m13.08-4.565h-2.04V4.182h1.918c1.278 0 1.806.506 1.806 1.52 0 .934-.548 1.501-1.684 1.501m12.003-2.317V1.404L45.48 2.66v.865l1.153-.418v2.616l2.33-.838zM47.573 0a3.469 3.469 0 013.459 3.478 3.468 3.468 0 01-3.46 3.477 3.468 3.468 0 01-3.458-3.478A3.469 3.469 0 0147.573 0m0 .51a2.96 2.96 0 00-2.951 2.967 2.96 2.96 0 002.95 2.968 2.96 2.96 0 002.953-2.967A2.96 2.96 0 0047.573.51",
    fill: "#00375a"
  }));
});

function AppHeader(props) {
  var _useState = useState(true),
      _useState2 = _slicedToArray(_useState, 2),
      navExpanded = _useState2[0],
      setNavExpanded = _useState2[1];

  var _useState3 = useState(true),
      _useState4 = _slicedToArray(_useState3, 2),
      mobileNavHidden = _useState4[0],
      setMobileNavHidden = _useState4[1];

  var _useState5 = useState(0),
      _useState6 = _slicedToArray(_useState5, 2),
      readingProgress = _useState6[0],
      setReadingProgress = _useState6[1];

  var _useState7 = useState('chapterLink1'),
      _useState8 = _slicedToArray(_useState7, 2),
      activeChapterLink = _useState8[0],
      setActiveChapterLink = _useState8[1];

  var entryStructure = useEntryStructure();
  var ref = useRef();
  useNativeScrollPrevention(ref);
  var chapters = entryStructure.map(function (chapter) {
    return {
      permaId: chapter.permaId,
      title: chapter.title,
      summary: chapter.summary
    };
  });
  useScrollPosition(function (_ref) {
    var prevPos = _ref.prevPos,
        currPos = _ref.currPos;
    var expand = currPos.y > prevPos.y;
    if (expand !== navExpanded) setNavExpanded(expand);
  }, [navExpanded]);
  useScrollPosition(function (_ref2) {
    var prevPos = _ref2.prevPos,
        currPos = _ref2.currPos;
    var current = currPos.y * -1; // Todo: Memoize and update on window resize

    var total = document.body.clientHeight - window.innerHeight;
    var progress = Math.abs(current / total) * 100;
    setReadingProgress(progress);
  }, [readingProgress], null, false, 1);

  function handleProgressBarMouseEnter() {
    setNavExpanded(true);
  }

  function handleBurgerMenuClick() {
    setMobileNavHidden(!mobileNavHidden);
  }

  function handleMenuClick(chapterLinkId) {
    setActiveChapterLink(chapterLinkId);
    setMobileNavHidden(true);
  }

  function renderChapterLinks(chapters) {
    return chapters.filter(function (chapterConfiguration) {
      return chapterConfiguration.title && chapterConfiguration.summary;
    }).map(function (chapter, index) {
      var chapterIndex = index + 1;
      var chapterLinkId = "chapterLink".concat(chapterIndex);
      return React.createElement("li", {
        key: index,
        className: styles.chapterListItem
      }, React.createElement(ChapterLink, Object.assign({}, chapter, {
        chapterIndex: chapterIndex,
        chapterLinkId: chapterLinkId,
        active: activeChapterLink === chapterLinkId,
        handleMenuClick: handleMenuClick
      })));
    });
  }
  return React.createElement("header", {
    className: classNames(styles.navigationBar, _defineProperty({}, styles.navigationBarExpanded, navExpanded))
  }, React.createElement("div", {
    className: styles.navigationBarContentWrapper
  }, React.createElement(HamburgerIcon, {
    onClick: handleBurgerMenuClick,
    mobileNavHidden: mobileNavHidden
  }), React.createElement(WDRlogo, {
    className: classNames(styles.menuIcon, styles.wdrLogo)
  }), React.createElement("nav", {
    className: classNames(styles.navigationChapters, _defineProperty({}, styles.navigationChaptersHidden, mobileNavHidden)),
    role: "navigation",
    ref: ref
  }, React.createElement("ul", {
    className: styles.chapterList
  }, renderChapterLinks(chapters))), React.createElement("div", {
    className: classNames(styles.contextIcons)
  }, React.createElement(SharingMenu, null), React.createElement(LegalInfoMenu, null))), React.createElement("div", {
    className: styles.progressBar,
    onMouseEnter: handleProgressBarMouseEnter
  }, React.createElement("span", {
    className: styles.progressIndicator,
    style: {
      width: readingProgress + '%'
    }
  })));
}

function useOnScreen(ref) {
  var rootMargin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '0px';
  var cb = arguments.length > 2 ? arguments[2] : undefined;

  var _useState = useState(false),
      _useState2 = _slicedToArray(_useState, 2),
      isIntersecting = _useState2[0],
      setIntersecting = _useState2[1];

  useEffect(function () {
    var current = ref.current;
    var observer = new IntersectionObserver(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 1),
          entry = _ref2[0];

      setIntersecting(entry.isIntersecting);

      if (entry.isIntersecting && cb) {
        cb();
      }
    }, {
      rootMargin: rootMargin
    });

    if (ref.current) {
      observer.observe(current);
    }

    return function () {
      observer.unobserve(current);
    };
  }, [ref, rootMargin, cb]);
  return isIntersecting;
}

var css$9 = ".Fullscreen-module_root__1N3CI {\n  width: 100%;\n  height: 100vh;\n  position: relative;\n  overflow: hidden;\n}\n";
var styles$8 = {"root":"Fullscreen-module_root__1N3CI"};
styleInject(css$9);

var Fullscreen = React.forwardRef(function Fullscreen(props, ref) {
  return React.createElement("div", {
    ref: ref,
    className: styles$8.root
  }, props.children);
});

var css$a = ".Image-module_root__1ef3j {\n  background-size: cover;\n  position: absolute;\n  top: 0;\n  width: 100%;\n  height: 100%;\n}\n\n@media (orientation: landscape) {\n  .Image-module_portrait__1mRha {\n    display: none;\n  }\n}\n\n@media (orientation: portrait) {\n  .Image-module_portrait__1mRha {\n    display: block;\n  }\n}";
var styles$9 = {"root":"Image-module_root__1ef3j","portrait":"Image-module_portrait__1mRha"};
styleInject(css$a);

/**
 * Render an image file.
 *
 * @param {Object} props
 * @param {number} props.id - Perma id of the image file.
 */

function Image(props) {
  var image = useFile({
    collectionName: 'imageFiles',
    permaId: props.id
  });

  if (image) {
    var focusX = typeof image.configuration.focusX === 'undefined' ? 50 : image.configuration.focusX;
    var focusY = typeof image.configuration.focusY === 'undefined' ? 50 : image.configuration.focusY;
    return React.createElement("div", {
      className: classNames(styles$9.root, _defineProperty({}, styles$9.portrait, props.mobile)),
      role: "img",
      style: {
        backgroundImage: "url(".concat(image.urls.large, ")"),
        backgroundPosition: "".concat(focusX, "% ").concat(focusY, "%")
      }
    });
  }

  return null;
}

var ScrollToSectionContext = React.createContext(function () {});

var MutedContext = React.createContext({
  muted: true,
  setMuted: function setMuted() {},
  mediaOff: true
});

var css$b = ".Video-module_root__30u0y {\n  position: absolute;\n  top: 0;\n  width: 100%;\n  height: 100%;\n}\n\n.Video-module_video__3FJvj {\n  width: 100%;\n  height: 100%;\n  transition: transform ease 0.2s;\n  outline: none;\n}\n\n.Video-module_video__3FJvj:focus {\n  outline: none;\n}\n\n.Video-module_backdrop__1R7f4 {\n  object-fit: cover;\n}\n";
var styles$a = {"root":"Video-module_root__30u0y","video":"Video-module_video__3FJvj","backdrop":"Video-module_backdrop__1R7f4"};
styleInject(css$b);

function Video(props) {
  var awsBucket = '//s3-eu-west-1.amazonaws.com/de.codevise.pageflow.development/pageflow-next/presentation-videos/';
  var videoBoatSunset = awsBucket + 'floodplain-clean.mp4';
  var poster_videoBoatSunset = awsBucket + 'posterframes/poster_katerchen.jpeg';
  var videoBoatDark = awsBucket + 'floodplain-dirty.mp4';
  var poster_videoBoatDark = awsBucket + 'posterframes/poster_katerchen.jpeg';
  var videoKaterchen = awsBucket + 'katerchen.mp4';
  var poster_videoKaterchen = awsBucket + 'posterframes/poster_katerchen.jpeg';
  var videoGarzweilerLoop1 = awsBucket + 'braunkohle_loop1.mp4';
  var poster_videoGarzweilerLoop1 = awsBucket + 'posterframes/poster_braunkohle_loop1.jpeg';
  var videoGarzweilerLoop2 = awsBucket + 'braunkohle_loop2.mp4';
  var poster_videoGarzweilerLoop2 = awsBucket + 'posterframes/poster_braunkohle_loop2.jpeg';
  var videoGarzweilerDrohne = awsBucket + 'braunkohle_drone.mp4';
  var poster_videoGarzweilerDrohne = awsBucket + 'posterframes/poster_braunkohle_drone.jpeg';
  var videoInselInterviewToni = awsBucket + 'pageflow_insel_interview_toni02.mp4';
  var poster_videoInselInterviewToni = awsBucket + 'posterframes/poster_pageflow_insel_interview_toni02.jpg';
  var videoUrl = {
    videoBoatSunset: videoBoatSunset,
    videoBoatDark: videoBoatDark,
    videoKaterchen: videoKaterchen,
    videoGarzweilerLoop1: videoGarzweilerLoop1,
    videoGarzweilerLoop2: videoGarzweilerLoop2,
    videoGarzweilerDrohne: videoGarzweilerDrohne,
    videoInselInterviewToni: videoInselInterviewToni
  }[props.id];
  var posterUrl = {
    poster_videoBoatSunset: poster_videoBoatSunset,
    poster_videoBoatDark: poster_videoBoatDark,
    poster_videoKaterchen: poster_videoKaterchen,
    poster_videoGarzweilerLoop1: poster_videoGarzweilerLoop1,
    poster_videoGarzweilerLoop2: poster_videoGarzweilerLoop2,
    poster_videoGarzweilerDrohne: poster_videoGarzweilerDrohne,
    poster_videoInselInterviewToni: poster_videoInselInterviewToni
  }['poster_' + props.id];
  var videoRef = useRef();
  var state = props.state;
  var mutedSettings = useContext(MutedContext);
  useEffect(function () {
    var video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = mutedSettings.muted;

    if (!mutedSettings.mediaOff && props.autoplay !== false) {
      if (state === 'active') {
        if (video.readyState > 0) {
          video.play();
        } else {
          video.addEventListener('loadedmetadata', play);
          return function () {
            return video.removeEventListener('loadedmetadata', play);
          };
        }
      } else {
        video.pause();
      }
    }

    function play() {
      video.play();
    }
  }, [state, mutedSettings.mediaOff, mutedSettings.muted, props.autoplay]);
  return React.createElement("div", {
    className: styles$a.root
  }, React.createElement(ScrollToSectionContext.Consumer, null, function (scrollToSection) {
    return React.createElement("video", {
      role: "img",
      src: videoUrl,
      ref: videoRef,
      className: classNames(styles$a.video, _defineProperty({}, styles$a.backdrop, !props.interactive)),
      controls: props.controls,
      playsInline: true,
      onEnded: function onEnded() {
        return props.nextSectionOnEnd && scrollToSection('next');
      },
      loop: !props.interactive,
      poster: posterUrl
    });
  }));
}
Video.defaultProps = {
  interactive: false,
  controls: false
};

var css$c = ".FillColor-module_FillColor__S1uEG {\n  width: 100%;\n  height: 100vh;\n}\n";
var styles$b = {"FillColor":"FillColor-module_FillColor__S1uEG"};
styleInject(css$c);

function FillColor(props) {
  return React.createElement("div", {
    className: styles$b.FillColor,
    style: {
      backgroundColor: props.color
    }
  });
}

var css$d = ".MotifArea-module_root__1_ACd {\n  position: absolute;\n  background: hsla(0, 0%, 100%, 0.2);\n  z-index: 2;\n  opacity: 0;\n  transition: opacity 0.2s ease;\n}\n\n.MotifArea-module_active__1q4z2 {\n  opacity: 1;\n}\n\n.MotifArea-module_corner__3hB5t {\n  position: absolute;\n  width: 10px;\n  height: 10px;\n}\n\n.MotifArea-module_topLeft__3vHHi {\n  border-top: solid 2px #fff;\n  border-left: solid 2px #fff;\n}\n\n.MotifArea-module_topRight__2gNmC {\n  right: 0;\n  border-top: solid 2px #fff;\n  border-right: solid 2px #fff;\n}\n\n.MotifArea-module_bottomLeft__2qEqb {\n  bottom: 0;\n  border-bottom: solid 2px #fff;\n  border-left: solid 2px #fff;\n}\n\n.MotifArea-module_bottomRight__3OjTb {\n  right: 0;\n  bottom: 0;\n  border-bottom: solid 2px #fff;\n  border-right: solid 2px #fff;\n}\n";
var styles$c = {"root":"MotifArea-module_root__1_ACd","active":"MotifArea-module_active__1q4z2","corner":"MotifArea-module_corner__3hB5t","topLeft":"MotifArea-module_topLeft__3vHHi MotifArea-module_corner__3hB5t","topRight":"MotifArea-module_topRight__2gNmC MotifArea-module_corner__3hB5t","bottomLeft":"MotifArea-module_bottomLeft__2qEqb MotifArea-module_corner__3hB5t","bottomRight":"MotifArea-module_bottomRight__3OjTb MotifArea-module_corner__3hB5t"};
styleInject(css$d);

var MotifArea = React.forwardRef(function MotifArea(props, ref) {
  var image = useFile({
    collectionName: 'imageFiles',
    permaId: props.imageId
  });

  if (!image) {
    return null;
  }

  return React.createElement("div", {
    ref: ref,
    className: classNames(styles$c.root, _defineProperty({}, styles$c.active, props.active)),
    style: position(props, image),
    onMouseEnter: props.onMouseEnter,
    onMouseLeave: props.onMouseLeave
  }, React.createElement("div", {
    className: styles$c.topLeft
  }), React.createElement("div", {
    className: styles$c.topRight
  }), React.createElement("div", {
    className: styles$c.bottomLeft
  }), React.createElement("div", {
    className: styles$c.bottomRight
  }));
});

function position(props, image) {
  var originalRatio = image.width / image.height;
  var containerRatio = props.containerWidth / props.containerHeight;
  var scale = containerRatio > originalRatio ? props.containerWidth / image.width : props.containerHeight / image.height;
  var contentWidth = image.width * scale;
  var contentHeight = image.height * scale;
  var focusX = image.configuration.focusX === undefined ? 50 : image.configuration.focusX;
  var focusY = image.configuration.focusY === undefined ? 50 : image.configuration.focusY;
  var cropLeft = (contentWidth - props.containerWidth) * focusX / 100;
  var cropTop = (contentHeight - props.containerHeight) * focusY / 100;
  var motifArea = image.configuration.motifArea || {
    top: 0,
    left: 0,
    width: 0,
    height: 0
  };
  return {
    top: contentHeight * motifArea.top / 100 - cropTop,
    left: contentWidth * motifArea.left / 100 - cropLeft,
    width: contentWidth * motifArea.width / 100,
    height: contentHeight * motifArea.height / 100
  };
}

function getSize(el) {
  if (!el) {
    return {
      left: 0,
      top: 0,
      width: 0,
      height: 0
    };
  }

  return {
    left: el.offsetLeft,
    top: el.offsetTop,
    width: el.offsetWidth,
    height: el.offsetHeight
  };
}

function useDimension() {
  var _useState = useState(getSize(null)),
      _useState2 = _slicedToArray(_useState, 2),
      componentSize = _useState2[0],
      setComponentSize = _useState2[1];

  var _useState3 = useState(null),
      _useState4 = _slicedToArray(_useState3, 2),
      currentNode = _useState4[0],
      setCurrentNode = _useState4[1];

  var measuredRef = useCallback(function (node) {
    setCurrentNode(node);
    setComponentSize(getSize(node));
  }, []);
  useEffect(function () {
    function handleResize() {
      setComponentSize(getSize(currentNode));
    }

    if (!currentNode) {
      return;
    }

    handleResize();
    window.addEventListener('resize', handleResize);
    return function () {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentNode]);
  return [componentSize, measuredRef];
}

var videos = {
  videoBoatSunset: {
    id: "videoBoatSunset",
    width: 960,
    height: 406,
    motiveArea: {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    },
    focusX: 50,
    focusY: 50
  },
  videoBoatDark: {
    id: "videoBoatDark",
    width: 960,
    height: 406,
    motiveArea: {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    },
    focusX: 50,
    focusY: 50
  },
  videoKaterchen: {
    id: "videoKaterchen",
    width: 1920,
    height: 1080,
    motiveArea: {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    },
    focusX: 50,
    focusY: 50
  },
  videoGarzweilerLoop1: {
    id: "videoGarzweilerLoop1",
    width: 3840,
    height: 2160,
    motiveArea: {
      top: 0,
      left: 0,
      width: 1,
      height: 1
    },
    focusX: 50,
    focusY: 50
  },
  videoGarzweilerLoop2: {
    id: "videoGarzweilerLoop2",
    width: 1920,
    height: 1080,
    motiveArea: {
      top: 0,
      left: 0,
      width: 1,
      height: 1
    },
    focusX: 15,
    focusY: 20
  },
  videoGarzweilerDrohne: {
    id: "videoGarzweilerDrohne",
    width: 1920,
    height: 1080,
    motiveArea: {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    }
  },
  videoInselInterviewToni: {
    id: "videoInselInterviewToni",
    width: 1920,
    height: 1080,
    motiveArea: {
      top: 0,
      left: 0,
      width: 0,
      height: 0
    }
  }
};

var css$e = ".Backdrop-module_Backdrop__1w4UZ {\n  width: 100%;\n  z-index: 2;\n}\n\n.Backdrop-module_offScreen__2_FYZ {\n}\n";
var styles$d = {"Backdrop":"Backdrop-module_Backdrop__1w4UZ","offScreen":"Backdrop-module_offScreen__2_FYZ"};
styleInject(css$e);

function Backdrop(props) {
  var _useDimension = useDimension(),
      _useDimension2 = _slicedToArray(_useDimension, 2),
      containerDimension = _useDimension2[0],
      setContainerRef = _useDimension2[1];

  return React.createElement("div", {
    className: classNames(styles$d.Backdrop, props.transitionStyles.backdrop, props.transitionStyles["backdrop-".concat(props.state)], _defineProperty({}, styles$d.offScreen, props.offScreen))
  }, React.createElement("div", {
    className: props.transitionStyles.backdropInner
  }, React.createElement("div", {
    className: props.transitionStyles.backdropInner2
  }, props.children(renderContent(props, containerDimension, setContainerRef)))));
}
Backdrop.defaultProps = {
  transitionStyles: {}
};

function renderContent(props, containerDimension, setContainerRef) {
  if (props.image.toString().startsWith('#')) {
    return React.createElement(FillColor, {
      color: props.image
    });
  } else if (props.image.toString().startsWith('video')) {
    var video = videos[props.image];
    return React.createElement(Fullscreen, {
      ref: setContainerRef
    }, React.createElement(Video, {
      state: props.onScreen ? 'active' : 'inactive',
      id: props.image,
      offset: props.offset,
      interactive: props.interactive,
      nextSectionOnEnd: props.nextSectionOnEnd
    }), React.createElement(MotifArea, {
      ref: props.motifAreaRef,
      image: video,
      containerWidth: containerDimension.width,
      containerHeight: containerDimension.height
    }));
  } else {
    return React.createElement(Fullscreen, {
      ref: setContainerRef
    }, React.createElement(Image, {
      id: props.image
    }), React.createElement(Image, {
      id: props.imageMobile,
      mobile: true
    }), React.createElement(MotifArea, {
      ref: props.motifAreaRef,
      imageId: props.image,
      containerWidth: containerDimension.width,
      containerHeight: containerDimension.height
    }));
  }
}

var Context$1 = React.createContext({});
function EditorStateProvider(props) {
  var _useState = useState(null),
      _useState2 = _slicedToArray(_useState, 2),
      selection = _useState2[0],
      setSelectionState = _useState2[1];

  var setSelection = useCallback(function (selection) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'SELECTED',
        payload: selection || {}
      }, window.location.origin);
    }

    setSelectionState(selection);
  }, []);
  var value = useMemo(function () {
    return props.active ? {
      selection: selection,
      setSelection: setSelection
    } : {};
  }, [props.active, setSelection, selection]);
  return React.createElement(Context$1.Provider, {
    value: value
  }, props.children);
}
function useEditorSelection(options) {
  var _useContext = useContext(Context$1),
      selection = _useContext.selection,
      setSelection = _useContext.setSelection;

  var resetSelection = useCallback(function () {
    setSelection(null);
  }, [setSelection]);
  var select = useCallback(function (selection) {
    setSelection(selection || options);
  }, [setSelection, options]);
  return useMemo(function () {
    return setSelection ? {
      isSelected: selection && options && selection.id === options.id && selection.type === options.type,
      isSelectable: !selection || selection.type === 'contentElement',
      select: select,
      resetSelection: resetSelection
    } : {};
  }, [options, selection, setSelection, select, resetSelection]);
}

var css$f = ".Foreground-module_Foreground__13ODU {\n  position: relative;\n  z-index: 3;\n\n  box-sizing: border-box;\n\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n}\n\n.Foreground-module_fullFadeHeight__2p9dx {\n  min-height: 51vh;\n}\n\n.Foreground-module_fullHeight__1vMXb {\n  min-height: 100vh;\n}\n\n.Foreground-module_fullFadeHeight__2p9dx.Foreground-module_enlarge__14Plm,\n.Foreground-module_fullHeight__1vMXb.Foreground-module_enlarge__14Plm {\n  min-height: 130vh;\n}\n\n.Foreground-module_hidden__2dmAx {\n  visibility: hidden;\n}\n";
var styles$e = {"Foreground":"Foreground-module_Foreground__13ODU","fullFadeHeight":"Foreground-module_fullFadeHeight__2p9dx","fullHeight":"Foreground-module_fullHeight__1vMXb","enlarge":"Foreground-module_enlarge__14Plm","hidden":"Foreground-module_hidden__2dmAx"};
styleInject(css$f);

function Foreground(props) {
  var _useEditorSelection = useEditorSelection(),
      resetSelection = _useEditorSelection.resetSelection;

  return React.createElement("div", {
    className: className(props),
    onClick: resetSelection
  }, props.children);
}

function className(props) {
  var _classNames;

  return classNames(styles$e.Foreground, props.transitionStyles.foreground, props.transitionStyles["foreground-".concat(props.state)], styles$e["".concat(props.heightMode, "Height")], (_classNames = {}, _defineProperty(_classNames, styles$e.hidden, props.hidden), _defineProperty(_classNames, styles$e.enlarge, props.hidden && !props.disableEnlarge), _classNames));
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

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
 * Register new types of content elements.
 * @name frontend_contentElementTypes
 */
var ContentElementTypeRegistry =
/*#__PURE__*/
function () {
  function ContentElementTypeRegistry() {
    _classCallCheck(this, ContentElementTypeRegistry);

    this.types = {};
  }
  /**
   * Register a new type of content element.
   *
   * @param {string} typeName - Name of the content element type.
   * @param {Object} options
   * @param {React.Component} options.component
   * @memberof frontend_contentElementTypes
   *
   * @example
   *
   * // frontend.js
   *
   * import {frontend} from 'pageflow-scrolled/frontend';
   * import {InlineImage} from './InlineImage';
   *
   * frontend.contentElementTypes.register('inlineImage', {
   *   component: InlineImage
   * });
   */


  _createClass(ContentElementTypeRegistry, [{
    key: "register",
    value: function register(typeName, options) {
      this.types[typeName] = options;
    }
  }, {
    key: "getComponent",
    value: function getComponent(typeName) {
      if (!this.types[typeName]) {
        throw new Error("Unknown content element type name \"".concat(typeName, "\""));
      }

      return this.types[typeName].component;
    }
  }]);

  return ContentElementTypeRegistry;
}();

var api = {
  contentElementTypes: new ContentElementTypeRegistry()
};

var css$g = ".ContentElement-module_outer__3ZsNV {\n  position: relative;\n}\n\n.ContentElement-module_selectable__2oRzN {\n  position: relative;\n}\n\n.ContentElement-module_selectable__2oRzN:after {\n  content: '';\n  position: absolute;\n  top: -5px;\n  left: -5px;\n  right: -5px;\n  bottom: -5px;\n}\n\n.ContentElement-module_bl__2w5xM,\n.ContentElement-module_br__3v-_l,\n.ContentElement-module_tr__l_gbk,\n.ContentElement-module_tl__NrB8G {\n  width: 10px;\n  height: 10px;\n  position: absolute;\n  opacity: 0;\n}\n\n.ContentElement-module_selected__1uFZP .ContentElement-module_bl__2w5xM,\n.ContentElement-module_selected__1uFZP .ContentElement-module_br__3v-_l,\n.ContentElement-module_selected__1uFZP .ContentElement-module_tr__l_gbk,\n.ContentElement-module_selected__1uFZP .ContentElement-module_tl__NrB8G {\n  border-width: 3px\n}\n\n.ContentElement-module_selected__1uFZP .ContentElement-module_bl__2w5xM,\n.ContentElement-module_selected__1uFZP .ContentElement-module_br__3v-_l,\n.ContentElement-module_selected__1uFZP .ContentElement-module_tr__l_gbk,\n.ContentElement-module_selected__1uFZP .ContentElement-module_tl__NrB8G,\n.ContentElement-module_selectable__2oRzN:hover .ContentElement-module_bl__2w5xM,\n.ContentElement-module_selectable__2oRzN:hover .ContentElement-module_br__3v-_l,\n.ContentElement-module_selectable__2oRzN:hover .ContentElement-module_tr__l_gbk,\n.ContentElement-module_selectable__2oRzN:hover .ContentElement-module_tl__NrB8G {\n  opacity: 0.8;\n}\n\n.ContentElement-module_bl__2w5xM {\n  bottom: -6px;\n  left: -6px;\n  border-bottom: solid 1px currentColor;\n  border-left: solid 1px currentColor;\n}\n\n.ContentElement-module_br__3v-_l {\n  bottom: -6px;\n  right: -6px;\n  border-bottom: solid 1px currentColor;\n  border-right: solid 1px currentColor;\n}\n\n.ContentElement-module_tr__l_gbk {\n  top: -6px;\n  right: -6px;\n  border-top: solid 1px currentColor;\n  border-right: solid 1px currentColor;\n}\n\n.ContentElement-module_tl__NrB8G {\n  top: -6px;\n  left: -6px;\n  border-top: solid 1px currentColor;\n  border-left: solid 1px currentColor;\n}\n\n.ContentElement-module_selected__1uFZP:hover:after,\n.ContentElement-module_selected__1uFZP:after {\n  border: solid 1px currentColor;\n  opacity: 0.8;\n  pointer-events: none;\n}\n";
var styles$f = {"selectionWidth":"1px","selectionPadding":"-6px","selectionPadding2":"-5px","outer":"ContentElement-module_outer__3ZsNV","selectable":"ContentElement-module_selectable__2oRzN","bl":"ContentElement-module_bl__2w5xM","br":"ContentElement-module_br__3v-_l","tr":"ContentElement-module_tr__l_gbk","tl":"ContentElement-module_tl__NrB8G","selected":"ContentElement-module_selected__1uFZP"};
styleInject(css$g);

var css$h = "\n\n.InsertContentElementIndicator-module_root__2KRRn {\n  position: absolute;\n  left: 0;\n  width: 100%;\n  text-align: center;\n  cursor: pointer;\n  opacity: 0;\n}\n\n.InsertContentElementIndicator-module_before__1EEFz {\n  bottom: 100%;\n}\n\n.InsertContentElementIndicator-module_after__2YmaD {\n  top: 100%;\n}\n\n.InsertContentElementIndicator-module_root__2KRRn:hover {\n  opacity: 1;\n}\n\n.InsertContentElementIndicator-module_box__3EIMv svg {\n  vertical-align: middle;\n  oopacity: 0.8;\n}\n\n.InsertContentElementIndicator-module_bar__c-Ifz {\n  background-color: currentColor;\n  position: absolute;\n  top: 50%;\n  height: 1px;\n  oopacity: 0.5;\n  width: calc(50% - 15px);\n}\n\n.InsertContentElementIndicator-module_left__13U3P {\n  left: -6px;\n}\n\n.InsertContentElementIndicator-module_right__lSfoH {\n  right: -6px;\n}\n\n.InsertContentElementIndicator-module_selected__3sk0q.InsertContentElementIndicator-module_root__2KRRn {\n  opacity: 0.8;\n}\n\n.InsertContentElementIndicator-module_selected__3sk0q .InsertContentElementIndicator-module_right__lSfoH,\n.InsertContentElementIndicator-module_selected__3sk0q .InsertContentElementIndicator-module_left__13U3P {\n  width: 13px;\n  background-color: currentColor;\n  oopacity: 0.8;\n  height: 5px;\n  top: calc(50% - 2px);\n}\n\n.InsertContentElementIndicator-module_selected__3sk0q .InsertContentElementIndicator-module_right__lSfoH {\n  right: -6px;\n}\n\n.InsertContentElementIndicator-module_selected__3sk0q .InsertContentElementIndicator-module_left__13U3P {\n  left: -6px;\n}\n\n.InsertContentElementIndicator-module_middle__2TTQX {\n  opacity: 0;\n  width: 100%;\n  left: 0;\n  top: 50%;\n  height: 1px;\n}\n\n.InsertContentElementIndicator-module_selected__3sk0q .InsertContentElementIndicator-module_middle__2TTQX {\n  opacity: 1;\n}\n\n.InsertContentElementIndicator-module_selected__3sk0q .InsertContentElementIndicator-module_box__3EIMv {\n  opacity: 0;\n}\n";
var styles$g = {"selectionColor":"#1c86fe","backgroundColor":"rgba(0, 0, 0, 0.8)","borderColor":"rgba(255, 255, 255, 0.2)","root":"InsertContentElementIndicator-module_root__2KRRn","before":"InsertContentElementIndicator-module_before__1EEFz","after":"InsertContentElementIndicator-module_after__2YmaD","box":"InsertContentElementIndicator-module_box__3EIMv","bar":"InsertContentElementIndicator-module_bar__c-Ifz","left":"InsertContentElementIndicator-module_left__13U3P InsertContentElementIndicator-module_bar__c-Ifz","right":"InsertContentElementIndicator-module_right__lSfoH InsertContentElementIndicator-module_bar__c-Ifz","selected":"InsertContentElementIndicator-module_selected__3sk0q","middle":"InsertContentElementIndicator-module_middle__2TTQX InsertContentElementIndicator-module_bar__c-Ifz"};
styleInject(css$h);

function _extends$9() {
  _extends$9 = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends$9.apply(this, arguments);
}
var PlusIcon = (function (_ref) {
  var _ref$styles = _ref.styles,
      props = _objectWithoutProperties(_ref, ["styles"]);

  return React.createElement("svg", _extends$9({
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 512 512"
  }, props), React.createElement("path", {
    d: "M256 0C114.844 0 0 114.839 0 256s114.844 256 256 256 256-114.839 256-256S397.156 0 256 0zm133.594 272.699H272.699v116.895c0 9.225-7.48 16.699-16.699 16.699-9.219 0-16.699-7.475-16.699-16.699V272.699H122.406c-9.219 0-16.699-7.475-16.699-16.699 0-9.225 7.48-16.699 16.699-16.699h116.895V122.406c0-9.225 7.48-16.699 16.699-16.699 9.219 0 16.699 7.475 16.699 16.699v116.895h116.895c9.219 0 16.699 7.475 16.699 16.699.001 9.225-7.48 16.699-16.699 16.699z"
  }));
});

function InsertContentElementIndicator(_ref) {
  var contentElementId = _ref.contentElementId,
      selected = _ref.selected,
      position = _ref.position;

  var _useEditorSelection = useEditorSelection({
    id: contentElementId,
    type: position
  }),
      isSelected = _useEditorSelection.isSelected,
      select = _useEditorSelection.select;

  var _useI18n = useI18n({
    locale: 'ui'
  }),
      t = _useI18n.t;

  function handleClick(event) {
    event.stopPropagation();
    select();
  }

  return React.createElement("div", {
    className: classNames(styles$g.root, styles$g[position], _defineProperty({}, styles$g.selected, isSelected)),
    title: t('pageflow_scrolled.inline_editing.insert_content_element'),
    onClick: handleClick
  }, React.createElement("div", {
    className: styles$g.box
  }, React.createElement(PlusIcon, {
    width: 20,
    height: 20,
    fill: "currentColor"
  })), React.createElement("div", {
    className: styles$g.left
  }), React.createElement("div", {
    className: styles$g.right
  }), React.createElement("div", {
    className: styles$g.middle
  }));
}

function ContentElement(props) {
  var Component = api.contentElementTypes.getComponent(props.type);

  var _useEditorSelection = useEditorSelection({
    id: props.id,
    type: 'contentElement'
  }),
      isSelected = _useEditorSelection.isSelected,
      isSelectable = _useEditorSelection.isSelectable,
      select = _useEditorSelection.select,
      resetSelection = _useEditorSelection.resetSelection;

  if (select) {
    var _classNames;

    return React.createElement("div", {
      className: classNames(styles$f.outer)
    }, props.first && React.createElement(InsertContentElementIndicator, {
      position: "before",
      contentElementId: props.id
    }), React.createElement("div", {
      className: classNames((_classNames = {}, _defineProperty(_classNames, styles$f.selected, isSelected), _defineProperty(_classNames, styles$f.selectable, isSelectable), _classNames)),
      onClick: function onClick(e) {
        e.stopPropagation();
        isSelectable ? select() : resetSelection();
      }
    }, React.createElement(Component, {
      sectionProps: props.sectionProps,
      configuration: props.itemProps
    }), React.createElement("div", {
      className: styles$f.tl
    }), React.createElement("div", {
      className: styles$f.bl
    }), React.createElement("div", {
      className: styles$f.tr
    }), React.createElement("div", {
      className: styles$f.br
    })), React.createElement(InsertContentElementIndicator, {
      position: "after",
      contentElementId: props.id
    }));
  } else {
    return React.createElement(Component, {
      sectionProps: props.sectionProps,
      configuration: props.itemProps
    });
  }
}

function ContentElements(props) {
  return React.createElement(React.Fragment, null, props.items.map(function (item, index) {
    return props.children(item, React.createElement(ContentElement, {
      key: item.id,
      id: item.id,
      type: item.type,
      first: index === 0,
      position: item.position,
      itemProps: item.props,
      sectionProps: props.sectionProps
    }));
  }));
}
ContentElements.defaultProps = {
  children: function children(item, child) {
    return child;
  }
};

var css$i = ".TwoColumn-module_root__37EqL {\n}\n\n.TwoColumn-module_group__3Hg2y {\n  clear: right;\n  margin-left: 8%;\n  margin-right: 8%;\n}\n\n.TwoColumn-module_group-full__2OT4o {\n  margin-left: 0;\n  margin-right: 0;\n}\n\n.TwoColumn-module_sticky__4LCDO,\n.TwoColumn-module_inline__1fPfM {\n  max-width: 500px;\n}\n\n.TwoColumn-module_right__Fr52a .TwoColumn-module_inline__1fPfM {\n  margin-left: auto;\n}\n\n@media (max-width: 949px) {\n  .TwoColumn-module_right__Fr52a .TwoColumn-module_sticky__4LCDO {\n    margin-left: auto;\n  }\n}\n\n@media (min-width: 950px) {\n  .TwoColumn-module_sticky__4LCDO {\n    position: sticky;\n    float: right;\n    top: 33%;\n    width: 30%;\n    max-width: 600px;\n  }\n\n  .TwoColumn-module_right__Fr52a .TwoColumn-module_sticky__4LCDO {\n    float: left;\n  }\n}\n";
var styles$h = {"root":"TwoColumn-module_root__37EqL","group":"TwoColumn-module_group__3Hg2y","group-full":"TwoColumn-module_group-full__2OT4o","sticky":"TwoColumn-module_sticky__4LCDO","inline":"TwoColumn-module_inline__1fPfM","right":"TwoColumn-module_right__Fr52a"};
styleInject(css$i);

var availablePositions = ['inline', 'sticky', 'full'];
function TwoColumn(props) {
  return React.createElement("div", {
    className: classNames(styles$h.root, styles$h[props.align])
  }, React.createElement("div", {
    className: styles$h.inline,
    ref: props.contentAreaRef
  }), renderItems(props));
}
TwoColumn.defaultProps = {
  align: 'left'
};

function renderItems(props) {
  return groupItemsByPosition(props.items).map(function (group, index) {
    return React.createElement("div", {
      key: index,
      className: classNames(styles$h.group, styles$h["group-".concat(group.position)])
    }, renderItemGroup(props, group, 'sticky'), renderItemGroup(props, group, 'inline'), renderItemGroup(props, group, 'full'));
  });
}

function renderItemGroup(props, group, position) {
  if (group[position].length) {
    return React.createElement("div", {
      className: styles$h[position]
    }, props.children(React.createElement(ContentElements, {
      sectionProps: props.sectionProps,
      items: group[position]
    })));
  }
}

function groupItemsByPosition(items) {
  var groups = [];
  var currentGroup;
  items.reduce(function (previousItemPosition, item, index) {
    var position = availablePositions.indexOf(item.position) >= 0 ? item.position : 'inline';

    if (!previousItemPosition || previousItemPosition !== position && (previousItemPosition !== 'sticky' || position !== 'inline')) {
      currentGroup = {
        position: position,
        sticky: [],
        inline: [],
        full: []
      };
      groups = [].concat(_toConsumableArray(groups), [currentGroup]);
    }

    currentGroup[position].push(item);
    return position;
  }, null);
  return groups;
}

var css$j = ".Center-module_outer__3Rr0H {\n  margin-left: 8%;\n  margin-right: 8%;\n}\n\n.Center-module_outer-full__3dknO {\n  margin-left: 0;\n  margin-right: 0;\n}\n\n.Center-module_item__1KSs3 {\n  margin-left: auto;\n  margin-right: auto;\n  max-width: 700px;\n}\n\n.Center-module_item-full__1cEuv {\n  margin-left: 0;\n  margin-right: 0;\n  max-width: none;\n}\n\n@media (min-width: 950px) {\n  .Center-module_inner-left__2z9Ea {\n    float: left;\n    width: 60%;\n    margin-left: -10%;\n    margin-right: 1em;\n    margin-bottom: 1em;\n  }\n\n  .Center-module_inner-right__KBkVt {\n    float: right;\n    width: 60%;\n    margin-right: -10%;\n    margin-left: 1em;\n    margin-bottom: 1em;\n  }\n}\n";
var styles$i = {"outer":"Center-module_outer__3Rr0H","outer-full":"Center-module_outer-full__3dknO","item":"Center-module_item__1KSs3","item-full":"Center-module_item-full__1cEuv","inner-left":"Center-module_inner-left__2z9Ea","inner-right":"Center-module_inner-right__KBkVt"};
styleInject(css$j);

function Center(props) {
  return React.createElement("div", {
    className: classNames(styles$i.root)
  }, React.createElement("div", {
    ref: props.contentAreaRef
  }), React.createElement(ContentElements, {
    sectionProps: props.sectionProps,
    items: props.items
  }, function (item, child) {
    return React.createElement("div", {
      key: item.index,
      className: classNames(styles$i.outer, styles$i["outer-".concat(item.position)])
    }, React.createElement("div", {
      className: classNames(styles$i.item, styles$i["item-".concat(item.position)])
    }, props.children(React.createElement("div", {
      className: styles$i["inner-".concat(item.position)]
    }, child))));
  }));
}

function Layout(props) {
  if (props.sectionProps.layout === 'center') {
    return React.createElement(Center, props);
  } else if (props.sectionProps.layout === 'right') {
    return React.createElement(TwoColumn, Object.assign({
      align: "right"
    }, props));
  } else {
    return React.createElement(TwoColumn, props);
  }
}
Layout.defaultProps = {
  layout: 'left'
};

function isIntersectingX(rectA, rectB) {
  return rectA.left < rectB.right && rectA.right > rectB.left || rectB.left < rectA.right && rectB.right > rectA.left;
}

function getBoundingClientRect(el) {
  if (!el) {
    return {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: 0,
      height: 0
    };
  }

  return el.getBoundingClientRect();
}

function useBoundingClientRect() {
  var _useState = useState(getBoundingClientRect(null)),
      _useState2 = _slicedToArray(_useState, 2),
      boundingClientRect = _useState2[0],
      setBoundingClientRect = _useState2[1];

  var _useState3 = useState(null),
      _useState4 = _slicedToArray(_useState3, 2),
      currentNode = _useState4[0],
      setCurrentNode = _useState4[1];

  var measureRef = useCallback(function (node) {
    setCurrentNode(node);
    setBoundingClientRect(getBoundingClientRect(node));
  }, []);
  useEffect(function () {
    function handler() {
      setBoundingClientRect(getBoundingClientRect(currentNode));
    }

    if (!currentNode) {
      return;
    }

    window.addEventListener('resize', handler);
    window.addEventListener('scroll', handler);
    return function () {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler);
    };
  }, [currentNode]);
  return [boundingClientRect, measureRef];
}

function useScrollTarget(ref, isScrollTarget) {
  useEffect(function () {
    if (ref.current && isScrollTarget) {
      window.scrollTo({
        top: ref.current.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.25,
        behavior: 'smooth'
      });
    }
  }, [ref, isScrollTarget]);
}

var css$k = ".Section-module_Section__Yo58b {\n  position: relative;\n}\n\n.Section-module_invert__3_p7F {\n  color: #222;\n}\n\n.Section-module_activityProbe__Fsklh {\n  position: absolute;\n  top: 0;\n  left: 0;\n  bottom: 2px;\n  width: 1px;\n}\n";
var styles$j = {"Section":"Section-module_Section__Yo58b","invert":"Section-module_invert__3_p7F","activityProbe":"Section-module_activityProbe__Fsklh"};
styleInject(css$k);

var css$l = "\n\n.fadeInBgConceal-module_backdrop__11JGO {\n  position: absolute;\n  height: 100%;\n}\n\n.fadeInBgConceal-module_backdropInner__1IAYD {\n  position: fixed;\n  top: 0;\n  height: 100vh;\n  width: 100%;\n}\n\n.fadeInBgConceal-module_backdrop__11JGO {\n  transition: opacity 0.5s ease, visibility 0.5s;\n}\n\n.fadeInBgConceal-module_backdrop-below__3E6Uk {\n  opacity: 0;\n  visibility: hidden;\n}\n";
var fadeInBgConceal = {"fade-duration":"0.5s","backdrop":"fadeInBgConceal-module_backdrop__11JGO","backdropInner":"fadeInBgConceal-module_backdropInner__1IAYD","backdrop-below":"fadeInBgConceal-module_backdrop-below__3E6Uk"};
styleInject(css$l);

var css$m = "\n\n.fadeInBgFadeOut-module_backdrop__r0YXp {\n  position: absolute;\n  height: 100%;\n}\n\n.fadeInBgFadeOut-module_backdropInner__IQp87 {\n  position: fixed;\n  top: 0;\n  height: 100vh;\n  width: 100%;\n}\n\n.fadeInBgFadeOut-module_backdrop__r0YXp .fadeInBgFadeOut-module_backdropInner__IQp87,\n.fadeInBgFadeOut-module_foreground__Q2vkT {\n  transition: opacity 0.5s ease, visibility 0.5s;\n}\n\n.fadeInBgFadeOut-module_foreground-above__3pmz9,\n.fadeInBgFadeOut-module_backdrop-below__2G-Ic .fadeInBgFadeOut-module_backdropInner__IQp87 {\n  opacity: 0;\n  visibility: hidden;\n}\n\n.fadeInBgFadeOut-module_bbackdrop__1thge::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100vh;\n  background-color: #000;\n}\n\n.fadeInBgFadeOut-module_bbackdrop-below__yaeMc::before {\n  visibility: hidden;\n}\n";
var fadeInBgFadeOut = {"fade-duration":"0.5s","backdrop":"fadeInBgFadeOut-module_backdrop__r0YXp","backdropInner":"fadeInBgFadeOut-module_backdropInner__IQp87","foreground":"fadeInBgFadeOut-module_foreground__Q2vkT","foreground-above":"fadeInBgFadeOut-module_foreground-above__3pmz9","backdrop-below":"fadeInBgFadeOut-module_backdrop-below__2G-Ic","bbackdrop":"fadeInBgFadeOut-module_bbackdrop__1thge","bbackdrop-below":"fadeInBgFadeOut-module_bbackdrop-below__yaeMc"};
styleInject(css$m);

var css$n = "\n\n.fadeInBgFadeOutBg-module_backdrop__15ocl {\n  position: absolute;\n  height: 100%;\n}\n\n.fadeInBgFadeOutBg-module_backdropInner__sAnz6 {\n  position: fixed;\n  top: 0;\n  height: 100vh;\n  width: 100%;\n}\n\n.fadeInBgFadeOutBg-module_boxShadow__xUKyj,\n.fadeInBgFadeOutBg-module_backdrop__15ocl .fadeInBgFadeOutBg-module_backdropInner__sAnz6 {\n  transition: opacity 0.5s ease, visibility 0.5s;\n}\n\n.fadeInBgFadeOutBg-module_boxShadow-above__2bY0E,\n.fadeInBgFadeOutBg-module_backdrop-below__1rDT6 .fadeInBgFadeOutBg-module_backdropInner__sAnz6 {\n  opacity: 0;\n  visibility: hidden;\n}\n\n.fadeInBgFadeOutBg-module_bbackdrop__25Ux-::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100vh;\n  background-color: #000;\n}\n\n.fadeInBgFadeOutBg-module_bbackdrop-below__2MPgj::before {\n  visibility: hidden;\n}\n";
var fadeInBgFadeOutBg = {"fade-duration":"0.5s","backdrop":"fadeInBgFadeOutBg-module_backdrop__15ocl","backdropInner":"fadeInBgFadeOutBg-module_backdropInner__sAnz6","boxShadow":"fadeInBgFadeOutBg-module_boxShadow__xUKyj","boxShadow-above":"fadeInBgFadeOutBg-module_boxShadow-above__2bY0E","backdrop-below":"fadeInBgFadeOutBg-module_backdrop-below__1rDT6","bbackdrop":"fadeInBgFadeOutBg-module_bbackdrop__25Ux-","bbackdrop-below":"fadeInBgFadeOutBg-module_bbackdrop-below__2MPgj"};
styleInject(css$n);

var css$o = "\n\n.fadeInBgScrollOut-module_backdrop__1bSsb {\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-end;\n}\n\n.fadeInBgScrollOut-module_backdropInner__3JZBG {\n  position: sticky;\n  bottom: 0;\n  width: 100%;\n}\n\n.fadeInBgScrollOut-module_backdropInner2__q-00L {\n  position: absolute;\n  bottom: 0;\n  width: 100%;\n}\n\n.fadeInBgScrollOut-module_foreground__1ODH9 {\n  min-height: 100vh;\n}\n\n.fadeInBgScrollOut-module_backdrop__1bSsb {\n  transition: opacity 0.5s ease, visibility 0.5s;\n}\n\n.fadeInBgScrollOut-module_backdrop-below__2Dbkr {\n  opacity: 0;\n  visibility: hidden;\n}\n";
var fadeInBgScrollOut = {"fade-duration":"0.5s","backdrop":"fadeInBgScrollOut-module_backdrop__1bSsb","backdropInner":"fadeInBgScrollOut-module_backdropInner__3JZBG","backdropInner2":"fadeInBgScrollOut-module_backdropInner2__q-00L","foreground":"fadeInBgScrollOut-module_foreground__1ODH9","backdrop-below":"fadeInBgScrollOut-module_backdrop-below__2Dbkr"};
styleInject(css$o);

var css$p = "\n\n.fadeInConceal-module_backdrop__1zaRO {\n  position: absolute;\n  height: 100%;\n}\n\n.fadeInConceal-module_backdropInner__1AIvq {\n  position: fixed;\n  top: 0;\n  height: 100vh;\n  width: 100%;\n}\n\n.fadeInConceal-module_backdrop__1zaRO,\n.fadeInConceal-module_foreground__3giM9 {\n  transition: opacity 0.5s ease, visibility 0.5s;\n}\n\n.fadeInConceal-module_backdrop-below__AWyQe,\n.fadeInConceal-module_foreground-below__2z5Op {\n  opacity: 0;\n  visibility: hidden;\n}\n";
var fadeInConceal = {"fade-duration":"0.5s","backdrop":"fadeInConceal-module_backdrop__1zaRO","backdropInner":"fadeInConceal-module_backdropInner__1AIvq","foreground":"fadeInConceal-module_foreground__3giM9","backdrop-below":"fadeInConceal-module_backdrop-below__AWyQe","foreground-below":"fadeInConceal-module_foreground-below__2z5Op"};
styleInject(css$p);

var css$q = "\n\n.fadeInFadeOut-module_backdrop__Y4xOA {\n  position: absolute;\n  height: 100%;\n}\n\n.fadeInFadeOut-module_backdropInner__1oRfP {\n  position: fixed;\n  top: 0;\n  height: 100vh;\n  width: 100%;\n}\n\n.fadeInFadeOut-module_backdrop__Y4xOA .fadeInFadeOut-module_backdropInner__1oRfP,\n.fadeInFadeOut-module_foreground__1eleZ {\n  transition: opacity 0.5s ease, visibility 0.5s;\n}\n\n.fadeInFadeOut-module_foreground-above__249wa,\n.fadeInFadeOut-module_backdrop-below__1h2I4 .fadeInFadeOut-module_backdropInner__1oRfP,\n.fadeInFadeOut-module_foreground-below__3mE6f {\n  opacity: 0;\n  visibility: hidden;\n}\n\n.fadeInFadeOut-module_bbackdrop__WJjFl::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100vh;\n  background-color: #000;\n}\n\n.fadeInFadeOut-module_bbackdrop-below__1Htkz::before {\n  visibility: hidden;\n}\n";
var fadeInFadeOut = {"fade-duration":"0.5s","backdrop":"fadeInFadeOut-module_backdrop__Y4xOA","backdropInner":"fadeInFadeOut-module_backdropInner__1oRfP","foreground":"fadeInFadeOut-module_foreground__1eleZ","foreground-above":"fadeInFadeOut-module_foreground-above__249wa","backdrop-below":"fadeInFadeOut-module_backdrop-below__1h2I4","foreground-below":"fadeInFadeOut-module_foreground-below__3mE6f","bbackdrop":"fadeInFadeOut-module_bbackdrop__WJjFl","bbackdrop-below":"fadeInFadeOut-module_bbackdrop-below__1Htkz"};
styleInject(css$q);

var css$r = "\n\n.fadeInFadeOutBg-module_backdrop__2-IF3 {\n  position: absolute;\n  height: 100%;\n}\n\n.fadeInFadeOutBg-module_backdropInner__3r_bo {\n  position: fixed;\n  top: 0;\n  height: 100vh;\n  width: 100%;\n}\n\n.fadeInFadeOutBg-module_backdrop__2-IF3 .fadeInFadeOutBg-module_backdropInner__3r_bo,\n.fadeInFadeOutBg-module_boxShadow__3x7Ki,\n.fadeInFadeOutBg-module_foreground__24f_M {\n  transition: opacity 0.5s ease, visibility 0.5s;\n}\n\n.fadeInFadeOutBg-module_backdrop-below__4Ys_2 .fadeInFadeOutBg-module_backdropInner__3r_bo,\n.fadeInFadeOutBg-module_boxShadow-above__3T2K5,\n.fadeInFadeOutBg-module_foreground-below__3pTRc {\n  opacity: 0;\n  visibility: hidden;\n}\n\n.fadeInFadeOutBg-module_bbackdrop__MVdvw::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100vh;\n  background-color: #000;\n}\n\n.fadeInFadeOutBg-module_bbackdrop-below__30mpF::before {\n  visibility: hidden;\n}\n";
var fadeInFadeOutBg = {"fade-duration":"0.5s","backdrop":"fadeInFadeOutBg-module_backdrop__2-IF3","backdropInner":"fadeInFadeOutBg-module_backdropInner__3r_bo","boxShadow":"fadeInFadeOutBg-module_boxShadow__3x7Ki","foreground":"fadeInFadeOutBg-module_foreground__24f_M","backdrop-below":"fadeInFadeOutBg-module_backdrop-below__4Ys_2","boxShadow-above":"fadeInFadeOutBg-module_boxShadow-above__3T2K5","foreground-below":"fadeInFadeOutBg-module_foreground-below__3pTRc","bbackdrop":"fadeInFadeOutBg-module_bbackdrop__MVdvw","bbackdrop-below":"fadeInFadeOutBg-module_bbackdrop-below__30mpF"};
styleInject(css$r);

var css$s = "\n\n.fadeInScrollOut-module_backdrop__2FhBb {\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-end;\n}\n\n.fadeInScrollOut-module_backdropInner__1OfNZ {\n  position: sticky;\n  bottom: 0;\n  width: 100%;\n}\n\n.fadeInScrollOut-module_backdropInner2__5bNPT {\n  position: absolute;\n  bottom: 0;\n  width: 100%;\n}\n\n.fadeInScrollOut-module_foreground__3h0EX {\n  min-height: 100vh;\n}\n\n.fadeInScrollOut-module_backdrop__2FhBb,\n.fadeInScrollOut-module_foreground__3h0EX {\n  transition: opacity 0.5s ease, visibility 0.5s;\n}\n\n.fadeInScrollOut-module_backdrop-below__3cRLH,\n.fadeInScrollOut-module_foreground-below__1Jcql {\n  opacity: 0;\n  visibility: hidden;\n}\n";
var fadeInScrollOut = {"fade-duration":"0.5s","backdrop":"fadeInScrollOut-module_backdrop__2FhBb","backdropInner":"fadeInScrollOut-module_backdropInner__1OfNZ","backdropInner2":"fadeInScrollOut-module_backdropInner2__5bNPT","foreground":"fadeInScrollOut-module_foreground__3h0EX","backdrop-below":"fadeInScrollOut-module_backdrop-below__3cRLH","foreground-below":"fadeInScrollOut-module_foreground-below__1Jcql"};
styleInject(css$s);

var css$t = ".revealConceal-module_backdrop__dLUhU {\n  position: absolute;\n  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);\n  height: 100%;\n}\n\n.revealConceal-module_backdropInner__2k1Z- {\n  position: fixed;\n  top: 0;\n  height: 100vh;\n  width: 100%;\n\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n";
var revealConceal = {"backdrop":"revealConceal-module_backdrop__dLUhU","backdropInner":"revealConceal-module_backdropInner__2k1Z-"};
styleInject(css$t);

var css$u = "\n\n.revealFadeOut-module_backdrop___Q1QF {\n  position: absolute;\n  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);\n  height: 200%;\n}\n\n.revealFadeOut-module_backdropInner__17qRn {\n  position: fixed;\n  top: 0;\n  height: 100vh;\n  width: 100%;\n\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n\n.revealFadeOut-module_foreground__1GzBs {\n  transition: opacity 0.5s ease, visibility 0.5s;\n}\n\n.revealFadeOut-module_foreground-above__3GxOf {\n  opacity: 0;\n  visibility: hidden;\n}\n";
var revealFadeOut = {"fade-duration":"0.5s","backdrop":"revealFadeOut-module_backdrop___Q1QF","backdropInner":"revealFadeOut-module_backdropInner__17qRn","foreground":"revealFadeOut-module_foreground__1GzBs","foreground-above":"revealFadeOut-module_foreground-above__3GxOf"};
styleInject(css$u);

var css$v = "\n\n.revealFadeOutBg-module_backdrop__30OCF {\n  position: absolute;\n  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);\n  height: 200%;\n}\n\n.revealFadeOutBg-module_backdropInner__3v3tM {\n  position: fixed;\n  top: 0;\n  height: 100vh;\n  width: 100%;\n\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n\n.revealFadeOutBg-module_boxShadow__1NZRz {\n  transition: opacity 1s ease, visibility 1s;\n}\n\n.revealFadeOutBg-module_boxShadow-above__2r4ov {\n  opacity: 0;\n  visibility: hidden;\n}\n";
var revealFadeOutBg = {"fade-duration":"0.5s","backdrop":"revealFadeOutBg-module_backdrop__30OCF","backdropInner":"revealFadeOutBg-module_backdropInner__3v3tM","boxShadow":"revealFadeOutBg-module_boxShadow__1NZRz","boxShadow-above":"revealFadeOutBg-module_boxShadow-above__2r4ov"};
styleInject(css$v);

var css$w = ".revealScrollOut-module_backdrop__2yOXd {\n  position: absolute;\n  clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);\n  top: 0;\n  bottom: 0;\n  display: flex;\n  flex-direction: column;\n  justify-content: flex-end;\n}\n\n.revealScrollOut-module_backdropInner__211p3 {\n  position: sticky;\n  bottom: 0;\n  width: 100%;\n\n  transform: translateZ(0);\n  backface-visibility: hidden;\n}\n\n.revealScrollOut-module_backdropInner2__v6WqM {\n  position: absolute;\n  bottom: 0;\n  width: 100%;\n}\n\n.revealScrollOut-module_foreground__3z-hw {\n}\n";
var revealScrollOut = {"backdrop":"revealScrollOut-module_backdrop__2yOXd","backdropInner":"revealScrollOut-module_backdropInner__211p3","backdropInner2":"revealScrollOut-module_backdropInner2__v6WqM","foreground":"revealScrollOut-module_foreground__3z-hw"};
styleInject(css$w);

var css$x = ".scrollInConceal-module_backdrop__2OJJC {\n  position: sticky;\n  top: 0;\n  height: 0;\n}\n";
var scrollInConceal = {"backdrop":"scrollInConceal-module_backdrop__2OJJC"};
styleInject(css$x);

var css$y = "\n\n.scrollInFadeOut-module_backdrop__1vXJd {\n  position: sticky;\n  top: 0;\n  height: 0;\n}\n\n.scrollInFadeOut-module_foreground__3Ikxb {\n  transition: opacity 0.5s ease, visibility 0.5s;\n}\n\n.scrollInFadeOut-module_foreground-above__6ipm- {\n  opacity: 0;\n  visibility: hidden;\n}\n\n.scrollInFadeOut-module_bbackdrop__2C-bf::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100vh;\n  background-color: #000;\n}\n\n.scrollInFadeOut-module_bbackdrop-below__3tq0M::before {\n  visibility: hidden;\n}\n";
var scrollInFadeOut = {"fade-duration":"0.5s","backdrop":"scrollInFadeOut-module_backdrop__1vXJd","foreground":"scrollInFadeOut-module_foreground__3Ikxb","foreground-above":"scrollInFadeOut-module_foreground-above__6ipm-","bbackdrop":"scrollInFadeOut-module_bbackdrop__2C-bf","bbackdrop-below":"scrollInFadeOut-module_bbackdrop-below__3tq0M"};
styleInject(css$y);

var css$z = "\n\n.scrollInFadeOutBg-module_backdrop__zw95c {\n  position: sticky;\n  top: 0;\n  height: 0;\n}\n\n.scrollInFadeOutBg-module_boxShadow__3UxCQ {\n  transition: opacity 0.5s ease, visibility 0.5s;\n}\n\n.scrollInFadeOutBg-module_boxShadow-above__3kfau {\n  opacity: 0;\n  visibility: hidden;\n}\n\n.scrollInFadeOutBg-module_bbackdrop__2pO9o::before {\n  content: \"\";\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100vh;\n  background-color: #000;\n}\n\n.scrollInFadeOutBg-module_bbackdrop-below__1Ky2w::before {\n  visibility: hidden;\n}\n";
var scrollInFadeOutBg = {"fade-duration":"0.5s","backdrop":"scrollInFadeOutBg-module_backdrop__zw95c","boxShadow":"scrollInFadeOutBg-module_boxShadow__3UxCQ","boxShadow-above":"scrollInFadeOutBg-module_boxShadow-above__3kfau","bbackdrop":"scrollInFadeOutBg-module_bbackdrop__2pO9o","bbackdrop-below":"scrollInFadeOutBg-module_bbackdrop-below__1Ky2w"};
styleInject(css$z);

var css$A = ".scrollInScrollOut-module_backdrop__XzCge {\n  position: sticky;\n  top: 0;\n  height: 100vh;\n}\n\n.scrollInScrollOut-module_foreground__1yyY8 {\n  margin-top: -100vh;\n}\n";
var scrollInScrollOut = {"backdrop":"scrollInScrollOut-module_backdrop__XzCge","foreground":"scrollInScrollOut-module_foreground__1yyY8"};
styleInject(css$A);

var css$B = ".previewScrollOut-module_scene__W9bDl {\n  height: 100%;\n}\n\n.previewScrollOut-module_backdrop__2-Bl_ {\n  position: absolute;\n  top: 0;\n}\n";
var previewScrollOut = {"scene":"previewScrollOut-module_scene__W9bDl","backdrop":"previewScrollOut-module_backdrop__2-Bl_"};
styleInject(css$B);

var styles$k = {
  fadeInBgConceal: fadeInBgConceal,
  fadeInBgFadeOut: fadeInBgFadeOut,
  fadeInBgFadeOutBg: fadeInBgFadeOutBg,
  fadeInBgScrollOut: fadeInBgScrollOut,
  fadeInConceal: fadeInConceal,
  fadeInFadeOut: fadeInFadeOut,
  fadeInFadeOutBg: fadeInFadeOutBg,
  fadeInScrollOut: fadeInScrollOut,
  revealConceal: revealConceal,
  revealFadeOut: revealFadeOut,
  revealFadeOutBg: revealFadeOutBg,
  revealScrollOut: revealScrollOut,
  scrollInConceal: scrollInConceal,
  scrollInFadeOut: scrollInFadeOut,
  scrollInFadeOutBg: scrollInFadeOutBg,
  scrollInScrollOut: scrollInScrollOut,
  previewScrollOut: previewScrollOut
};
var enterTransitions = {
  fade: 'fadeIn',
  fadeBg: 'fadeInBg',
  scroll: 'scrollIn',
  scrollOver: 'scrollIn',
  reveal: 'reveal',
  beforeAfter: 'reveal',
  preview: 'preview'
};
var exitTransitions = {
  fade: 'fadeOut',
  fadeBg: 'fadeOutBg',
  scroll: 'scrollOut',
  scrollOver: 'conceal',
  reveal: 'scrollOut',
  beforeAfter: 'conceal'
};
function getTransitionStyles(section, previousSection, nextSection) {
  var enterTransition = enterTransitions[section.transition];
  var exitTransition = exitTransitions[nextSection ? nextSection.transition : 'scroll'];
  var name = "".concat(enterTransition).concat(capitalize(exitTransition));

  if (!styles$k[name]) {
    throw new Error("Unknown transition ".concat(name));
  }

  return styles$k[name];
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function NoOpShadow(props) {
  return React.createElement("div", null, props.children);
}

var css$C = ".GradientShadow-module_shadow__2UiDH {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100vh;\n  z-index: 1;\n  transition: opacity 1s ease;\n}\n\n.GradientShadow-module_align-right__3iXZs .GradientShadow-module_shadow__2UiDH,\n.GradientShadow-module_align-left__3qcNM .GradientShadow-module_shadow__2UiDH {\n  background: linear-gradient(to right, #000 0%,rgba(0, 0, 0, 0) 100%);\n}\n\n@media (min-width: 950px) {\n  .GradientShadow-module_align-right__3iXZs .GradientShadow-module_shadow__2UiDH {\n    background: linear-gradient(to left, #000 0%,rgba(0, 0, 0, 0) 100%);\n  }\n}\n\n.GradientShadow-module_intersecting__h6vpz .GradientShadow-module_shadow__2UiDH,\n.GradientShadow-module_align-center__2C7cl .GradientShadow-module_shadow__2UiDH {\n  background: #000;\n}\n";
var styles$l = {"shadow":"GradientShadow-module_shadow__2UiDH","align-right":"GradientShadow-module_align-right__3iXZs","align-left":"GradientShadow-module_align-left__3qcNM","intersecting":"GradientShadow-module_intersecting__h6vpz","align-center":"GradientShadow-module_align-center__2C7cl"};
styleInject(css$C);

function GradientShadow(props) {
  var maxOpacityOverlap = props.motifAreaRect.height / 2;
  var motifAreaOverlap = Math.min(maxOpacityOverlap, props.motifAreaRect.bottom - props.contentAreaRect.top);
  var opacityFactor = props.intersecting && props.motifAreaRect.height > 0 ? motifAreaOverlap / maxOpacityOverlap : 1;
  return React.createElement("div", {
    className: classNames(styles$l.root, styles$l["align-".concat(props.align)], _defineProperty({}, styles$l.intersecting, props.intersecting))
  }, React.createElement("div", {
    className: styles$l.shadow,
    style: {
      opacity: props.opacity * Math.round(opacityFactor * 10) / 10
    }
  }), props.children);
}
GradientShadow.defaultProps = {
  opacity: 0.7,
  align: 'left'
};

function NoOpBoxWrapper(props) {
  return React.createElement("div", null, props.children);
}

var css$D = ".GradientBox-module_wrapper__1Jj7N {\n  padding-bottom: 50px;\n}\n\n.GradientBox-module_shadow__2XilX {\n  --background: rgba(0, 0, 0, 0.7);\n  position: absolute;\n  top: 0;\n  left: 0;\n  bottom: 0;\n  right: 0;\n  pointer-events: none;\n}\n\n.GradientBox-module_long__10s6v .GradientBox-module_shadow__2XilX {\n  bottom: -100vh;\n}\n\n.GradientBox-module_gradient__31tJ- {\n  text-shadow: 0px 1px 5px black;\n}\n\n.GradientBox-module_gradient__31tJ- .GradientBox-module_shadow__2XilX {\n  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0px,rgba(0, 0, 0, 0.3) 100px,rgba(0, 0, 0, 0.3) 100%);\n}\n\n.GradientBox-module_content__96lDk {\n  position: relative;\n}\n";
var styles$m = {"wrapper":"GradientBox-module_wrapper__1Jj7N","shadow":"GradientBox-module_shadow__2XilX","long":"GradientBox-module_long__10s6v","gradient":"GradientBox-module_gradient__31tJ-","content":"GradientBox-module_content__96lDk"};
styleInject(css$D);

function GradientBox(props) {
  var _classNames;

  var padding = props.active ? props.padding : 0;
  return React.createElement("div", {
    className: classNames(styles$m.root, (_classNames = {}, _defineProperty(_classNames, styles$m.gradient, padding > 0), _defineProperty(_classNames, styles$m["long"], props.coverInvisibleNextSection), _classNames)),
    style: {
      paddingTop: padding
    }
  }, React.createElement("div", {
    className: styles$m.wrapper
  }, React.createElement("div", {
    className: classNames(styles$m.shadow, props.transitionStyles.boxShadow, props.transitionStyles["boxShadow-".concat(props.state)]),
    style: {
      top: padding,
      opacity: props.opacity
    }
  }), React.createElement("div", {
    className: styles$m.content
  }, props.children)));
}
GradientBox.defaultProps = {
  opacity: 1
};

var css$E = ".CardBox-module_wrapper__3vnaH {\n}\n\n.CardBox-module_content__36v7J {\n  position: relative;\n}\n";
var styles$n = {"wrapper":"CardBox-module_wrapper__3vnaH","content":"CardBox-module_content__36v7J"};
styleInject(css$E);

function CardBox(props) {
  var padding = props.active ? props.padding : 0;
  return React.createElement("div", {
    style: {
      paddingTop: padding
    }
  }, React.createElement("div", {
    className: styles$n.wrapper
  }, React.createElement("div", {
    style: {
      top: padding
    }
  }), React.createElement("div", {
    className: styles$n.content
  }, props.children)));
}

var css$F = ".CardBoxWrapper-module_cardBg__154o2 {\n  background: white;\n  color: black;\n  padding: 4%;\n  margin: 0 -4% 50px 0;\n  border-radius: 15px;\n  opacity: 1;\n}\n";
var styles$o = {"cardBg":"CardBoxWrapper-module_cardBg__154o2"};
styleInject(css$F);

function CardBoxWrapper(props) {
  return React.createElement("div", {
    className: styles$o.cardBg
  }, props.children);
}

function ownKeys$4(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$4(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$4(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var OnScreenContext = React.createContext({
  center: false,
  top: false,
  bottom: false
});
function Section(props) {
  var activityProbeRef = useRef();
  useOnScreen(activityProbeRef, '-50% 0px -50% 0px', props.onActivate);
  var ref = useRef();
  var onScreen = useOnScreen(ref, '0px 0px 0px 0px');
  useScrollTarget(ref, props.isScrollTarget);
  var sectionProperties = {
    layout: props.layout,
    invert: props.invert
  };

  var _useBoundingClientRec = useBoundingClientRect(),
      _useBoundingClientRec2 = _slicedToArray(_useBoundingClientRec, 2),
      motifAreaRect = _useBoundingClientRec2[0],
      setMotifAreaRectRect = _useBoundingClientRec2[1];

  var _useDimension = useDimension(),
      _useDimension2 = _slicedToArray(_useDimension, 2),
      motifAreaDimension = _useDimension2[0],
      setMotifAreaDimensionRef = _useDimension2[1];

  var setMotifAreaRefs = useCallback(function (node) {
    setMotifAreaRectRect(node);
    setMotifAreaDimensionRef(node);
  }, [setMotifAreaRectRect, setMotifAreaDimensionRef]);

  var _useBoundingClientRec3 = useBoundingClientRect(props.layout),
      _useBoundingClientRec4 = _slicedToArray(_useBoundingClientRec3, 2),
      contentAreaRect = _useBoundingClientRec4[0],
      setContentAreaRef = _useBoundingClientRec4[1];

  var intersecting = isIntersectingX(motifAreaRect, contentAreaRect);
  var heightOffset = 0; //(props.backdrop.first || props.transition === 'scrollOver') ? 0 : (window.innerHeight / 3);

  var transitionStyles = getTransitionStyles(props, props.previousSection, props.nextSection);
  var appearance = {
    shadow: {
      background: GradientShadow,
      foreground: GradientBox,
      foregroundWrapper: NoOpBoxWrapper
    },
    transparent: {
      background: NoOpShadow,
      foreground: CardBox,
      foregroundWrapper: NoOpBoxWrapper
    },
    cards: {
      background: NoOpShadow,
      foreground: CardBox,
      foregroundWrapper: CardBoxWrapper
    }
  }[props.appearance || 'shadow'];
  var Shadow = appearance.background;
  var Box = appearance.foreground;
  var BoxWrapper = appearance.foregroundWrapper;
  return React.createElement("section", {
    id: "section-".concat(props.permaId),
    ref: ref,
    className: classNames(styles$j.Section, transitionStyles.section, _defineProperty({}, styles$j.invert, props.invert))
  }, React.createElement("div", {
    ref: activityProbeRef,
    className: styles$j.activityProbe
  }), React.createElement(Backdrop, Object.assign({}, props.backdrop, {
    motifAreaRef: setMotifAreaRefs,
    onScreen: onScreen,
    offset: Math.max(0, Math.max(1, -contentAreaRect.top / 200)),
    state: props.state,
    transitionStyles: transitionStyles,
    nextSectionOnEnd: props.nextSectionOnEnd,
    interactive: props.interactiveBackdrop
  }), function (children) {
    return props.interactiveBackdrop ? children : React.createElement(Shadow, {
      align: props.layout,
      intersecting: intersecting,
      opacity: props.shadowOpacity >= 0 ? props.shadowOpacity / 100 : 0.7,
      motifAreaRect: motifAreaRect,
      contentAreaRect: contentAreaRect
    }, children);
  }), React.createElement(Foreground, {
    transitionStyles: transitionStyles,
    hidden: props.interactiveBackdrop,
    disableEnlarge: props.disableEnlarge,
    state: props.state,
    heightMode: heightMode(props)
  }, React.createElement(Box, {
    active: intersecting,
    coverInvisibleNextSection: props.nextSection && props.nextSection.transition.startsWith('fade'),
    transitionStyles: transitionStyles,
    state: props.state,
    padding: Math.max(0, motifAreaDimension.top + motifAreaDimension.height - heightOffset),
    opacity: props.shadowOpacity
  }, React.createElement(Layout, {
    items: indexItems(props.foreground),
    appearance: props.appearance,
    contentAreaRef: setContentAreaRef,
    sectionProps: sectionProperties
  }, function (children) {
    return React.createElement(BoxWrapper, null, children);
  }))));
}

function indexItems(items) {
  return items.map(function (item, index) {
    return _objectSpread$4({}, item, {
      index: index
    });
  });
}

function heightMode(props) {
  if (props.fullHeight) {
    if (props.transition.startsWith('fade') || props.nextSection && props.nextSection.transition.startsWith('fade')) {
      return 'fullFade';
    } else {
      return 'full';
    }
  }

  return 'dynamic';
}

function Chapter(props) {
  return React.createElement("div", {
    id: "chapter-".concat(props.permaId)
  }, renderSections(props.sections, props.currentSectionIndex, props.setCurrentSectionIndex, props.scrollTargetSectionIndex, props.setScrollTargetSectionIndex));
}

function renderSections(sections, currentSectionIndex, setCurrentSectionIndex, scrollTargetSectionIndex, setScrollTargetSectionIndex) {
  function _onActivate(sectionIndex) {
    setCurrentSectionIndex(sectionIndex);
    setScrollTargetSectionIndex(null);
  }

  return sections.map(function (section) {
    return React.createElement(Section, Object.assign({
      key: section.permaId,
      state: section.sectionIndex > currentSectionIndex ? 'below' : section.sectionIndex < currentSectionIndex ? 'above' : 'active',
      isScrollTarget: section.sectionIndex === scrollTargetSectionIndex,
      onActivate: function onActivate() {
        return _onActivate(section.sectionIndex);
      }
    }, section));
  });
}

var css$G = ".Entry-module_Entry__1nDGh {\n  font-family: 'Source Sans Pro', sans-serif;\n  background-color: #000;\n  color: #fff;\n}\n\n.Entry-module_exampleSelect__1uAJs {\n  position: absolute;\n  top: 5px;\n  left: 50%;\n  z-index: 10;\n  transform: translateX(-50%);\n}\n";
var entryStyles = {"font-sans":"'Source Sans Pro', sans-serif","Entry":"Entry-module_Entry__1nDGh","exampleSelect":"Entry-module_exampleSelect__1uAJs"};
styleInject(css$G);

function Entry(props) {
  var _useState = useState(0),
      _useState2 = _slicedToArray(_useState, 2),
      currentSectionIndex = _useState2[0],
      setCurrentSectionIndexState = _useState2[1];

  var _useState3 = useState(null),
      _useState4 = _slicedToArray(_useState3, 2),
      scrollTargetSectionIndex = _useState4[0],
      setScrollTargetSectionIndex = _useState4[1];

  var _useEditorSelection = useEditorSelection(),
      select = _useEditorSelection.select;

  var _useState5 = useState(true),
      _useState6 = _slicedToArray(_useState5, 2),
      muted = _useState6[0],
      setMuted = _useState6[1];

  var dispatch = useEntryStateDispatch();
  var entryStructure = useEntryStructure();
  var setCurrentSectionIndex = useCallback(function (index) {
    if (window.parent) {
      window.parent.postMessage({
        type: 'CHANGE_SECTION',
        payload: {
          index: index
        }
      }, window.location.origin);
    }

    setCurrentSectionIndexState(index);
  }, [setCurrentSectionIndexState]);
  useEffect(function () {
    if (window.parent !== window) {
      window.addEventListener('message', receive);
      window.parent.postMessage({
        type: 'READY'
      }, window.location.origin);
    }

    return function () {
      return window.removeEventListener('message', receive);
    };

    function receive(message) {
      if (window.location.href.indexOf(message.origin) === 0) {
        if (message.data.type === 'ACTION') {
          dispatch(message.data.payload);
        } else if (message.data.type === 'SCROLL_TO_SECTION') {
          setScrollTargetSectionIndex(message.data.payload.index);
        } else if (message.data.type === 'SELECT') {
          select(message.data.payload);
        }
      }
    }
  }, [dispatch, select]);

  function scrollToSection(index) {
    if (index === 'next') {
      index = currentSectionIndex + 1;
    }

    setScrollTargetSectionIndex(index);
  }

  return React.createElement("div", {
    className: entryStyles.Entry
  }, React.createElement(MutedContext.Provider, {
    value: {
      muted: muted,
      setMuted: setMuted
    }
  }, React.createElement(ScrollToSectionContext.Provider, {
    value: scrollToSection
  }, renderChapters(entryStructure, currentSectionIndex, setCurrentSectionIndex, scrollTargetSectionIndex, setScrollTargetSectionIndex))));
}

function renderChapters(entryStructure, currentSectionIndex, setCurrentSectionIndex, scrollTargetSectionIndex, setScrollTargetSectionIndex) {
  return entryStructure.map(function (chapter, index) {
    return React.createElement(Chapter, {
      key: index,
      permaId: chapter.permaId,
      sections: chapter.sections,
      currentSectionIndex: currentSectionIndex,
      setCurrentSectionIndex: setCurrentSectionIndex,
      scrollTargetSectionIndex: scrollTargetSectionIndex,
      setScrollTargetSectionIndex: setScrollTargetSectionIndex
    });
  });
}

var css$H = "body {\n  margin: 0;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n";
styleInject(css$H);

var css$I = ".Text-module_h2__34chJ {\n  font-size: 66px;\n  font-weight: 700;\n}\n\n.Text-module_h1__2_5kX {\n  font-size: 110px;\n  line-height: 1;\n}\n\n.Text-module_body__4oWD- {\n  font-size: 22px;\n  line-height: 1.4;\n}\n\n.Text-module_caption__3_6Au {\n  font-size: 20px;\n  line-height: 1.4;\n}\n\n@media (max-width: 600px) {\n  .Text-module_h2__34chJ {\n    font-size: 40px;\n  }\n\n  .Text-module_h1__2_5kX {\n    font-size: 66px;\n  }\n}\n";
var styles$p = {"text-s":"20px","text-base":"22px","text-l":"40px","text-xl":"66px","text-2xl":"110px","h2":"Text-module_h2__34chJ","h1":"Text-module_h1__2_5kX","body":"Text-module_body__4oWD-","caption":"Text-module_caption__3_6Au"};
styleInject(css$I);

/**
 * Render some text using the default typography scale.
 *
 * @param {Object} props
 * @param {string} props.scaleCategory - One of the styles `'h1'`, `'h2'`, `'body'`, `'caption'`.
 * @param {string} [props.inline] - Render a span instread of a div.
 * @param {string} props.children - Nodes to render with specified typography.
 */

function Text(_ref) {
  var inline = _ref.inline,
      scaleCategory = _ref.scaleCategory,
      children = _ref.children;
  return React.createElement(inline ? 'span' : 'div', {
    className: styles$p[scaleCategory]
  }, children);
}

var css$J = ".InlineCaption-module_root__1R8Ib {\n  padding: 3px 10px 5px;\n  background-color: #fff;\n  color: #222;\n  text-shadow: none;\n}\n";
var styles$q = {"root":"InlineCaption-module_root__1R8Ib"};
styleInject(css$J);

/**
 * Render a caption text attached to a content element.
 *
 * @param {Object} props
 * @param {string} props.text - The text to be displayed.
 */

function InlineCaption(_ref) {
  var text = _ref.text;

  if (text) {
    return React.createElement("div", {
      className: styles$q.root,
      role: "caption"
    }, React.createElement(Text, {
      scaleCategory: "caption"
    }, text));
  } else {
    return null;
  }
}

/**
 * Read and change media settings of the entry.
 *
 * @example
 * const mediaSettings = useMediaSettings();
 * mediaSettings // =>
 *   {
 *      muted: true,            // All media elements should be played without sound.
 *      setMuted: muted => {},  // Enable sound for all media elements.
 *      mediaOff: false         // Playing media is not allowed. Will be true when
 *                              // rendering section thumbnails in the editor.
 *   }
 */

function useMediaSettings() {
  return useContext(MutedContext);
}

var css$K = ".SectionThumbnail-module_crop__Q1nZj {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  overflow: hidden;\n}\n\n.SectionThumbnail-module_scale__2tKDG {\n  transform: scale(0.2);\n  transform-origin: 0 0;\n  width: 500%;\n}\n";
var styles$r = {"crop":"SectionThumbnail-module_crop__Q1nZj","scale":"SectionThumbnail-module_scale__2tKDG"};
styleInject(css$K);

function SectionThumbnail(_ref) {
  var seed = _ref.seed,
      props = _objectWithoutProperties(_ref, ["seed"]);

  return React.createElement(EntryStateProvider, {
    seed: seed
  }, React.createElement(Inner, props));
}

function Inner(_ref2) {
  var sectionPermaId = _ref2.sectionPermaId,
      subscribe = _ref2.subscribe;
  var dispatch = useEntryStateDispatch();
  useEffect(function () {
    return subscribe(dispatch);
  }, [subscribe, dispatch]);
  var section = useSectionStructure({
    sectionPermaId: sectionPermaId
  });

  if (section) {
    return React.createElement("div", {
      className: styles$r.crop
    }, React.createElement("div", {
      className: styles$r.scale
    }, React.createElement("div", {
      className: entryStyles.Entry
    }, React.createElement(Section, Object.assign({
      state: "active"
    }, section, {
      transition: "preview"
    })))));
  } else {
    return React.createElement("div", {
      className: styles$r.root
    }, "Not found.");
  }
}

Inner.defaultProps = {
  subscribe: function subscribe() {}
};

var editMode = window.location.pathname.indexOf('/editor/entries') === 0;

window.pageflowScrolledRender = function (seed) {
  setupI18n(seed.i18n);
  ReactDOM.render(React.createElement(Root, {
    seed: seed
  }), document.getElementById('root'));
};

function Root(_ref) {
  var seed = _ref.seed;
  return React.createElement(React.Fragment, null, React.createElement(EditorStateProvider, {
    active: editMode
  }, React.createElement(EntryStateProvider, {
    seed: seed
  }, React.createElement(AppHeader, null), React.createElement(Entry, null))));
}

export { Entry, EntryStateProvider, Image, InlineCaption, SectionThumbnail, Text, Video, api as frontend, setupI18n, useI18n, useMediaSettings, useOnScreen };
