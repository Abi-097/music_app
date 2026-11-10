import { Link } from 'react-router-dom';
import { FiPlay, FiPause } from 'react-icons/fi';
import { usePlayer } from '../context/PlayerContext';
import Cover from './Cover';

// Square card used in grids (recommendations).
export default function TrackCard({ track, list }) {
  const { current, isPlaying, playTrack, togglePlay } = usePlayer();
  const active = current?._id === track._id;

  return (
    <div className="group rounded-xl bg-zinc-900 p-3 transition hover:bg-zinc-800">
      <div className="relative">
        <Cover src={track.coverUrl} alt={track.title} className="aspect-square w-full rounded-lg" />
        <button
          onClick={() => (active ? togglePlay() : playTrack(track, list))}
          aria-label={active && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          className={`absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 shadow-lg transition hover:scale-105 hover:bg-emerald-400 ${
            active ? 'opacity-100' : 'opacity-0 focus:opacity-100 group-hover:opacity-100'
          }`}
        >
          {active && isPlaying ? <FiPause size={20} /> : <FiPlay size={20} className="translate-x-px" />}
        </button>
      </div>
      <Link to={`/track/${track._id}`} className="mt-3 block truncate text-sm font-semibold hover:underline">
        {track.title}
      </Link>
      <p className="truncate text-xs text-zinc-400">{track.artist}</p>
    </div>
  );
}
