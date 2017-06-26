// See https://github.com/Modernizr/Modernizr/blob/master/feature-detects/audio/webaudio.js

pageflow.browser.feature('webaudio support', function(has) {
  console.log('helllooooo!');
  console.log('AudioContext' in window);
  console.log('webkitAudioContext' in window || 'AudioContext' in window);
  return 'webkitAudioContext' in window || 'AudioContext' in window;
});
