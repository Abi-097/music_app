import { useEffect, useState } from 'react';
import { FiHeart } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import useRequireAuth from '../hooks/useRequireAuth';

// Heart toggle for a track or playlist. Every LikeButton showing the same item stays in sync
// (for example the one in the player bar and the one in a track list).
export default function LikeButton({ type = 'track', id, liked: initialLiked = false, count: initialCount = 0, showCount = false }) {
  const requireAuth = useRequireAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [id, initialLiked, initialCount]);

  useEffect(() => {
    const onSync = (e) => {
      if (e.detail.type === type && e.detail.id === id) {
        setLiked(e.detail.liked);
        setCount(e.detail.count);
      }
    };
    window.addEventListener('like-sync', onSync);
    return () => window.removeEventListener('like-sync', onSync);
  }, [type, id]);

  const toggle = async () => {
    if (!requireAuth() || busy) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/${type === 'track' ? 'tracks' : 'playlists'}/${id}/like`);
      window.dispatchEvent(
        new CustomEvent('like-sync', { detail: { type, id, liked: data.liked, count: data.likesCount } })
      );
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={showCount ? 'btn-ghost' : 'icon-btn'}
    >
      {liked ? <FaHeart className="text-emerald-400" /> : <FiHeart />}
      {showCount && <span>{count}</span>}
    </button>
  );
}
