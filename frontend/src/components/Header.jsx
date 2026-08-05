import { Search, ChevronDown, Grid, HelpCircle, MoreVertical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ title }) {
  const { user } = useAuth();
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'A';

  return (
    <header className="header">
      {/* Account / Workspace Switcher (GA4 style) */}
      <div className="header-left">
        <div className="account-selector">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="account-subtitle">All accounts &gt; Demo Account</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              GA4 - IntelliReal Financial ... <ChevronDown size={14} />
            </span>
          </div>
        </div>
      </div>

      {/* GA4 Center Pill Search Bar */}
      <div className="ga4-search">
        <Search size={16} className="ga4-search-icon" />
        <input
          type="text"
          placeholder='Try searching "revenue 2024" or "AAPL 10-K"'
        />
      </div>

      {/* Top Right GA4 Header Controls */}
      <div className="header-right">
        <button className="icon-btn" title="Google Apps">
          <Grid size={18} />
        </button>
        <button className="icon-btn" title="Help & Feedback">
          <HelpCircle size={18} />
        </button>
        <button className="icon-btn" title="More options">
          <MoreVertical size={18} />
        </button>
        <div className="user-avatar" title={user?.email || 'Account'}>
          {initials}
        </div>
      </div>
    </header>
  );
}
