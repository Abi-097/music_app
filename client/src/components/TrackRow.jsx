import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPlay, FiPause, FiPlus, FiX, FiList } from 'react-icons/fi';
import { usePlayer } from '../context/PlayerContext';
import useRequireAuth from '../hooks/useRequireAuth';
import Cover from './Cover';
import LikeButton from './LikeButton';
import DownloadButton from './DownloadButton';
import AddToPlaylistModal from './AddToPlaylistModal';
import { fmtTime } from '../lib/format';

// One track in a list. `list` is the full list so that playing a row queues the rest of the list.
// `onRemove` (optional) shows a remove button, used inside the owner's playlists.
export default function TrackRow({ track, list, onRemove }) {
  const { current, isPlaying, playTrack, togglePlay, addToQueue } = usePlayer();
  const requireAuth = useRequireAuth();
  const [adding, setAdding] = useState(false);

  const active = current?._id === track._id;
  const handlePlay = () => (active ? togglePlay() : playTrack(track, list));
  const details = [track.album, track.movie].filter(Boolean).join(' · ');

  return (
    <div
      className={`grid grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-800/60 md:grid-cols-[2rem_minmax(0,1.2fr)_minmax(0,1fr)_auto] ${
        active ? 'bg-zinc-800/60' : ''
      }`}
    >
      <button className="icon-btn" onClick={handlePlay} aria-label={active && isPlaying ? 'Pause' : 'Play'}>
        {active && isPlaying ? <FiPause className="text-emerald-400" /> : <FiPlay />}
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <Cover src={track.coverUrl} alt="" className="h-10 w-10 shrink-0 rounded" />
        <div className="min-w-0">
          <Link
            to={`/track/${track._id}`}
            className={`block truncate text-sm font-medium hover:underline ${active ? 'text-emerald-400' : ''}`}
          >
            {track.title}
          </Link>
          <p className="truncate text-xs text-zinc-400">{track.artist}</p>
        </div>
      </div>

      <p className="hidden truncate text-sm text-zinc-400 md:block">{details}</p>

      <div className="flex items-center gap-0.5">
        <LikeButton id={track._id} liked={track.liked} count={track.likesCount} />
        <button className="icon-btn" aria-label="Add to queue" title="Add to queue" onClick={() => addToQueue(track)}>
          <FiList />
        </button>
        <button
          className="icon-btn"
          aria-label="Add to playlist"
          title="Add to playlist"
          onClick={() => requireAuth() && setAdding(true)}
        >
          <FiPlus />
        </button>
        <span className="hidden sm:inline-flex"><DownloadButton track={track} /></span>
        {onRemove && (
          <button className="icon-btn" aria-label="Remove from playlist" title="Remove from playlist" onClick={() => onRemove(track)}>
            <FiX />
          </button>
        )}
        <span className="hidden w-10 text-right text-xs text-zinc-500 sm:inline">
          {track.duration ? fmtTime(track.duration) : ''}
        </span>
      </div>

      {adding && <AddToPlaylistModal track={track} onClose={() => setAdding(false)} />}
    </div>
  );
}
