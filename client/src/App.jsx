import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import PlaylistDetail from './pages/PlaylistDetail';
import TrackDetail from './pages/TrackDetail';
import Liked from './pages/Liked';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="py-20 text-center text-zinc-500">Loading…</p>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/track/:id" element={<TrackDetail />} />
        <Route path="/playlist/:id" element={<PlaylistDetail />} />
        <Route path="/library" element={<Protected><Library /></Protected>} />
        <Route path="/liked" element={<Protected><Liked /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
