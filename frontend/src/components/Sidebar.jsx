import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Search,
  Globe,
  Shield,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  {
    section: 'Main',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/documents', icon: FileText, label: 'Documents' },
      { to: '/chat', icon: MessageSquare, label: 'Chat' },
    ],
  },
  {
    section: 'Coming Soon',
    items: [
      { to: '/edgar', icon: Search, label: 'SEC EDGAR', badge: 'Phase 2' },
      { to: '/analytics', icon: TrendingUp, label: 'Analytics', badge: 'Phase 2' },
      { to: '/risks', icon: Shield, label: 'Risk Monitor', badge: 'Phase 2' },
      { to: '/graph', icon: Globe, label: 'Knowledge Graph', badge: 'Phase 3' },
    ],
  },
];

export default function Sidebar() {
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">IR</div>
        <span className="sidebar-logo-text">IntelliReal</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              const isDisabled = !!item.badge;

              return (
                <NavLink
                  key={item.to}
                  to={isDisabled ? '#' : item.to}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={(e) => isDisabled && e.preventDefault()}
                  style={isDisabled ? { opacity: 0.5, cursor: 'default' } : {}}
                >
                  <Icon />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="sidebar-badge">{item.badge}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-link" onClick={() => signOut()}>
          <LogOut />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
