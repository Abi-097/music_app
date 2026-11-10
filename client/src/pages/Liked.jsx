import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import TrackRow from '../components/TrackRow';
import { usePlayer } from '../context/PlayerContext';

export default function Liked() {
  const { playAll } = usePlayer();
  const [tracks, setTracks] = useState(null);

  useEffect(() => {
    api
      .get('/tracks/liked')
      .then((res) => setTracks(res.data.tracks))
      .catch((err) => {
        toast.error(errMsg(err));
        setTracks([]);
      });
  }, []);

  if (!tracks) return <p className="py-20 text-center text-zinc-500">Loading…</p>;

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Liked songs</h1>
        {tracks.length > 0 && (
          <div className="flex gap-2">
            <button className="btn-primary" onClick={() => playAll(tracks)}>Play</button>
            <button className="btn-ghost" onClick={() => playAll(tracks, { shuffleStart: true })}>Shuffle</button>
          </div>
        )}
      </div>

      {tracks.length === 0 ? (
        <p className="py-10 text-center text-zinc-400">
          You haven't liked anything yet. Tap the heart on a track, or{' '}
          <Link to="/search" className="text-emerald-400 hover:underline">find some music</Link>.
        </p>
      ) : (
        <div className="space-y-1">
          {tracks.map((t) => (
            <TrackRow key={t._id} track={t} list={tracks} />
          ))}
        </div>
      )}
    </>
  );
}
