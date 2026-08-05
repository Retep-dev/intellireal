import { Search, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ title }) {
  const { user } = useAuth();
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>

      <div className="header-actions">
        <div className="header-search">
          <Search size={14} />
          <input type="text" placeholder="Search documents, KPIs..." />
        </div>

        <button className="btn btn-ghost" style={{ padding: '8px' }}>
          <Bell size={18} />
        </button>

        <div className="header-avatar" title={user?.email || 'User'}>
          {initials}
        </div>
      </div>
    </header>
  );
}
