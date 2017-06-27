pageflow.mediaPlayer.preventZero = function(player) {
  // Volume must be greater than zero in exponential fading
  player.preventZero = function(volume) {
    if (volume !== 0) {
      return volume;
    }
    else {
      return 0.01;
    }
  };
};
