import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiPlay, FiShuffle, FiEdit2, FiTrash2, FiLock, FiGlobe } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import Cover from '../components/Cover';
import Modal from '../components/Modal';
import TrackRow from '../components/TrackRow';
import LikeButton from '../components/LikeButton';
import ShareButtons from '../components/ShareButtons';
import CommentSection from '../components/CommentSection';

export default function PlaylistDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { playAll } = usePlayer();
  const navigate = useNavigate();

  const [pl, setPl] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', isPublic: false });

  useEffect(() => {
    setPl(null);
    setError('');
    api
      .get(`/playlists/${id}`)
      .then((res) => {
        setPl(res.data);
        setForm({ name: res.data.name, description: res.data.description, isPublic: res.data.isPublic });
      })
      .catch((err) => setError(errMsg(err)));
  }, [id, user?.id]);

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="mb-4 text-zinc-300">{error}</p>
        <Link to="/library" className="btn-ghost">Back to library</Link>
      </div>
    );
  }
  if (!pl) return <p className="py-20 text-center text-zinc-500">Loading…</p>;

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const { data } = await api.put(`/playlists/${id}`, form);
      setPl((p) => ({ ...p, ...data }));
      setEditing(false);
      toast.success('Playlist updated');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const removePlaylist = async () => {
    if (!window.confirm(`Delete "${pl.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/playlists/${id}`);
      toast.success('Playlist deleted');
      navigate('/library');
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const removeTrack = async (track) => {
    try {
      await api.delete(`/playlists/${id}/tracks/${track._id}`);
      setPl((p) => ({ ...p, tracks: p.tracks.filter((t) => t._id !== track._id) }));
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const covers = pl.tracks.map((t) => t.coverUrl).filter(Boolean);

  return (
    <>
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end">
        <div className="grid h-48 w-48 shrink-0 grid-cols-2 grid-rows-2 overflow-hidden rounded-xl bg-zinc-800 shadow-lg">
          {[0, 1, 2, 3].map((i) => (
            <Cover key={i} src={covers[covers.length === 1 ? 0 : i]} className="h-full w-full" />
          ))}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-zinc-400">
            {pl.isPublic ? <FiGlobe /> : <FiLock />} {pl.isPublic ? 'Public' : 'Private'} playlist
          </p>
          <h1 className="mt-1 break-words text-4xl font-bold">{pl.name}</h1>
          {pl.description && <p className="mt-2 text-zinc-400">{pl.description}</p>}
          <p className="mt-2 text-sm text-zinc-400">
            By {pl.owner?.name} · {pl.tracks.length} {pl.tracks.length === 1 ? 'song' : 'songs'}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button className="btn-primary" disabled={!pl.tracks.length} onClick={() => playAll(pl.tracks)}>
          <FiPlay /> Play
        </button>
        <button className="btn-ghost" disabled={!pl.tracks.length} onClick={() => playAll(pl.tracks, { shuffleStart: true })}>
          <FiShuffle /> Shuffle
        </button>
        <LikeButton type="playlist" id={pl._id} liked={pl.liked} count={pl.likesCount} showCount />
        {pl.isOwner && (
          <>
            <button className="btn-ghost" onClick={() => setEditing(true)}>
              <FiEdit2 /> Edit
            </button>
            <button className="btn-danger" onClick={removePlaylist}>
              <FiTrash2 /> Delete
            </button>
          </>
        )}
      </div>

      {pl.tracks.length === 0 ? (
        <p className="py-8 text-zinc-400">
          This playlist is empty.{' '}
          {pl.isOwner && (
            <>
              <Link to="/search" className="text-emerald-400 hover:underline">Find songs</Link> and use the + button to add them here.
            </>
          )}
        </p>
      ) : (
        <div className="space-y-1">
          {pl.tracks.map((t) => (
            <TrackRow key={t._id} track={t} list={pl.tracks} onRemove={pl.isOwner ? removeTrack : undefined} />
          ))}
        </div>
      )}

      {pl.isPublic && (
        <div className="mt-8">
          <ShareButtons title={pl.name} path={`/playlist/${pl._id}`} />
        </div>
      )}

      <div className="mt-10 max-w-2xl">
        <CommentSection type="playlist" id={pl._id} />
      </div>

      {editing && (
        <Modal title="Edit playlist" onClose={() => setEditing(false)}>
          <form onSubmit={save} className="space-y-3">
            <input className="input" value={form.name} maxLength={80} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <textarea className="input" rows={3} value={form.description} maxLength={300} placeholder="Description (optional)" onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-emerald-400" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />
              Public playlist
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn-primary" disabled={!form.name.trim()}>Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
