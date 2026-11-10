import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Section from '../components/Section';
import TrackCard from '../components/TrackCard';
import TrackRow from '../components/TrackRow';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export default function Home() {
  const { user } = useAuth();
  const [rec, setRec] = useState(null);
  const [trending, setTrending] = useState([]);
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    let alive = true;
    Promise.all([api.get('/tracks/recommended'), api.get('/tracks/trending'), api.get('/tracks/genres')])
      .then(([r, t, g]) => {
        if (!alive) return;
        setRec(r.data);
        setTrending(t.data.tracks);
        setGenres(g.data);
      })
      .catch((err) => {
        if (alive) {
          toast.error(errMsg(err));
          setRec({ tracks: [], basedOn: [] });
        }
      });
    return () => {
      alive = false;
    };
  }, [user?.id]);

  if (!rec) return <p className="py-20 text-center text-zinc-500">Loading…</p>;

  if (rec.tracks.length === 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold">No music yet</h1>
        <p className="text-zinc-400">
          The catalogue is empty. Run <code className="rounded bg-zinc-800 px-1.5 py-0.5">npm run seed</code> in the
          server folder to load demo tracks.
        </p>
      </div>
    );
  }

  const personalised = rec.basedOn.length > 0;

  return (
    <>
      <h1 className="mb-8 text-3xl font-bold">
        {greeting()}
        {user ? `, ${user.name.split(' ')[0]}` : ''}
      </h1>

      <Section
        title={personalised ? 'Recommended for you' : 'Popular right now'}
        action={
          user && !personalised ? (
            <Link to="/settings" className="text-sm text-emerald-400 hover:underline">
              Pick your favourite genres
            </Link>
          ) : null
        }
      >
        {personalised && (
          <p className="-mt-2 mb-4 text-sm text-zinc-400">Based on {rec.basedOn.join(', ')}</p>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {rec.tracks.map((t) => (
            <TrackCard key={t._id} track={t} list={rec.tracks} />
          ))}
        </div>
      </Section>

      {genres.length > 0 && (
        <Section title="Browse genres">
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <Link key={g.name} to={`/search?genre=${encodeURIComponent(g.name)}`} className="chip">
                {g.name} <span className="text-zinc-500">· {g.count}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section title="Trending">
        <div className="space-y-1">
          {trending.map((t) => (
            <TrackRow key={t._id} track={t} list={trending} />
          ))}
        </div>
      </Section>
    </>
  );
}
