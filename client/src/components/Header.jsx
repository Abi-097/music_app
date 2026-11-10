import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FiMusic, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
  }`;

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-zinc-950">
            <FiMusic />
          </span>
          Wavely
        </Link>

        <nav className="order-last flex w-full items-center gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/search" className={linkClass}>Search</NavLink>
          <NavLink to="/library" className={linkClass}>Library</NavLink>
          <NavLink to="/liked" className={linkClass}>Liked songs</NavLink>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-zinc-400 md:inline">Hi, {user.name.split(' ')[0]}</span>
              <Link to="/settings" className="icon-btn" aria-label="Settings" title="Settings">
                <FiSettings />
              </Link>
              <button className="icon-btn" onClick={handleLogout} aria-label="Log out" title="Log out">
                <FiLogOut />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
