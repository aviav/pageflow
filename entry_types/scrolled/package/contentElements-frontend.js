import { Text, frontend, useOnScreen, Image, InlineCaption, Video, useMediaSettings, useI18n } from 'pageflow-scrolled/frontend';
import React, { useState, useRef, useEffect } from 'react';
import classNames from 'classnames';
import ReactPlayer from 'react-player';

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

var css = ".Heading-module_root__33TFw {\n  margin-top: 0.2em;\n  margin-bottom: 0.5em;\n  padding-top: 0.3em;\n}\n\n@media (orientation: landscape) {\n  .Heading-module_first__1PMJX {\n    padding-top: 25%;\n  }\n}\n";
var styles = {"root":"Heading-module_root__33TFw","first":"Heading-module_first__1PMJX"};
styleInject(css);

function Heading(_ref) {
  var configuration = _ref.configuration;
  return React.createElement("h1", {
    className: classNames(styles.root, _defineProperty({}, styles.first, configuration.first))
  }, React.createElement(Text, {
    scaleCategory: configuration.first ? 'h1' : 'h2',
    inline: true
  }, configuration.children));
}

frontend.contentElementTypes.register('heading', {
  component: Heading
});

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

// Copyright (c) 2013 Marc J. Schmidt
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// Originally based on version 1.2.1,
// https://github.com/marcj/css-element-queries/tree/1.2.1
// Some lines removed for compatibility.
var ResizeSensor = function () {
  // Make sure it does not throw in a SSR (Server Side Rendering) situation
  if (typeof window === "undefined") {
    return null;
  } // https://github.com/Semantic-Org/Semantic-UI/issues/3855
  // https://github.com/marcj/css-element-queries/issues/257


  var globalWindow = window; // Only used for the dirty checking, so the event callback count is limited to max 1 call per fps per sensor.
  // In combination with the event based resize sensor this saves cpu time, because the sensor is too fast and
  // would generate too many unnecessary events.

  var requestAnimationFrame = globalWindow.requestAnimationFrame || globalWindow.mozRequestAnimationFrame || globalWindow.webkitRequestAnimationFrame || function (fn) {
    return globalWindow.setTimeout(fn, 20);
  };

  function forEachElement(elements, callback) {
    var elementsType = Object.prototype.toString.call(elements);
    var isCollectionTyped = '[object Array]' === elementsType || '[object NodeList]' === elementsType || '[object HTMLCollection]' === elementsType || '[object Object]' === elementsType;
    var i = 0,
        j = elements.length;

    if (isCollectionTyped) {
      for (; i < j; i++) {
        callback(elements[i]);
      }
    } else {
      callback(elements);
    }
  }

  function getElementSize(element) {
    if (!element.getBoundingClientRect) {
      return {
        width: element.offsetWidth,
        height: element.offsetHeight
      };
    }

    var rect = element.getBoundingClientRect();
    return {
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    };
  }

  function setStyle(element, style) {
    Object.keys(style).forEach(function (key) {
      element.style[key] = style[key];
    });
  }

  var ResizeSensor = function ResizeSensor(element, callback) {
    function EventQueue() {
      var q = [];

      this.add = function (ev) {
        q.push(ev);
      };

      var i, j;

      this.call = function (sizeInfo) {
        for (i = 0, j = q.length; i < j; i++) {
          q[i].call(this, sizeInfo);
        }
      };

      this.remove = function (ev) {
        var newQueue = [];

        for (i = 0, j = q.length; i < j; i++) {
          if (q[i] !== ev) newQueue.push(q[i]);
        }

        q = newQueue;
      };

      this.length = function () {
        return q.length;
      };
    }

    function attachResizeEvent(element, resized) {
      if (!element) return;

      if (element.resizedAttached) {
        element.resizedAttached.add(resized);
        return;
      }

      element.resizedAttached = new EventQueue();
      element.resizedAttached.add(resized);
      element.resizeSensor = document.createElement('div');
      element.resizeSensor.dir = 'ltr';
      element.resizeSensor.className = 'resize-sensor';
      var style = {
        pointerEvents: 'none',
        position: 'absolute',
        left: '0px',
        top: '0px',
        right: '0px',
        bottom: '0px',
        overflow: 'hidden',
        zIndex: '-1',
        visibility: 'hidden',
        maxWidth: '100%'
      };
      var styleChild = {
        position: 'absolute',
        left: '0px',
        top: '0px',
        transition: '0s'
      };
      setStyle(element.resizeSensor, style);
      var expand = document.createElement('div');
      expand.className = 'resize-sensor-expand';
      setStyle(expand, style);
      var expandChild = document.createElement('div');
      setStyle(expandChild, styleChild);
      expand.appendChild(expandChild);
      var shrink = document.createElement('div');
      shrink.className = 'resize-sensor-shrink';
      setStyle(shrink, style);
      var shrinkChild = document.createElement('div');
      setStyle(shrinkChild, styleChild);
      setStyle(shrinkChild, {
        width: '200%',
        height: '200%'
      });
      shrink.appendChild(shrinkChild);
      element.resizeSensor.appendChild(expand);
      element.resizeSensor.appendChild(shrink);
      element.appendChild(element.resizeSensor);
      var computedStyle = window.getComputedStyle(element);
      var position = computedStyle ? computedStyle.getPropertyValue('position') : null;

      if ('absolute' !== position && 'relative' !== position && 'fixed' !== position) {
        element.style.position = 'relative';
      }

      var dirty, rafId;
      var size = getElementSize(element);
      var lastWidth = 0;
      var lastHeight = 0;
      var initialHiddenCheck = true;
      var lastAnimationFrame = 0;

      var resetExpandShrink = function resetExpandShrink() {
        var width = element.offsetWidth;
        var height = element.offsetHeight;
        expandChild.style.width = width + 10 + 'px';
        expandChild.style.height = height + 10 + 'px';
        expand.scrollLeft = width + 10;
        expand.scrollTop = height + 10;
        shrink.scrollLeft = width + 10;
        shrink.scrollTop = height + 10;
      };

      var reset = function reset() {
        // Check if element is hidden
        if (initialHiddenCheck) {
          var invisible = element.offsetWidth === 0 && element.offsetHeight === 0;

          if (invisible) {
            // Check in next frame
            if (!lastAnimationFrame) {
              lastAnimationFrame = requestAnimationFrame(function () {
                lastAnimationFrame = 0;
                reset();
              });
            }

            return;
          } else {
            // Stop checking
            initialHiddenCheck = false;
          }
        }

        resetExpandShrink();
      };

      element.resizeSensor.resetSensor = reset;

      var onResized = function onResized() {
        rafId = 0;
        if (!dirty) return;
        lastWidth = size.width;
        lastHeight = size.height;

        if (element.resizedAttached) {
          element.resizedAttached.call(size);
        }
      };

      var onScroll = function onScroll() {
        size = getElementSize(element);
        dirty = size.width !== lastWidth || size.height !== lastHeight;

        if (dirty && !rafId) {
          rafId = requestAnimationFrame(onResized);
        }

        reset();
      };

      var addEvent = function addEvent(el, name, cb) {
        if (el.attachEvent) {
          el.attachEvent('on' + name, cb);
        } else {
          el.addEventListener(name, cb);
        }
      };

      addEvent(expand, 'scroll', onScroll);
      addEvent(shrink, 'scroll', onScroll); // Fix for custom Elements

      requestAnimationFrame(reset);
    }

    forEachElement(element, function (elem) {
      attachResizeEvent(elem, callback);
    });

    this.detach = function (ev) {
      ResizeSensor.detach(element, ev);
    };

    this.reset = function () {
      element.resizeSensor.resetSensor();
    };
  };

  ResizeSensor.reset = function (element) {
    forEachElement(element, function (elem) {
      elem.resizeSensor.resetSensor();
    });
  };

  ResizeSensor.detach = function (element, ev) {
    forEachElement(element, function (elem) {
      if (!elem) return;

      if (elem.resizedAttached && typeof ev === "function") {
        elem.resizedAttached.remove(ev);
        if (elem.resizedAttached.length()) return;
      }

      if (elem.resizeSensor) {
        if (elem.contains(elem.resizeSensor)) {
          elem.removeChild(elem.resizeSensor);
        }

        delete elem.resizeSensor;
        delete elem.resizedAttached;
      }
    });
  };

  if (typeof MutationObserver !== "undefined") {
    var observer = new MutationObserver(function (mutations) {
      for (var i in mutations) {
        if (mutations.hasOwnProperty(i)) {
          var items = mutations[i].addedNodes;

          for (var j = 0; j < items.length; j++) {
            if (items[j].resizeSensor) {
              ResizeSensor.reset(items[j]);
            }
          }
        }
      }
    });
    document.addEventListener("DOMContentLoaded", function (event) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  }

  return ResizeSensor;
}();

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var defaultProps = {
  handleSize: 40,
  handle: null,
  hover: false,
  leftImageAlt: '',
  leftImageCss: {},
  leftImageLabel: null,
  onSliderPositionChange: function onSliderPositionChange() {},
  rightImageAlt: '',
  rightImageCss: {},
  rightImageLabel: null,
  skeleton: null,
  sliderLineColor: '#ffffff',
  sliderLineWidth: 2,
  sliderPositionPercentage: 0.5
};

function ReactCompareImage(props) {
  var handleSize = props.handleSize,
      handle = props.handle,
      hover = props.hover,
      leftImage = props.leftImage,
      leftImageAlt = props.leftImageAlt,
      leftImageCss = props.leftImageCss,
      leftImageLabel = props.leftImageLabel,
      onSliderPositionChange = props.onSliderPositionChange,
      rightImage = props.rightImage,
      rightImageAlt = props.rightImageAlt,
      rightImageCss = props.rightImageCss,
      rightImageLabel = props.rightImageLabel,
      skeleton = props.skeleton,
      sliderLineColor = props.sliderLineColor,
      sliderLineWidth = props.sliderLineWidth,
      sliderPositionPercentage = props.sliderPositionPercentage,
      sliderPosition = props.sliderPosition,
      setSliderPosition = props.setSliderPosition,
      isSliding = props.isSliding,
      setIsSliding = props.setIsSliding,
      classicMode = props.classicMode,
      wiggle = props.wiggle;

  var _useState = useState(0),
      _useState2 = _slicedToArray(_useState, 2),
      containerWidth = _useState2[0],
      setContainerWidth = _useState2[1];

  var _useState3 = useState(false),
      _useState4 = _slicedToArray(_useState3, 2),
      leftImgLoaded = _useState4[0],
      setLeftImgLoaded = _useState4[1];

  var _useState5 = useState(false),
      _useState6 = _slicedToArray(_useState5, 2),
      rightImgLoaded = _useState6[0],
      setRightImgLoaded = _useState6[1];

  var containerRef = useRef();
  var rightImageRef = useRef();
  var leftImageRef = useRef(); // keep track container's width in local state

  useEffect(function () {
    var updateContainerWidth = function updateContainerWidth() {
      var currentContainerWidth = containerRef.current.getBoundingClientRect().width;
      setContainerWidth(currentContainerWidth);
    }; // initial execution must be done manually


    updateContainerWidth(); // update local state if container size is changed

    var containerElement = containerRef.current;
    var resizeSensor = new ResizeSensor(containerElement, function () {
      updateContainerWidth();
    });
    return function () {
      resizeSensor.detach(containerElement);
    };
  }, []);
  useEffect(function () {
    // consider the case where loading image is completed immediately
    // due to the cache etc.
    var alreadyDone = leftImageRef.current.complete;
    alreadyDone && setLeftImgLoaded(true);
    return function () {
      // when the left image source is changed
      setLeftImgLoaded(false);
    };
  }, [leftImage]);
  useEffect(function () {
    // consider the case where loading image is completed immediately
    // due to the cache etc.
    var alreadyDone = rightImageRef.current.complete;
    alreadyDone && setRightImgLoaded(true);
    return function () {
      // when the right image source is changed
      setRightImgLoaded(false);
    };
  }, [rightImage]);
  var allImagesLoaded = rightImgLoaded && leftImgLoaded;
  useEffect(function () {
    var handleSliding = function handleSliding(event) {
      var e = event || window.event; // Calc Cursor Position from the left edge of the viewport

      var cursorXfromViewport = e.touches ? e.touches[0].pageX : e.pageX; // Calc Cursor Position from the left edge of the window (consider any page scrolling)

      var cursorXfromWindow = cursorXfromViewport - window.pageXOffset; // Calc Cursor Position from the left edge of the image

      var imagePosition = rightImageRef.current.getBoundingClientRect();
      var pos = cursorXfromWindow - imagePosition.left; // Set minimum and maximum values to prevent the slider from overflowing

      var minPos = 0 + sliderLineWidth / 2;
      var maxPos = containerWidth - sliderLineWidth / 2;
      if (pos < minPos) pos = minPos;
      if (pos > maxPos) pos = maxPos;
      setSliderPosition(pos / containerWidth); // If there's a callback function, invoke it everytime the slider changes

      if (onSliderPositionChange) {
        onSliderPositionChange(pos / containerWidth);
      }
    };

    var startSliding = function startSliding(e) {
      setIsSliding(true); // Prevent default behavior other than mobile scrolling

      if (!('touches' in e)) {
        e.preventDefault();
      } // Slide the image even if you just click or tap (not drag)


      handleSliding(e);
      window.addEventListener('mousemove', handleSliding); // 07

      window.addEventListener('touchmove', handleSliding); // 08
    };

    var finishSliding = function finishSliding() {
      setIsSliding(false);
      window.removeEventListener('mousemove', handleSliding);
      window.removeEventListener('touchmove', handleSliding);
    };

    var containerElement = containerRef.current;

    if (allImagesLoaded) {
      if (classicMode) {
        // it's necessary to reset event handlers each time the canvasWidth changes
        // for mobile
        containerElement.addEventListener('touchstart', startSliding); // 01

        window.addEventListener('touchend', finishSliding); // 02
        // for desktop

        if (hover) {
          containerElement.addEventListener('mousemove', handleSliding); // 03

          containerElement.addEventListener('mouseleave', finishSliding); // 04
        } else {
          containerElement.addEventListener('mousedown', startSliding); // 05

          window.addEventListener('mouseup', finishSliding); // 06
        }
      }
    }

    return function () {
      if (classicMode) {
        // cleanup all event resteners
        containerElement.removeEventListener('touchstart', startSliding); // 01

        window.removeEventListener('touchend', finishSliding); // 02

        containerElement.removeEventListener('mousemove', handleSliding); // 03

        containerElement.removeEventListener('mouseleave', finishSliding); // 04

        containerElement.removeEventListener('mousedown', startSliding); // 05

        window.removeEventListener('mouseup', finishSliding); // 06

        window.removeEventListener('mousemove', handleSliding); // 07

        window.removeEventListener('touchmove', handleSliding); // 08
      }
    };
  }, [allImagesLoaded, containerWidth, hover, sliderLineWidth]); // eslint-disable-line
  // Image size set as follows.
  //
  // 1. right(under) image:
  //     width  = 100% of container width
  //     height = auto
  //
  // 2. left(over) imaze:
  //     width  = 100% of container width
  //     height = right image's height
  //              (protrudes is hidden by css 'object-fit: hidden')

  var styles = {
    container: {
      boxSizing: 'border-box',
      position: 'relative',
      width: '100%',
      overflow: 'hidden'
    },
    rightImage: _objectSpread({
      display: 'block',
      height: 'auto',
      // Respect the aspect ratio
      width: '100%'
    }, rightImageCss),
    leftImage: _objectSpread({
      clip: "rect(auto, ".concat(containerWidth * sliderPosition, "px, auto, auto)"),
      display: 'block',
      height: '100%',
      // fit to the height of right(under) image
      objectFit: 'cover',
      // protrudes is hidden
      position: 'absolute',
      top: 0,
      width: '100%'
    }, leftImageCss),
    slider: {
      alignItems: 'center',
      cursor: !hover && 'ew-resize',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'center',
      left: "".concat(containerWidth * sliderPosition - handleSize / 2, "px"),
      position: 'absolute',
      top: 0,
      width: "".concat(handleSize, "px")
    },
    line: {
      background: sliderLineColor,
      boxShadow: '0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12)',
      flex: '0 1 auto',
      height: '100%',
      width: "".concat(sliderLineWidth, "px")
    },
    handleCustom: {
      alignItems: 'center',
      boxSizing: 'border-box',
      display: 'flex',
      flex: '1 0 auto',
      height: 'auto',
      justifyContent: 'center',
      width: 'auto'
    },
    handleDefault: {
      alignItems: 'center',
      border: "".concat(sliderLineWidth, "px solid ").concat(sliderLineColor),
      borderRadius: '100%',
      boxShadow: '0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12)',
      boxSizing: 'border-box',
      display: 'flex',
      flex: '1 0 auto',
      height: "".concat(handleSize, "px"),
      justifyContent: 'center',
      width: "".concat(handleSize, "px")
    },
    leftArrow: {
      border: "inset ".concat(handleSize * 0.15, "px rgba(0,0,0,0)"),
      borderRight: "".concat(handleSize * 0.15, "px solid ").concat(sliderLineColor),
      height: '0px',
      marginLeft: "-".concat(handleSize * 0.25, "px"),
      // for IE11
      marginRight: "".concat(handleSize * 0.25, "px"),
      width: '0px'
    },
    rightArrow: {
      border: "inset ".concat(handleSize * 0.15, "px rgba(0,0,0,0)"),
      borderLeft: "".concat(handleSize * 0.15, "px solid ").concat(sliderLineColor),
      height: '0px',
      marginRight: "-".concat(handleSize * 0.25, "px"),
      // for IE11
      width: '0px'
    },
    leftLabel: {
      background: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      left: '5%',
      opacity: isSliding ? 0 : 1,
      padding: '10px 20px',
      position: 'absolute',
      top: '50%',
      transform: 'translate(0,-50%)',
      transition: 'opacity 0.1s ease-out 0.5s',
      maxWidth: '30%',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none'
    },
    rightLabel: {
      background: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      opacity: isSliding ? 0 : 1,
      padding: '10px 20px',
      position: 'absolute',
      right: '5%',
      top: '50%',
      transform: 'translate(0,-50%)',
      transition: 'opacity 0.1s ease-out 0.5s',
      maxWidth: '30%',
      WebkitUserSelect: 'none',
      WebkitTouchCallout: 'none'
    }
  };
  return React.createElement(React.Fragment, null, skeleton && !allImagesLoaded && React.createElement("div", {
    style: _objectSpread({}, styles.container)
  }, skeleton), React.createElement("div", {
    style: _objectSpread({}, styles.container, {
      display: allImagesLoaded ? 'block' : 'none'
    }),
    ref: containerRef,
    "data-testid": "container"
  }, React.createElement("img", {
    onLoad: function onLoad() {
      return setRightImgLoaded(true);
    },
    alt: rightImageAlt,
    "data-testid": "right-image",
    ref: rightImageRef,
    src: rightImage,
    style: styles.rightImage
  }), React.createElement("img", {
    onLoad: function onLoad() {
      return setLeftImgLoaded(true);
    },
    alt: leftImageAlt,
    "data-testid": "left-image",
    ref: leftImageRef,
    src: leftImage,
    style: styles.leftImage
  }), React.createElement("div", {
    style: styles.slider,
    className: classNames(_defineProperty({}, 'wiggle', wiggle))
  }, React.createElement("div", {
    style: styles.line
  }), handle ? React.createElement("div", {
    style: styles.handleCustom
  }, handle) : React.createElement("div", {
    style: styles.handleDefault
  }, React.createElement("div", {
    style: styles.leftArrow
  }), React.createElement("div", {
    style: styles.rightArrow
  })), React.createElement("div", {
    style: styles.line
  })), leftImageLabel && React.createElement("div", {
    style: styles.leftLabel
  }, leftImageLabel), rightImageLabel && React.createElement("div", {
    style: styles.rightLabel
  }, rightImageLabel)));
}

ReactCompareImage.defaultProps = defaultProps;

var css$1 = ".BeforeAfter-module_container__2Lm06 {\n  height: 100%;\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n}\n\n.wiggle {\n  animation: BeforeAfter-module_shake__2LyX0 1.5s cubic-bezier(.36,.07,.19,.97) both;\n}\n\n@keyframes BeforeAfter-module_shake__2LyX0 {\n  10%, 90% {\n    transform: translate3d(-20%, 0, 0);\n  }\n\n  20%, 80% {\n    transform: translate3d(40%, 0, 0);\n  }\n\n  30%, 50%, 70% {\n    transform: translate3d(-80%, 0, 0);\n  }\n\n  40%, 60% {\n    transform: translate3d(80%, 0, 0);\n  }\n}";
var styles$1 = {"container":"BeforeAfter-module_container__2Lm06","shake":"BeforeAfter-module_shake__2LyX0"};
styleInject(css$1);

function BeforeAfter(_ref) {
  var state = _ref.state,
      leftImageLabel = _ref.leftImageLabel,
      rightImageLabel = _ref.rightImageLabel,
      _ref$startPos = _ref.startPos,
      startPos = _ref$startPos === void 0 ? 0 : _ref$startPos,
      _ref$slideMode = _ref.slideMode,
      slideMode = _ref$slideMode === void 0 ? 'both' : _ref$slideMode;

  var _useState = useState({
    pos: window.pageYOffset || document.documentElement.scrollTop,
    dir: 'unknown'
  }),
      _useState2 = _slicedToArray(_useState, 2),
      scrollPos = _useState2[0],
      setScrollPos = _useState2[1];

  var _useState3 = useState(false),
      _useState4 = _slicedToArray(_useState3, 2),
      isSliding = _useState4[0],
      setIsSliding = _useState4[1];

  var _useState5 = useState(startPos),
      _useState6 = _slicedToArray(_useState5, 2),
      beforeAfterPos = _useState6[0],
      setBeforeAfterPos = _useState6[1];

  var beforeAfterRef = useRef();
  var slideOnScroll = slideMode === 'both' || slideMode === 'scroll';
  var slideClassic = slideMode === 'both' || slideMode === 'classic';
  var current = beforeAfterRef.current;

  var _useState7 = useState(false),
      _useState8 = _slicedToArray(_useState7, 2),
      wiggle = _useState8[0],
      setWiggle = _useState8[1];

  useEffect(function () {
    var node = current;

    if (node) {
      setWiggle(state === 'active');
    }
  }, [state, current]);
  useEffect(function () {
    var node = current;

    function handler() {
      if (node) {
        setScrollPos(function (prevPos) {
          var currPos = window.pageYOffset || document.documentElement.scrollTop;

          if (currPos > prevPos['pos']) {
            return {
              pos: currPos,
              dir: 'down'
            };
          }

          if (currPos < prevPos['pos']) {
            return {
              pos: currPos,
              dir: 'up'
            };
          }

          return prevPos;
        });

        if (slideOnScroll) {
          if (scrollPos['dir'] === 'down' && beforeAfterPos < 1) {
            setBeforeAfterPos(function (prev) {
              return prev + 0.025;
            });
            setIsSliding(true);
            setTimeout(function () {
              return setIsSliding(false);
            }, 200);
          } else if (scrollPos['dir'] === 'up' && beforeAfterPos > 0) {
            setBeforeAfterPos(function (prev) {
              return prev - 0.025;
            });
            setIsSliding(true);
            setTimeout(function () {
              return setIsSliding(false);
            }, 250);
          } else {
            setIsSliding(false);
          }
        }
      }
    }

    if (!node) {
      return;
    }

    setTimeout(handler, 0);

    if (state === 'active') {
      window.addEventListener('scroll', handler);
      return function () {
        window.removeEventListener('scroll', handler);
      };
    }
  }, [current, setBeforeAfterPos, scrollPos, state, setIsSliding]);
  var awsBucket = '//s3-eu-west-1.amazonaws.com/de.codevise.pageflow.development/pageflow-next/presentation-images/';
  var beforeImage = awsBucket + 'before_after/haldern_church1.jpg';
  var afterImage = awsBucket + 'before_after/haldern_church2.jpg';
  return React.createElement("div", {
    ref: beforeAfterRef,
    className: styles$1.container
  }, React.createElement(ReactCompareImage, {
    leftImage: beforeImage,
    rightImage: afterImage,
    sliderPosition: beforeAfterPos,
    setSliderPosition: setBeforeAfterPos,
    isSliding: isSliding,
    setIsSliding: setIsSliding,
    leftImageLabel: leftImageLabel,
    rightImageLabel: rightImageLabel,
    classicMode: slideClassic,
    wiggle: wiggle
  }));
}

var css$2 = ".InlineBeforeAfter-module_root__1f5oG {\n  position: relative;\n  margin: 0 auto;\n}\n";
var styles$2 = {"root":"InlineBeforeAfter-module_root__1f5oG"};
styleInject(css$2);

function InlineBeforeAfter(props) {
  var ref = useRef();
  var onScreen = useOnScreen(ref, '-50% 0px -50% 0px');
  return React.createElement("div", {
    ref: ref,
    className: styles$2.root
  }, React.createElement(BeforeAfter, Object.assign({}, props.configuration, {
    state: onScreen ? 'active' : 'inactive'
  })));
}

frontend.contentElementTypes.register('inlineBeforeAfter', {
  component: InlineBeforeAfter
});

var css$3 = ".InlineImage-module_root__3edeH {\n  position: relative;\n  margin-top: 1em;\n}\n\n.InlineImage-module_container__30JBC {\n  position: relative;\n  margin-top: 1em;\n}\n\n.InlineImage-module_spacer__2yTJT {\n  padding-top: 75%;\n}\n\n.InlineImage-module_inner__3WcPa {\n  border: solid 2px #fff;\n  position: absolute;\n  top: 0;\n  left: 0;\n  bottom: 0;\n  right: 0;\n}\n";
var styles$3 = {"root":"InlineImage-module_root__3edeH","container":"InlineImage-module_container__30JBC","spacer":"InlineImage-module_spacer__2yTJT","inner":"InlineImage-module_inner__3WcPa"};
styleInject(css$3);

function InlineImage(_ref) {
  var configuration = _ref.configuration;
  return React.createElement("div", {
    className: classNames(styles$3.root)
  }, React.createElement("div", {
    className: styles$3.container
  }, React.createElement("div", {
    className: styles$3.spacer
  }, React.createElement("div", {
    className: styles$3.inner
  }, React.createElement(Image, configuration)))), React.createElement(InlineCaption, {
    text: configuration.caption
  }));
}

frontend.contentElementTypes.register('inlineImage', {
  component: InlineImage
});

var css$4 = ".InlineVideo-module_root__26uiY {\n  position: relative;\n  max-height: 98vh;\n}\n\n.InlineVideo-module_inner__3n7y4 {\n  position: absolute;\n  top: 0;\n  left: 0;\n  bottom: 0;\n  right: 0;\n}\n\n/* Timeline in native video controls is hidden in Storybook to prevent\n   Percy from detecting different loading progress as visual\n   change. See .storybook/preview-head.html file. */\n";
var styles$4 = {"root":"InlineVideo-module_root__26uiY","inner":"InlineVideo-module_inner__3n7y4"};
styleInject(css$4);

function InlineVideo(_ref) {
  var configuration = _ref.configuration;
  var ref = useRef();
  var onScreen = useOnScreen(ref, '-50% 0px -50% 0px');
  return React.createElement("div", {
    ref: ref,
    className: classNames(styles$4.root)
  }, React.createElement("div", {
    style: {
      paddingTop: configuration.wideFormat ? '41.15%' : '56.25%'
    }
  }, React.createElement("div", {
    className: styles$4.inner
  }, React.createElement(Video, Object.assign({}, configuration, {
    state: onScreen ? 'active' : 'inactive',
    interactive: true
  })))));
}

frontend.contentElementTypes.register('inlineVideo', {
  component: InlineVideo
});

var css$5 = ".SoundDisclaimer-module_soundDisclaimer__31hWh {\n  text-align: center;\n  border: 1px solid white;\n  border-radius: 4px;\n  cursor: pointer;\n  font-size: inherit;\n}\n\n.SoundDisclaimer-module_soundDisclaimer__31hWh:hover {\n  background: rgba(255, 255, 255, 0.25);\n}";
var styles$5 = {"soundDisclaimer":"SoundDisclaimer-module_soundDisclaimer__31hWh"};
styleInject(css$5);

function SoundDisclaimer() {
  var mediaSettings = useMediaSettings();

  var _useI18n = useI18n(),
      t = _useI18n.t;

  return React.createElement("div", {
    className: classNames(styles$5.soundDisclaimer),
    onClick: function onClick() {
      return mediaSettings.setMuted(false);
    }
  }, React.createElement("p", {
    dangerouslySetInnerHTML: {
      __html: t('pageflow_scrolled.public.sound_disclaimer.help_text')
    }
  }));
}

frontend.contentElementTypes.register('soundDisclaimer', {
  component: SoundDisclaimer
});

var css$6 = ".TextBlock-module_text__21Hk4 {\n  padding: 0;\n  margin: 1em 0;\n  text-shadow: none;\n}\n\n.TextBlock-module_dummy__2KicI {\n  opacity: 0.7;\n}\n\n.TextBlock-module_text__21Hk4 a {\n  color: #fff;\n  word-wrap: break-word;\n}\n\n.TextBlock-module_text__21Hk4 ol,\n.TextBlock-module_text__21Hk4 ul {\n  padding-left: 20px;\n}\n";
var styles$6 = {"text":"TextBlock-module_text__21Hk4","dummy":"TextBlock-module_dummy__2KicI"};
styleInject(css$6);

function TextBlock(_ref) {
  var configuration = _ref.configuration;
  return React.createElement(Text, {
    scaleCategory: "body"
  }, React.createElement("div", {
    className: classNames(styles$6.text, _defineProperty({}, styles$6.dummy, configuration.dummy)),
    dangerouslySetInnerHTML: {
      __html: configuration.children
    }
  }));
}

frontend.contentElementTypes.register('textBlock', {
  component: TextBlock
});

var css$7 = ".VideoEmbed-module_VideoEmbed__3BUjc {\n  margin-bottom: 15px;\n}\n\n.VideoEmbed-module_embedWrapper__1kG8A {\n  overflow:hidden;\n  position:relative;\n  background: black;\n  padding-top: 56.25%;\n}\n\n.VideoEmbed-module_wide__1IwOr {\n  padding-top: 56.25%;\n}\n\n.VideoEmbed-module_narrow__2jLxH {\n  padding-top: 75%;\n}\n\n.VideoEmbed-module_square__2ljo8 {\n  padding-top: 100%;\n}\n\n.VideoEmbed-module_portrait__1ttPj {\n  padding-top: 177.77%;\n}\n\n.VideoEmbed-module_embedPlayer__54NKG {\n  position: absolute;\n  top: 0;\n  left: 0;\n  bottom: 0;\n  right: 0;\n}\n";
var styles$7 = {"VideoEmbed":"VideoEmbed-module_VideoEmbed__3BUjc","embedWrapper":"VideoEmbed-module_embedWrapper__1kG8A","wide":"VideoEmbed-module_wide__1IwOr","narrow":"VideoEmbed-module_narrow__2jLxH","square":"VideoEmbed-module_square__2ljo8","portrait":"VideoEmbed-module_portrait__1ttPj","embedPlayer":"VideoEmbed-module_embedPlayer__54NKG"};
styleInject(css$7);

function VideoEmbed(_ref) {
  var configuration = _ref.configuration;

  // base64-encoded configuration
  // => make component re-render on configuration changes
  function keyFromConfiguration(config) {
    return btoa(JSON.stringify(config));
  }

  return React.createElement("div", {
    className: styles$7.VideoEmbed
  }, React.createElement("div", {
    className: classNames(styles$7.embedWrapper, styles$7[configuration.aspectRatio])
  }, React.createElement(ReactPlayer, {
    className: styles$7.embedPlayer,
    key: keyFromConfiguration(configuration),
    url: configuration.videoSource,
    playing: true,
    light: true,
    width: "100%",
    height: "100%",
    controls: !configuration.hideControls,
    config: {
      youtube: {
        playerVars: {
          showinfo: !configuration.hideInfo
        }
      },
      vimeo: {
        playerOptions: {
          byline: !configuration.hideInfo
        }
      }
    }
  })), React.createElement(InlineCaption, {
    text: configuration.caption
  }));
}

frontend.contentElementTypes.register('videoEmbed', {
  component: VideoEmbed
});

var css$8 = "\n.ExternalLink-module_hidden__3jer0 {\n  display: none;\n}\n\n.ExternalLink-module_link_item__Blypv {\n  width: 45%;\n  max-width: 45%;\n  vertical-align: top;\n  margin: 2% auto;\n  background-color: #fff; \n  color: rgba(20,20,20,0.8);\n  text-decoration: none;\n  transition: 0.3s;\n}\n\n\n.ExternalLink-module_link_item__Blypv.ExternalLink-module_invert__1zrgN {\n  background-color: rgba(20,20,20,0.8);;\n  color: #fff;\n}\n\n.ExternalLink-module_link_item__Blypv.ExternalLink-module_layout_center__3NRpQ {\n  width: 29%;\n  max-width: 29%;\n  \n}\n\n.ExternalLink-module_link_item__Blypv:hover {\n  background-color: #141414;\n  color: #fff;\n  -webkit-transform: scale(1.05);\n  -moz-transform: scale(1.05);\n  -ms-transform: scale(1.05);\n  -o-transform: scale(1.05);\n  transform: scale(1.05);\n}\n\n.ExternalLink-module_link_item__Blypv:hover .ExternalLink-module_link_title__FZJ-0 {\n  text-decoration: underline;\n}\n\n.ExternalLink-module_link_thumbnail__2_BHq {\n  width: auto;\n  background-repeat: no-repeat;\n  background-size: cover;\n  padding-top: 56.25%;\n  position: relative;\n\n}\n\n.ExternalLink-module_link_details__lRhKU {\n  margin: 20px;\n}\n\n.ExternalLink-module_link_details__lRhKU > .ExternalLink-module_link_title__FZJ-0 {\n  font-size: 1.2em;\n  font-weight: bold;\n  margin-bottom: 20px;\n}\n\n.ExternalLink-module_link_details__lRhKU > .ExternalLink-module_link_desc__3fSe1 {\n\n}\n\n.ExternalLink-module_link_details__lRhKU > p {\n  width: 100%;\n  white-space: normal;\n  line-height: 1.3em;\n}\n\n.ExternalLink-module_tooltip__18MpC {\n  position: absolute;\n  left: 50%;\n  top: 80px;\n  width: 180px;\n  padding: 5px;\n  margin-left: -95px;\n  background-color: #444;\n  color: #fff;\n  border: solid 1px #fff;\n  opacity: 0.9;\n  font-size: 13px;\n  text-align: center;\n  white-space: normal;\n}\n\n.ExternalLink-module_tooltip__18MpC > span {\n  display: block;\n  color: #fff;\n  text-decoration: underline;\n}";
var styles$8 = {"hidden":"ExternalLink-module_hidden__3jer0","link_item":"ExternalLink-module_link_item__Blypv","invert":"ExternalLink-module_invert__1zrgN","layout_center":"ExternalLink-module_layout_center__3NRpQ","link_title":"ExternalLink-module_link_title__FZJ-0","link_thumbnail":"ExternalLink-module_link_thumbnail__2_BHq","link_details":"ExternalLink-module_link_details__lRhKU","link_desc":"ExternalLink-module_link_desc__3fSe1","tooltip":"ExternalLink-module_tooltip__18MpC"};
styleInject(css$8);

function ExternalLink(props) {
  var _classNames;

  var _useState = useState(true),
      _useState2 = _slicedToArray(_useState, 2),
      hideTooltip = _useState2[0],
      setHideTooltip = _useState2[1];

  var _props$sectionProps = props.sectionProps,
      layout = _props$sectionProps.layout,
      invert = _props$sectionProps.invert;

  var _useI18n = useI18n(),
      t = _useI18n.t;

  var isInEditor = function isInEditor() {
    return window.frameElement != undefined && window.location.pathname.includes('/editor/entries/');
  };

  var onTooltipClick = function onTooltipClick() {
    window.open(props.url, '_blank');
    setHideTooltip(true);
  };

  var onClick = function onClick(event) {
    if (props.open_in_new_tab == false && isInEditor()) {
      setHideTooltip(false);
      event.preventDefault();
    }
  };

  var onMouseLeave = function onMouseLeave() {
    setHideTooltip(true);
  };

  return React.createElement("a", {
    className: classNames(styles$8.link_item, (_classNames = {}, _defineProperty(_classNames, styles$8.invert, invert), _defineProperty(_classNames, styles$8.layout_center, layout == 'center'), _classNames)),
    href: props.url || '',
    onClick: onClick,
    onMouseLeave: onMouseLeave,
    target: props.open_in_new_tab == '1' ? '_blank' : '_self'
  }, React.createElement("div", {
    className: styles$8.link_thumbnail
  }, React.createElement(Image, {
    id: props.thumbnail
  })), React.createElement("div", {
    className: styles$8.link_details
  }, React.createElement("p", {
    className: styles$8.link_title
  }, props.title), React.createElement("p", {
    className: styles$8.link_desc,
    dangerouslySetInnerHTML: {
      __html: props.description
    }
  })), React.createElement("div", {
    className: classNames(_defineProperty({}, styles$8.hidden, hideTooltip), styles$8.tooltip),
    onClick: onTooltipClick
  }, t('pageflow_scrolled.public.external_link.open_in_new_tab_message'), React.createElement("span", {
    target: "_blank"
  }, t('pageflow_scrolled.public.external_link.open_in_new_tab'))));
}

var css$9 = ".ExternalLinkList-module_ext_links_container__16IIo{\n  display: flex;\n  flex-wrap: wrap;\n  border-collapse: separate;\n  border-spacing: 10px;\n  min-height: 240px;\n  width: auto;\n  height: auto;\n  pointer-events: all;\n  position: relative;\n  -webkit-transition: opacity 0.5s;\n  -moz-transition: opacity 0.5s;\n  transition: opacity 0.5s;\n  transition-timing-function: cubic-bezier(0.1, 0.57, 0.1, 1);\n  transition-duration: 0ms;\n}\n";
var styles$9 = {"ext_links_container":"ExternalLinkList-module_ext_links_container__16IIo"};
styleInject(css$9);

function ExternalLinkList(props) {
  var linkList = props.configuration.links || [];
  return React.createElement("div", {
    className: styles$9.ext_links_container
  }, linkList.map(function (link, index) {
    return React.createElement(ExternalLink, Object.assign({}, link, {
      key: link.id,
      sectionProps: props.sectionProps
    }));
  }));
}

frontend.contentElementTypes.register('externalLinkList', {
  component: ExternalLinkList
});

var css$a = ".DataWrapperChart-module_container__2eZ15 {\n  min-height: 200px;\n  height: 400px;\n}\n\n.DataWrapperChart-module_container__2eZ15 > iframe {\n  width: 100%;\n  height: 100%;\n  position: relative;\n  top: 0;\n}";
var styles$a = {"container":"DataWrapperChart-module_container__2eZ15"};
styleInject(css$a);

function DataWrapperChart(_ref) {
  var configuration = _ref.configuration;
  var ref = useRef();
  var onScreen = useOnScreen(ref, '25% 0px 25% 0px'); // remove url protocol, so that it is selected by the browser itself

  var srcURL = '';

  if (configuration.url && onScreen) {
    srcURL = configuration.url.replace(/http(s|):/, '');
  }

  return React.createElement("div", {
    ref: ref,
    className: styles$a.container
  }, React.createElement("iframe", {
    src: srcURL,
    scrolling: "auto",
    frameBorder: "0",
    align: "aus",
    allowFullScreen: true,
    mozallowfullscreen: "true",
    webkitallowfullscreen: "true"
  }));
}

frontend.contentElementTypes.register('dataWrapperChart', {
  component: DataWrapperChart
});
