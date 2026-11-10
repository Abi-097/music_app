import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlay, FiPause, FiSkipBack, FiSkipForward, FiShuffle, FiRepeat,
  FiVolume2, FiVolumeX, FiSliders, FiLoader,
} from 'react-icons/fi';
import { usePlayer } from '../context/PlayerContext';
import { fmtTime } from '../lib/format';
import Cover from './Cover';
import LikeButton from './LikeButton';
import PlaybackSettings from './PlaybackSettings';

// Persistent bottom player: play/pause, next/previous, shuffle, repeat, seek, volume and playback settings.
export default function Player() {
  const p = usePlayer();
  const [showSettings, setShowSettings] = useState(false);
  const t = p.current;
  if (!t) return null;

  const volume = p.muted ? 0 : p.settings.volume;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-1 px-3 py-2 md:flex-row md:items-center md:gap-4">
        {/* Now playing */}
        <div className="flex min-w-0 items-center gap-3 md:w-1/4">
          <Cover src={t.coverUrl} alt="" className="h-12 w-12 shrink-0 rounded" />
          <div className="min-w-0 flex-1">
            <Link to={`/track/${t._id}`} className="block truncate text-sm font-semibold hover:underline">
              {t.title}
            </Link>
            <p className="truncate text-xs text-zinc-400">{t.artist}</p>
          </div>
          <LikeButton id={t._id} liked={t.liked} count={t.likesCount} />
        </div>

        {/* Controls + seek bar */}
        <div className="flex flex-1 flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <button
              className={`icon-btn ${p.shuffle ? '!text-emerald-400' : ''}`}
              onClick={p.toggleShuffle}
              aria-label="Shuffle"
              aria-pressed={p.shuffle}
              title="Shuffle"
            >
              <FiShuffle />
            </button>
            <button className="icon-btn" onClick={p.prev} aria-label="Previous track" title="Previous">
              <FiSkipBack />
            </button>
            <button
              onClick={p.togglePlay}
              aria-label={p.isPlaying ? 'Pause' : 'Play'}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-950 transition hover:scale-105"
            >
              {p.loading ? (
                <FiLoader className="animate-spin" />
              ) : p.isPlaying ? (
                <FiPause />
              ) : (
                <FiPlay className="translate-x-px" />
              )}
            </button>
            <button className="icon-btn" onClick={p.next} aria-label="Next track" title="Next">
              <FiSkipForward />
            </button>
            <button
              className={`icon-btn relative ${p.repeat !== 'off' ? '!text-emerald-400' : ''}`}
              onClick={p.cycleRepeat}
              aria-label={`Repeat: ${p.repeat}`}
              title={`Repeat: ${p.repeat}`}
            >
              <FiRepeat />
              {p.repeat === 'one' && (
                <span className="absolute -right-0.5 -top-0.5 rounded-full bg-emerald-500 px-1 text-[9px] font-bold leading-tight text-zinc-950">
                  1
                </span>
              )}
            </button>
          </div>

          <div className="flex w-full max-w-xl items-center gap-2 text-xs text-zinc-400">
            <span className="w-10 text-right tabular-nums">{fmtTime(p.progress)}</span>
            <input
              type="range"
              min={0}
              max={p.duration || 0}
              step={0.1}
              value={Math.min(p.progress, p.duration || 0)}
              onChange={(e) => p.seek(Number(e.target.value))}
              aria-label="Seek"
              className="h-1 flex-1 cursor-pointer"
            />
            <span className="w-10 tabular-nums">{fmtTime(p.duration)}</span>
          </div>
        </div>

        {/* Volume + settings */}
        <div className="relative hidden items-center justify-end gap-2 md:flex md:w-1/4">
          <button className="icon-btn" onClick={p.toggleMute} aria-label={p.muted ? 'Unmute' : 'Mute'}>
            {volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="h-1 w-24 cursor-pointer"
          />
          <button
            className={`icon-btn ${showSettings ? '!text-emerald-400' : ''}`}
            onClick={() => setShowSettings((s) => !s)}
            aria-label="Playback settings"
            title="Playback settings"
          >
            <FiSliders />
          </button>

          {showSettings && (
            <div className="absolute bottom-14 right-0 w-80 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-xl">
              <h3 className="mb-3 text-sm font-semibold">Playback settings</h3>
              <PlaybackSettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
