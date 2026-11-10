import { Link } from 'react-router-dom';
import { FiLock, FiGlobe } from 'react-icons/fi';
import Cover from './Cover';

// Playlist tile with a 2x2 cover mosaic.
export default function PlaylistCard({ playlist, showOwner = false }) {
  const covers = playlist.covers || [];
  return (
    <Link to={`/playlist/${playlist._id}`} className="group block rounded-xl bg-zinc-900 p-3 transition hover:bg-zinc-800">
      <div className="grid aspect-square grid-cols-2 grid-rows-2 overflow-hidden rounded-lg bg-zinc-800">
        {[0, 1, 2, 3].map((i) => (
          <Cover key={i} src={covers[covers.length === 1 ? 0 : i]} className="h-full w-full" />
        ))}
      </div>
      <p className="mt-3 truncate text-sm font-semibold group-hover:underline">{playlist.name}</p>
      <p className="flex items-center gap-1.5 truncate text-xs text-zinc-400">
        {playlist.isPublic ? <FiGlobe /> : <FiLock />}
        {playlist.trackCount} {playlist.trackCount === 1 ? 'song' : 'songs'}
        {showOwner && playlist.owner?.name ? ` · by ${playlist.owner.name}` : ''}
      </p>
    </Link>
  );
}
