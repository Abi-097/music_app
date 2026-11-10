import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api, { errMsg } from '../lib/api';
import { timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';

// Comments for a track or playlist. type = 'track' | 'playlist'.
export default function CommentSection({ type, id }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/comments/${type}/${id}`)
      .then((res) => setComments(res.data))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [type, id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const { data } = await api.post(`/comments/${type}/${id}`, { text });
      setComments((c) => [data, ...c]);
      setText('');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setPosting(false);
    }
  };

  const remove = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((c) => c.filter((x) => x._id !== commentId));
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <section aria-label="Comments">
      <h2 className="mb-3 text-lg font-semibold">Comments ({comments.length})</h2>

      {user ? (
        <form onSubmit={submit} className="mb-5 flex gap-2">
          <input
            className="input"
            placeholder="Add a comment…"
            value={text}
            maxLength={500}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn-primary" disabled={!text.trim() || posting}>
            Post
          </button>
        </form>
      ) : (
        <p className="mb-5 text-sm text-zinc-400">
          <Link to="/login" className="text-emerald-400 hover:underline">Log in</Link> to join the conversation.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-500">No comments yet. Be the first!</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c._id} className="flex items-start gap-3 rounded-lg bg-zinc-900 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-semibold text-emerald-300">
                {(c.user?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{c.user?.name || 'Unknown'}</span>
                  <span className="ml-2 text-xs text-zinc-500">{timeAgo(c.createdAt)}</span>
                </p>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-zinc-300">{c.text}</p>
              </div>
              {user && c.user?._id === user.id && (
                <button className="icon-btn" aria-label="Delete comment" onClick={() => remove(c._id)}>
                  <FiTrash2 />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
