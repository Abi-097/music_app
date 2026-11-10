import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { errMsg } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/AuthShell';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Welcome to Wavely! Pick your favourite genres to get recommendations.');
      navigate('/settings', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account">
      <form onSubmit={submit} className="space-y-3">
        <input className="input" placeholder="Name" autoComplete="name" required maxLength={60} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input" type="email" placeholder="Email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password (6+ characters)" autoComplete="new-password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-400">
        Already have an account? <Link to="/login" className="text-emerald-400 hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
