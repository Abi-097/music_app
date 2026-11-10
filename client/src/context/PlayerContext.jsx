import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const PlayerContext = createContext(null);
export const usePlayer = () => useContext(PlayerContext);

const DEFAULTS = { quality: 'high', rate: 1, volume: 0.8, autoplay: true };

const readSettings = () => {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('player-settings') || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
};

// "low" uses the lower-bitrate stream when a track has one, otherwise the high-quality file.
const pickSrc = (track, quality) =>
  quality === 'low' && track.audioUrlLow ? track.audioUrlLow : track.audioUrl;

export function PlayerProvider({ children }) {
  const { user } = useAuth();

  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [nonce, setNonce] = useState(0); // bumps to force a reload of the same track
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off'); // 'off' | 'all' | 'one'
  const [muted, setMuted] = useState(false);
  const [settings, setSettings] = useState(readSettings);

  const howl = useRef(null);
  const timer = useRef(null);

  // Always-fresh snapshot so Howler callbacks never read stale state.
  const live = useRef({});
  live.current = { queue, index, shuffle, repeat, settings, muted };

  const current = queue[index] || null;

  const stopTimer = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const startTimer = () => {
    stopTimer();
    timer.current = setInterval(() => {
      const h = howl.current;
      if (h && h.playing()) setProgress(Number(h.seek()) || 0);
    }, 250);
  };

  const destroy = () => {
    stopTimer();
    if (howl.current) {
      howl.current.unload();
      howl.current = null;
    }
  };

  // Moves to the next track. `auto` is true when a track ended by itself.
  const advance = useCallback((auto) => {
    const { queue: q, index: i, shuffle: shuf, repeat: rep, settings: s } = live.current;
    const h = howl.current;
    if (!q.length) return;

    if (auto && rep === 'one' && h) {
      h.seek(0);
      h.play();
      return;
    }
    if (auto && !s.autoplay) {
      if (h) h.stop();
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    let next;
    if (shuf && q.length > 1) {
      do {
        next = Math.floor(Math.random() * q.length);
      } while (next === i);
    } else {
      next = i + 1;
      if (next >= q.length) {
        if (rep === 'all') {
          next = 0;
        } else {
          if (h) h.stop();
          setIsPlaying(false);
          setProgress(0);
          return;
        }
      }
    }
    setIndex(next);
    setNonce((n) => n + 1);
  }, []);

  const load = useCallback(
    (track, opts = {}) => {
      const { startAt = 0, play = true, quality } = opts;
      destroy();
      if (!track) return;

      const { settings: s, muted: m } = live.current;
      setLoading(true);
      setProgress(startAt);
      setDuration(track.duration || 0);

      const h = new Howl({
        src: [pickSrc(track, quality ?? s.quality)],
        html5: true, // streams the file instead of downloading it fully first
        volume: m ? 0 : s.volume,
        rate: s.rate,
        onload: () => {
          setDuration(h.duration());
          setLoading(false);
          if (startAt) h.seek(startAt);
        },
        onplay: () => {
          setIsPlaying(true);
          setLoading(false);
          startTimer();
        },
        onpause: () => setIsPlaying(false),
        onstop: () => setIsPlaying(false),
        onend: () => advance(true),
        onloaderror: () => {
          setLoading(false);
          setIsPlaying(false);
          toast.error('Could not load this track');
        },
        onplayerror: () => {
          // Browsers can block autoplay until the user interacts; retry once audio is unlocked.
          h.once('unlock', () => h.play());
        },
      });

      howl.current = h;
      if (play) h.play();
      if (!startAt) api.post(`/tracks/${track._id}/play`).catch(() => {});
    },
    [advance]
  );

  // (Re)load whenever the current track changes or is restarted.
  const currentId = current?._id;
  useEffect(() => {
    if (current) load(current);
    else destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, nonce]);

  useEffect(() => () => destroy(), []);

  const playTrack = useCallback((track, list) => {
    if (list && list.length) {
      const i = list.findIndex((t) => t._id === track._id);
      setQueue(list);
      setIndex(i >= 0 ? i : 0);
    } else {
      setQueue([track]);
      setIndex(0);
    }
    setNonce((n) => n + 1);
  }, []);

  const playAll = useCallback((list, { shuffleStart = false } = {}) => {
    if (!list.length) return;
    setQueue(list);
    setShuffle(shuffleStart);
    setIndex(shuffleStart ? Math.floor(Math.random() * list.length) : 0);
    setNonce((n) => n + 1);
  }, []);

  const addToQueue = useCallback((track) => {
    const { queue: q } = live.current;
    if (!q.length) {
      setQueue([track]);
      setIndex(0);
      setNonce((n) => n + 1);
      return;
    }
    if (q.some((t) => t._id === track._id)) {
      toast('Already in the queue');
      return;
    }
    setQueue([...q, track]);
    toast.success('Added to queue');
  }, []);

  const togglePlay = useCallback(() => {
    const h = howl.current;
    if (!h) {
      const { queue: q, index: i } = live.current;
      if (q[i]) load(q[i]);
      return;
    }
    if (h.playing()) h.pause();
    else h.play();
  }, [load]);

  const next = useCallback(() => advance(false), [advance]);

  const prev = useCallback(() => {
    const { queue: q, index: i, repeat: rep } = live.current;
    const h = howl.current;
    if (!q.length) return;
    if (h && Number(h.seek()) > 3) {
      h.seek(0);
      setProgress(0);
      return;
    }
    let p = i - 1;
    if (p < 0) p = rep === 'all' ? q.length - 1 : 0;
    setIndex(p);
    setNonce((n) => n + 1);
  }, []);

  const seek = useCallback((seconds) => {
    if (howl.current) howl.current.seek(seconds);
    setProgress(seconds);
  }, []);

  // Playback settings: quality, speed, volume, autoplay. Saved on this device.
  const updateSettings = useCallback(
    (partial) => {
      const prevSettings = live.current.settings;
      const nextSettings = { ...prevSettings, ...partial };
      setSettings(nextSettings);
      localStorage.setItem('player-settings', JSON.stringify(nextSettings));

      const h = howl.current;
      if (!h) return;
      if ('rate' in partial) h.rate(nextSettings.rate);
      if ('volume' in partial) h.volume(nextSettings.volume);

      // Switching quality reloads the current track at the same position.
      if ('quality' in partial && partial.quality !== prevSettings.quality) {
        const { queue: q, index: i } = live.current;
        const t = q[i];
        if (t && pickSrc(t, partial.quality) !== pickSrc(t, prevSettings.quality)) {
          load(t, { startAt: Number(h.seek()) || 0, play: h.playing(), quality: partial.quality });
        }
      }
    },
    [load]
  );

  const setVolume = useCallback(
    (v) => {
      setMuted(false);
      updateSettings({ volume: v });
    },
    [updateSettings]
  );

  const toggleMute = useCallback(() => {
    const m = !live.current.muted;
    setMuted(m);
    if (howl.current) howl.current.volume(m ? 0 : live.current.settings.volume);
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')),
    []
  );

  // When a user logs in, adopt the playback preferences saved on their account.
  useEffect(() => {
    if (user?.settings) {
      updateSettings({
        quality: user.settings.quality,
        rate: user.settings.playbackRate,
        autoplay: user.settings.autoplay,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Lock-screen / media-key controls.
  useEffect(() => {
    if (!('mediaSession' in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      album: current.album || '',
      artwork: current.coverUrl ? [{ src: current.coverUrl, sizes: '400x400' }] : [],
    });
    navigator.mediaSession.setActionHandler('play', () => howl.current?.play());
    navigator.mediaSession.setActionHandler('pause', () => howl.current?.pause());
    navigator.mediaSession.setActionHandler('previoustrack', prev);
    navigator.mediaSession.setActionHandler('nexttrack', next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  return (
    <PlayerContext.Provider
      value={{
        current,
        queue,
        isPlaying,
        loading,
        progress,
        duration,
        shuffle,
        repeat,
        muted,
        settings,
        playTrack,
        playAll,
        addToQueue,
        togglePlay,
        next,
        prev,
        seek,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        updateSettings,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}
