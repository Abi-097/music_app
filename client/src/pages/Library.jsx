import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import Section from '../components/Section';
import Modal from '../components/Modal';
import PlaylistCard from '../components/PlaylistCard';

export default function Library() {
  const navigate = useNavigate();
  const [mine, setMine] = useState(null);
  const [community, setCommunity] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isPublic: false });

  useEffect(() => {
    api.get('/playlists').then((r) => setMine(r.data)).catch((err) => {
      toast.error(errMsg(err));
      setMine([]);
    });
    api.get('/playlists/public').then((r) => setCommunity(r.data)).catch(() => {});
  }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const { data } = await api.post('/playlists', form);
      toast.success('Playlist created');
      navigate(`/playlist/${data._id}`);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  if (!mine) return <p className="py-20 text-center text-zinc-500">Loading…</p>;

  // Don't repeat the user's own public playlists in the community list.
  const mineIds = new Set(mine.map((p) => p._id));
  const others = community.filter((p) => !mineIds.has(p._id));

  return (
    <>
      <Section
        title="Your playlists"
        action={
          <button className="btn-primary" onClick={() => setCreating(true)}>
            <FiPlus /> New playlist
          </button>
        }
      >
        {mine.length === 0 ? (
          <p className="text-zinc-400">No playlists yet. Create one to start collecting your favourite tracks.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {mine.map((p) => (
              <PlaylistCard key={p._id} playlist={p} />
            ))}
          </div>
        )}
      </Section>

      {others.length > 0 && (
        <Section title="Public playlists from the community">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {others.map((p) => (
              <PlaylistCard key={p._id} playlist={p} showOwner />
            ))}
          </div>
        </Section>
      )}

      {creating && (
        <Modal title="New playlist" onClose={() => setCreating(false)}>
          <form onSubmit={create} className="space-y-3">
            <input
              className="input"
              placeholder="Playlist name"
              value={form.name}
              maxLength={80}
              autoFocus
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <textarea
              className="input"
              rows={3}
              placeholder="Description (optional)"
              value={form.description}
              maxLength={300}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-emerald-400"
                checked={form.isPublic}
                onChange={(e) => setForm({ ...form, isPublic: e.target.checked })}
              />
              Make this playlist public (others can view, like and comment)
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn-primary" disabled={!form.name.trim()}>Create</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
