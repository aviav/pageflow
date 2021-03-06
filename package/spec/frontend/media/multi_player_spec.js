import {AudioPlayer, MultiPlayer} from 'pageflow/frontend';

import sinon from 'sinon';

describe('MultiPlayer', function() {
  var Null = AudioPlayer.Null;
  describe('#fadeTo', function() {
    it('plays and fades in new player', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {fadeDuration: 1000});

      sinon.spy(player, 'playAndFadeIn');

      await multiPlayer.fadeTo(5);

      expect(player.playAndFadeIn).toHaveBeenCalledWith(1000);
    });

    it('fades and pauses previous player', async () => {
      var previousPlayer = new Null();
      var pool = fakePlayerPool({
        5: previousPlayer,
        6: new Null()
      });
      var multiPlayer = new MultiPlayer(pool, {fadeDuration: 1000});

      sinon.spy(previousPlayer, 'fadeOutAndPause');

      await multiPlayer.fadeTo(5);
      await multiPlayer.fadeTo(6);

      expect(previousPlayer.fadeOutAndPause).toHaveBeenCalledWith(1000);
    });

    it('does not interrupt playback when fading to same audio file', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {
        fadeDuration: 1000
      });

      sinon.spy(player, 'playAndFadeIn');
      sinon.stub(player, 'paused').returns(false);

      await multiPlayer.fadeTo(5);
      await multiPlayer.fadeTo(5);

      expect(player.playAndFadeIn).toHaveBeenCalledOnce();
    });

    it('rewinds if playFromBeginning option is true', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {
        fadeDuration: 1000,
        playFromBeginning: true
      });

      sinon.spy(player, 'rewind');

      await multiPlayer.fadeTo(5);

      expect(player.rewind).toHaveBeenCalled();
    });

    it('restarts same audio file if playFromBeginning option is true', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {
        fadeDuration: 1000,
        playFromBeginning: true
      });

      sinon.spy(player, 'playAndFadeIn');

      await multiPlayer.fadeTo(5);
      await multiPlayer.fadeTo(5);

      expect(player.playAndFadeIn).toHaveBeenCalledTwice();
    });

    it('rewinds if rewindOnChange option is true', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {
        fadeDuration: 1000,
        rewindOnChange: true
      });

      sinon.spy(player, 'rewind');

      await multiPlayer.fadeTo(5);

      expect(player.rewind).toHaveBeenCalled();
    });

    it('does not interrupt when fading to same audio file when rewindOnChange option is true', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {
        fadeDuration: 1000,
        rewindOnChange: true
      });

      sinon.spy(player, 'playAndFadeIn');
      sinon.stub(player, 'paused').returns(false);

      await multiPlayer.fadeTo(5);
      await multiPlayer.fadeTo(5);

      expect(player.playAndFadeIn).toHaveBeenCalledOnce();
    });

    it('plays and fades in same audio file if paused', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {
        fadeDuration: 1000
      });

      sinon.spy(player, 'playAndFadeIn');

      await multiPlayer.fadeTo(5);
      multiPlayer.pause();
      await multiPlayer.fadeTo(5);

      expect(player.playAndFadeIn).toHaveBeenCalledTwice();
    });

    it('plays and fades in new player directly if crossFade option is true', async () => {
      var previousPlayer = new Null();
      var nextPlayer = new Null();
      var pool = fakePlayerPool({
        5: previousPlayer,
        6: nextPlayer
      });
      var multiPlayer = new MultiPlayer(pool, {fadeDuration: 1000, crossFade: true});

      var deferreds = [];
      var pendingPromise = new Promise(function(resolve, reject){
        deferreds.push({resolve: resolve, reject: reject});
      });

      sinon.stub(previousPlayer, 'fadeOutAndPause').returns(pendingPromise);
      sinon.spy(nextPlayer, 'playAndFadeIn');

      await multiPlayer.fadeTo(5);
      await multiPlayer.fadeTo(6);

      expect(nextPlayer.playAndFadeIn).toHaveBeenCalledWith(1000);
    });
  });

  describe('#play', function() {
    it('plays new player', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {fadeDuration: 1000});

      sinon.spy(player, 'play');

      await multiPlayer.play(5);

      expect(player.play).toHaveBeenCalled();
    });

    it('fades and pauses previous player', async () => {
      var previousPlayer = new Null();
      var pool = fakePlayerPool({
        5: previousPlayer,
        6: new Null()
      });
      var multiPlayer = new MultiPlayer(pool, {fadeDuration: 1000});

      sinon.spy(previousPlayer, 'fadeOutAndPause');

      await multiPlayer.play(5);
      await multiPlayer.play(6);

      expect(previousPlayer.fadeOutAndPause).toHaveBeenCalledWith(1000);
    });

    it('does not interrupt playback when playing  same audio file', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {
        fadeDuration: 1000
      });

      sinon.spy(player, 'play');
      sinon.stub(player, 'paused').returns(false);

      await multiPlayer.play(5);
      await multiPlayer.play(5);

      expect(player.play).toHaveBeenCalledOnce();
    });

    it('rewinds 0 if playFromBeginning option is true', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {
        fadeDuration: 1000,
        playFromBeginning: true
      });

      sinon.spy(player, 'rewind');

      await multiPlayer.play(5);

      expect(player.rewind).toHaveBeenCalled();
    });

    it('restarts same audio file if playFromBeginning option is true', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {
        fadeDuration: 1000,
        playFromBeginning: true
      });

      sinon.spy(player, 'play');

      await multiPlayer.play(5);
      await multiPlayer.play(5);

      expect(player.play).toHaveBeenCalledTwice();
    });

    it('rewinds if rewindOnChange option is true', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {
        fadeDuration: 1000,
        rewindOnChange: true
      });

      sinon.spy(player, 'rewind');

      await multiPlayer.play(5);

      expect(player.rewind).toHaveBeenCalled();
    });

    it('does not interrupt when playing same audio file when rewindOnChange option is true', async () => {
      var player = new Null();
      var pool = fakePlayerPool({5: player});
      var multiPlayer = new MultiPlayer(pool, {
        fadeDuration: 1000,
        rewindOnChange: true
      });

      sinon.spy(player, 'play');
      sinon.stub(player, 'paused').returns(false);

      await multiPlayer.play(5);
      await multiPlayer.play(5);

      expect(player.play).toHaveBeenCalledOnce();
    });
  });

  it('emits play and pause events', async () => {
    var player = new Null();
    var pool = fakePlayerPool({5: player});
    var multiPlayer = new MultiPlayer(pool, {fadeDuration: 1000});
    var playHandler = sinon.spy();
    var pauseHandler = sinon.spy();

    multiPlayer.on('play', playHandler);
    multiPlayer.on('pause', pauseHandler);
    await multiPlayer.play(5);
    player.trigger('pause');
    player.trigger('play');

    expect(playHandler).toHaveBeenCalledWith({audioFileId: 5});
    expect(pauseHandler).toHaveBeenCalledWith({audioFileId: 5});
  });

  it('emits ended event when player ends', async () => {
    var player = new Null();
    var pool = fakePlayerPool({5: player});
    var multiPlayer = new MultiPlayer(pool, {fadeDuration: 1000});
    var handler = sinon.spy();

    multiPlayer.on('ended', handler);
    await multiPlayer.play(5);
    player.trigger('ended');

    expect(handler).toHaveBeenCalledWith({audioFileId: 5});
  });

  it('does not emit ended event if player is no longer current player', async () => {
    var player = new Null();
    var pool = fakePlayerPool({
      5: player,
      6: new Null()
    });
    var multiPlayer = new MultiPlayer(pool, {fadeDuration: 1000});
    var handler = sinon.spy();

    multiPlayer.on('ended', handler);
    await multiPlayer.play(5);
    await multiPlayer.play(6);
    player.trigger('ended');

    expect(handler).not.toHaveBeenCalled();
  });

  it('propagates pause event if previous player fades out and pauses', async () => {
    var player1 = new Null();
    var player2 = new Null();
    var pool = fakePlayerPool({
      5: player1,
      6: player2
    });
    player1.fadeOutAndPause = function() { return new Promise(resolve =>
      setTimeout(() => {
        resolve();
        player1.trigger('pause');
      }, 10)
    ); };

    var multiPlayer = new MultiPlayer(pool, {fadeDuration: 1000});
    var handler = jest.fn();

    multiPlayer.on('pause', handler);
    await multiPlayer.fadeTo(5);
    jest.spyOn(player1, 'paused').mockReturnValue(false);
    await multiPlayer.fadeTo(6);

    expect(handler).toHaveBeenCalledWith({audioFileId: 5});
  });

  it('stops event propagation immediately if previous player is paused', async () => {
    var player1 = new Null();
    var player2 = new Null();
    var pool = fakePlayerPool({
      5: player1,
      6: player2
    });
    player1.fadeOutAndPause = function() { return new Promise(resolve =>
      setTimeout(resolve, 10)
    ); };

    var multiPlayer = new MultiPlayer(pool, {fadeDuration: 1000});
    var handler = jest.fn();

    multiPlayer.on('pause', handler);
    await multiPlayer.fadeTo(5);
    jest.spyOn(player1, 'paused').mockReturnValue(true);
    multiPlayer.fadeTo(6);
    player1.trigger('pause');

    expect(handler).not.toHaveBeenCalled();
  });

  it('propagates playfailed event', async () => {
    var player = new Null();
    var pool = fakePlayerPool({5: player});
    var multiPlayer = new MultiPlayer(pool, {fadeDuration: 1000});
    var handler = sinon.spy();

    multiPlayer.on('playfailed', handler);
    await multiPlayer.play(5);
    player.trigger('playfailed');

    expect(handler).toHaveBeenCalled();
  });

  function fakePlayerPool(players) {
    return {
      get: function(id) {
        return players[id];
      }
    };
  }
});
