import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ title = 'Dashboard' }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Header title={title} />
        <div className="app-content page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
