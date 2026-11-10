import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiPlay, FiPause, FiPlus } from 'react-icons/fi';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import useRequireAuth from '../hooks/useRequireAuth';
import Cover from '../components/Cover';
import LikeButton from '../components/LikeButton';
import DownloadButton from '../components/DownloadButton';
import ShareButtons from '../components/ShareButtons';
import CommentSection from '../components/CommentSection';
import AddToPlaylistModal from '../components/AddToPlaylistModal';

export default function TrackDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { current, isPlaying, playTrack, togglePlay } = usePlayer();
  const requireAuth = useRequireAuth();

  const [track, setTrack] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setTrack(null);
    setError('');
    api.get(`/tracks/${id}`).then((r) => setTrack(r.data)).catch((err) => setError(errMsg(err)));
  }, [id, user?.id]);

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-zinc-300">{error}</p>
        <Link to="/" className="btn-ghost">Back home</Link>
      </div>
    );
  }
  if (!track) return <p className="py-20 text-center text-zinc-500">Loading…</p>;

  const active = current?._id === track._id;
  const meta = [
    ['Artist', track.artist],
    ['Album', track.album],
    ['Movie', track.movie],
    ['Genre', track.genre],
    ['Plays', track.plays?.toLocaleString()],
  ].filter(([, v]) => v);

  return (
    <>
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end">
        <Cover src={track.coverUrl} alt={track.title} className="h-48 w-48 shrink-0 rounded-xl shadow-lg" />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-zinc-400">Track</p>
          <h1 className="mt-1 break-words text-4xl font-bold">{track.title}</h1>
          <p className="mt-2 text-zinc-300">
            <Link to={`/search?q=${encodeURIComponent(track.artist)}&field=artist`} className="hover:underline">
              {track.artist}
            </Link>
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={() => (active ? togglePlay() : playTrack(track))}>
          {active && isPlaying ? <FiPause /> : <FiPlay />} {active && isPlaying ? 'Pause' : 'Play'}
        </button>
        <LikeButton id={track._id} liked={track.liked} count={track.likesCount} showCount />
        <button className="btn-ghost" onClick={() => requireAuth() && setAdding(true)}>
          <FiPlus /> Add to playlist
        </button>
        <DownloadButton track={track} withLabel />
      </div>

      <dl className="mb-8 grid max-w-xl grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
        {meta.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-zinc-500">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <ShareButtons title={`${track.title} – ${track.artist}`} path={`/track/${track._id}`} />

      <div className="mt-10 max-w-2xl">
        <CommentSection type="track" id={track._id} />
      </div>

      {adding && <AddToPlaylistModal track={track} onClose={() => setAdding(false)} />}
    </>
  );
}
