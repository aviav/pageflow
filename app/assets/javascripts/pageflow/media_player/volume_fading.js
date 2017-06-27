pageflow.mediaPlayer.volumeFading = function(player) {
  var originalVolume = player.volume;
  var fadeVolumeDeferred;
  var fadeVolumeInterval;

  player.volume = function(value) {
    if (typeof value !== 'undefined') {
      cancelFadeVolume();
    }

    return originalVolume.apply(player, arguments);
  };

  player.fadeVolume = function(value, duration) {
    if (value === 0) {
      throw new Error('Value must be greater than zero in exponential fading');
    }
    if (!pageflow.browser.has('volume control support')) {
      return new jQuery.Deferred().resolve().promise();
    }

    cancelFadeVolume();

    return new $.Deferred(function(deferred) {
      var resolution = 10;
      var startValue = player.preventZero(volume());
      // exponent is divided by steps, so we need inverseSteps = 1/steps
      var inverseSteps = resolution / duration;
      var factor = Math.pow(value / startValue, inverseSteps);

      if (value === startValue) {
        deferred.resolve();
      }
      else {
        fadeVolumeDeferred = deferred;
        fadeVolumeInterval = setInterval(function() {
          volume(player.preventZero(volume()) * factor);

          if ((volume() >= value && value >= startValue) ||
              (volume() <= value && value <= startValue)) {

            resolveFadeVolume();
          }
        }, resolution);
      }
    });

    function volume(/* arguments */) {
      return originalVolume.apply(player, arguments);
    }
  };

  player.one('dispose', cancelFadeVolume);

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