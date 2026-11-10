import { Link } from 'react-router-dom';
import { FiMusic } from 'react-icons/fi';

// Centered card used by the login and register pages.
export default function AuthShell({ title, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-zinc-950">
            <FiMusic />
          </span>
          Wavely
        </Link>
        <h1 className="mb-4 text-center text-lg font-semibold">{title}</h1>
        {children}
      </div>
    </div>
  );
}
