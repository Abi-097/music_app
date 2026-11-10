import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import TrackRow from '../components/TrackRow';
import { usePlayer } from '../context/PlayerContext';

const FIELDS = [
  ['all', 'Everything'],
  ['title', 'Song name'],
  ['artist', 'Artist'],
  ['album', 'Album'],
  ['movie', 'Movie'],
];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const { playAll } = usePlayer();

  const q = params.get('q') || '';
  const field = params.get('field') || 'all';
  const genre = params.get('genre') || '';
  const sort = params.get('sort') || 'popular';

  const [input, setInput] = useState(q);
  const [result, setResult] = useState({ tracks: [], total: 0 });
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  const update = (patch) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        return next;
      },
      { replace: true }
    );

  useEffect(() => {
    api.get('/tracks/genres').then((r) => setGenres(r.data)).catch(() => {});
  }, []);

  // Keep the box in sync with the URL, and push typing to the URL after a short pause.
  useEffect(() => setInput(q), [q]);
  useEffect(() => {
    if (input === q) return undefined;
    const id = setTimeout(() => update({ q: input.trim() }), 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get('/tracks', { params: { q, field, genre, sort, limit: 50 } })
      .then((res) => alive && setResult(res.data))
      .catch((err) => alive && toast.error(errMsg(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [q, field, genre, sort]);

  return (
    <>
      <h1 className="mb-4 text-3xl font-bold">Search</h1>

      <div className="mb-3 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            autoFocus
            className="input !pl-9"
            placeholder="Search by song, artist, album or movie"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <select className="input md:w-44" value={field} onChange={(e) => update({ field: e.target.value === 'all' ? '' : e.target.value })} aria-label="Search in">
          {FIELDS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select className="input md:w-40" value={sort} onChange={(e) => update({ sort: e.target.value === 'popular' ? '' : e.target.value })} aria-label="Sort by">
          <option value="popular">Most popular</option>
          <option value="newest">Newest</option>
          <option value="title">A–Z</option>
        </select>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button className={`chip ${!genre ? 'chip-active' : ''}`} onClick={() => update({ genre: '' })}>
          All genres
        </button>
        {genres.map((g) => (
          <button
            key={g.name}
            className={`chip ${genre.toLowerCase() === g.name.toLowerCase() ? 'chip-active' : ''}`}
            onClick={() => update({ genre: g.name })}
          >
            {g.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-zinc-500">Searching…</p>
      ) : result.tracks.length === 0 ? (
        <p className="py-10 text-center text-zinc-400">No tracks found{q ? ` for “${q}”` : ''}. Try a different search.</p>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-zinc-400">{result.total} {result.total === 1 ? 'result' : 'results'}</p>
            <button className="btn-ghost" onClick={() => playAll(result.tracks)}>Play all</button>
          </div>
          <div className="space-y-1">
            {result.tracks.map((t) => (
              <TrackRow key={t._id} track={t} list={result.tracks} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
