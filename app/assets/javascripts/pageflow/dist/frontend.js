(function (jqueryUi, $, Backbone, _, IScroll) {
  'use strict';

  $ = $ && $.hasOwnProperty('default') ? $['default'] : $;
  Backbone = Backbone && Backbone.hasOwnProperty('default') ? Backbone['default'] : Backbone;
  _ = _ && _.hasOwnProperty('default') ? _['default'] : _;
  IScroll = IScroll && IScroll.hasOwnProperty('default') ? IScroll['default'] : IScroll;

  $.fn.updateTitle = function () {
    if (!this.data('title')) {
      this.data('title', this.attr('title'));
    }

    if (this.hasClass('active')) {
      this.attr('title', this.data('activeTitle'));
    } else {
      this.attr('title', this.data('title'));
    }
  };

  $.fn.loadLazyImages = function () {
    this.find('img[data-src]').each(function () {
      var img = $(this);

      if (!img.attr('src')) {
        img.attr('src', img.data('src'));
      }
    });
  };

  window.pageflow = {
    log: function log(text, options) {
      if (window.console && (pageflow.debugMode() || options && options.force)) {
        window.console.log(text);
      }
    },
    debugMode: function debugMode() {
      return window.location.href.indexOf('debug=true') >= 0;
    }
  };

  // https://github.com/jashkenas/backbone/issues/2601

  function BaseObject(options) {
    this.initialize.apply(this, arguments);
  }

  _.extend(BaseObject.prototype, Backbone.Events, {
    initialize: function initialize(options) {}
  }); // The self-propagating extend function that Backbone classes use.


  BaseObject.extend = Backbone.Model.extend;

  pageflow.Object = BaseObject;

  /**
   * Mute feature settings for background media (ATMO and background videos)
   *
   * @since 13.0
   */
  pageflow.backgroundMedia = {
    muted: false,
    unmute: function unmute() {
      if (this.muted) {
        this.muted = false;
        pageflow.events.trigger('background_media:unmute');
      }
    },
    mute: function mute() {
      if (!this.muted) {
        this.muted = true;
        pageflow.events.trigger('background_media:mute');
      }
    }
  };

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

  pageflow.EntryData = EntryData;

  pageflow.SeedEntryData = pageflow.EntryData.extend({
    initialize: function initialize(options) {
      this.theme = options.theme;
      this.files = _(_.keys(options.files || {})).reduce(function (memo, collectionName) {
        memo[collectionName] = _(options.files[collectionName]).reduce(function (result, file) {
          result[file.perma_id] = file;
          return result;
        }, {});
        return memo;
      }, {});
      this.storylineConfigurations = _(options.storylines).reduce(function (memo, storyline) {
        memo[storyline.id] = storyline.configuration;
        return memo;
      }, {});
      this.storylineIdsByChapterIds = _(options.chapters).reduce(function (memo, chapter) {
        memo[chapter.id] = chapter.storyline_id;
        return memo;
      }, {});
      this.chapterConfigurations = _.reduce(options.chapters, function (memo, chapter) {
        memo[chapter.id] = chapter.configuration;
        return memo;
      }, {});
      this.chapterPagePermaIds = _(options.pages).reduce(function (memo, page) {
        memo[page.chapter_id] = memo[page.chapter_id] || [];
        memo[page.chapter_id].push(page.perma_id);
        return memo;
      }, {});
      this.chapterIdsByPagePermaIds = _(options.pages).reduce(function (memo, page) {
        memo[page.perma_id] = page.chapter_id;
        return memo;
      }, {});
      this.pageConfigurations = _.reduce(options.pages, function (memo, page) {
        memo[page.perma_id] = page.configuration;
        return memo;
      }, {});
      this.pagePositions = _.reduce(options.pages, function (memo, page, index) {
        memo[page.perma_id] = index;
        return memo;
      }, {});
    },
    getThemingOption: function getThemingOption(name) {
      return this.theme[name];
    },
    getFile: function getFile(collectionName, permaId) {
      return this.files[collectionName][permaId];
    },
    getChapterConfiguration: function getChapterConfiguration(id) {
      return this.chapterConfigurations[id] || {};
    },
    getChapterPagePermaIds: function getChapterPagePermaIds(id) {
      return this.chapterPagePermaIds[id];
    },
    getPageConfiguration: function getPageConfiguration(permaId) {
      return this.pageConfigurations[permaId] || {};
    },
    getPagePosition: function getPagePosition(permaId) {
      return this.pagePositions[permaId];
    },
    getChapterIdByPagePermaId: function getChapterIdByPagePermaId(permaId) {
      return this.chapterIdsByPagePermaIds[permaId];
    },
    getStorylineConfiguration: function getStorylineConfiguration(id) {
      return this.storylineConfigurations[id] || {};
    },
    getStorylineIdByChapterId: function getStorylineIdByChapterId(id) {
      return this.storylineIdsByChapterIds[id];
    }
  });

  //  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
  pageflow.cookies = {
    getItem: function getItem(sKey) {
      if (!sKey) {
        return null;
      } // eslint-disable-next-line no-useless-escape


      return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function setItem(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
      // eslint-disable-next-line no-useless-escape
      if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
        return false;
      }

      var sExpires = "";

      if (vEnd) {
        switch (vEnd.constructor) {
          case Number:
            sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
            break;

          case String:
            sExpires = "; expires=" + vEnd;
            break;

          case Date:
            sExpires = "; expires=" + vEnd.toUTCString();
            break;
        }
      }

      document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
      return true;
    },
    removeItem: function removeItem(sKey, sPath, sDomain) {
      if (!this.hasItem(sKey)) {
        return false;
      }

      document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
      return true;
    },
    hasItem: function hasItem(sKey) {
      if (!sKey) {
        return false;
      } // eslint-disable-next-line no-useless-escape


      return new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=").test(document.cookie);
    },
    keys: function keys() {
      // eslint-disable-next-line no-useless-escape
      var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);

      for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {
        aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);
      }

      return aKeys;
    }
  };

  pageflow.cookieNotice = {
    request: function request() {
      pageflow.ready.then(function () {
        pageflow.events.trigger('cookie_notice:request');
      });
    }
  };

  pageflow.events = _.extend({}, Backbone.Events);

  pageflow.commonPageCssClasses = {
    updateCommonPageCssClasses: function updateCommonPageCssClasses(pageElement, configuration) {
      pageElement.toggleClass('invert', configuration.get('invert'));
      pageElement.toggleClass('hide_title', configuration.get('hide_title'));
      toggleModeClass(pageflow.Page.textPositions, 'text_position');
      toggleModeClass(pageflow.Page.delayedTextFadeIn, 'delayed_text_fade_in');
      toggleModeClass(pageflow.Page.scrollIndicatorModes, 'scroll_indicator_mode');
      toggleModeClass(pageflow.Page.scrollIndicatorOrientations, 'scroll_indicator_orientation');

      function toggleModeClass(modes, name) {
        var value = configuration.get(name);

        _.each(modes, function (mode) {
          pageElement.removeClass(name + '_' + mode);
        });

        if (value) {
          pageElement.addClass(name + '_' + value);
        }
      }

      pageElement.toggleClass('no_text_content', !hasContent());

      function hasContent() {
        var hasTitle = _(['title', 'subtitle', 'tagline']).some(function (attribute) {
          return !!$.trim(configuration.get(attribute));
        });

        var text = $('<div />').html(configuration.get('text')).text();
        var hasText = !!$.trim(text);
        return hasTitle && !configuration.get('hide_title') || hasText;
      }
    }
  };

  pageflow.defaultPageContent = {
    updateDefaultPageContent: function updateDefaultPageContent(pageElement, configuration) {
      pageElement.find('.page_header-tagline').text(configuration.get('tagline') || '');
      pageElement.find('.page_header-title').text(configuration.get('title') || '');
      pageElement.find('.page_header-subtitle').text(configuration.get('subtitle') || '');
      pageElement.find('.page_text .paragraph').html(configuration.get('text') || '');
    }
  };

  pageflow.infoBox = {
    updateInfoBox: function updateInfoBox(pageElement, configuration) {
      var infoBox = pageElement.find('.add_info_box');

      if (!infoBox.find('h3').length) {
        infoBox.prepend($('<h3 />'));
      }

      infoBox.find('h3').html(configuration.get('additional_title') || '');
      infoBox.find('p').html(configuration.get('additional_description') || '');
      infoBox.toggleClass('empty', !configuration.get('additional_description') && !configuration.get('additional_title'));
      infoBox.toggleClass('title_empty', !configuration.get('additional_title'));
      infoBox.toggleClass('description_empty', !configuration.get('additional_description'));
    }
  };

  pageflow.videoHelpers = {
    updateVideoPoster: function updateVideoPoster(pageElement, imageUrl) {
      pageElement.find('.vjs-poster').css('background-image', 'url(' + imageUrl + ')');
    },
    updateBackgroundVideoPosters: function updateBackgroundVideoPosters(pageElement, imageUrl, x, y) {
      pageElement.find('.vjs-poster, .background-image').css({
        'background-image': 'url(' + imageUrl + ');',
        'background-position': x + '% ' + y + '%;'
      });
    }
  };

  pageflow.volumeFade = {
    fadeSound: function fadeSound(media, endVolume, fadeTime) {
      var fadeResolution = 10;
      var startVolume = media.volume();
      var steps = fadeTime / fadeResolution;
      var leap = (endVolume - startVolume) / steps;
      clearInterval(this.fadeInterval);

      if (endVolume != startVolume) {
        var fade = this.fadeInterval = setInterval(_.bind(function () {
          media.volume(media.volume() + leap);

          if (media.volume() >= endVolume && endVolume >= startVolume || media.volume() <= endVolume && endVolume <= startVolume) {
            clearInterval(fade);
          }
        }, this), fadeResolution);
      }
    }
  };

  pageflow.pageType = function () {
    var base = {
      enhance: function enhance(pageElement, configuarion) {},
      prepare: function prepare(pageElement, configuarion) {},
      unprepare: function unprepare(pageElement, configuarion) {},
      preload: function preload(pageElement, configuarion) {},
      resize: function resize(pageElement, configuarion) {},
      activating: function activating(pageElement, configuarion) {},
      activated: function activated(pageElement, configuarion) {},
      deactivating: function deactivating(pageElement, configuarion) {},
      deactivated: function deactivated(pageElement, configuarion) {},
      update: function update(pageElement, configuarion) {},
      cleanup: function cleanup(pageElement, configuarion) {},
      embeddedEditorViews: function embeddedEditorViews() {},
      linkedPages: function linkedPages() {
        return [];
      },
      isPageChangeAllowed: function isPageChangeAllowed(pageElement, configuarion, options) {
        return true;
      },
      prepareNextPageTimeout: 200
    };
    return {
      repository: [],
      register: function register(name, pageType) {
        var constructor = function constructor() {};

        _.extend(constructor.prototype, base, Backbone.Events, pageType);

        this.repository[name] = constructor;
      },
      get: function get(name) {
        if (!this.repository[name]) {
          throw 'Unknown page type "' + name + '"';
        }

        return new this.repository[name]();
      }
    };
  }();

  (function () {
    pageflow.preload = {
      image: function image(url) {
        return $.Deferred(function (deferred) {
          var image = new Image();
          image.onload = deferred.resolve;
          image.onerror = deferred.resolve;
          image.src = url;
        }).promise();
      },
      backgroundImage: function backgroundImage(element) {
        var that = this;
        var promises = [];
        $(element).addClass('load_image');
        $(element).each(function () {
          var propertyValue = window.getComputedStyle(this).getPropertyValue('background-image');

          if (propertyValue.match(/^url/)) {
            promises.push(that.image(propertyValue.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '')));
          }
        });
        return $.when.apply(null, promises);
      }
    };
  })();

  pageflow.bandwidth = function () {
    var maxLoadTime = 5000;
    pageflow.bandwidth.promise = pageflow.bandwidth.promise || new $.Deferred(function (deferred) {
      var smallFileUrl = pageflow.assetUrls.smallBandwidthProbe + "?" + new Date().getTime(),
          largeFileUrl = pageflow.assetUrls.largeBandwidthProbe + "?" + new Date().getTime(),
          smallFileSize = 165,
          largeFileSize = 1081010;
      $.when(timeFile(smallFileUrl), timeFile(largeFileUrl)).done(function (timeToLoadSmallFile, timeToLoadLargeFile) {
        var timeDelta = (timeToLoadLargeFile - timeToLoadSmallFile) / 1000;
        var bitsDelta = (largeFileSize - smallFileSize) * 8;
        timeDelta = Math.max(timeDelta, 0.01);
        deferred.resolve({
          durationInSeconds: timeDelta,
          speedInBps: (bitsDelta / timeDelta).toFixed(2)
        });
      }).fail(function () {
        deferred.resolve({
          durationInSeconds: Infinity,
          speedInBps: 0
        });
      });
    }).promise();
    return pageflow.bandwidth.promise;

    function timeFile(url) {
      var startTime = new Date().getTime();
      return withTimeout(loadFile(url), maxLoadTime).pipe(function () {
        return new Date().getTime() - startTime;
      });
    }

    function loadFile(url, options) {
      return new $.Deferred(function (deferred) {
        var image = new Image();
        image.onload = deferred.resolve;
        image.onerror = deferred.reject;
        image.src = url;
      }).promise();
    }

    function withTimeout(promise, milliseconds) {
      return new $.Deferred(function (deferred) {
        var timeout = setTimeout(function () {
          deferred.reject();
        }, milliseconds);
        promise.always(function () {
          clearTimeout(timeout);
        }).then(deferred.resolve, deferred.reject);
      }).promise();
    }
  };

  /**
   * Browser feature detection.
   *
   * @since 0.9
   */

  pageflow.browser = function () {
    var tests = {},
        results = {},
        _ready = new $.Deferred();

    return {
      off: {},
      on: {},
      unset: {},

      /**
       * Add a feature test.
       *
       * @param name [String] Name of the feature. Can contain whitespace.
       * @param test [Function] A function that either returns `true` or
       *   `false` or a promise that resolves to `true` or `false`.
       * @memberof pageflow.browser
       */
      feature: function feature(name, test) {
        var s = name.replace(/ /g, '_');

        this.off[s] = function () {
          window.localStorage['override ' + name] = 'off';
          pageflow.log('Feature off: ' + name, {
            force: true
          });
        };

        this.on[s] = function () {
          window.localStorage['override ' + name] = 'on';
          pageflow.log('Feature on: ' + name, {
            force: true
          });
        };

        this.unset[s] = function () {
          window.localStorage.removeItem('override ' + name);
          pageflow.log('Feature unset: ' + name, {
            force: true
          });
        };

        tests[name] = test;
      },

      /**
       * Check whether the browser has a specific feature. This method
       * may only be called after the `#ready` promise is resolved.
       *
       * @param name [String] Name of the feature.
       * @return [Boolean]
       * @memberof pageflow.browser
       */
      has: function has(name) {
        if (this.ready().state() != 'resolved') {
          throw 'Feature detection has not finished yet.';
        }

        if (results[name] === undefined) {
          throw 'Unknown feature "' + name + '".';
        }

        return results[name];
      },

      /**
       * A promise that is resolved once feature detection has finished.
       *
       * @return [Promise]
       * @memberof pageflow.browser
       */
      ready: function ready() {
        return _ready.promise();
      },

      /** @api private */
      detectFeatures: function detectFeatures() {
        var promises = {};

        var asyncHas = function asyncHas(name) {
          var runTest = function runTest() {
            var value,
                underscoredName = name.replace(/ /g, '_');

            if (pageflow.debugMode() && location.href.indexOf('&has=' + underscoredName) >= 0) {
              value = location.href.indexOf('&has=' + underscoredName + '_on') >= 0;
              pageflow.log('FEATURE OVERRIDDEN ' + name + ': ' + value, {
                force: true
              });
              return value;
            } else if ((pageflow.debugMode() || pageflow.ALLOW_FEATURE_OVERRIDES) && window.localStorage && typeof window.localStorage['override ' + name] !== 'undefined') {
              value = window.localStorage['override ' + name] === 'on';
              pageflow.log('FEATURE OVERRIDDEN ' + name + ': ' + value, {
                force: true
              });
              return value;
            } else {
              return tests[name](asyncHas);
            }
          };

          promises[name] = promises[name] || $.when(runTest());
          return promises[name];
        };

        asyncHas.not = function (name) {
          return asyncHas(name).pipe(function (result) {
            return !result;
          });
        };

        asyncHas.all = function ()
        /* arguments */
        {
          return $.when.apply(null, arguments).pipe(function ()
          /* arguments */
          {
            return _.all(arguments);
          });
        };

        $.when.apply(null, _.map(_.keys(tests), function (name) {
          return asyncHas(name).then(function (result) {
            var cssClassName = name.replace(/ /g, '_');
            $('body').toggleClass('has_' + cssClassName, !!result);
            $('body').toggleClass('has_no_' + cssClassName, !result);
            results[name] = !!result;
          });
        })).then(_ready.resolve);
        return this.ready();
      }
    };
  }();

  /**
   * Detect browser via user agent. Use only if feature detection is not
   * an option.
   */

  pageflow.browser.Agent = function (userAgent) {
    return {
      matchesSilk: function matchesSilk() {
        return matches(/\bSilk\b/);
      },
      matchesDesktopSafari: function matchesDesktopSafari() {
        return this.matchesSafari() && !this.matchesMobilePlatform();
      },
      matchesDesktopSafari9: function matchesDesktopSafari9() {
        return this.matchesSafari9() && !this.matchesMobilePlatform();
      },
      matchesDesktopSafari10: function matchesDesktopSafari10() {
        return this.matchesSafari10() && !this.matchesMobilePlatform();
      },
      matchesSafari9: function matchesSafari9() {
        return this.matchesSafari() && matches(/Version\/9/i);
      },
      matchesSafari10: function matchesSafari10() {
        return this.matchesSafari() && matches(/Version\/10/i);
      },
      matchesSafari11: function matchesSafari11() {
        return this.matchesSafari() && matches(/Version\/11/i);
      },
      matchesSafari11AndAbove: function matchesSafari11AndAbove() {
        return this.matchesSafari() && captureGroupGreaterOrEqual(/Version\/(\d+)/i, 11);
      },
      matchesSafari: function matchesSafari() {
        // - Chrome also reports to be a Safari
        // - Safari does not report to be a Chrome
        // - Edge also reports to be a Safari, but also reports to be Chrome
        return matches(/Safari\//i) && !matches(/Chrome/i);
      },

      /**
       * Returns true on iOS Safari.
       * @return {boolean}
       */
      matchesMobileSafari: function matchesMobileSafari() {
        var matchers = [/iPod/i, /iPad/i, /iPhone/i];
        return _.any(matchers, function (matcher) {
          return userAgent.match(matcher);
        });
      },

      /**
       * Returns true on iOS or Android.
       * @return {boolean}
       */
      matchesMobilePlatform: function matchesMobilePlatform() {
        var matchers = [/iPod/i, /iPad/i, /iPhone/i, /Android/i, /Silk/i, /IEMobile/i];
        return _.any(matchers, function (matcher) {
          return userAgent.match(matcher);
        });
      },

      /**
       * Returns true on Internet Explorser version 9, 10 and 11.
       * @return {boolean}
       */
      matchesIEUpTo11: function matchesIEUpTo11() {
        return userAgent.match(/Trident\//);
      },

      /**
       * Returns true in InApp browser of Facebook app.
       * @return {boolean}
       */
      matchesFacebookInAppBrowser: function matchesFacebookInAppBrowser() {
        return userAgent.match(/FBAN/) && userAgent.match(/FBAV/);
      }
    };

    function matches(exp) {
      return !!userAgent.match(exp);
    }

    function captureGroupGreaterOrEqual(exp, version) {
      var match = userAgent.match(exp);
      return match && match[1] && parseInt(match[1], 10) >= version;
    }
  };

  pageflow.browser.agent = new pageflow.browser.Agent(navigator.userAgent);

  pageflow.browser.feature('autoplay support', function (has) {
    return !pageflow.browser.agent.matchesSafari11AndAbove() && !pageflow.browser.agent.matchesMobilePlatform();
  });

  // See https://developer.mozilla.org/de/docs/Web/CSS/CSS_Animations/Detecting_CSS_animation_support
  pageflow.browser.feature('css animations', function () {
    var prefixes = ['Webkit', 'Moz', 'O', 'ms', 'Khtml'],
        elm = document.createElement('div');

    if (elm.style.animationName !== undefined) {
      return true;
    }

    for (var i = 0; i < prefixes.length; i++) {
      if (elm.style[prefixes[i] + 'AnimationName'] !== undefined) {
        return true;
      }
    }

    return false;
  });

  // Facebook app displays a toolbar at the bottom of the screen on iOS
  // phone which hides parts of the browser viewport. Normally this is
  // hidden once the user scrolls, but since there is no native
  // scrolling in Pageflow, the bar stays and hides page elements like
  // the slim player controls.
  pageflow.browser.feature('facebook toolbar', function (has) {
    return has.all(has('iphone platform'), pageflow.browser.agent.matchesFacebookInAppBrowser());
  });

  pageflow.browser.feature('high bandwidth', function () {
    return pageflow.bandwidth().pipe(function (result) {
      var isHigh = result.speedInBps > 8000 * 1024;

      if (window.console) {
        window.console.log('Detected bandwidth ' + result.speedInBps / 8 / 1024 + 'KB/s. High: ' + (isHigh ? 'Yes' : 'No'));
      }

      return isHigh;
    });
  });

  pageflow.browser.feature('ie', function () {
    if (navigator.appName == 'Microsoft Internet Explorer') {
      return true;
    } else {
      return false;
    }
  });

  pageflow.browser.feature('ios platform', function () {
    return pageflow.browser.agent.matchesMobileSafari();
  });
  pageflow.browser.feature('iphone platform', function (has) {
    return has.all(has('ios platform'), has('phone platform'));
  });

  pageflow.browser.feature('mobile platform', function () {
    return pageflow.browser.agent.matchesMobilePlatform();
  });

  if (navigator.userAgent.match(/iPad;.*CPU.*OS 7_\d/i) && !window.navigator.standalone) {
    $('html').addClass('ipad ios7');
  }

  pageflow.browser.feature('phone platform', function () {
    var matchers = [/iPod/i, /iPad/i, /iPhone/i, /Android/i, /IEMobile/i];
    return _.any(matchers, function (matcher) {
      return navigator.userAgent.match(matcher) && $(window).width() < 700;
    });
  });

  pageflow.browser.feature('pushstate support', function () {
    return window.history && 'pushState' in window.history;
  });

  pageflow.browser.feature('request animation frame support', function () {
    return 'requestAnimationFrame' in window || 'web';
  });

  pageflow.browser.feature('touch support', function () {
    return 'ontouchstart' in window ||
    /* Firefox on android */
    window.DocumentTouch && document instanceof window.DocumentTouch ||
    /* > 0 on IE touch devices */
    navigator.maxTouchPoints;
  });

  pageflow.browser.feature('rewrite video sources support', function () {
    // set from conditionally included script file
    return !pageflow.ie9;
  });
  pageflow.browser.feature('stop buffering support', function (has) {
    return has.not('mobile platform');
  });
  pageflow.browser.feature('buffer underrun waiting support', function (has) {
    return has.not('mobile platform');
  });
  pageflow.browser.feature('prebuffering support', function (has) {
    return has.not('mobile platform');
  });
  pageflow.browser.feature('mp4 support only', function (has) {
    // - Silk does not play videos with hls source
    // - Desktop Safari 9.1 does not loop hls videos
    // - Desktop Safari 10 does not loop hls videos on El
    //   Capitan. Appears to be fixed on Sierra
    return pageflow.browser.agent.matchesSilk() || pageflow.browser.agent.matchesDesktopSafari9() || pageflow.browser.agent.matchesDesktopSafari10();
  });
  pageflow.browser.feature('mse and native hls support', function (has) {
    return pageflow.browser.agent.matchesSafari() && !pageflow.browser.agent.matchesMobilePlatform();
  });
  pageflow.browser.feature('native video player', function (has) {
    return has('iphone platform');
  });

  pageflow.browser.feature('volume control support', function (has) {
    return has.not('ios platform');
  });
  pageflow.browser.feature('audio context volume fading support', function () {
    return !pageflow.browser.agent.matchesDesktopSafari();
  });

  /**
   * Let plugins register functions which extend the editor or
   * slideshow with certain functionality when a named feature is
   * enabled.
   *
   * @alias pageflow.features
   * @since 0.9
   */

  pageflow.Features = pageflow.Object.extend(
  /** @lends pageflow.features */
  {
    /** @api private */
    initialize: function initialize() {
      this.registry = {};
      this.enabledFeatureNames = [];
    },

    /**
     * `pageflow.features` has been renamed to `pageflow.browser`.
     * @deprecated
     */
    has: function has()
    /* arguments */
    {
      return pageflow.browser.has.apply(pageflow.browser, arguments);
    },

    /**
     * Register a function to configure a feature when it is active.
     *
     * @param {String} scope - Name of the scope the passed function
     *   shall be called in.
     * @param name [String] Name of the feature
     * @param fn [Function] Function to call when the given feature
     *   is activate.
     */
    register: function register(scope, name, fn) {
      this.registry[scope] = this.registry[scope] || {};
      this.registry[scope][name] = this.registry[scope][name] || [];
      this.registry[scope][name].push(fn);
    },

    /**
     * Check if a feature as been enabled.
     *
     * @param name [String]
     * @return [Boolean]
     */
    isEnabled: function isEnabled(name) {
      return _(this.enabledFeatureNames).contains(name);
    },

    /** @api private */
    enable: function enable(scope, names) {
      var fns = this.registry[scope] || {};
      this.enabledFeatureNames = this.enabledFeatureNames.concat(names);

      _(names).each(function (name) {
        _(fns[name] || []).each(function (fn) {
          fn();
        });
      });
    }
  });
  pageflow.features = new pageflow.Features();

  /**
   * Playing audio files.
   * @alias pageflow.audio
   * @member
   */

  pageflow.Audio = function (options) {
    this.getSources = options.getSources || function (audioFileId) {
      return options.audioFiles[audioFileId] || '';
    };
    /**
     * Creates a player for the given audio file.
     *
     * @param {string|number} audioFileId
     *   Id of the audio file to play. The id can be of the form
     *   `"5.suffix"` to distinguish multiple occurences of the same
     *   audio file for example inside a pageflow.Audio.PlayerPool;
     *
     * @param {Object} [options]
     *   Options to pass on player creation
     *
     * @static
     */


    this.createPlayer = function (audioFileId, options) {
      var sources = this.getSources(removeSuffix(audioFileId));

      if (sources) {
        return new pageflow.AudioPlayer(sources, _.extend({
          volumeFading: true
        }, options || {}));
      } else {
        return new pageflow.AudioPlayer.Null();
      }
    };
    /**
     * Create a `MultiPlayer` to play and fade between multiple audio
     * files.
     *
     * @param {Object} [options]
     *   All options supported by pageflow.AudioPlayer can be passed.
     *
     * @param {number} [options.fadeDuration]
     *   Time in milliseconds to fade audios in and out.
     *
     * @param {boolean} [options.playFromBeginning=false]
     *   Always restart audio files from the beginning.
     *
     * @param {boolean} [options.rewindOnChange=false]
     *   Play from beginning when changing audio files.
     *
     * @return {pageflow.Audio.MultiPlayer}
     */


    this.createMultiPlayer = function (options) {
      return new pageflow.Audio.MultiPlayer(new pageflow.Audio.PlayerPool(this, options), options);
    };

    function removeSuffix(id) {
      if (!id) {
        return id;
      }

      return parseInt(id.toString().split('.')[0], 10);
    }
  };

  pageflow.Audio.setup = function (options) {
    pageflow.audio = new pageflow.Audio(options);
  };

  pageflow.Audio.PlayerPool = function (audio, options) {
    this.players = {};

    this.get = function (audioFileId) {
      this.players[audioFileId] = this.players[audioFileId] || audio.createPlayer(audioFileId, options);
      return this.players[audioFileId];
    };

    this.dispose = function () {
      this.players = {};
    };
  };

  /**
   * Play and fade between multiple audio files.
   *
   * @class
   */

  pageflow.Audio.MultiPlayer = function (pool, options) {
    if (options.crossFade && options.playFromBeginning) {
      throw 'pageflow.Audio.MultiPlayer: The options crossFade and playFromBeginning can not be used together at the moment.';
    }

    var current = new pageflow.AudioPlayer.Null();
    var currentId = null;
    var that = this;
    /**
     * Continue playback.
     */

    this.resume = function () {
      return current.play();
    };
    /**
     * Continue playback with fade in.
     */


    this.resumeAndFadeIn = function () {
      return current.playAndFadeIn(options.fadeDuration);
    };

    this.seek = function (position) {
      return current.seek(position);
    };

    this.pause = function () {
      return current.pause();
    };

    this.paused = function () {
      return current.paused();
    };

    this.fadeOutAndPause = function () {
      return current.fadeOutAndPause(options.fadeDuration);
    };

    this.position = function () {
      return current.position;
    };

    this.duration = function () {
      return current.duration;
    };

    this.fadeTo = function (id) {
      return changeCurrent(id, function (player) {
        return player.playAndFadeIn(options.fadeDuration);
      });
    };

    this.play = function (id) {
      return changeCurrent(id, function (player) {
        return player.play();
      });
    };

    this.changeVolumeFactor = function (factor) {
      return current.changeVolumeFactor(factor, options.fadeDuration);
    };

    this.formatTime = function (time) {
      return current.formatTime(time);
    };

    function changeCurrent(id, callback) {
      if (!options.playFromBeginning && id === currentId && !current.paused()) {
        return;
      }

      var player = pool.get(id);
      currentId = id;
      var fadeOutPromise = current.fadeOutAndPause(options.fadeDuration);
      fadeOutPromise.then(function () {
        stopEventPropagation(current);
      });
      handleCrossFade(fadeOutPromise).then(function () {
        current = player;
        startEventPropagation(current, id);
        handlePlayFromBeginning(player).then(function () {
          callback(player);
        });
      });
    }

    function handleCrossFade(fadePomise) {
      if (options.crossFade) {
        return new $.Deferred().resolve().promise();
      } else {
        return fadePomise;
      }
    }

    function handlePlayFromBeginning(player) {
      if (options.playFromBeginning || options.rewindOnChange) {
        return player.rewind();
      } else {
        return new $.Deferred().resolve().promise();
      }
    }

    function startEventPropagation(player, id) {
      that.listenTo(player, 'play', function () {
        that.trigger('play', {
          audioFileId: id
        });
      });
      that.listenTo(player, 'pause', function () {
        that.trigger('pause', {
          audioFileId: id
        });
      });
      that.listenTo(player, 'timeupdate', function () {
        that.trigger('timeupdate', {
          audioFileId: id
        });
      });
      that.listenTo(player, 'ended', function () {
        that.trigger('ended', {
          audioFileId: id
        });
      });
      that.listenTo(player, 'playfailed', function () {
        that.trigger('playfailed', {
          audioFileId: id
        });
      });
    }

    function stopEventPropagation(player) {
      that.stopListening(player);
    }
  };

  _.extend(pageflow.Audio.MultiPlayer.prototype, Backbone.Events);

  pageflow.mediaPlayer = {
    enhance: function enhance(player, options) {
      pageflow.mediaPlayer.handleFailedPlay(player, _.extend({
        hasAutoplaySupport: pageflow.browser.has('autoplay support')
      }, options));
      pageflow.mediaPlayer.asyncPlay(player);

      if (options.hooks) {
        pageflow.mediaPlayer.hooks(player, options.hooks);
      }

      if (options.volumeFading) {
        pageflow.mediaPlayer.volumeFading(player);
        pageflow.mediaPlayer.volumeBinding(player, pageflow.settings, options);
      }

      if (options.loadWaiting) {
        pageflow.mediaPlayer.loadWaiting(player);
      }
    }
  };

  pageflow.mediaPlayer.handleFailedPlay = function (player, options) {
    var originalPlay = player.play;

    player.play = function ()
    /* arguments */
    {
      var result = originalPlay.apply(player, arguments);

      if (result && typeof result["catch"] !== 'undefined') {
        return result["catch"](function (e) {
          if (e.name === 'NotAllowedError' && options.hasAutoplaySupport) {
            if (options.fallbackToMutedAutoplay) {
              player.muted(true);
              return originalPlay.apply(player, arguments).then(function () {
                player.trigger('playmuted');
              }, function () {
                player.trigger('playfailed');
              });
            } else {
              player.trigger('playfailed');
            }
          } else {
            pageflow.log('Caught play exception for video.');
          }
        });
      }

      return result;
    };
  };

  pageflow.mediaPlayer.volumeFading = function (player) {
    if (!pageflow.browser.has('volume control support')) {
      return pageflow.mediaPlayer.volumeFading.noop(player);
    } else if (pageflow.browser.has('audio context volume fading support') && pageflow.audioContext.get() && player.getMediaElement) {
      return pageflow.mediaPlayer.volumeFading.webAudio(player, pageflow.audioContext.get());
    } else {
      return pageflow.mediaPlayer.volumeFading.interval(player);
    }
  };

  pageflow.mediaPlayer.volumeFading.interval = function (player) {
    var originalVolume = player.volume;
    var fadeVolumeDeferred;
    var fadeVolumeInterval;

    player.volume = function (value) {
      if (typeof value !== 'undefined') {
        cancelFadeVolume();
      }

      return originalVolume.apply(player, arguments);
    };

    player.fadeVolume = function (value, duration) {
      cancelFadeVolume();
      return new $.Deferred(function (deferred) {
        var resolution = 10;
        var startValue = volume();
        var steps = duration / resolution;
        var leap = (value - startValue) / steps;

        if (value === startValue) {
          deferred.resolve();
        } else {
          fadeVolumeDeferred = deferred;
          fadeVolumeInterval = setInterval(function () {
            volume(volume() + leap);

            if (volume() >= value && value >= startValue || volume() <= value && value <= startValue) {
              resolveFadeVolume();
            }
          }, resolution);
        }
      });
    };

    player.one('dispose', cancelFadeVolume);

    function volume()
    /* arguments */
    {
      return originalVolume.apply(player, arguments);
    }

    function resolveFadeVolume() {
      clearInterval(fadeVolumeInterval);
      fadeVolumeDeferred.resolve();
      fadeVolumeInterval = null;
      fadeVolumeDeferred = null;
    }

    function cancelFadeVolume() {
      if (fadeVolumeInterval) {
        clearInterval(fadeVolumeInterval);
        fadeVolumeDeferred.reject();
        fadeVolumeInterval = null;
        fadeVolumeDeferred = null;
      }
    }
  };

  pageflow.mediaPlayer.volumeFading.noop = function (player) {
    player.fadeVolume = function (value, duration) {
      return new $.Deferred().resolve().promise();
    };
  };

  pageflow.mediaPlayer.volumeFading.webAudio = function (player, audioContext) {
    var gainNode;
    var currentDeferred;
    var currentTimeout;
    var currentValue = 1;
    var lastStartTime;
    var lastDuration;
    var lastStartValue;
    var allowedMinValue = 0.000001;

    if (audioContext.state === 'suspended') {
      pageflow.events.on('background_media:unmute', function () {
        player.volume(currentValue);
      });
    }

    function tryResumeIfSuspended() {
      return new $.Deferred(function (deferred) {
        if (audioContext.state === 'suspended') {
          var maybePromise = audioContext.resume();

          if (maybePromise && maybePromise.then) {
            maybePromise.then(handleDeferred);
          } else {
            setTimeout(handleDeferred, 0);
          }
        } else {
          deferred.resolve();
        }

        function handleDeferred() {
          if (audioContext.state === 'suspended') {
            deferred.reject();
          } else {
            deferred.resolve();
          }
        }
      }).promise();
    }

    player.volume = function (value) {
      if (typeof value !== 'undefined') {
        tryResumeIfSuspended().then(function () {
          ensureGainNode();
          cancel();
          currentValue = ensureInAllowedRange(value);
          gainNode.gain.setValueAtTime(currentValue, audioContext.currentTime);
        }, function () {
          currentValue = ensureInAllowedRange(value);
        });
      }

      return Math.round(currentValue * 100) / 100;
    };

    player.fadeVolume = function (value, duration) {
      return tryResumeIfSuspended().then(function () {
        ensureGainNode();
        cancel();
        recordFadeStart(duration);
        currentValue = ensureInAllowedRange(value);
        gainNode.gain.setValueAtTime(lastStartValue, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(currentValue, audioContext.currentTime + duration / 1000);
        return new $.Deferred(function (deferred) {
          currentTimeout = setTimeout(resolve, duration);
          currentDeferred = deferred;
        }).promise();
      }, function () {
        currentValue = ensureInAllowedRange(value);
        return new $.Deferred().resolve().promise();
      });
    };

    player.one('dispose', cancel);

    function ensureGainNode() {
      if (!gainNode) {
        gainNode = audioContext.createGain();
        var source = audioContext.createMediaElementSource(player.getMediaElement());
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
      }
    }

    function resolve() {
      clearTimeout(currentTimeout);
      currentDeferred.resolve();
      currentTimeout = null;
      currentDeferred = null;
    }

    function cancel() {
      if (currentDeferred) {
        gainNode.gain.cancelScheduledValues(audioContext.currentTime);
        clearTimeout(currentTimeout);
        currentDeferred.reject();
        currentTimeout = null;
        currentDeferred = null;
        updateCurrentValueFromComputedValue();
      }
    }

    function recordFadeStart(duration) {
      lastStartTime = audioContext.currentTime;
      lastStartValue = currentValue;
      lastDuration = duration;
    }

    function updateCurrentValueFromComputedValue() {
      // Firefox 54 on Ubuntu does not provide computed values when gain
      // was changed via one of the scheduling methods. Instead
      // gain.value always reports 1. Interpolate manually do determine
      // how far the fade was performed before cancel was called.
      if (gainNode.gain.value == 1) {
        var performedDuration = (audioContext.currentTime - lastStartTime) * 1000;
        var lastDelta = currentValue - lastStartValue;
        var performedFraction = lastDelta > 0 ? performedDuration / lastDuration : 1;
        currentValue = ensureInAllowedRange(lastStartValue + performedFraction * lastDelta);
      } else {
        currentValue = gainNode.gain.value;
      }
    }

    function ensureInAllowedRange(value) {
      return value < allowedMinValue ? allowedMinValue : value;
    }
  };

  pageflow.mediaPlayer.volumeBinding = function (player, settings, options) {
    options = options || {};
    var originalPlay = player.play;
    var originalPause = player.pause;
    var volumeFactor = 'volumeFactor' in options ? options.volumeFactor : 1;

    player.play = function () {
      player.intendToPlay();
      player.volume(player.targetVolume());
      listenToVolumeSetting();
      return originalPlay.call(player);
    };

    player.playAndFadeIn = function (duration) {
      if (!player.paused() && !player.intendingToPause()) {
        return new $.Deferred().resolve().promise();
      }

      player.intendToPlay();
      player.volume(0);
      return $.when(originalPlay.call(player)).then(function () {
        listenToVolumeSetting();
        return player.fadeVolume(player.targetVolume(), duration).then(null, function () {
          return new $.Deferred().resolve().promise();
        });
      });
    };

    player.pause = function () {
      stopListeningToVolumeSetting();
      originalPause.call(player);
    };

    player.fadeOutAndPause = function (duration) {
      if (player.paused() && !player.intendingToPlay()) {
        return new $.Deferred().resolve().promise();
      }

      player.intendToPause();
      stopListeningToVolumeSetting();
      return player.fadeVolume(0, duration).always(function () {
        return player.ifIntendingToPause().then(function () {
          originalPause.call(player);
        });
      });
    };

    player.changeVolumeFactor = function (factor, duration) {
      volumeFactor = factor;
      return player.fadeVolume(player.targetVolume(), duration);
    };

    player.targetVolume = function () {
      return settings.get('volume') * volumeFactor;
    };

    function listenToVolumeSetting() {
      player.on('dispose', stopListeningToVolumeSetting);
      settings.on('change:volume', onVolumeChange);
    }

    function stopListeningToVolumeSetting() {
      player.off('dispose', stopListeningToVolumeSetting);
      settings.off('change:volume', onVolumeChange);
    }

    function onVolumeChange(model, value) {
      player.fadeVolume(player.targetVolume(), 40);
    }
  };

  pageflow.mediaPlayer.loadWaiting = function (player) {
    var originalFadeVolume = player.fadeVolume;

    player.fadeVolume = function ()
    /* args */
    {
      var args = arguments;
      return $.when(this.loadedPromise).then(function () {
        return originalFadeVolume.apply(player, args);
      });
    };
  };

  pageflow.mediaPlayer.hooks = function (player, hooks) {
    var originalPlay = player.play;

    if (hooks.before) {
      player.play = function ()
      /* args */
      {
        var args = arguments;
        player.trigger('beforeplay');
        player.intendToPlay();
        return $.when(hooks.before()).then(function () {
          return player.ifIntendingToPlay().then(function () {
            return originalPlay.apply(player, args);
          });
        });
      };
    }

    if (hooks.after) {
      player.on('pause', hooks.after);
      player.on('ended', hooks.after);
    }
  };

  pageflow.mediaPlayer.asyncPlay = function (player) {
    var originalPlay = player.play;
    var originalPause = player.pause;
    var intendingToPlay = false;
    var intendingToPause = false;

    player.play = function ()
    /* arguments */
    {
      player.intendToPlay();
      return originalPlay.apply(player, arguments);
    };

    player.pause = function ()
    /* arguments */
    {
      player.intendToPause();
      return originalPause.apply(player, arguments);
    };

    player.intendToPlay = function () {
      intendingToPlay = true;
      intendingToPause = false;
    };

    player.intendToPause = function () {
      intendingToPause = true;
      intendingToPlay = false;
    };

    player.intendingToPlay = function () {
      return intendingToPlay;
    };

    player.intendingToPause = function () {
      return intendingToPause;
    };

    player.ifIntendingToPause = function () {
      return promiseFromBoolean(intendingToPause);
    };

    player.ifIntendingToPlay = function () {
      return promiseFromBoolean(intendingToPlay);
    };

    function promiseFromBoolean(value) {
      return new $.Deferred(function (deferred) {
        if (value) {
          deferred.resolve();
        } else {
          deferred.reject('aborted');
        }
      }).promise();
    }
  };

  /**
   * Playing audio sources
   *
   * @param {Object[]} sources
   * List of sources for audio element.
   *
   * @param {string} sources[].type
   * Mime type of the audio.
   *
   * @param {string} sources[].src
   * Url of the audio.
   *
   * @class
   */

  pageflow.AudioPlayer = function (sources, options) {
    options = options || {};
    var codecMapping = {
      vorbis: 'audio/ogg',
      mp4: 'audio/mp4',
      mp3: 'audio/mpeg'
    };
    var ready = new $.Deferred();
    var loaded = new $.Deferred();
    var audio = new Audio5js({
      reusedTag: options.tag,
      swf_path: pageflow.assetUrls.audioSwf,
      throw_errors: false,
      format_time: false,
      codecs: options.codecs || ['vorbis', 'mp4', 'mp3'],
      ready: ready.resolve,
      loop: options.loop
    });
    audio.readyPromise = ready.promise();
    audio.loadedPromise = loaded.promise();
    audio.on('load', loaded.resolve);

    if (options.mediaEvents) {
      pageflow.AudioPlayer.mediaEvents(audio, options.context);
    }

    if (options.pauseInBackground && pageflow.browser.has('mobile platform')) {
      pageflow.AudioPlayer.pauseInBackground(audio);
    }

    pageflow.mediaPlayer.enhance(audio, _.extend({
      loadWaiting: true
    }, options || {}));
    pageflow.AudioPlayer.seekWithInvalidStateHandling(audio);
    pageflow.AudioPlayer.rewindMethod(audio);
    pageflow.AudioPlayer.getMediaElementMethod(audio);

    audio.src = function (sources) {
      ready.then(function () {
        var source = _.detect(sources || [], function (source) {
          if (codecMapping[audio.settings.player.codec] === source.type) {
            return source.src;
          }
        });

        audio.load(source ? source.src : '');
      });
    };

    var originalLoad = audio.load;

    audio.load = function (src) {
      if (!src) {
        this.duration = 0;
      }

      this.currentSrc = src;
      this.position = 0;
      this.trigger('timeupdate', this.position, this.duration);
      originalLoad.apply(this, arguments);
    };

    var originalSeek = audio.seek;

    audio.seek = function () {
      if (this.currentSrc) {
        return originalSeek.apply(this, arguments);
      }
    };

    var originalPlay = audio.play;

    audio.play = function () {
      if (this.currentSrc) {
        originalPlay.apply(this, arguments);
      }
    };

    audio.paused = function () {
      return !audio.playing;
    };

    audio.src(sources);
    return audio;
  };

  pageflow.AudioPlayer.fromAudioTag = function (element, options) {
    return new pageflow.AudioPlayer(element.find('source').map(function () {
      return {
        src: $(this).attr('src'),
        type: $(this).attr('type')
      };
    }).get(), _.extend({
      tag: element[0]
    }, options || {}));
  };

  pageflow.AudioPlayer.fromScriptTag = function (element, options) {
    var sources = element.length ? JSON.parse(element.text()) : [];
    return new pageflow.AudioPlayer(sources, options);
  };

  pageflow.AudioPlayer.mediaEvents = function (player, context) {
    function triggerMediaEvent(name) {
      pageflow.events.trigger('media:' + name, {
        fileName: player.currentSrc,
        context: context,
        currentTime: player.position,
        duration: player.duration,
        volume: player.volume(),
        bitrate: 128000
      });
    }

    player.on('play', function () {
      triggerMediaEvent('play');
    });
    player.on('timeupdate', function () {
      triggerMediaEvent('timeupdate');
    });
    player.on('pause', function () {
      triggerMediaEvent('pause');
    });
    player.on('ended', function () {
      triggerMediaEvent('ended');
    });
  };

  pageflow.AudioPlayer.Null = function () {
    this.playAndFadeIn = function () {
      return new $.Deferred().resolve().promise();
    };

    this.fadeOutAndPause = function () {
      return new $.Deferred().resolve().promise();
    };

    this.changeVolumeFactor = function () {
      return new $.Deferred().resolve().promise();
    };

    this.play = function () {};

    this.pause = function () {};

    this.paused = function () {
      return true;
    };

    this.seek = function () {
      return new $.Deferred().resolve().promise();
    };

    this.rewind = function () {
      return new $.Deferred().resolve().promise();
    };

    this.formatTime = function () {};

    this.one = function (event, handler) {
      handler();
    };
  };

  _.extend(pageflow.AudioPlayer.Null.prototype, Backbone.Events);

  /**
   * Calling seek before the media tag is ready causes InvalidState
   * exeption. If this happens, we wait for the next progress event and
   * retry. We resolve a promise once seeking succeeded.
   *
   * @api private
   */

  pageflow.AudioPlayer.seekWithInvalidStateHandling = function (player) {
    var originalSeek = player.seek;

    player.seek = function (time) {
      return retryOnProgress(function () {
        originalSeek.call(player, time);
      });
    };

    function retryOnProgress(fn) {
      var tries = 0;
      return new $.Deferred(function (deferred) {
        function tryOrWaitForProgress() {
          tries += 1;

          if (tries >= 50) {
            deferred.reject();
            return;
          }

          try {
            fn();
            deferred.resolve();
          } catch (e) {
            player.one('progress', tryOrWaitForProgress);
          }
        }

        tryOrWaitForProgress();
      }).promise();
    }
  };

  pageflow.AudioPlayer.rewindMethod = function (player) {
    /**
     * Seek to beginning of file. If already at the beginning do
     * nothing.
     *
     * @alias pageflow.AudioPlayer#rewind
     */
    player.rewind = function () {
      if (player.position > 0) {
        var result = player.seek(0);
        player.trigger('timeupdate', player.position, player.duration);
        return result;
      } else {
        return new $.Deferred().resolve().promise();
      }
    };
  };

  // Prevent audio play back when browser enters background on mobile
  // device. Use the face that timeupdate events continue to fire while
  // intervals no longer executed when the browser is in the background.
  pageflow.AudioPlayer.pauseInBackground = function (player) {
    var interval;
    var lastInterval;
    var resolution = 100;

    function startProbeInterval() {
      interval = setInterval(function () {
        lastInterval = new Date().getTime();
      }, resolution);
    }

    function stopProbeInterval() {
      clearInterval(interval);
      interval = null;
    }

    function pauseIfProbeIntervalHalted() {
      if (intervalHalted()) {
        player.pause();
      }
    }

    function intervalHalted() {
      return interval && lastInterval < new Date().getTime() - resolution * 5;
    }

    player.on('play', startProbeInterval);
    player.on('pause', stopProbeInterval);
    player.on('ended', stopProbeInterval);
    player.on('timeupdate', pauseIfProbeIntervalHalted);
  };

  pageflow.AudioPlayer.getMediaElementMethod = function (player) {
    player.getMediaElement = function () {
      return player.audio.audio;
    };
  };

  /**
   * Obtain the globally shared audio context. There can only be a
   * limited number of `AudioContext` objects in one page.
   *
   * @since 12.1
   */
  pageflow.audioContext = {
    /**
     * @returns [AudioContext]
     *   Returns `null` if web audio API is not supported or creating
     *   the context fails.
     */
    get: function get() {
      var AudioContext = window.AudioContext || window.webkitAudioContext;

      if (typeof this._audioContext === 'undefined') {
        try {
          this._audioContext = AudioContext && new AudioContext();
        } catch (e) {
          this._audioContext = null;
          pageflow.log('Failed to create AudioContext.', {
            force: true
          });
        }
      }

      return this._audioContext;
    }
  };

  pageflow.VideoPlayer = function (element, options) {
    options = options || {};
    element = pageflow.VideoPlayer.filterSources(element);
    var player = videojs(element, options);

    if (options.useSlimPlayerControlsDuringPhonePlayback) {
      pageflow.mediaPlayer.useSlimPlayerControlsDuringPhonePlayback(player);
    }

    pageflow.VideoPlayer.prebuffering(player);
    pageflow.VideoPlayer.cueSettingsMethods(player);
    pageflow.VideoPlayer.getMediaElementMethod(player);

    if (options.mediaEvents) {
      pageflow.VideoPlayer.mediaEvents(player, options.context);
    }

    if (options.bufferUnderrunWaiting) {
      pageflow.VideoPlayer.bufferUnderrunWaiting(player);
    }

    pageflow.mediaPlayer.enhance(player, options);
    return player;
  };

  videojs.Html5DashJS.hook('beforeinitialize', function (player, mediaPlayer) {
    mediaPlayer.getDebug().setLogToBrowserConsole(false);
  });

  pageflow.mediaPlayer.useSlimPlayerControlsDuringPhonePlayback = function (player) {
    var originalPlay = player.play;

    player.play = function () {
      if (pageflow.browser.has('phone platform') && !pageflow.browser.has('native video player')) {
        pageflow.widgets.use({
          name: 'slim_player_controls',
          insteadOf: 'classic_player_controls'
        }, function (restoreWidgets) {
          player.one('pause', restoreWidgets);
        });
      }

      return originalPlay.apply(this, arguments);
    };
  };

  pageflow.VideoPlayer.mediaEvents = function (player, context) {
    function triggerMediaEvent(name) {
      pageflow.events.trigger('media:' + name, {
        fileName: player.currentSrc(),
        context: context,
        currentTime: player.currentTime(),
        duration: player.duration(),
        volume: player.volume(),
        bitrate: pageflow.browser.has('high bandwidth') ? 3500000 : 2000000
      });
    }

    player.on('play', function () {
      triggerMediaEvent('play');
    });
    player.on('timeupdate', function () {
      triggerMediaEvent('timeupdate');
    });
    player.on('pause', function () {
      triggerMediaEvent('pause');
    });
    player.on('ended', function () {
      triggerMediaEvent('ended');
    });
  };

  pageflow.VideoPlayer.prebuffering = function (player) {
    player.isBufferedAhead = function (delta, silent) {
      // video.js only gives us one time range starting from 0 here. We
      // still ask for the last time range to be on the safe side.
      var timeRanges = player.buffered();
      var currentBufferTime = timeRanges.end(timeRanges.length - 1);
      var desiredBufferTime = player.currentTime() + delta;

      if (player.duration()) {
        desiredBufferTime = Math.min(desiredBufferTime, Math.floor(player.duration()));
      }

      var result = currentBufferTime >= desiredBufferTime;

      if (!silent) {
        pageflow.log('buffered ahead ' + delta + ': ' + result + ' (' + currentBufferTime + '/' + desiredBufferTime + ')');
      }

      return result;
    };

    player.prebuffer = function (options) {
      options = options || {};
      var delta = options.secondsToBuffer || 10;
      var secondsToWait = options.secondsToWait || 3;
      var interval = 200;
      var maxCount = secondsToWait * 1000 / interval;
      var count = 0;
      var deferred = $.Deferred();

      var _timeout;

      if (pageflow.browser.has('prebuffering support')) {
        if (!player.isBufferedAhead(delta) && !player.prebufferDeferred) {
          pageflow.log('prebuffering video ' + player.src());

          _timeout = function timeout() {
            setTimeout(function () {
              if (!player.prebufferDeferred) {
                return;
              }

              count++;

              if (player.isBufferedAhead(delta) || count > maxCount) {
                pageflow.log('finished prebuffering video ' + player.src());
                deferred.resolve();
                player.prebufferDeferred = null;
              } else {
                _timeout();
              }
            }, interval);
          };

          _timeout();

          player.prebufferDeferred = deferred;
        }
      }

      return player.prebufferDeferred ? player.prebufferDeferred.promise() : deferred.resolve().promise();
    };

    player.abortPrebuffering = function () {
      if (player.prebufferDeferred) {
        pageflow.log('ABORT prebuffering');
        player.prebufferDeferred.reject();
        player.prebufferDeferred = null;
      }
    };

    var originalPause = player.pause;

    player.pause = function () {
      player.abortPrebuffering();
      return originalPause.apply(this, arguments);
    };

    player.one('dispose', function () {
      player.abortPrebuffering();
    });
  };

  pageflow.VideoPlayer.bufferUnderrunWaiting = function (player) {
    var originalPause = player.pause;

    player.pause = function () {
      cancelWaiting();
      originalPause.apply(this, arguments);
    };

    function pauseAndPreloadOnUnderrun() {
      if (bufferUnderrun()) {
        pauseAndPreload();
      }
    }

    function bufferUnderrun() {
      return !player.isBufferedAhead(0.1, true) && !player.waitingOnUnderrun && !ignoringUnderruns();
    }

    function pauseAndPreload() {
      pageflow.log('Buffer underrun');
      player.trigger('bufferunderrun');
      player.pause();
      player.waitingOnUnderrun = true;
      player.prebuffer({
        secondsToBuffer: 5,
        secondsToWait: 5
      }).then(function () {
        // do nothing if user aborted waiting by clicking pause
        if (player.waitingOnUnderrun) {
          player.waitingOnUnderrun = false;
          player.trigger('bufferunderruncontinue');
          player.play();
        }
      });
    }

    function cancelWaiting() {
      if (player.waitingOnUnderrun) {
        player.ignoreUnderrunsUntil = new Date().getTime() + 5 * 1000;
        player.waitingOnUnderrun = false;
        player.trigger('bufferunderruncontinue');
      }
    }

    function ignoringUnderruns() {
      var r = player.ignoreUnderrunsUntil && new Date().getTime() < player.ignoreUnderrunsUntil;

      if (r) {
        pageflow.log('ignoring underrun');
      }

      return r;
    }

    function stopListeningForProgress() {
      player.off('progress', pauseAndPreloadOnUnderrun);
    }

    if (pageflow.browser.has('buffer underrun waiting support')) {
      player.on('play', function () {
        player.on('progress', pauseAndPreloadOnUnderrun);
      });
      player.on('pause', stopListeningForProgress);
      player.on('ended', stopListeningForProgress);
    }
  };

  pageflow.VideoPlayer.filterSources = function (playerElement) {
    if (!$(playerElement).is('video')) {
      return playerElement;
    }

    var changed = false;

    if (pageflow.browser.has('mp4 support only')) {
      // keep only mp4 source
      $(playerElement).find('source').not('source[type="video/mp4"]').remove();
      changed = true;
    } else if (pageflow.browser.has('mse and native hls support')) {
      // remove dash source to ensure hls is used
      $(playerElement).find('source[type="application/dash+xml"]').remove();
      changed = true;
    }

    if (changed) {
      // the video tags initially in the dom are broken since they "saw"
      // the other sources. replace with clones
      var clone = $(playerElement).clone(true);
      $(playerElement).replaceWith(clone);
      return clone[0];
    } else {
      return playerElement;
    }
  };

  pageflow.VideoPlayer.Lazy = function (template, options) {
    var placeholder = $('<span class="video_placeholder" />'),
        that = this,
        readyCallbacks = new $.Callbacks(),
        disposeTimeout,
        videoTag,
        videoPlayer,
        html;
    saveHtml(template);
    template.before(placeholder);

    this.ensureCreated = function () {
      if (disposeTimeout) {
        clearTimeout(disposeTimeout);
        disposeTimeout = null;
      }

      if (!videoTag) {
        videoTag = createVideoTag();
        placeholder.replaceWith(videoTag);
        videoPlayer = new pageflow.VideoPlayer(videoTag[0], options);
        videoPlayer.ready(readyCallbacks.fire);
      }
    };

    this.isPresent = function () {
      return videoTag && !disposeTimeout;
    };

    this.dispose = function () {
      if (videoTag && !pageflow.browser.has('mobile platform')) {
        this.setEmptySrc();
        $(videoPlayer.el()).replaceWith(placeholder);
        videoPlayer.dispose();
        videoPlayer = null;
        videoTag = null;
      }
    };

    this.setEmptySrc = function () {
      videoPlayer.src([{
        type: 'video/webm',
        src: pageflow.assetUrls.emptyWebm
      }, {
        type: 'video/mp4',
        src: pageflow.assetUrls.emptyMp4
      }]);
    };

    this.scheduleDispose = function () {
      if (!disposeTimeout) {
        disposeTimeout = setTimeout(function () {
          that.dispose();
        }, 5 * 1000);
      }
    }; // proxied methods


    this.ready = function (callback) {
      readyCallbacks.add(callback);
    };

    this.paused = function () {
      return videoPlayer && videoPlayer.paused();
    };

    this.volume = function ()
    /* arguments */
    {
      if (!videoPlayer) {
        return 0;
      }

      return videoPlayer.volume.apply(videoPlayer, arguments);
    };

    this.showPosterImage = function () {
      return videoPlayer && videoPlayer.posterImage.show();
    };

    this.hidePosterImage = function () {
      return videoPlayer && videoPlayer.posterImage.unlockShowing();
    };

    _.each(['play', 'playAndFadeIn', 'pause', 'fadeOutAndPause', 'prebuffer', 'src', 'on', 'load', 'currentTime', 'muted'], function (method) {
      that[method] = function ()
      /* args */
      {
        var args = arguments;

        if (!videoPlayer) {
          pageflow.log('Video Player not yet initialized. (' + method + ')', {
            force: true
          });
          return;
        }

        return new $.Deferred(function (deferred) {
          videoPlayer.ready(function () {
            $.when(videoPlayer[method].apply(videoPlayer, args)).then(deferred.resolve);
          });
        });
      };
    });

    function saveHtml(template) {
      html = template.html();
    }

    function createVideoTag() {
      var htmlWithPreload = html.replace(/preload="[a-z]*"/, 'preload="auto"');
      htmlWithPreload = htmlWithPreload.replace(/src="([^"]*)"/g, 'src="$1&t=' + new Date().getTime() + '"');
      var element = $(htmlWithPreload);

      if (pageflow.browser.has('mobile platform') && element.attr('data-mobile-poster')) {
        element.attr('poster', element.attr('data-mobile-poster'));
      } else if (pageflow.browser.has('high bandwidth') && !pageflow.browser.has('mobile platform')) {
        element.attr('poster', element.attr('data-large-poster'));
        element.find('source').each(function () {
          $(this).attr('src', $(this).attr('data-high-src'));
        });
      } else {
        element.attr('poster', element.attr('data-poster'));
      }

      return element;
    }
  };

  pageflow.VideoPlayer.cueSettingsMethods = function (player) {
    /**
     * Specify the display position of text tracks. This method can also
     * be used to make VideoJS reposition the text tracks after the
     * margins of the text track display have been changed (e.g. to
     * translate text tracks when player controls are displayed).
     *
     * To force such an update, the passed string has to differ from the
     * previously passed string. You can append a dot and an arbitrary
     * string (e.g. `"auto.translated"`), to keep the current setting but
     * still force repositioning.
     *
     * On the other hand, it is possible to change the positioning but
     * have VideoJS apply the change only when the next cue is
     * displayed. This way we can prevent moving a cue that the user
     * might just be reading. Simply append the string `".lazy"`
     * (e.g. `"auto.lazy"`).
     *
     * @param {string} line
     *   Either `"top"` to move text tracks to the first line or
     *   `"auto"` to stick with automatic positioning, followed by a tag
     *   to either force or prevent immediate update.
     */
    player.updateCueLineSettings = function (line) {
      var components = line.split('.');
      var value = components[0];
      var command = components[1];
      value = value == 'top' ? 1 : value;
      var changed = false;

      _(player.textTracks()).each(function (textTrack) {
        if (textTrack.mode == 'showing' && textTrack.cues) {
          for (var i = 0; i < textTrack.cues.length; i++) {
            if (textTrack.cues[i].line != value) {
              textTrack.cues[i].line = value;
              changed = true;
            }
          }
        }
      }); // Setting `line` does not update display directly, but only when
      // the next cue is displayed. This is problematic, when we
      // reposition text tracks to prevent overlap with player
      // controls. Triggering the event makes VideoJS update positions.
      // Ensure display is also updated when the current showing text
      // track changed since the last call, i.e. `line` has been changed
      // for a cue even though the previous call had the same
      // parameters.


      if ((this.prevLine !== line || changed) && command != 'lazy') {
        var tech = player.tech({
          IWillNotUseThisInPlugins: true
        });
        tech && tech.trigger('texttrackchange');
      }

      this.prevLine = line;
    };
  };

  pageflow.VideoPlayer.getMediaElementMethod = function (player) {
    player.getMediaElement = function () {
      var tech = player.tech({
        IWillNotUseThisInPlugins: true
      });
      return tech && tech.el();
    };
  };

  pageflow.Visited = function (entryId, pages, events, cookies) {
    var cookieName = '_pageflow_visited';
    var unvisitedPages = [];

    function _init() {
      pageflow.cookieNotice.request();

      if (!cookies.hasItem(cookieName)) {
        storeVisitedPageIds(getAllIds());
      } else {
        var visitedIds = getVisitedPageIds();
        unvisitedPages = _.difference(getAllIds(), visitedIds);
      }

      events.on('page:change', function (page) {
        var id = page.getPermaId();
        var ids = getVisitedPageIds();

        if (ids.indexOf(id) < 0) {
          ids.push(id);
        }

        storeVisitedPageIds(ids);
      });
    }

    function migrateLegacyCookie() {
      var legacyCookieName = '_pageflow_' + entryId + '_visited';

      if (cookies.hasItem(legacyCookieName)) {
        var ids = getCookieIds(legacyCookieName);
        storeVisitedPageIds(_.uniq(ids));
        cookies.removeItem(legacyCookieName);
      }
    }

    function getAllIds() {
      return pages.map(function (page) {
        return page.perma_id;
      });
    }

    function storeVisitedPageIds(ids) {
      cookies.setItem(cookieName, ids, Infinity, location.pathname);
    }

    function getVisitedPageIds() {
      return getCookieIds(cookieName);
    }

    function getCookieIds(name) {
      if (cookies.hasItem(name) && !!cookies.getItem(name)) {
        return cookies.getItem(name).split(',').map(function (id) {
          return parseInt(id, 10);
        });
      }

      return [];
    }

    return {
      init: function init() {
        migrateLegacyCookie();

        _init();
      },
      getUnvisitedPages: function getUnvisitedPages() {
        return unvisitedPages;
      }
    };
  };

  pageflow.Visited.setup = function () {
    pageflow.visited = new pageflow.Visited(pageflow.entryId, pageflow.pages, pageflow.events, pageflow.cookies);

    if (pageflow.Visited.enabled) {
      pageflow.visited.init();
    }
  };

  /**
   * A promise that is resolved once the document is printed.
   */
  // old promise not working properly, resolved in print-mode

  /*  return new $.Deferred(function(deferred) {
      if (window.matchMedia) {
        var mediaQueryList = window.matchMedia('print');
        mediaQueryList.addListener(function(mql) {
          if (mql.matches) {
            deferred.resolve();
          }
        });
      }

      window.onbeforeprint = deferred.resolve;
    });
  }; */

  $(function ($) {
    // now bound to pageflow.ready
    pageflow.ready.then(function () {
      $('img.print_image').each(function () {
        var img = $(this);

        if (img.data('src')) {
          img.attr('src', img.data('printsrc'));
        }
      });
    });
  });

  pageflow.History = function (slideshow, adapter) {
    slideshow.on('slideshowchangepage', function (event, options) {
      var hash = slideshow.currentPage().attr('id');

      if (options.back) {
        adapter.replaceState(null, '', adapter.hash());
      } else if (options.ignoreInHistory) {
        adapter.replaceState(null, '', hash);
      } else {
        adapter.replaceState(options, '', adapter.hash());
        adapter.pushState(null, '', hash);
      }
    });
    adapter.on('popstate', function (event) {
      if (!adapter.state()) {
        return;
      }

      slideshow.goToByPermaId(adapter.hash(), _.extend({
        back: true
      }, _.pick(adapter.state(), 'direction', 'transition')));
    });
    adapter.on('hashchange', function () {
      slideshow.goToByPermaId(adapter.hash());
    });

    this.getLandingPagePermaId = function () {
      return adapter.hash() || pageParameter();
    };

    this.start = function () {
      adapter.replaceState(null, '', slideshow.currentPage().attr('id'));
    };

    this.back = _.bind(adapter.back, adapter);

    function pageParameter() {
      var match = window.location.href.match(/page=([^&]*)/);
      return match ? match[1] : '';
    }
  };

  pageflow.History.create = function (slideshow, options) {
    options = options || {};
    var adapter;

    if (options.simulate) {
      adapter = new pageflow.History.SimulatedAdapter();
    } else if (pageflow.browser.has('pushstate support')) {
      adapter = new pageflow.History.PushStateAdapter();
    } else {
      adapter = new pageflow.History.HashAdapter();
    }

    return new pageflow.History(slideshow, adapter);
  };

  pageflow.History.HashAdapter = function () {
    var counter = 0;

    this.back = function () {
      if (counter > 0) {
        window.history.back();
        counter -= 1;
        return true;
      }

      return false;
    };

    this.pushState = function (state, title, hash) {
      if (window.location.hash !== hash) {
        counter += 1;
        window.location.hash = hash;
      }
    };

    this.replaceState = function (state, title, hash) {
      window.location.hash = hash;
    };

    this.state = function () {
      return {};
    };

    this.hash = function () {
      var match = window.location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    };

    this.on = function (event, listener) {
      return $(window).on(event, listener);
    };
  };

  pageflow.History.PushStateAdapter = function () {
    var counter = 0;

    this.back = function () {
      if (counter > 0) {
        window.history.back();
        return true;
      }

      return false;
    };

    this.pushState = function (state, title, hash) {
      counter += 1;
      window.history.pushState(state, title, '#' + hash);
    };

    this.replaceState = function (state, title, hash) {
      window.history.replaceState(state, title, '#' + hash);
    };

    this.state = function () {
      return history.state;
    };

    this.hash = function () {
      var match = window.location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    };

    this.on = function (event, listener) {
      return $(window).on(event, listener);
    };

    $(window).on('popstate', function () {
      counter -= 1;
    });
  };

  pageflow.History.SimulatedAdapter = function () {
    var stack = [{
      hash: null,
      state: null
    }];

    this.back = function () {
      if (stack.length > 1) {
        stack.pop();
        this.trigger('popstate');
        return true;
      }

      return false;
    };

    this.pushState = function (state, title, hash) {
      stack.push({
        state: state,
        hash: hash
      });
    };

    this.replaceState = function (state, title, hash) {
      peek().state = state;
      peek().hash = hash;
    };

    this.state = function () {
      return peek().state;
    };

    this.hash = function () {
      return peek().hash;
    };

    function peek() {
      return stack[stack.length - 1];
    }
  };

  _.extend(pageflow.History.SimulatedAdapter.prototype, Backbone.Events);

  pageflow.DelayedStart = function ($) {
    return function () {
      var waitDeferred = new $.Deferred();
      var promises = [];
      var performed = false;
      return {
        promise: function promise() {
          return waitDeferred.promise();
        },
        wait: function wait(callback) {
          var cancelled = false;
          waitDeferred.then(function () {
            if (!cancelled) {
              callback();
            }
          });
          return {
            cancel: function cancel() {
              cancelled = true;
            }
          };
        },
        waitFor: function waitFor(callbackOrPromise) {
          if (!performed) {
            if (typeof callbackOrPromise === 'function') {
              callbackOrPromise = new $.Deferred(function (deferred) {
                callbackOrPromise(deferred.resolve);
              }).promise();
            }

            promises.push(callbackOrPromise);
          }
        },
        perform: function perform() {
          if (!performed) {
            performed = true;
            $.when.apply(null, promises).then(waitDeferred.resolve);
          }
        }
      };
    };
  }($);

  pageflow.delayedStart = new pageflow.DelayedStart();

  pageflow.manualStart = function ($) {
    var requiredDeferred = $.Deferred();
    var waitDeferred = $.Deferred();
    $(function () {
      if (pageflow.manualStart.enabled) {
        pageflow.delayedStart.waitFor(waitDeferred);
        requiredDeferred.resolve(waitDeferred.resolve);
      }
    });
    return {
      required: function required() {
        return requiredDeferred.promise();
      }
    };
  }($);

  pageflow.widgets = function () {
    return {
      isPresent: function isPresent(name) {
        return !!$('div.' + className(name)).length;
      },
      areLoaded: function areLoaded() {
        return !!$('div.widgets_present').length;
      },
      use: function use(options, callback) {
        var original = options.insteadOf;
        var originalClassName = className(original);
        var replacementClassNames = className(options.name) + ' ' + className(original, 'replaced');

        if (this.isPresent(original)) {
          replace(originalClassName, replacementClassNames);
          callback(function () {
            replace(replacementClassNames, originalClassName);
          });
        } else {
          callback(function () {});
        }
      }
    };

    function replace(original, replacement) {
      $('div.widgets_present').removeClass(original).addClass(replacement);
      pageflow.events.trigger('widgets:update');
      pageflow.slides.triggerResizeHooks();
    }

    function className(name, state) {
      return 'widget_' + name + '_' + (state || 'present');
    }
  }();

  pageflow.widgetTypes = function () {
    var registry = {};
    var base = {
      enhance: function enhance(element) {}
    };
    return {
      register: function register(name, widgetType) {
        registry[name] = _.extend({}, base, widgetType);
      },
      enhance: function enhance(container) {
        function enhance(element) {
          var typeName = $(element).data('widget');

          if (registry[typeName]) {
            registry[typeName].enhance(element);
          }
        }

        container.find('[data-widget]').each(function () {
          enhance($(this));
        });
      }
    };
  }();

  pageflow.widgetTypes.register('default_navigation', {
    enhance: function enhance(element) {
      element.navigation();
    }
  });
  pageflow.widgetTypes.register('default_mobile_navigation', {
    enhance: function enhance(element) {
      element.navigationMobile();
    }
  });

  pageflow.links = {
    setup: function setup() {
      this.ensureClickOnEnterKeyPress();
      this.setupContentSkipLinks();
    },
    ensureClickOnEnterKeyPress: function ensureClickOnEnterKeyPress() {
      $('body').on('keypress', 'a, [tabindex]', function (e) {
        if (e.which == 13) {
          $(this).click();
        }
      });
      $('body').on('keyup', 'a, [tabindex]', function (e) {
        e.stopPropagation();
      });
    },
    setupContentSkipLinks: function setupContentSkipLinks() {
      $('.content_link').attr('href', '#firstContent');
      $('.content_link').click(function (e) {
        $('#firstContent').focus();
        e.preventDefault();
        return false;
      });
    }
  };

  pageflow.HighlightedPage = pageflow.Object.extend({
    initialize: function initialize(entryData, options) {
      this.customNavigationBarMode = options && options.customNavigationBarMode;
      this.entry = entryData;
    },
    getPagePermaId: function getPagePermaId(currentPagePermaId) {
      var storylineId = this.entry.getStorylineIdByPagePermaId(currentPagePermaId);

      if (this.getNavigationBarMode(storylineId) === 'inherit_from_parent') {
        var parentPagePermaId = this.entry.getParentPagePermaId(storylineId);
        return parentPagePermaId && this.getPagePermaId(parentPagePermaId);
      } else {
        return this.getDisplayedPageInChapter(currentPagePermaId);
      }
    },
    getDisplayedPageInChapter: function getDisplayedPageInChapter(pagePermaId) {
      return _(this.getChapterPagesUntil(pagePermaId).reverse()).find(function (permaId) {
        return this.pageIsDisplayedInNavigation(permaId);
      }, this);
    },
    pageIsDisplayedInNavigation: function pageIsDisplayedInNavigation(permaId) {
      return this.entry.getPageConfiguration(permaId).display_in_navigation !== false;
    },
    getNavigationBarMode: function getNavigationBarMode(storylineId) {
      if (this.customNavigationBarMode) {
        return this.customNavigationBarMode(storylineId, this.entry);
      } else {
        return this.entry.getStorylineConfiguration(storylineId).navigation_bar_mode;
      }
    },
    getChapterPagesUntil: function getChapterPagesUntil(pagePermaId) {
      var found = false;
      var chapterId = this.entry.getChapterIdByPagePermaId(pagePermaId);
      return _.filter(this.entry.getChapterPagePermaIds(chapterId), function (other) {
        var result = !found;
        found = found || pagePermaId === other;
        return result;
      });
    }
  });

  pageflow.HighlightedPage.create = function (options) {
    return new pageflow.HighlightedPage(pageflow.entryData, options);
  };

  pageflow.ChapterFilter = pageflow.Object.extend({
    initialize: function initialize(entryData) {
      this.entry = entryData;
    },
    strategies: {
      non: function non() {
        return false;
      },
      current_storyline: function current_storyline(currentChapterId, otherChapterId) {
        return this.entry.getStorylineIdByChapterId(currentChapterId) === this.entry.getStorylineIdByChapterId(otherChapterId);
      },
      inherit_from_parent: function inherit_from_parent(currentChapterId, otherChapterId) {
        return this.chapterVisibleFromChapter(this.entry.getParentChapterId(currentChapterId), otherChapterId);
      }
    },
    chapterVisibleFromPage: function chapterVisibleFromPage(currentPagePermaId, chapterId) {
      var currentChapterId = this.entry.getChapterIdByPagePermaId(currentPagePermaId);
      return this.chapterVisibleFromChapter(currentChapterId, chapterId);
    },
    chapterVisibleFromChapter: function chapterVisibleFromChapter(currentChapterId, otherChapterId) {
      return this.getStrategy(currentChapterId).call(this, currentChapterId, otherChapterId);
    },
    getStrategy: function getStrategy(chapterId) {
      return this.strategies[this.getNavigationBarMode(chapterId)] || this.strategies.current_storyline;
    },
    getNavigationBarMode: function getNavigationBarMode(chapterId) {
      var storylineId = this.entry.getStorylineIdByChapterId(chapterId);
      return this.entry.getStorylineConfiguration(storylineId).navigation_bar_mode;
    }
  });
  pageflow.ChapterFilter.strategies = _(pageflow.ChapterFilter.prototype.strategies).keys();

  pageflow.ChapterFilter.create = function () {
    return new pageflow.ChapterFilter(pageflow.entryData);
  };

  pageflow.Fullscreen = pageflow.Object.extend({
    toggle: function toggle() {
      var fullscreen = this;

      if ($.support.fullscreen) {
        $('#outer_wrapper').fullScreen({
          callback: function callback(active) {
            fullscreen._active = active;
            fullscreen.trigger('change');
          }
        });
      }
    },
    isSupported: function isSupported() {
      return $.support.fullscreen;
    },
    isActive: function isActive() {
      return this._active;
    }
  });
  pageflow.fullscreen = new pageflow.Fullscreen();

  /**
   * Manual interaction with the multimedia alert.
   *
   * @since 0.9
   */
  pageflow.multimediaAlert = {
    /**
     * Display the multimedia alert.
     */
    show: function show() {
      pageflow.events.trigger('request:multimedia_alert');
    }
  };

  pageflow.nativeScrolling = {
    preventScrollBouncing: function preventScrollBouncing(slideshow) {
      slideshow.on('touchmove', function (e) {
        e.preventDefault();
      });
    },
    preventScrollingOnEmbed: function preventScrollingOnEmbed(slideshow) {
      slideshow.on('wheel mousewheel DOMMouseScroll', function (e) {
        e.stopPropagation();
        e.preventDefault();
      });
    }
  };

  (function () {
    var KEY_TAB = 9;
    pageflow.FocusOutline = pageflow.Object.extend({
      initialize: function initialize(element) {
        this.element = element;
      },
      showOnlyAfterKeyboardInteraction: function showOnlyAfterKeyboardInteraction() {
        var focusOutline = this;
        this.disable();
        this.element.on('keydown', function (event) {
          if (event.which === KEY_TAB) {
            focusOutline.enable();
          }
        });
        this.element.on('mousedown', function () {
          focusOutline.disable();
        });
      },
      disable: function disable() {
        if (!this.disabled) {
          this.disabled = true;
          this.element.addClass('disable_focus_outline');
          this.element.removeClass('enable_focus_outline');
        }
      },
      enable: function enable() {
        if (this.disabled) {
          this.disabled = false;
          this.element.removeClass('disable_focus_outline');
          this.element.addClass('enable_focus_outline');
        }
      }
    });

    pageflow.FocusOutline.setup = function (element) {
      pageflow.focusOutline = new pageflow.FocusOutline(element);
      pageflow.focusOutline.showOnlyAfterKeyboardInteraction();
    };
  })();

  pageflow.phoneLandscapeFullscreen = function () {
    if (window.screen.orientation) {
      pageflow.ready.then(function () {
        if (pageflow.browser.has('phone platform') && !pageflow.browser.has('iphone platform')) {
          window.screen.orientation.onchange = function () {
            if (isLandscape()) {
              requestFullscreen(document.body);
            }
          };
        }
      });
    }

    function isLandscape() {
      return window.orientation == 90 || window.orientation == -90;
    }

    function requestFullscreen(el) {
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.webkitEnterFullscreen) {
        el.webkitEnterFullscreen();
      }
    }
  };

  pageflow.theme = {
    mainColor: function mainColor() {
      var probe = document.getElementById('theme_probe-main_color');
      return window.getComputedStyle(probe)['background-color'];
    }
  };

  pageflow.Settings = Backbone.Model.extend({
    defaults: {
      volume: 1
    },
    initialize: function initialize() {
      var storage = this.getLocalStorage();

      if (storage) {
        if (storage['pageflow.settings']) {
          try {
            this.set(JSON.parse(storage['pageflow.settings']));
          } catch (e) {
            pageflow.log(e);
          }
        }

        this.on('change', function () {
          storage['pageflow.settings'] = JSON.stringify(this);
        });
      }
    },
    getLocalStorage: function getLocalStorage() {
      try {
        return window.localStorage;
      } catch (e) {
        // Safari throws SecurityError when accessing window.localStorage
        // if cookies/website data are disabled.
        return null;
      }
    }
  });
  pageflow.settings = new pageflow.Settings();

  pageflow.Slideshow = function ($el, configurations) {
    var transitioning = false,
        currentPage = $(),
        pages = $(),
        that = this,
        currentPageIndex;
    configurations = configurations || {};

    function transitionMutex(fn, context) {
      if (transitioning) {
        return;
      }

      transitioning = true;
      var transitionDuration = fn.call(context);
      setTimeout(function () {
        transitioning = false;
      }, transitionDuration);
    }

    function nearestPage(index) {
      var result = $(pages.get(index));

      if (!result.length) {
        return pages.last();
      }

      return result;
    }

    this.nextPageExists = function () {
      return this.scrollNavigator.nextPageExists(currentPage, pages);
    };

    this.previousPageExists = function () {
      return this.scrollNavigator.previousPageExists(currentPage, pages);
    };

    this.isOnLandingPage = function () {
      return currentPage.is(this.scrollNavigator.getLandingPage(pages));
    };

    this.goToLandingPage = function () {
      this.goTo(this.scrollNavigator.getLandingPage(pages));
    };

    this.back = function () {
      this.scrollNavigator.back(currentPage, pages);
    };

    this.next = function () {
      this.scrollNavigator.next(currentPage, pages);
    };

    this.parentPageExists = function () {
      return !!pageflow.entryData.getParentPagePermaIdByPagePermaId(this.currentPagePermaId());
    };

    this.goToParentPage = function () {
      this.goToByPermaId(pageflow.entryData.getParentPagePermaIdByPagePermaId(this.currentPagePermaId()));
    };

    this.goToById = function (id, options) {
      return this.goTo($el.find('[data-id=' + id + ']'), options);
    };

    this.goToByPermaId = function (permaId, options) {
      if (permaId) {
        return this.goTo(getPageByPermaId(permaId), options);
      }
    };

    this.goTo = function (page, options) {
      options = options || {};

      if (page.length && !page.is(currentPage)) {
        var cancelled = false;
        pageflow.events.trigger('page:changing', {
          cancel: function cancel() {
            cancelled = true;
          }
        });

        if (cancelled) {
          return;
        }

        transitionMutex(function () {
          var previousPage = currentPage;
          currentPage = page;
          currentPageIndex = currentPage.index();
          var transition = options.transition || this.scrollNavigator.getDefaultTransition(previousPage, currentPage, pages);
          var direction = this.scrollNavigator.getTransitionDirection(previousPage, currentPage, pages, options);
          var outDuration = previousPage.page('deactivate', {
            direction: direction,
            transition: transition
          });
          var inDuration = currentPage.page('activate', {
            direction: direction,
            position: options.position,
            transition: transition
          });
          currentPage.page('preload');
          $el.trigger('slideshowchangepage', [options]);
          return Math.max(outDuration, inDuration);
        }, this);
        return true;
      }
    };

    this.goToFirstPage = function () {
      return this.goTo(pages.first());
    };

    this.update = function (options) {
      pages = $el.find('section.page');
      pages.each(function (index) {
        var $page = $(this);
        $page.page({
          index: index,
          configuration: configurations[$page.data('id')]
        });
      });
      ensureCurrentPage(options);
    };

    this.currentPage = function () {
      return currentPage;
    };

    this.currentPagePermaId = function () {
      return parseInt(currentPage.attr('id'), 10);
    };

    this.currentPageConfiguration = function () {
      return currentPage.page('getConfiguration');
    };

    function ensureCurrentPage(options) {
      var newCurrentPage = findNewCurrentPage(options);

      if (newCurrentPage) {
        currentPage = newCurrentPage;
        currentPageIndex = currentPage.index();
        currentPage.page('activateAsLandingPage');
        currentPage.page('preload');
      }
    }

    function findNewCurrentPage(options) {
      if (!currentPage.length) {
        var permaId = options && options.landingPagePermaId;
        var landingPage = permaId ? getPageByPermaId(permaId) : $();
        return landingPage.length ? landingPage : that.scrollNavigator.getLandingPage(pages);
      } else if (!currentPage.parent().length) {
        return nearestPage(currentPageIndex);
      }
    }

    function getPageByPermaId(permaId) {
      return $el.find('#' + parseInt(permaId, 10));
    }

    this.on = function () {
      $el.on.apply($el, arguments);
    };

    this.triggerResizeHooks = function () {
      currentPage.page('resize');
      pageflow.events.trigger('resize');
    };

    $el.on(pageflow.navigationDirection.getEventName('scrollerbumpback'), _.bind(function (event) {
      if (currentPage.page('isPageChangeAllowed', {
        type: 'bumpback'
      })) {
        this.back();
      }
    }, this));
    $el.on(pageflow.navigationDirection.getEventName('scrollerbumpnext'), _.bind(function (event) {
      if (currentPage.page('isPageChangeAllowed', {
        type: 'bumpnext'
      })) {
        this.next();
      }
    }, this));
    $el.on('click', 'a.to_top', _.bind(function () {
      this.goToLandingPage();
    }, this));
    $(window).on('resize', this.triggerResizeHooks);
    pageflow.nativeScrolling.preventScrollBouncing($el);
    $el.addClass('slideshow');
    $el.find('.hidden_text_indicator').hiddenTextIndicator({
      parent: $('body')
    });
    this.on('slideshowchangepage', function () {
      pageflow.hideText.deactivate();
    });
    $el.find('.scroll_indicator').scrollIndicator({
      parent: this
    });
    this.scrollNavigator = new pageflow.DomOrderScrollNavigator(this, pageflow.entryData);
    pageflow.AdjacentPreloader.create(function () {
      return pages;
    }, this.scrollNavigator).attach(pageflow.events);
    pageflow.SuccessorPreparer.create(function () {
      return pages;
    }, this.scrollNavigator).attach(pageflow.events);
  };

  pageflow.Slideshow.setup = function (options) {
    function configurationsById(pages) {
      return _.reduce(pages, function (memo, page) {
        memo[page.id] = page.configuration;
        return memo;
      }, {});
    }

    pageflow.slides = new pageflow.Slideshow(options.element, configurationsById(options.pages));
    pageflow.features.enable('slideshow', options.enabledFeatureNames || []);
    pageflow.atmo = pageflow.Atmo.create(pageflow.slides, pageflow.events, pageflow.audio, pageflow.backgroundMedia);
    pageflow.history = pageflow.History.create(pageflow.slides, {
      simulate: options.simulateHistory
    });

    if (options.beforeFirstUpdate) {
      options.beforeFirstUpdate();
    }

    pageflow.slides.update({
      landingPagePermaId: pageflow.history.getLandingPagePermaId()
    });
    pageflow.history.start();
    return pageflow.slides;
  };

  (function () {
    var attributeName = 'atmo_audio_file_id';
    pageflow.Atmo = pageflow.Object.extend({
      initialize: function initialize(options) {
        this.slideshow = options.slideshow;
        this.multiPlayer = options.multiPlayer;
        this.backgroundMedia = options.backgroundMedia;
        this.disabled = pageflow.browser.has('mobile platform');
        this.listenTo(options.events, 'page:change page:update background_media:unmute', function () {
          this.update();
        });
        this.listenTo(options.multiPlayer, 'playfailed', function () {
          options.backgroundMedia.mute();
        });
      },
      disable: function disable() {
        this.disabled = true;
        this.multiPlayer.fadeOutAndPause();
        pageflow.events.trigger('atmo:disabled');
      },
      enable: function enable() {
        this.disabled = false;
        this.update();
        pageflow.events.trigger('atmo:enabled');
      },
      pause: function pause() {
        if (pageflow.browser.has('volume control support')) {
          return this.multiPlayer.fadeOutAndPause();
        } else {
          this.multiPlayer.pause();
        }
      },
      turnDown: function turnDown() {
        if (pageflow.browser.has('volume control support')) {
          return this.multiPlayer.changeVolumeFactor(0.2);
        } else {
          this.multiPlayer.pause();
        }
      },
      resume: function resume() {
        if (this.multiPlayer.paused()) {
          if (this.disabled || this.backgroundMedia.muted) {
            return new $.Deferred().resolve().promise();
          } else {
            return this.multiPlayer.resumeAndFadeIn();
          }
        } else {
          return this.multiPlayer.changeVolumeFactor(1);
        }
      },
      update: function update() {
        var configuration = this.slideshow.currentPageConfiguration();

        if (!this.disabled) {
          if (this.backgroundMedia.muted) {
            this.multiPlayer.fadeOutAndPause();
          } else {
            this.multiPlayer.fadeTo(configuration[attributeName]);
          }
        }
      },
      createMediaPlayerHooks: function createMediaPlayerHooks(configuration) {
        var atmo = this;
        return {
          before: function before() {
            if (configuration.atmo_during_playback === 'mute') {
              atmo.pause();
            } else if (configuration.atmo_during_playback === 'turn_down') {
              atmo.turnDown();
            }
          },
          after: function after() {
            atmo.resume();
          }
        };
      }
    });

    pageflow.Atmo.create = function (slideshow, events, audio, backgroundMedia) {
      return new pageflow.Atmo({
        slideshow: slideshow,
        events: events,
        backgroundMedia: backgroundMedia,
        multiPlayer: audio.createMultiPlayer({
          loop: true,
          fadeDuration: 500,
          crossFade: true,
          playFromBeginning: false,
          rewindOnChange: true,
          pauseInBackground: true
        })
      });
    };

    pageflow.Atmo.duringPlaybackModes = ['play', 'mute', 'turn_down'];
  })();

  (function ($) {
    var creatingMethods = ['reinit', 'reactivate', 'activate', 'activateAsLandingPage', 'preload', 'prepare', 'linkedPages'];
    var ignoredMethods = ['cleanup', 'refreshScroller', 'resize', 'deactivate', 'unprepare', 'isPageChangeAllowed'];
    var prototype = {
      _create: function _create() {
        this.configuration = this.element.data('configuration') || this.options.configuration;
        this.index = this.options.index;
      },
      _destroy: function _destroy() {
        this.isDestroyed = true;
      },
      _ensureCreated: function _ensureCreated() {
        this.created = true;
        this.element.nonLazyPage(this.options);
      },
      _delegateToInner: function _delegateToInner(method, args) {
        return this.element.nonLazyPage.apply(this.element, [method].concat([].slice.call(args)));
      },
      getPermaId: function getPermaId() {
        return parseInt(this.element.attr('id'), 10);
      },
      getConfiguration: function getConfiguration() {
        return this.configuration;
      },
      update: function update(configuration) {
        if (this.created) {
          this._delegateToInner('update', arguments);
        } else {
          _.extend(this.configuration, configuration.attributes);
        }
      }
    };

    _(creatingMethods).each(function (method) {
      prototype[method] = function () {
        this._ensureCreated();

        return this._delegateToInner(method, arguments);
      };
    });

    _(ignoredMethods).each(function (method) {
      prototype[method] = function () {
        if (this.created) {
          return this._delegateToInner(method, arguments);
        }
      };
    });

    $.widget('pageflow.page', prototype);
  })($);

  /**
   * Utility functions for page types that dynamically switch to a two
   * column layout where some kind of embed is displayed next to the
   * text (i.e. `pageflow-chart` and `pageflow-embedded-video`).
   *
   * Works closely with the `page-with_split_layout` CSS class (see
   * `pageflow/themes/default/page/line_lengths.scss`).
   *
   * @since 12.2
   */
  pageflow.pageSplitLayout = function () {
    return {
      /**
       * Determine if the page is wide enough to display two columns.
       *
       * @memberof pageflow.pageSplitLayout
       */
      pageIsWideEnough: function pageIsWideEnough(pageElement) {
        var pageClientRect = pageElement[0].getBoundingClientRect();
        var contentClientRect = getContentClientRect(pageElement, pageClientRect);
        var spaceRightFromTitle = pageClientRect.right - contentClientRect.right;
        var spaceLeftFromTitle = contentClientRect.left - pageClientRect.left;
        var leftPositionedEmbedWidth = pageClientRect.width * 0.51;
        var rightPositionedEmbedWidth = pageClientRect.width * 0.55;
        return spaceLeftFromTitle >= leftPositionedEmbedWidth || spaceRightFromTitle >= rightPositionedEmbedWidth;
      }
    };

    function getContentClientRect(pageElement, pageClientRect) {
      var pageTitle = pageElement.find('.page_header-title');
      var pageText = pageElement.find('.page_text .paragraph');
      var pageTitleClientRect = pageTitle[0].getBoundingClientRect();
      var pageTextClientRect = pageText[0].getBoundingClientRect();
      var contentRight;
      var contentLeft;

      if (isTitleHidden(pageTitleClientRect)) {
        contentRight = pageTextClientRect.right;
        contentLeft = pageTextClientRect.left;
      } else {
        contentRight = Math.max(pageTitleClientRect.right, pageTextClientRect.right);
        contentLeft = pageTitleClientRect.left;
      }

      var contentTranslation = getContentTranslationCausedByHiddenText(pageElement, pageClientRect);
      return {
        right: contentRight - contentTranslation,
        left: contentLeft - contentTranslation
      };
    }

    function isTitleHidden(pageTitleClientRect) {
      return pageTitleClientRect.width === 0;
    }

    function getContentTranslationCausedByHiddenText(pageElement, pageClientRect) {
      var contentWrapper = pageElement.find('.content_wrapper');
      var contentWrapperClientRect = contentWrapper[0].getBoundingClientRect();
      var contentWrapperMarginInsidePage = contentWrapper[0].offsetLeft;
      var nonTranslatedContentWrapperLeft = pageClientRect.left + contentWrapperMarginInsidePage;
      return contentWrapperClientRect.left - nonTranslatedContentWrapperLeft;
    }
  }();

  (function ($) {
    $.widget('pageflow.nonLazyPage', {
      widgetEventPrefix: 'page',
      _create: function _create() {
        this.configuration = this.element.data('configuration') || this.options.configuration;
        this.index = this.options.index;

        this._setupNearBoundaryCssClasses();

        this._setupContentLinkTargetHandling();

        this.reinit();
      },
      getPermaId: function getPermaId() {
        return parseInt(this.element.attr('id'), 10);
      },
      getConfiguration: function getConfiguration() {
        return this.configuration;
      },
      update: function update(configuration) {
        _.extend(this.configuration, configuration.attributes);

        this.pageType.update(this.element, configuration);
      },
      reinit: function reinit() {
        this.pageType = pageflow.pageType.get(this.element.data('template'));
        this.element.data('pageType', this.pageType);
        this.preloaded = false;

        if (this.pageType.scroller === false) {
          this.content = $();
        } else {
          this.content = this.element.find('.scroller');
        }

        this.content.scroller(this.pageType.scrollerOptions || {});
        this.pageType.scroller = this.content.scroller('instance');
        this.pageType.scrollIndicator = new pageflow.ScrollIndicator(this.element);

        this._setupHideTextOnSwipe();

        this._triggerPageTypeHook('enhance');

        this._trigger('enhanced');
      },
      reactivate: function reactivate() {
        if (this.element.hasClass('active')) {
          this.preload();
          this.content.scroller('enable');
          this.content.scroller('resetPosition');
          this.content.scroller('afterAnimationHook');

          this._triggerPageTypeHook('activating');

          this._triggerDelayedPageTypeHook('activated');
        }
      },
      cleanup: function cleanup() {
        this._triggerPageTypeHook('deactivating');

        this._triggerDelayedPageTypeHook('deactivated');

        this._triggerPageTypeHook('cleanup');
      },
      refreshScroller: function refreshScroller() {
        this.content.scroller('refresh');
      },
      resize: function resize() {
        this._triggerPageTypeHook('resize');
      },
      activateAsLandingPage: function activateAsLandingPage() {
        this.element.addClass('active');
        this.content.scroller('enable');
        this.content.scroller('resetPosition');
        this.content.scroller('afterAnimationHook');

        this._trigger('activate', null, {
          page: this
        });

        this._triggerPageTypeHook('activating');

        this._triggerDelayedPageTypeHook('activated');
      },
      prepare: function prepare() {
        this._triggerPageTypeHook('prepare');
      },
      unprepare: function unprepare() {
        this._triggerPageTypeHook('unprepare');
      },
      prepareNextPageTimeout: function prepareNextPageTimeout() {
        return this.pageType.prepareNextPageTimeout;
      },
      linkedPages: function linkedPages() {
        return this._triggerPageTypeHook('linkedPages');
      },
      isPageChangeAllowed: function isPageChangeAllowed(options) {
        return this._triggerPageTypeHook('isPageChangeAllowed', options);
      },
      preload: function preload() {
        var page = this;

        if (!this.preloaded) {
          this.preloaded = true;
          return $.when(this._triggerPageTypeHook('preload')).then(function () {
            page._trigger('preloaded');
          });
        }
      },
      activate: function activate(options) {
        options = options || {};
        setTimeout(_.bind(function () {
          this.element.addClass('active');
        }, this), 0);
        var duration = this.animateTransition('in', options, function () {
          this.content.scroller('enable');
          this.content.scroller('afterAnimationHook');

          this._triggerDelayedPageTypeHook('activated');
        });
        this.content.scroller('resetPosition', {
          position: options.position
        });

        this._trigger('activate', null, {
          page: this
        });

        this._triggerPageTypeHook('activating', {
          position: options.position
        });

        return duration;
      },
      deactivate: function deactivate(options) {
        options = options || {};
        this.element.removeClass('active');
        var duration = this.animateTransition('out', options, function () {
          this._triggerPageTypeHook('deactivated');
        });
        this.content.scroller('disable');

        this._trigger('deactivate');

        this._triggerPageTypeHook('deactivating');

        return duration;
      },
      animateTransition: function animateTransition(destination, options, callback) {
        var otherDestination = destination === 'in' ? 'out' : 'in';
        var transition = pageflow.pageTransitions.get(options.transition || this.configuration.transition || 'fade');
        var animateClass = transition.className + ' animate-' + destination + '-' + options.direction;
        this.element.removeClass('animate-' + otherDestination + '-forwards animate-' + otherDestination + '-backwards').addClass(animateClass);
        setTimeout(_.bind(function () {
          this.element.removeClass(animateClass);
          callback.call(this);
        }, this), transition.duration);
        return transition.duration;
      },
      _triggerDelayedPageTypeHook: function _triggerDelayedPageTypeHook(name) {
        var that = this;
        var handle = pageflow.delayedStart.wait(function () {
          that._triggerPageTypeHook(name);
        });
        this.element.one('pagedeactivate', function () {
          handle.cancel();
        });
      },
      _triggerPageTypeHook: function _triggerPageTypeHook(name, options) {
        return this.pageType[name](this.element, this.configuration, options || {});
      },
      _setupHideTextOnSwipe: function _setupHideTextOnSwipe() {
        if (pageflow.entryData.getThemingOption('hide_text_on_swipe') && !pageflow.navigationDirection.isHorizontal() && !this.pageType.noHideTextOnSwipe) {
          this.element.hideTextOnSwipe({
            eventTargetSelector: // legacy ERB pages
            '.content > .scroller,' + // React based pages
            '.content > .scroller-wrapper > .scroller,' + // internal links/text page
            '.content.scroller'
          });
        }
      },
      _setupNearBoundaryCssClasses: function _setupNearBoundaryCssClasses() {
        var element = this.element;

        _(['top', 'bottom']).each(function (boundary) {
          element.on('scrollernear' + boundary, function () {
            element.addClass('is_near_' + boundary);
          });
          element.on('scrollernotnear' + boundary, function () {
            element.removeClass('is_near_' + boundary);
          });
        });
      },
      _setupContentLinkTargetHandling: function _setupContentLinkTargetHandling() {
        this._on({
          'click .page_text .paragraph a': function clickPage_textParagraphA(event) {
            var href = $(event.currentTarget).attr('href');
            var target = PAGEFLOW_EDITOR ? '_blank' : $(event.currentTarget).attr('target');

            if (href[0] === '#') {
              pageflow.slides.goToByPermaId(href.substr(1));
            } else {
              // There was a time when the rich text editor did not add
              // target attributes to inline links even though it should
              // have. Ensure all content links to external urls open in
              // new tab, except explicitly specified otherwise by editor.
              window.open(href, target || '_blank');
            }

            event.preventDefault();
          }
        });
      }
    });
  })($);

  (function ($) {
    /**
     * Wrapper widget around iScroll adding special bump events which
     * are triggered when scrolling to the very top or very bottom
     * (called boundary posititon below).
     * @private
     */
    $.widget('pageflow.scroller', {
      dragThreshold: 50,
      maxXDelta: 50,
      maxYDelta: 50,
      doubleBumpThreshold: 500,
      _create: function _create() {
        this.eventListenerTarget = this.options.eventListenerTarget ? $(this.options.eventListenerTarget) : this.element;
        this.iscroll = new IScroll(this.element[0], _.extend({
          mouseWheel: true,
          bounce: false,
          keyBindings: true,
          probeType: 2,
          preventDefault: false,
          eventListenerTarget: this.eventListenerTarget[0]
        }, _.pick(this.options, 'freeScroll', 'scrollX', 'noMouseWheelScrollX')));
        this.iscroll.disable();

        if (pageflow.entryData.getThemingOption('page_change_by_scrolling')) {
          this._initMousewheelBump('up');

          this._initMousewheelBump('down');

          this._initDragGestureBump();
        }

        this._initKeyboardBump('up');

        this._initKeyboardBump('down');

        this._initNearBottomEvents();

        this._initNearTopEvents();

        this._initMoveEvents();

        this._onScrollEndCallbacks = new $.Callbacks();
      },
      enable: function enable() {
        this.iscroll.enable();
        this.iscroll.refresh();
      },
      resetPosition: function resetPosition(options) {
        options = options || {};
        this.iscroll.refresh();

        if (options.position === 'bottom') {
          this.iscroll.scrollTo(0, this.iscroll.maxScrollY, 0);
        } else {
          this.iscroll.scrollTo(0, 0, 0);
        }

        this._triggerBoundaryEvents();
      },
      scrollBy: function scrollBy(deltaX, deltaY, time, easing) {
        this.scrollTo(this.iscroll.x + deltaX, this.iscroll.y + deltaY, time, easing);
      },
      scrollTo: function scrollTo(x, y, time, easing) {
        this.iscroll.scrollTo(Math.max(Math.min(x, 0), this.iscroll.maxScrollX), Math.max(Math.min(y, 0), this.iscroll.maxScrollY), time, easing);

        this._onScrollEndCallbacks.fire();
      },
      refresh: function refresh() {
        this.iscroll.refresh();
      },
      afterAnimationHook: function afterAnimationHook() {
        this._triggerBoundaryEvents();
      },
      disable: function disable() {
        this.iscroll.disable();
      },
      positionX: function positionX() {
        return this.iscroll.x;
      },
      positionY: function positionY() {
        return this.iscroll.y;
      },
      maxX: function maxX() {
        return this.iscroll.maxScrollX;
      },
      maxY: function maxY() {
        return this.iscroll.maxScrollY;
      },
      onScroll: function onScroll(callback) {
        this.iscroll.on('scroll', callback);
      },
      onScrollEnd: function onScrollEnd(callback) {
        this.iscroll.on('scrollEnd', callback);

        this._onScrollEndCallbacks.add(callback);
      },
      _initMoveEvents: function _initMoveEvents() {
        this.iscroll.on('mousewheelup', _.bind(this._triggerMoveEvent, this));
        this.iscroll.on('mousewheeldown', _.bind(this._triggerMoveEvent, this));
        this.iscroll.on('afterkeyboard', _.bind(this._triggerMoveEvent, this));
      },
      _triggerMoveEvent: function _triggerMoveEvent() {
        this._trigger('move');
      },
      _initNearBottomEvents: function _initNearBottomEvents() {
        this.iscroll.on('scroll', _.bind(this._triggerNearBottomEvents, this));
        this.iscroll.on('scrollEnd', _.bind(this._triggerNearBottomEvents, this));
        this.iscroll.on('afterkeyboard', _.bind(this._triggerNearBottomEvents, this));
      },
      _initNearTopEvents: function _initNearTopEvents() {
        this.iscroll.on('scroll', _.bind(this._triggerNearTopEvents, this));
        this.iscroll.on('scrollEnd', _.bind(this._triggerNearTopEvents, this));
        this.iscroll.on('afterkeyboard', _.bind(this._triggerNearTopEvents, this));
      },
      _triggerBoundaryEvents: function _triggerBoundaryEvents() {
        this._triggerNearTopEvents();

        this._triggerNearBottomEvents();
      },
      _triggerNearBottomEvents: function _triggerNearBottomEvents() {
        if (this._atBoundary('down', {
          delta: 50
        })) {
          this._trigger('nearbottom');
        } else {
          this._trigger('notnearbottom');
        }
      },
      _triggerNearTopEvents: function _triggerNearTopEvents() {
        if (this._atBoundary('up', {
          delta: 50
        })) {
          this._trigger('neartop');
        } else {
          this._trigger('notneartop');
        }
      },
      // Whenever the a mousewheel event is triggered, we test whether
      // the scroller is at the very top or at the very bottom. If so,
      // we trigger a hintdown or hintup event the first time the mouse
      // wheel turns and a bumpup or bumpdown event when the mouse wheel
      // is turned to times in a short period of time.
      _initMousewheelBump: function _initMousewheelBump(direction) {
        var firstBump = false;
        this.iscroll.on('mousewheel' + direction, _.bind(function () {
          if (!this._atBoundary(direction)) {
            return;
          }

          if (firstBump) {
            this._trigger('bump' + direction);

            firstBump = false;
            clearTimeout(this.waitForSecondBump);
          } else {
            this._trigger('hint' + direction);

            firstBump = true;
            this.waitForSecondBump = setTimeout(function () {
              firstBump = false;
            }, this.doubleBumpThreshold);
          }
        }, this));
      },
      // Trigger bumpup or bumpdown event when the a up/down key is
      // pressed while the scroller in boundary position.
      _initKeyboardBump: function _initKeyboardBump(direction) {
        this.iscroll.on('keyboard' + direction, _.bind(function (event) {
          if (this._atBoundary(direction)) {
            // Make sure other iScrolls which might be enabled by the
            // bump event do not process the keyboard event again.
            event.stopImmediatePropagation();

            this._trigger('bump' + direction);
          }
        }, this));
        this.iscroll.on('keyboardhint' + direction, _.bind(function () {
          if (this._atBoundary(direction)) {
            this._trigger('hint' + direction);
          }
        }, this));
      },
      // Trigger bumpup or bumpdown when the user drags the page from a
      // boundary position. Trigger bumpleft or bumpright if user drags
      // horizontally.
      _initDragGestureBump: function _initDragGestureBump() {
        var allowUp = false,
            allowDown = false,
            allowLeft = false,
            allowRight = false,
            startX,
            startY;
        this.eventListenerTarget.on('touchstart MSPointerDown pointerdown', _.bind(function (event) {
          var point = event.originalEvent.touches ? event.originalEvent.touches[0] : event.originalEvent;
          startX = point.pageX;
          startY = point.pageY;

          if (!this._isNonTouchPointer(event)) {
            allowDown = this._atBoundary('down');
            allowUp = this._atBoundary('up');
            allowLeft = true;
            allowRight = true;
          }
        }, this));
        this.eventListenerTarget.on('touchmove MSPointerMove pointermove', _.bind(function (event) {
          var point = event.originalEvent.touches ? event.originalEvent.touches[0] : event.originalEvent;
          var deltaX = point.pageX - startX;
          var deltaY = point.pageY - startY;

          if (Math.abs(deltaX) > this.maxXDelta) {
            allowDown = allowUp = false;
          }

          if (Math.abs(deltaY) > this.maxYDelta) {
            allowLeft = allowRight = false;
          }

          if (allowUp && deltaY > this.dragThreshold) {
            this._trigger('bumpup');

            allowDown = allowUp = allowLeft = allowRight = false;
          } else if (allowDown && deltaY < -this.dragThreshold) {
            this._trigger('bumpdown');

            allowDown = allowUp = allowLeft = allowRight = false;
          } else if (allowLeft && deltaX > this.dragThreshold) {
            this._trigger('bumpleft');

            allowDown = allowUp = allowLeft = allowRight = false;
          } else if (allowRight && deltaX < -this.dragThreshold) {
            this._trigger('bumpright');

            allowDown = allowUp = allowLeft = allowRight = false;
          }
        }, this));
        this.eventListenerTarget.on('touchend MSPointerUp pointerup', _.bind(function (event) {
          var point = event.originalEvent.touches ? event.originalEvent.changedTouches[0] : event.originalEvent;
          var deltaX = point.pageX - startX;
          var deltaY = point.pageY - startY;

          if (allowUp && deltaY > 0) {
            this._trigger('hintup');
          } else if (allowDown && deltaY < 0) {
            this._trigger('hintdown');
          }

          if (allowLeft && deltaX > 0) {
            this._trigger('hintleft');
          } else if (allowRight && deltaX < 0) {
            this._trigger('hintright');
          }
        }, this));
      },
      _isNonTouchPointer: function _isNonTouchPointer(event) {
        return event.originalEvent.pointerType && event.originalEvent.pointerType !== event.originalEvent.MSPOINTER_TYPE_TOUCH && event.originalEvent.pointerType !== 'touch';
      },
      // Checks whether the scroller is at the very top or very bottom.
      _atBoundary: function _atBoundary(direction, options) {
        options = options || {};
        var delta = options.delta || 0;

        if (direction === 'up') {
          return this.iscroll.y >= -delta;
        } else {
          return this.iscroll.y <= this.iscroll.maxScrollY + delta;
        }
      }
    });
  })($);

  pageflow.ScrollIndicator = pageflow.Object.extend({
    initialize: function initialize(pageElement) {
      this.pageElement = pageElement;
    },
    disable: function disable() {
      if (this._isPageActive()) {
        pageflow.events.trigger('scroll_indicator:disable');
      }
    },
    scheduleDisable: function scheduleDisable() {
      if (this._isPageActive()) {
        pageflow.events.trigger('scroll_indicator:schedule_disable');
      }
    },
    enable: function enable(text) {
      if (this._isPageActive()) {
        pageflow.events.trigger('scroll_indicator:enable');
      }
    },
    _isPageActive: function _isPageActive() {
      return this.pageElement.hasClass('active');
    }
  });

  (function ($) {
    var boundaries = {
      back: 'top',
      next: 'bottom'
    };
    $.widget('pageflow.scrollIndicator', {
      _create: function _create() {
        var parent = this.options.parent,
            direction = this.element.data('direction'),
            boundary = boundaries[direction],
            that = this,
            fadeTimeout;

        function update(page) {
          that.element.toggleClass('hidden_by_scoll_indicator_mode', hiddenByMode(page));
          that.element.toggleClass('hidden_for_page', hideScrollIndicatorForPage(page));
          that.element.toggleClass('invert', invertIndicator(page));
          that.element.toggleClass('horizontal', page.hasClass('scroll_indicator_orientation_horizontal'));
          that.element.toggleClass('available', targetPageExists());
        }

        function hiddenByMode(page) {
          return page.hasClass('scroll_indicator_mode_non') || page.hasClass('scroll_indicator_mode_only_next') && direction === 'back' || page.hasClass('scroll_indicator_mode_only_back') && direction === 'next';
        }

        function invertIndicator(page) {
          var result = page.data('invertIndicator');

          if (typeof result === 'undefined') {
            result = page.hasClass('invert') && !hasSlimPlayerControls(page);
          }

          return result;
        }

        function hideScrollIndicatorForPage(page) {
          return hasSlimPlayerControls(page) || !pageflow.widgets.areLoaded();
        }

        function hasSlimPlayerControls(page) {
          return hasPlayerControls(page) && pageflow.widgets.isPresent('slim_player_controls');
        }

        function hasPlayerControls(page) {
          return !!page.find('[data-role="player_controls"]').length;
        }

        function targetPageExists() {
          return direction === 'next' ? parent.nextPageExists() : parent.previousPageExists();
        }

        parent.on('pageactivate', function (event) {
          update($(event.target));
          clearTimeout(fadeTimeout);
          that.element.removeClass('faded');
        });
        pageflow.events.on({
          'page:update': function pageUpdate() {
            update(parent.currentPage());
          },
          'scroll_indicator:disable': function scroll_indicatorDisable() {
            clearTimeout(fadeTimeout);
            that.element.addClass('hidden_for_page');
          },
          'scroll_indicator:schedule_disable': function scroll_indicatorSchedule_disable() {
            clearTimeout(fadeTimeout);
            fadeTimeout = setTimeout(function () {
              that.element.addClass('faded');
            }, 2000);
          },
          'scroll_indicator:enable': function scroll_indicatorEnable() {
            clearTimeout(fadeTimeout);
            that.element.removeClass('faded hidden_for_page');
          }
        });
        parent.on(pageflow.navigationDirection.getEventName('scrollerhint' + direction), function () {
          that.element.addClass('animate');
          setTimeout(function () {
            that.element.removeClass('animate');
          }, 500);
        });
        parent.on('scrollernear' + boundary, function (event) {
          var page = $(event.target).parents('section');

          if (page.hasClass('active')) {
            that.element.toggleClass('visible', targetPageExists());
          }
        });
        parent.on('scrollernotnear' + boundary + ' slideshowchangepage', function () {
          that.element.removeClass('visible');
        });
        $.when(pageflow.ready, pageflow.delayedStart.promise()).done(function () {
          setTimeout(function () {
            that.element.addClass('attract');
            setTimeout(function () {
              that.element.removeClass('attract');
            }, 1500);
          }, 3000);
        });
        this.element.on('click', function () {
          if (direction === 'next') {
            parent.next();
          } else {
            parent.back();
          }
        });
      }
    });
  })($);

  (function ($) {
    $.widget('pageflow.hiddenTextIndicator', {
      _create: function _create() {
        var parent = this.options.parent,
            that = this;
        parent.on('pageactivate', function (event) {
          var pageOrPageWrapper = $(event.target).add('.content_and_background', event.target);
          that.element.toggleClass('invert', $(event.target).hasClass('invert'));
          that.element.toggleClass('hidden', pageOrPageWrapper.hasClass('hide_content_with_text') || pageOrPageWrapper.hasClass('no_hidden_text_indicator'));
        });
        parent.on('hidetextactivate', function () {
          that.element.addClass('visible');
        });
        parent.on('hidetextdeactivate', function () {
          that.element.removeClass('visible');
        });
      }
    });
  })($);

  pageflow.AdjacentPages = pageflow.Object.extend({
    initialize: function initialize(pages, scrollNavigator) {
      this.pages = pages;
      this.scrollNavigator = scrollNavigator;
    },
    of: function of(page) {
      var result = [];
      var pages = this.pages();
      var nextPage = this.nextPage(page);

      if (nextPage) {
        result.push(nextPage);
      }

      _(page.linkedPages()).each(function (permaId) {
        var linkedPage = pages.filter('#' + permaId);

        if (linkedPage.length) {
          result.push(linkedPage.page('instance'));
        }
      }, this);

      return result;
    },
    nextPage: function nextPage(page) {
      var nextPage = this.scrollNavigator.getNextPage(page.element, this.pages());
      return nextPage.length && nextPage.page('instance');
    }
  });

  pageflow.AdjacentPreloader = pageflow.Object.extend({
    initialize: function initialize(adjacentPages) {
      this.adjacentPages = adjacentPages;
    },
    attach: function attach(events) {
      this.listenTo(events, 'page:change', this.preloadAdjacent);
    },
    preloadAdjacent: function preloadAdjacent(page) {
      _(this.adjacentPages.of(page)).each(function (page) {
        page.preload();
      });
    }
  });

  pageflow.AdjacentPreloader.create = function (pages, scrollNavigator) {
    return new pageflow.AdjacentPreloader(new pageflow.AdjacentPages(pages, scrollNavigator));
  };

  pageflow.SuccessorPreparer = pageflow.Object.extend({
    initialize: function initialize(adjacentPages) {
      this.adjacentPages = adjacentPages;
    },
    attach: function attach(events) {
      this.listenTo(events, 'page:change', this.schedule);
    },
    schedule: function schedule(page) {
      clearTimeout(this.scheduleTimeout);

      var prepare = _.bind(this.prepareSuccessor, this, page);

      this.scheduleTimeout = setTimeout(prepare, page.prepareNextPageTimeout());
    },
    prepareSuccessor: function prepareSuccessor(page) {
      var preparedPages = _.compact([page, this.adjacentPages.nextPage(page)]);

      var noLongerPreparedPages = _.difference(this.lastPreparedPages, preparedPages);

      var newAdjacentPages = _.difference(preparedPages, this.lastPreparedPages);

      _(noLongerPreparedPages).each(function (page) {
        if (!page.isDestroyed) {
          page.unprepare();
        }
      });

      _(newAdjacentPages).each(function (adjacentPage) {
        adjacentPage.prepare();
      });

      this.lastPreparedPages = preparedPages;
    }
  });

  pageflow.SuccessorPreparer.create = function (pages, scrollNavigator) {
    return new pageflow.SuccessorPreparer(new pageflow.AdjacentPages(pages, scrollNavigator));
  };

  (function ($) {
    $.widget('pageflow.swipeGesture', {
      _create: function _create() {
        var startX, startY, startTime, distX, distY;
        this.options = _.extend({
          orientation: 'x',
          minDist: 100,
          maxOrthogonalDist: 50,
          maxDuration: 500
        }, this.options);
        var selector = this.options.eventTargetSelector;
        this.element.on('touchstart MSPointerDown pointerdown', selector, _.bind(function (event) {
          if (isNonTouchPointer(event)) {
            return;
          }

          var point = event.originalEvent.touches ? event.originalEvent.touches[0] : event.originalEvent;
          startX = point.pageX;
          startY = point.pageY;
          distX = 0;
          distY = 0;
          startTime = new Date().getTime();
        }, this));
        this.element.on('touchmove MSPointerMove pointermove', selector, _.bind(function (event) {
          if (isNonTouchPointer(event)) {
            return;
          }

          var point = event.originalEvent.touches ? event.originalEvent.touches[0] : event.originalEvent;
          distX = point.pageX - startX;
          distY = point.pageY - startY;
        }, this));
        this.element.on('touchend MSPointerUp pointerup', selector, _.bind(function (event) {
          if (isNonTouchPointer(event)) {
            return;
          }

          var elapsedTime = new Date().getTime() - startTime;
          var dist = this.options.orientation === 'x' ? distX : distY;
          var orthogonalDist = this.options.orientation === 'x' ? distY : distX;

          if (Math.abs(dist) > this.options.minDist && Math.abs(orthogonalDist) < this.options.maxOrthogonalDist && elapsedTime < this.options.maxDuration) {
            if (this.options.orientation === 'x') {
              this._trigger(dist > 0 ? 'right' : 'left');
            } else {
              this._trigger(dist > 0 ? 'down' : 'up');
            }
          }
        }, this));

        function isNonTouchPointer(event) {
          return event.originalEvent.pointerType && event.originalEvent.pointerType !== event.originalEvent.MSPOINTER_TYPE_TOUCH && event.originalEvent.pointerType !== 'touch';
        }
      }
    });
  })($);

  pageflow.hideText = function () {
    function element() {
      return $('body');
    }

    function prefix(event) {
      return _.map(event.split(' '), function (e) {
        return 'hidetext' + e;
      }).join(' ');
    }

    $(function () {
      element().on('keydown', function (event) {
        if (event.keyCode == 27) {
          pageflow.hideText.deactivate();
        }
      });
    });
    return {
      isActive: function isActive() {
        return element().hasClass('hideText');
      },
      toggle: function toggle() {
        if (this.isActive()) {
          this.deactivate();
        } else {
          this.activate();
        }
      },
      activate: function activate() {
        if (!this.isActive()) {
          element().addClass('hideText');
          element().trigger('hidetextactivate');
        }
      },
      deactivate: function deactivate() {
        if (this.isActive()) {
          element().removeClass('hideText');
          element().trigger('hidetextdeactivate');
        }
      },
      on: function on(event, callback) {
        element().on(prefix(event), callback);
      },
      off: function off(event, callback) {
        element().off(prefix(event), callback);
      }
    };
  }();

  (function ($) {
    $.widget('pageflow.hideTextOnSwipe', {
      _create: function _create() {
        this.element.swipeGesture({
          orientation: 'x',
          eventTargetSelector: this.options.eventTargetSelector
        });
        this.element.on('swipegestureleft', function () {
          pageflow.hideText.activate();
        });
        this.element.on('touchstart MSPointerDown pointerdown mousedown', this.options.eventTargetSelector, function () {
          if (pageflow.hideText.isActive()) {
            pageflow.hideText.deactivate();
          }
        });
        this.element.on('scrollermove', function () {
          if (pageflow.hideText.isActive()) {
            pageflow.hideText.deactivate();
          }
        });
      }
    });
  })($);

  pageflow.DomOrderScrollNavigator = function (slideshow, entryData) {
    this.getLandingPage = function (pages) {
      return pages.first();
    };

    this.back = function (currentPage, pages) {
      var position = 'bottom';
      var previousPage = this.getPreviousPage(currentPage, pages);

      if (previousPage.is(getParentPage(currentPage, pages))) {
        position = null;
      }

      slideshow.goTo(previousPage, {
        position: position,
        ignoreInHistory: true
      });
    };

    this.next = function (currentPage, pages) {
      slideshow.goTo(this.getNextPage(currentPage, pages), {
        ignoreInHistory: true
      });
    };

    this.nextPageExists = function (currentPage, pages) {
      return !!this.getNextPage(currentPage, pages).length;
    };

    this.previousPageExists = function (currentPage, pages) {
      return !!this.getPreviousPage(currentPage, pages).length;
    };

    this.getNextPage = function (currentPage, pages) {
      var currentPageIndex = pages.index(currentPage);
      var nextPage = currentPageIndex < pages.length - 1 ? $(pages.get(currentPageIndex + 1)) : $();

      if (sameStoryline(currentPage, nextPage)) {
        return nextPage;
      }

      var scrollSuccessor = getScrollSuccessor(currentPage, pages);

      if (scrollSuccessor.length) {
        return scrollSuccessor;
      }

      return getParentPage(currentPage, pages);
    };

    this.getPreviousPage = function (currentPage, pages) {
      var currentPageIndex = pages.index(currentPage);
      var previousPage = currentPageIndex > 0 ? $(pages.get(currentPageIndex - 1)) : $();

      if (sameStoryline(currentPage, previousPage)) {
        return previousPage;
      }

      return getParentPage(currentPage, pages);
    };

    this.getTransitionDirection = function (previousPage, currentPage, pages, options) {
      return pages.index(currentPage) > pages.index(previousPage) ? 'forwards' : 'backwards';
    };

    this.getDefaultTransition = function (previousPage, currentPage, pages) {
      if (inParentStorylineOf(currentPage, previousPage, pages)) {
        return getStorylinePageTransition(currentPage);
      } else if (inParentStorylineOf(previousPage, currentPage, pages)) {
        return getStorylinePageTransition(previousPage);
      }
    };

    function inParentStorylineOf(page, otherPage, pages) {
      var parentPage = getParentPage(page, pages);
      return entryData.getStorylineIdByPagePermaId(parentPage.page('getPermaId')) == entryData.getStorylineIdByPagePermaId(otherPage.page('getPermaId'));
    }

    function sameStoryline(page1, page2) {
      return entryData.getStorylineIdByPagePermaId(page1.page('getPermaId')) == entryData.getStorylineIdByPagePermaId(page2.page('getPermaId'));
    }

    function getParentPage(page, pages) {
      var storylineConfiguration = getStorylineConfiguration(page);

      if ('parent_page_perma_id' in storylineConfiguration && entryData.getThemingOption('change_to_parent_page_at_storyline_boundary')) {
        return pages.filter('#' + storylineConfiguration.parent_page_perma_id);
      }

      return $();
    }

    function getStorylinePageTransition(page) {
      var storylineConfiguration = getStorylineConfiguration(page);
      return storylineConfiguration.page_transition || 'scroll_over_from_right';
    }

    function getScrollSuccessor(page, pages) {
      var storylineConfiguration = getStorylineConfiguration(page);

      if ('scroll_successor_id' in storylineConfiguration) {
        return pages.filter('#' + storylineConfiguration.scroll_successor_id);
      }

      return $();
    }

    function getStorylineConfiguration(page) {
      var permaId = page.page('getPermaId');
      var storylineId = entryData.getStorylineIdByPagePermaId(permaId);
      return entryData.getStorylineConfiguration(storylineId);
    }
  };

  pageflow.navigationDirection = function () {
    var eventMapping = {
      v: {
        scrollerbumpnext: 'scrollerbumpdown',
        scrollerbumpback: 'scrollerbumpup',
        scrollerhintnext: 'scrollerhintdown',
        scrollerhintback: 'scrollerhintup'
      },
      h: {
        scrollerbumpnext: 'scrollerbumpright',
        scrollerbumpback: 'scrollerbumpleft',
        scrollerhintnext: 'scrollerhintright',
        scrollerhintback: 'scrollerhintleft'
      }
    };
    return {
      isHorizontalOnPhone: function isHorizontalOnPhone() {
        return pageflow.widgets.isPresent('phone_horizontal_slideshow_mode');
      },
      isHorizontal: function isHorizontal() {
        return this.isHorizontalOnPhone() && pageflow.browser.has('phone platform');
      },
      getEventName: function getEventName(name) {
        var result = eventMapping[this.isHorizontal() ? 'h' : 'v'][name];

        if (!result) {
          throw 'Unknown event name ' + name;
        }

        return result;
      }
    };
  }();

  pageflow.PageTransitions = pageflow.Object.extend({
    initialize: function initialize(navigationDirection) {
      this.repository = {};
      this.navigationDirection = navigationDirection;
    },
    register: function register(name, options) {
      this.repository[name] = options;
    },
    get: function get(name) {
      var transition = this.repository[name];

      if (!transition) {
        throw 'Unknown page transition "' + name + '"';
      }

      return this.navigationDirection.isHorizontal() ? transition.h : transition.v;
    },
    names: function names() {
      return _.keys(this.repository);
    }
  });
  pageflow.pageTransitions = new pageflow.PageTransitions(pageflow.navigationDirection);
  pageflow.pageTransitions.register('fade', {
    v: {
      className: 'fade fade-v',
      duration: 1100
    },
    h: {
      className: 'fade fade-h',
      duration: 600
    }
  });
  pageflow.pageTransitions.register('crossfade', {
    v: {
      className: 'crossfade',
      duration: 1100
    },
    h: {
      className: 'crossfade crossfade-fast',
      duration: 600
    }
  });
  pageflow.pageTransitions.register('fade_to_black', {
    v: {
      className: 'fade_to_black',
      duration: 2100
    },
    h: {
      className: 'fade_to_black',
      duration: 2100
    }
  });
  pageflow.pageTransitions.register('cut', {
    v: {
      className: 'cut',
      duration: 1100
    },
    h: {
      className: 'cut',
      duration: 1100
    }
  });
  pageflow.pageTransitions.register('scroll', {
    v: {
      className: 'scroll scroll-in scroll-from_bottom',
      duration: 1100
    },
    h: {
      className: 'scroll scroll-in scroll-from_right scroll-fast',
      duration: 600
    }
  });
  pageflow.pageTransitions.register('scroll_right', {
    v: {
      className: 'scroll scroll-in scroll-from_right',
      duration: 1100
    },
    h: {
      className: 'scroll scroll-in scroll-from_bottom scroll-fast',
      duration: 600
    }
  });
  pageflow.pageTransitions.register('scroll_left', {
    v: {
      className: 'scroll scroll-in scroll-from_left',
      duration: 1100
    },
    h: {
      className: 'scroll scroll-in scroll-from_top scroll-fast',
      duration: 600
    }
  });
  pageflow.pageTransitions.register('scroll_over_from_right', {
    v: {
      className: 'scroll scroll-over scroll-from_right',
      duration: 1100
    },
    h: {
      className: 'scroll scroll-over scroll-from_bottom scroll-fast',
      duration: 600
    }
  });
  pageflow.pageTransitions.register('scroll_over_from_left', {
    v: {
      className: 'scroll scroll-over scroll-from_left',
      duration: 1100
    },
    h: {
      className: 'scroll scroll-over scroll-from_top scroll-fast',
      duration: 600
    }
  });

  pageflow.ready = new $.Deferred(function (readyDeferred) {
    var pagePreloaded = new $.Deferred(function (pagePreloadedDeferred) {
      $(document).one('pagepreloaded', pagePreloadedDeferred.resolve);
    }).promise();

    window.onload = function () {
      pageflow.browser.detectFeatures().then(function () {
        var slideshow = $('[data-role=slideshow]');
        var body = $('body');
        pageflow.Visited.setup();
        pagePreloaded.then(function () {
          readyDeferred.resolve();
          pageflow.events.trigger('ready');
        });
        slideshow.each(function () {
          pageflow.events.trigger('seed:loaded');
          pageflow.entryData = new pageflow.SeedEntryData(pageflow.seed);
          pageflow.Audio.setup({
            audioFiles: pageflow.audioFiles
          });
          pageflow.Slideshow.setup({
            element: $(this),
            pages: pageflow.pages,
            enabledFeatureNames: pageflow.enabledFeatureNames,
            beforeFirstUpdate: function beforeFirstUpdate() {
              $('.header').header({
                slideshow: pageflow.slides
              });
              $('.overview').overview();
              $('.multimedia_alert').multimediaAlert();
              pageflow.widgetTypes.enhance(body);
              pageflow.delayedStart.perform();
              pageflow.phoneLandscapeFullscreen();
            }
          });
        });
        pageflow.links.setup();
        pageflow.FocusOutline.setup(body);
        pageflow.nativeScrolling.preventScrollingOnEmbed(slideshow);
      });
    };
  }).promise();

  $(function ($) {
    $('body').on('click', 'a.navigation_main', function () {
      pageflow.events.trigger('button:header');
    });
    $('body').on('click', 'a.navigation_index', function () {
      pageflow.events.trigger('button:overview');
    });
    $('body').on('click', 'a.navigation_fullscreen', function () {
      pageflow.events.trigger('button:fullscreen');
    });
    $('body').on('click', '.mute a', function () {
      pageflow.events.trigger('button:mute');
    });
    $('body').on('click', 'a.share.facebook', function () {
      pageflow.events.trigger('share:facebook');
    });
    $('body').on('click', 'a.share.twitter', function () {
      pageflow.events.trigger('share:twitter');
    });
    $('body').on('click', 'a.share.google', function () {
      pageflow.events.trigger('share:google');
    });
    $('body').on('pageactivate', function (event, ui) {
      pageflow.events.trigger('page:change', ui.page);
    });
  });

  (function ($) {
    $.widget('pageflow.fullscreenButton', {
      _create: function _create() {
        pageflow.fullscreen.on('change', this.update, this);
        this.update();
        this.element.click(function () {
          pageflow.fullscreen.toggle();
        });

        if (!pageflow.fullscreen.isSupported()) {
          this.element.css('visibility', 'hidden');
        }
      },
      _destroy: function _destroy() {
        pageflow.fullscreen.off('change', this.update);
      },
      update: function update() {
        this.element.toggleClass('active', !!pageflow.fullscreen.isActive()).updateTitle();
      }
    });
  })($);

  $(function ($) {
    $.widget('pageflow.header', {
      _create: function _create() {
        var slideshow = this.options.slideshow,
            that = this;
        slideshow.on('pageactivate', function (event, options) {
          updateClasses(slideshow.currentPage());
        });
        slideshow.on('scrollerneartop', function (event) {
          var page = $(event.target).parents('section');

          if (page.is(slideshow.currentPage())) {
            that.element.addClass('near_top');
          }
        });
        slideshow.on('scrollernotneartop', function (event) {
          var page = $(event.target).parents('section');

          if (page.is(slideshow.currentPage())) {
            that.element.removeClass('near_top');
          }
        });

        if (slideshow.currentPage().length) {
          updateClasses(slideshow.currentPage());
        }

        this.element.addClass('near_top');
        this.element.find('.header input').placeholder();

        function updateClasses(page) {
          that.element.toggleClass('invert', page.hasClass('invert'));
          that.element.toggleClass('first_page', page.index() === 0);
        }
      }
    });
  });

  (function ($) {
    $.widget('pageflow.multimediaAlert', {
      _create: function _create() {
        var widget = this;

        function show() {
          widget.element.show();
          toggleContent(false);
        }

        function hide() {
          widget.element.hide();
          toggleContent(true);
        }

        function toggleContent(state) {
          $('.page .content').toggleClass('initially_hidden', !state);
          $('.slideshow .scroll_indicator').toggleClass('initially_hidden', !state);
        }

        pageflow.manualStart.required().then(function (start) {
          show();
          widget.element.find('.close').one('click', function () {
            hide();
            pageflow.backgroundMedia.unmute();
            pageflow.events.trigger('button:close_multimedia_alert');
            start();
            return false;
          });
        });
        pageflow.events.on('request:multimedia_alert', function () {
          show();
          widget.element.find('.close').one('click', function () {
            hide();
          });
        }, this);
        pageflow.nativeScrolling.preventScrollBouncing(this.element);
      }
    });
  })($);

  (function ($) {
    $.widget('pageflow.muteButton', {
      _create: function _create() {
        var element = this.element;
        var volumeBeforeMute = 1;
        element.on('click', toggleMute);
        pageflow.settings.on('change:volume', this.update, this);
        this.update();

        function toggleMute() {
          if (pageflow.settings.get('volume') > 0) {
            volumeBeforeMute = pageflow.settings.get('volume');
            pageflow.settings.set('volume', 0);
          } else {
            pageflow.settings.set('volume', volumeBeforeMute);
          }
        }
      },
      _destroy: function _destroy() {
        pageflow.settings.off('change:volume', this.update);
      },
      update: function update() {
        var volume = pageflow.settings.get('volume');

        if (volume === 0) {
          this.element.attr('title', this.element.attr('data-muted-title')).addClass('muted');
        } else {
          this.element.attr('title', this.element.attr('data-not-muted-title')).removeClass('muted');
        }
      }
    });
  })($);

  (function ($) {
    $.widget('pageflow.navigation', {
      _create: function _create() {
        var element = this.element,
            overlays = element.find('.navigation_site_detail'),
            toggleIndicators = function toggleIndicators() {};

        element.addClass('js').append(overlays);
        $('a.navigation_top', element).topButton();
        $('.navigation_bar_bottom', element).append($('.navigation_bar_top > li', element).slice(-2));
        $('.navigation_volume_box', element).volumeSlider({
          orientation: 'h'
        });
        $('.navigation_mute', element).muteButton();
        /* hide volume button on mobile devices */

        if (pageflow.browser.has('mobile platform')) {
          $('li.mute', element).hide();
          $('.navigation_bar_bottom', element).css('height', '224px');
          $('.scroller', element).css('bottom', '224px');
          $('.navigation_scroll_indicator.bottom', element).css('bottom', '190px');
        }
        /* header button */


        $('.navigation_main', element).click(function () {
          $(this).toggleClass('active').updateTitle();
          $('.header').toggleClass('active');
        });
        /* open header through skiplinks */

        $('a[href="#header"], a[href="#search"]', '#skipLinks').click(function () {
          $('.navigation_main', element).addClass('active');
          $('.header').addClass('active');
          $(this.getAttribute('href')).select();
        });
        /* share-button */

        $('.navigation_menu .navigation_menu_box a', element).focus(function () {
          $(this).parents('.navigation_menu').addClass('focused');
        }).blur(function () {
          $(this).parents('.navigation_menu').removeClass('focused');
        });
        var shareBox = $('.navigation_share_box', element),
            links = $('.share_box_icons > a', shareBox);
        shareBox.shareMenu({
          subMenu: $('.sub_share', element),
          links: links,
          insertAfter: $('.share_box_icons'),
          closeOnMouseLeaving: shareBox
        });
        /* pages */

        var pageLinks = $('.navigation_thumbnails a', element),
            target;

        function registerHandler() {
          target = $(this);
          target.one('mouseup touchend', goToPage);
        }

        function removeHandler() {
          pageLinks.off('mouseup touchend', goToPage);
        }

        function hideOverlay() {
          $(overlays).addClass('hidden').removeClass('visible');
        }

        function goToPage(e) {
          if (target && target[0] != e.currentTarget) {
            return;
          }

          hideOverlay();
          pageflow.slides.goToById(this.getAttribute("data-link"));
          e.preventDefault();
        }

        pageLinks.each(function (index) {
          var handlerIn = function handlerIn() {
            if (!('ontouchstart' in document.documentElement)) {
              $(overlays[index]).css("top", $(this).offset().top).addClass('visible').removeClass('hidden');
              overlays.loadLazyImages();
            }
          };

          $(this).on({
            'mouseenter': handlerIn,
            'mouseleave': hideOverlay,
            'mousedown touchstart': registerHandler,
            'click': goToPage
          });
        });
        $(window).on('resize', function () {
          $(overlays).css("top", "0");
          initiateIndicators();
        });

        var initiateIndicators = function initiateIndicators() {
          setTimeout(function () {
            $('.navigation_scroll_indicator', element).show();
            toggleIndicators();
          }, 500);
        };

        $('.scroller', element).each(function () {
          var bottomIndicator = $('.navigation_scroll_indicator.bottom', element),
              topIndicator = $('.navigation_scroll_indicator.top', element),
              scrollUpIntervalID,
              scrollDownIntervalID,
              hideOverlay = function hideOverlay() {
            overlays.addClass('hidden').removeClass('visible');
          };

          var atBoundary = function atBoundary(direction) {
            if (direction === 'up') {
              return scroller.y >= 0;
            } else {
              return scroller.y <= scroller.maxScrollY;
            }
          };

          toggleIndicators = function toggleIndicators() {
            if (atBoundary('down')) {
              clearInterval(scrollDownIntervalID);
              bottomIndicator.removeClass('pressed');
            }

            if (atBoundary('up')) {
              clearInterval(scrollUpIntervalID);
              topIndicator.removeClass('pressed');
            }

            topIndicator.toggleClass('visible', !atBoundary('up'));
            bottomIndicator.toggleClass('visible', !atBoundary('down'));
          };

          var keyPressHandler = function keyPressHandler(e) {
            var that = this,
                scrollByStep = function scrollByStep() {
              if ($(that).hasClass('bottom')) {
                scroller.scrollBy(0, -20, 80);
              } else {
                scroller.scrollBy(0, 20, 80);
              }

              toggleIndicators();
            };

            if (e.which == 13) {
              scrollByStep();
              setTimeout(function () {
                that.focus();
              }, 50);
            } else if (e.which === 0) {
              scrollByStep();
            }
          };

          var scrollerOptions = {
            mouseWheel: true,
            bounce: false,
            probeType: 2
          };
          /*
            This is just a quick fix to detect IE10. We should
            refactor this condition if we decide to use Modernizr
            or another more global detection.
           */

          if (window.navigator.msPointerEnabled) {
            scrollerOptions.preventDefault = false;
          }

          var scroller = new IScroll(this, scrollerOptions);
          $('ul.navigation_thumbnails', element).pageNavigationList({
            scroller: scroller,
            scrollToActive: true,
            animationDuration: 500,
            lazyLoadImages: true,
            onAnimationStart: function onAnimationStart() {
              element.addClass('is_animating');
            },
            onAnimationEnd: function onAnimationEnd() {
              element.removeClass('is_animating');
            },
            onFilterChange: function onFilterChange() {
              toggleIndicators();
            }
          });
          pageflow.ready.then(function () {
            toggleIndicators();
          });
          topIndicator.on({
            'mousedown': function mousedown() {
              scrollUpIntervalID = setInterval(function () {
                scroller.scrollBy(0, 1);
                toggleIndicators();
              }, 5);
            },
            'keypress': keyPressHandler,
            'touchstart': keyPressHandler
          });
          topIndicator.on('mouseup touchend', function () {
            clearInterval(scrollUpIntervalID);
          });
          bottomIndicator.on({
            'mousedown': function mousedown() {
              scrollDownIntervalID = setInterval(function () {
                scroller.scrollBy(0, -1);
                toggleIndicators();
              }, 5);
            },
            'keypress': keyPressHandler,
            'touchstart': keyPressHandler
          });
          bottomIndicator.on('mouseup touchend', function () {
            clearInterval(scrollDownIntervalID);
          });
          toggleIndicators();
          scroller.on('scroll', function () {
            toggleIndicators();
            hideOverlay();
            removeHandler();
          });
        });
        /* hide text button */

        var hideText = $('.navigation_hide_text', element);
        hideText.click(function () {
          pageflow.hideText.toggle();
        });
        pageflow.hideText.on('activate deactivate', function () {
          hideText.toggleClass('active', pageflow.hideText.isActive()).updateTitle();
        });
        /* fullscreen button */

        $('.navigation_bar_bottom .fullscreen a', element).fullscreenButton();
        $('.button, .navigation_mute, .navigation_scroll_indicator', element).on({
          'touchstart mousedown': function touchstartMousedown() {
            $(this).addClass('pressed');
          },
          'touchend mouseup': function touchendMouseup() {
            $(this).removeClass('pressed');
          }
        });
        $('.navigation_share, .navigation_credits', element).on({
          'touchstart': function touchstart() {
            var element = $(this).parent().parent();
            element.addClass('open');

            function close(e) {
              if (!element.find(e.target).length) {
                element.removeClass('open');
                $('body').off('touchstart', close);
              }
            }

            $('body').on('touchstart', close);
          }
        });
        $('li', element).on('mouseleave', function () {
          $(this).blur();
        });
        $('body').on({
          'pageactivate': function pageactivate(e) {
            toggleIndicators();
          }
        });
      }
    });
  })($);

  (function ($) {
    $.widget('pageflow.navigationMobile', {
      _create: function _create() {
        var that = this,
            element = this.element,
            scroller;
        pageflow.nativeScrolling.preventScrollBouncing(element);
        $('body').on('touchstart mousedown MSPointerDown pointerdown', function (event) {
          if (element.hasClass('active') && !$(event.target).parents().filter(element).length) {
            element.removeClass('active imprint sharing');
          }
        });
        $('.menu.index', element).click(function () {
          if (!$(element).hasClass('sharing') && !$(element).hasClass('imprint')) {
            $(element).toggleClass('active');
            element.loadLazyImages();
          }

          $(element).removeClass('imprint sharing');
        });
        $('.menu.sharing', element).click(function () {
          $(element).addClass('sharing');
          $(element).removeClass('imprint');
        });
        $('.menu.imprint', element).click(function () {
          $(element).addClass('imprint');
          $(element).removeClass('sharing');
        });
        $('.imprint_mobile a', element).on('click touchstart', function (event) {
          event.stopPropagation();
        });
        $('.parent_page', element).parentPageButton({
          visibleClass: 'is_visible'
        });
        $('.wrapper', element).each(function () {
          var sharingMobile = $(this).parents('.sharing_mobile');
          scroller = new IScroll(this, {
            preventDefault: false,
            mouseWheel: true,
            bounce: false,
            probeType: 3
          });
          $('ul.pages', element).pageNavigationList({
            scroller: scroller,
            animationDuration: 500
          });
          scroller.on('scroll', function () {
            $('.overview_mobile li', element).removeClass('touched').off('touchend mouseup MSPointerUp pointerup', that._goToPage);
            $('.sub_share a', sharingMobile).off('touchend mouseup MSPointerUp pointerup', that._openLink);
          });
          $('.menu', element).click(function () {
            scroller.refresh();
          });

          if (!$(element).data('touchBound')) {
            $('li', element).on({
              'touchstart mousedown MSPointerDown pointerdown': function touchstartMousedownMSPointerDownPointerdown() {
                $(this).addClass('touched');
              },
              'touchend mouseup MSPointerUp pointerup': function touchendMouseupMSPointerUpPointerup() {
                $(this).removeClass('touched');
              }
            });
            $('.overview_mobile li', element).on({
              'touchstart mousedown MSPointerDown pointerdown': function touchstartMousedownMSPointerDownPointerdown() {
                $(this).one('touchend mouseup MSPointerUp pointerup', that._goToPage);
              }
            });
            $(element).data('touchBound', true);
          }

          $('.sub_share a', sharingMobile).on({
            'touchstart mousedown MSPointerDown pointerdown': function touchstartMousedownMSPointerDownPointerdown() {
              $(this).one('touchend mouseup MSPointerUp pointerup', that._openLink);
            }
          });
          sharingMobile.shareMenu({
            subMenu: $('.sub_share', element),
            links: $('li > a', sharingMobile),
            scroller: scroller
          });
        });
      },
      _goToPage: function _goToPage() {
        var a = $('a', this),
            id = a.attr("data-link");

        if (id !== undefined) {
          pageflow.slides.goToById(id);
          $('.navigation_mobile').removeClass('active');
        }
      },
      _openLink: function _openLink(event) {
        event.preventDefault();
        window.open(this.href, '_blank');
      }
    });
  })($);

  $(function ($) {
    $.widget('pageflow.overview', {
      _create: function _create() {
        var that = this,
            scroller,
            chapterParts = $('.ov_chapter', this.element),
            pages = $('.ov_page', this.element),
            noOfChapterParts = chapterParts.size(),
            scrollerWidth = noOfChapterParts * chapterParts.outerWidth(true),
            closeButton = $('.close', this.element),
            indexButton = $('.navigation_index'),
            overview = $('.overview'),
            wrapper = $('.wrapper', this.element);

        var toggleContent = function toggleContent(state) {
          var scrollIndicator = $('.slideshow .scroll_indicator');
          overview.toggleClass('active', state);
          overview.loadLazyImages();
          indexButton.toggleClass('active', state).updateTitle();
          $('section.page').toggleClass('hidden_by_overlay', state);
          scrollIndicator.toggleClass('hidden', state);

          if (overview.hasClass('active')) {
            pageflow.events.once('page:change', function () {
              toggleContent(false);
            }, that);
          } else {
            pageflow.events.off('page:change', null, that);
          }
        };

        var goToPage = function goToPage() {
          if (!$(this).hasClass('active')) {
            pageflow.slides.goToById(this.getAttribute("data-link"));
          }
        };

        $('.scroller', this.element).width(scrollerWidth);

        if (wrapper.find('.ov_chapter').length) {
          // scroller throws exception if initialized with empty set
          // of pages
          scroller = new IScroll(wrapper[0], {
            snap: '.ov_chapter',
            bounce: false,
            scrollX: true,
            scrollY: false,
            probeType: 2,
            mouseWheel: true,
            preventDefault: false
          });
          scroller.on('scroll', function () {
            pages.removeClass('touched').off('touchend mouseup', goToPage);
          });
          wrapper.pageNavigationList({
            scroller: scroller,
            scrollToActive: '.ov_chapter'
          });
          this.element.find('.overview_scroll_indicator.left').scrollButton({
            scroller: scroller,
            page: true,
            direction: 'left'
          });
          this.element.find('.overview_scroll_indicator.right').scrollButton({
            scroller: scroller,
            page: true,
            direction: 'right'
          });
        }

        pages.each(function () {
          $(this).on({
            'touchstart mousedown': function touchstartMousedown() {
              $(this).addClass('touched');
              $(this).one('touchend mouseup', goToPage);
            },
            'touchend mouseup': function touchendMouseup() {
              $(this).removeClass('touched');
            },
            'click': function click(event) {
              event.preventDefault();
            }
          });
        });

        if (scrollerWidth < wrapper.width()) {
          var closeButtonPos = Math.max(400, scrollerWidth - closeButton.width() - 10);

          if (isDirLtr(closeButton)) {
            closeButton.css({
              left: closeButtonPos + 'px',
              right: 'auto'
            });
          } else {
            closeButton.css({
              right: closeButtonPos + 'px',
              left: 'auto'
            });
          }
        }

        closeButton.click(toggleContent);
        indexButton.click(toggleContent);
        $('body').keyup(function (e) {
          if (e.which == 27 && overview.hasClass('active')) {
            toggleContent();
          }
        });

        function isDirLtr(el) {
          var styles = window.getComputedStyle(el[0]);
          return styles.direction == 'ltr';
        }
      }
    });
  });

  pageflow.PageNavigationListAnimation = pageflow.Object.extend({
    initialize: function initialize(entryData) {
      this.entry = entryData;
    },
    update: function update(currentPagePermaId) {
      var currentPagePosition = this.entry.getPagePosition(currentPagePermaId);
      var currentStorylineId = this.entry.getStorylineIdByPagePermaId(currentPagePermaId);
      var currentStorylineLevel = this.entry.getStorylineLevel(currentStorylineId);
      this.enabled = this.lastStorylineId && this.lastStorylineId !== currentStorylineId;
      this.movingUp = this.lastStorylineLevel > currentStorylineLevel;
      this.movingDown = this.lastStorylineLevel < currentStorylineLevel;
      this.movingForwards = this.lastStorylineLevel === currentStorylineLevel && this.lastPagePosition < currentPagePosition;
      this.movingBackwards = this.lastStorylineLevel === currentStorylineLevel && this.lastPagePosition > currentPagePosition;
      this.lastPagePosition = currentPagePosition;
      this.lastStorylineId = currentStorylineId;
      this.lastStorylineLevel = currentStorylineLevel;
    },
    start: function start(element, visible) {
      if (this.enabled) {
        element.toggleClass('moving_up', this.movingUp);
        element.toggleClass('moving_down', this.movingDown);
        element.toggleClass('moving_forwards', this.movingForwards);
        element.toggleClass('moving_backwards', this.movingBackwards);
        element.toggleClass('animate_out', !visible);
      }
    },
    finish: function finish(element, visible) {
      if (this.enabled) {
        element.toggleClass('animate_in', !!visible);
      }
    }
  });

  pageflow.PageNavigationListAnimation.create = function () {
    return new pageflow.PageNavigationListAnimation(pageflow.entryData);
  };

  (function ($) {
    $.widget('pageflow.pageNavigationList', {
      _create: function _create() {
        var element = this.element;
        var options = this.options;
        var scroller = options.scroller;
        var links = element.find('a[href]');
        var chapterFilter = pageflow.ChapterFilter.create();
        var highlightedPage = pageflow.HighlightedPage.create(options.highlightedPage);
        var animation = pageflow.PageNavigationListAnimation.create();
        pageflow.ready.then(function () {
          highlightUnvisitedPages(pageflow.visited.getUnvisitedPages());
          update(getPagePermaId(pageflow.slides.currentPage()));
        });
        pageflow.slides.on('pageactivate', function (e) {
          setPageVisited(e.target.getAttribute('id'));
          update(getPagePermaId(e.target));
        });

        function getPagePermaId(section) {
          return parseInt($(section).attr('id') || $(section).attr('data-perma-id'), 10);
        }

        function update(currentPagePermaId) {
          var highlightedPagePermaId = highlightedPage.getPagePermaId(currentPagePermaId);
          var highlightedChapterId = pageflow.entryData.getChapterIdByPagePermaId(highlightedPagePermaId);
          element.toggleClass('inside_sub_chapter', highlightedPagePermaId !== currentPagePermaId);
          filterChapters(currentPagePermaId).then(function () {
            highlightPage(highlightedPagePermaId, {
              animate: !animation.enabled
            });
            highlightChapter(highlightedChapterId);

            if (options.onFilterChange) {
              options.onFilterChange();
            }
          });
        }

        function highlightPage(permaId, highlightOptions) {
          links.each(function () {
            var link = $(this);
            var active = '#' + permaId === link.attr('href');
            link.toggleClass('active', active);
            link.attr('tabindex', active ? '-1' : '3');

            if (active) {
              if (options.scrollToActive) {
                var target = options.scrollToActive === true ? link : link.parents(options.scrollToActive);
                scroller.scrollToElement(target[0], highlightOptions.animate ? 800 : 0);
              }
            }
          });
        }

        function highlightChapter(activeChapterId) {
          links.each(function () {
            var link = $(this);
            var active = activeChapterId === link.data('chapterId');
            link.toggleClass('in_active_chapter', active);
          });
        }

        function highlightUnvisitedPages(ids) {
          links.each(function () {
            var link = $(this);
            var unvisited = ids.indexOf(parseInt(link.attr('href').substr(1), 10)) >= 0;
            link.toggleClass('unvisited', unvisited);
          });
        }

        function setPageVisited(id) {
          element.find('[href="#' + id + '"]').removeClass('unvisited');
        }

        function filterChapters(currentPagePermaId) {
          animation.update(currentPagePermaId);
          links.each(function () {
            var link = $(this);
            animation.start(link.parent(), visible(currentPagePermaId, link));
          });
          return $.when(animation.enabled && animationDurationElapsed()).then(function () {
            links.each(function () {
              var link = $(this);
              var pageIsVisible = visible(currentPagePermaId, link);
              animation.finish(link.parent(), pageIsVisible);
              link.parent().andSelf().toggleClass('filtered', !pageIsVisible);

              if (pageIsVisible && options.lazyLoadImages) {
                link.loadLazyImages();
              }
            });
            scroller.refresh();
          });
        }

        function visible(currentPagePermaId, link) {
          return chapterFilter.chapterVisibleFromPage(currentPagePermaId, link.data('chapterId'));
        }

        function animationDurationElapsed() {
          if (options.animationDuration) {
            if (options.onAnimationStart) {
              options.onAnimationStart();
            }

            return $.Deferred(function (deferred) {
              setTimeout(function () {
                deferred.resolve();

                if (options.onAnimationEnd) {
                  setTimeout(options.onAnimationEnd, 500);
                }
              }, 500);
            }).promise();
          }
        }
      }
    });
  })($);

  (function ($) {
    $.widget('pageflow.parentPageButton', {
      _create: function _create() {
        var element = this.element;
        var options = this.options;
        element.click(function (event) {
          pageflow.slides.goToParentPage();
          event.preventDefault();
        });
        pageflow.slides.on('pageactivate', function (e, ui) {
          update();
        });
        update();

        function update() {
          var pagePermaId = parseInt(pageflow.slides.currentPage().attr('id'), 10);
          var chapterId = pageflow.entryData.getChapterIdByPagePermaId(pagePermaId);
          var chapterConfiguration = pageflow.entryData.getChapterConfiguration(chapterId);
          var visible = pageflow.slides.parentPageExists() && chapterConfiguration.display_parent_page_button !== false;

          if (options.visibleClass) {
            element.toggleClass(options.visibleClass, visible);
          } else {
            element.toggle(visible);
          }
        }
      }
    });
  })($);

  $.widget('pageflow.playerControls', {
    _create: function _create() {
      var player = this.options.player;
      var playButton = this.element.find('.vjs-play-control');
      var progressHolder = this.element.find('.vjs-progress-holder');
      var playProgress = this.element.find('.vjs-play-progress');
      var currentTimeDisplay = this.element.find('.vjs-current-time-display');
      var durationDisplay = this.element.find('.vjs-duration-display');
      var progressHandler = this.element.find('.vjs-slider-handle');
      var smallTimestamp = durationDisplay.html().length === 5 && durationDisplay.html().charAt(0) === "0";

      if (smallTimestamp) {
        durationDisplay.html("0:00");
        currentTimeDisplay.html(currentTimeDisplay.html().substr(1));
      } else {
        durationDisplay.html("00:00");
      }

      player.on('timeupdate', function (position, duration) {
        var percent = duration > 0 ? player.position / player.duration * 100 : 0;

        if (!isNaN(position)) {
          if (player.duration < 600) {
            $(currentTimeDisplay).html(player.formatTime(position).substr(1));
            $(durationDisplay).html(player.formatTime(duration).substr(1));
          } else {
            $(currentTimeDisplay).html(player.formatTime(position));
            $(durationDisplay).html(player.formatTime(duration));
          }
        }

        var handlerLeft = (progressHolder.width() - progressHandler.width()) * percent / 100;
        progressHandler.css({
          left: handlerLeft + 'px'
        });
        playProgress.css({
          width: percent + "%"
        });
      });
      player.on('play', function (position, duration) {
        $(playButton).removeClass('vjs-play');
        $(playButton).addClass('vjs-pause vjs-playing');
      });
      player.on('pause', function (position, duration) {
        $(playButton).removeClass('vjs-pause vjs-playing');
        $(playButton).addClass('vjs-play');
      });
      player.on('ended', function (position, duration) {
        $(playButton).removeClass('vjs-pause vjs-playing');
        $(playButton).addClass('vjs-play');
      });

      function togglePlay() {
        if (player.playing) {
          player.pause();
        } else {
          player.play();
        }
      }

      playButton.on({
        'mousedown touchstart': function mousedownTouchstart() {
          $(this).addClass('pressed');
        },
        'mouseup touchend': function mouseupTouchend() {
          $(this).removeClass('pressed');
        },
        'click': function click() {
          togglePlay();
        },
        'keypress': function keypress(e) {
          if (e.which == 13) {
            var that = this;
            togglePlay();
            setTimeout(function () {
              $(that).focus();
            }, 20);
          }
        }
      });
      $(progressHolder).on('mousedown touchstart', function (event) {
        player.seek(getSeekPosition(event));
        $('body').on({
          'mousemove touchmove': onMouseMove,
          'mouseup touchend': onMouseUp
        });

        function onMouseMove(event) {
          player.seek(getSeekPosition(event));
        }

        function onMouseUp() {
          $('body').off({
            'mousemove touchmove': onMouseMove,
            'mouseup touchend': onMouseUp
          });
        }

        function getSeekPosition(event) {
          var position = getPointerPageX(event) - $(progressHolder).offset().left;
          var fraction = position / $(progressHolder).width();
          return Math.min(Math.max(fraction, 0), 1) * player.duration;
        }

        function getPointerPageX(event) {
          if (event.originalEvent.changedTouches) {
            return event.originalEvent.changedTouches[0].pageX;
          } else {
            return event.pageX;
          }
        }
      });
    }
  });

  (function ($) {
    var SPACE_KEY = 32;
    $.widget('pageflow.scrollButton', {
      _create: function _create() {
        var element = this.element;
        var scroller = this.options.scroller;
        var direction = this.options.direction;
        scroller.on('scrollEnd', function () {
          updateVisibility();
        });
        this.element.on('click', function () {});

        if (this.options.page) {
          element.on({
            click: function click() {
              changePage();
              element.blur();
              return false;
            },
            keypress: function keypress(e) {
              if (e.which == SPACE_KEY) {
                changePage();
              }
            },
            touchstart: function touchstart() {
              changePage();
            }
          });
        }

        updateVisibility();

        function updateVisibility() {
          element.toggle(!atBoundary());
        }

        function changePage() {
          if (direction === 'top' || direction === 'left') {
            scroller.prev();
          } else if (direction === 'down' || direction === 'right') {
            scroller.next();
          }
        }

        function atBoundary() {
          if (direction === 'top') {
            return scroller.y >= 0;
          } else if (direction === 'left') {
            return scroller.x >= 0;
          } else if (direction === 'down') {
            return scroller.y <= scroller.maxScrollY;
          } else {
            return scroller.x <= scroller.maxScrollX;
          }
        }
      }
    });
  })($);

  (function ($) {
    $.widget('pageflow.shareMenu', {
      _create: function _create() {
        var $element = this.element,
            options = this.options,
            $links = options.links || $('a', $element),
            $subMenu = options.subMenu || $($element.find('.sub_share')),
            $subLinks = $('a', $subMenu),
            $closeOnMouseLeaving = options.closeOnMouseLeaving,
            scroller = options.scroller;
        $links.on('click', function (event) {
          var $this = $(this),
              $a = $this.find('a').length ? $this.find('a') : $this,
              active = $a.hasClass('active');

          if ($a.data('share-page')) {
            $links.removeClass('active');
            $a.addClass('active');
            event.preventDefault();
            var $currentPage = pageflow.slides.currentPage(),
                id = $currentPage.attr('id') || $currentPage.data('perma-id'),
                siteShareUrl = $a.data('share-page').replace(/permaId$/, id),
                $insertAfter = options.insertAfter || $a;
            $($subLinks[0]).attr('href', $a.attr('href'));
            $($subLinks[1]).attr('href', siteShareUrl);

            if (!$insertAfter.next().hasClass('sub_share')) {
              $insertAfter.after($subMenu);
            }

            if (active) {
              $subMenu.toggle();
              $a.toggleClass('active');
            } else {
              $subMenu.show();
              $links.find('.button').removeClass('pressed');
              $(this).find('.button').addClass('pressed');
            }

            if (scroller) {
              scroller.refresh();
            }
          }
        });

        if ($closeOnMouseLeaving) {
          $closeOnMouseLeaving.on('mouseleave', function () {
            $links.removeClass('active').blur();
            $(this).find('.button').removeClass('pressed');
            $subMenu.hide();
          });
        }
      }
    });
  })($);

  (function ($) {
    $.widget('pageflow.skipPageButton', {
      _create: function _create() {
        this.element.on('click', function () {
          pageflow.slides.next();
        });
        pageflow.events.on('page:change page:update', this.update, this);
        this.update();
      },
      _destroy: function _destroy() {
        pageflow.events.off(null, this.update);
      },
      update: function update() {
        if (pageflow.slides) {
          this.element.toggleClass('enabled', !!pageflow.slides.nextPageExists());
        }
      }
    });
  })($);

  (function ($) {
    $.widget('pageflow.topButton', {
      _create: function _create() {
        var element = this.element;
        element.click(function (event) {
          pageflow.slides.goToLandingPage();
          event.preventDefault();
        });
        pageflow.slides.on('pageactivate', function (e, ui) {
          toggle();
        });
        toggle(pageflow.slides.currentPage());

        function toggle() {
          var onLandingPage = pageflow.slides.isOnLandingPage();
          element.toggleClass('deactivated', onLandingPage);
          element.attr('tabindex', onLandingPage ? '-1' : '2');
        }
      }
    });
  })($);

  (function ($) {
    $.widget('pageflow.volumeSlider', {
      _create: function _create() {
        var element = this.element;
        var orientation = this.options.orientation;
        var slider = $('.volume-slider', element);
        element.on('mousedown', function (event) {
          var parent = $('body');
          parent.on('mousemove.volumeSlider', changeVolume);
          element.addClass('lock_showing');
          parent.on('mouseup.volumeSlider', function () {
            parent.off('mousemove.volumeSlider mouseup.volumeSlider');
            element.removeClass('lock_showing');
          });
          changeVolume(event);

          function changeVolume(event) {
            var volume;

            if (orientation === 'v') {
              volume = 1 - (event.pageY - slider.offset().top) / slider.height();
            } else {
              volume = (event.pageX - slider.offset().left) / slider.width();
            }

            pageflow.settings.set('volume', Math.min(1, Math.max(0, volume)));
          }
        });
        pageflow.settings.on('change:volume', this.update, this);
        this.update();
      },
      _destroy: function _destroy() {
        pageflow.settings.off('change:volume', this.update);
      },
      update: function update() {
        var volume = pageflow.settings.get('volume');

        if (this.options.orientation === 'v') {
          $('.volume-level', this.element).css({
            height: volume * 100 + '%'
          });
          $('.volume-handle', this.element).css({
            bottom: volume * 100 + '%',
            top: 'initial'
          });
        } else {
          $('.volume-level', this.element).css({
            width: volume * 100 + '%'
          });
          $('.volume-handle', this.element).css({
            left: volume * 100 + '%'
          });
        }

        this.element.toggleClass('volume-high', volume > 2 / 3);
        this.element.toggleClass('volume-medium', volume >= 1 / 3 && volume <= 2 / 3);
        this.element.toggleClass('volume-low', volume < 1 / 3 && volume > 0);
        this.element.toggleClass('volume-mute', volume === 0);
      }
    });
  })($);

}(jQuery, jQuery, Backbone, _, IScroll));
