import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [isPinned, setIsPinned] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar isPinned={isPinned} setIsPinned={setIsPinned} />
      <main className={`app-main ${isPinned ? 'sidebar-pinned' : ''}`}>
        <Header isPinned={isPinned} />
        <Outlet />
      </main>
    </div>
  );
}
