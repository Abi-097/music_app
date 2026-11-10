import { Outlet } from 'react-router-dom';
import Header from './Header';
import Player from './Player';

export default function Layout() {
  return (
    <div className="min-h-screen">
      <Header />
      {/* Bottom padding keeps content clear of the fixed player bar */}
      <main className="mx-auto max-w-7xl px-4 pb-40 pt-6">
        <Outlet />
      </main>
      <Player />
    </div>
  );
}
