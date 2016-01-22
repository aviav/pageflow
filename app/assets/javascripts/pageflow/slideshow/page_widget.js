(function($) {
  $.widget('pageflow.nonLazyPage', {
    widgetEventPrefix: 'page',
    _create: function() {
      this.configuration = this.element.data('configuration') || this.options.configuration;
      this.index = this.options.index;

      this._setupNearBoundaryCssClasses();

      this.reinit();
    },

    getPermaId: function() {
      return parseInt(this.element.attr('id'), 10);
    },

    getConfiguration: function() {
      return this.configuration;
    },

    update: function(configuration) {
      _.extend(this.configuration, configuration.attributes);
      this.pageType.update(this.element, configuration);
    },

    reinit: function() {
      this.pageType = pageflow.pageType.get(this.element.data('template'));
      this.element.data('pageType', this.pageType);
      this.preloaded = false;

      if (this.pageType.scroller === false) {
        this.content = $();
      }
      else {
        this.content = this.element.find('.scroller');
      }

      this.content.scroller(this.pageType.scrollerOptions || {});
      this.pageType.scroller = this.content.scroller('instance');
      this.pageType.scrollIndicator = new pageflow.ScrollIndicator(this.element);

      this._setupHideTextOnSwipe();

      this._triggerPageTypeHook('enhance');
      this._trigger('enhanced');
    },

    reactivate: function() {
      if (this.element.hasClass('active')) {
        this.preload();

        this.content.scroller('enable');
        this.content.scroller('resetPosition');
        this.content.scroller('afterAnimationHook');

        this._triggerPageTypeHook('activating');
        this._triggerDelayedPageTypeHook('activated');
      }
    },

    cleanup: function() {
      this._triggerPageTypeHook('deactivating');
      this._triggerDelayedPageTypeHook('deactivated');
      this._triggerPageTypeHook('cleanup');
    },

    refreshScroller: function() {
      this.content.scroller('refresh');
    },

    resize: function() {
      this._triggerPageTypeHook('resize');
    },

    activateAsLandingPage: function() {
      this.element.addClass('active');

      this.content.scroller('enable');
      this.content.scroller('resetPosition');
      this.content.scroller('afterAnimationHook');

      this._trigger('activate', null, {page: this});
      this._triggerPageTypeHook('activating');
      this._triggerDelayedPageTypeHook('activated');
    },

    prepare: function() {
      this._triggerPageTypeHook('prepare');
    },

    unprepare: function() {
      this._triggerPageTypeHook('unprepare');
    },

    prepareNextPageTimeout: function() {
      return this.pageType.prepareNextPageTimeout;
    },

    linkedPages: function() {
      return this._triggerPageTypeHook('linkedPages');
    },

    preload: function() {
      var page = this;

      if (!this.preloaded) {
        this.preloaded = true;

        return $.when(this._triggerPageTypeHook('preload')).then(function() {
          page._trigger('preloaded');
        });
      }
    },

    activate: function(options) {
      options = options || {};

      setTimeout(_.bind(function() {
        this.element.addClass('active');
      }, this), 0);

      var duration = this.animateTransition('in', options, function() {
        this.content.scroller('enable');
        this.content.scroller('afterAnimationHook');

        this._triggerDelayedPageTypeHook('activated');
      });

      this.content.scroller('resetPosition', {position: options.position});
      this._trigger('activate', null, {page: this});
      this._triggerPageTypeHook('activating', {position: options.position});

      return duration;
    },

    deactivate: function(options) {
      options = options || {};

      this.element.removeClass('active');

      var duration = this.animateTransition('out', options, function() {
        this._triggerPageTypeHook('deactivated');
      });

      this.content.scroller('disable');
      this._trigger('deactivate');
      this._triggerPageTypeHook('deactivating');

      return duration;
    },

    animateTransition: function(destination, options, callback) {
      var otherDestination = destination === 'in' ? 'out' : 'in';
      var transition = options.transition || this.configuration.transition || 'fade';
      var duration = pageflow.pageTransitions.get(transition).duration;
      var animateClass = transition + ' animate-' + destination + '-' + options.direction;

      this.element
        .removeClass('animate-' + otherDestination + '-forwards animate-' + otherDestination + '-backwards')
        .addClass(animateClass);

      setTimeout(_.bind(function() {
        this.element.removeClass(animateClass);
        callback.call(this);
      }, this), duration);

      return duration;
    },

    _triggerDelayedPageTypeHook: function(name) {
      var that = this;
      var handle = pageflow.manualStart.wait(function() {
        that._triggerPageTypeHook(name);
      });

      this.element.one('pagedeactivate', function() {
        handle.cancel();
      });
    },

    _triggerPageTypeHook: function(name, options) {
      return this.pageType[name](this.element, this.configuration, options || {});
    },

    _setupHideTextOnSwipe: function() {
      if (pageflow.entryData.getThemingOption('hide_text_on_swipe') &&
          !this.pageType.noHideTextOnSwipe) {
        this.content.hideTextOnSwipe();
      }
    },

    _setupNearBoundaryCssClasses: function() {
      var element = this.element;

      _(['top', 'bottom']).each(function(boundary) {
        element.on('scrollernear' + boundary, function() {
          element.addClass('is_near_' + boundary);
        });

        element.on('scrollernotnear' + boundary, function() {
          element.removeClass('is_near_' + boundary);
        });
      });
    }
  });
}(jQuery));