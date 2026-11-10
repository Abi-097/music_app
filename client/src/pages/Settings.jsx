import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import PlaybackSettings from '../components/PlaybackSettings';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { settings } = usePlayer();

  const [name, setName] = useState(user.name);
  const [picked, setPicked] = useState(user.preferredGenres || []);
  const [genres, setGenres] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/tracks/genres').then((r) => setGenres(r.data)).catch(() => {});
  }, []);

  const toggle = (g) => setPicked((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        name,
        preferredGenres: picked,
        settings: { quality: settings.quality, playbackRate: settings.rate, autoplay: settings.autoplay },
      });
      toast.success('Settings saved');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-2xl space-y-10">
      <h1 className="text-3xl font-bold">Settings</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Profile</h2>
        <label className="block">
          <span className="mb-1 block text-sm text-zinc-400">Display name</span>
          <input className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </label>
        <p className="mt-2 text-sm text-zinc-500">{user.email}</p>
      </section>

      <section>
        <h2 className="mb-1 text-lg font-semibold">Your music taste</h2>
        <p className="mb-3 text-sm text-zinc-400">Pick the genres you like. We use them (and the songs you like) to build your recommendations.</p>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              type="button"
              key={g.name}
              onClick={() => toggle(g.name)}
              aria-pressed={picked.includes(g.name)}
              className={`chip ${picked.includes(g.name) ? 'chip-active' : ''}`}
            >
              {g.name}
            </button>
          ))}
          {genres.length === 0 && <p className="text-sm text-zinc-500">No genres available yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Playback</h2>
        <PlaybackSettings />
      </section>

      <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>
    </form>
  );
}
