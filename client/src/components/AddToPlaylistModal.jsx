import { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Modal from './Modal';
import api, { errMsg } from '../lib/api';

export default function AddToPlaylistModal({ track, onClose }) {
  const [playlists, setPlaylists] = useState(null);
  const [name, setName] = useState('');

  useEffect(() => {
    api
      .get('/playlists')
      .then((res) => setPlaylists(res.data))
      .catch((err) => {
        toast.error(errMsg(err));
        setPlaylists([]);
      });
  }, []);

  const addTo = async (playlist) => {
    try {
      await api.post(`/playlists/${playlist._id}/tracks`, { trackId: track._id });
      toast.success(`Added to "${playlist.name}"`);
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const createAndAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const { data } = await api.post('/playlists', { name });
      await addTo(data);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <Modal title="Add to playlist" onClose={onClose}>
      <p className="mb-3 truncate text-sm text-zinc-400">{track.title} · {track.artist}</p>

      <form onSubmit={createAndAdd} className="mb-4 flex gap-2">
        <input className="input" placeholder="New playlist name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <button className="btn-primary shrink-0" disabled={!name.trim()}>
          <FiPlus /> Create
        </button>
      </form>

      {playlists === null ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : playlists.length === 0 ? (
        <p className="text-sm text-zinc-500">You have no playlists yet. Create one above.</p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {playlists.map((p) => (
            <li key={p._id}>
              <button
                onClick={() => addTo(p)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-800"
              >
                <span className="truncate">{p.name}</span>
                <span className="ml-3 shrink-0 text-xs text-zinc-500">{p.trackCount} songs</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
