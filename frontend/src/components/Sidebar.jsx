import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart2,
  FileText,
  MessageSquare,
  Search,
  TrendingUp,
  Shield,
  Settings,
  LogOut,
  Sparkles,
  PieChart,
  Pin,
  PinOff,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar({ isPinned, setIsPinned }) {
  const { signOut } = useAuth();
  const location = useLocation();

  const isCurrent = (path) => location.pathname === path;

  return (
    <aside className={`sidebar-container ${isPinned ? 'pinned' : ''}`}>
      {/* 1. Left Narrow Icon Rail (56px) */}
      <div className="icon-rail">
        <div className="rail-logo" title="IntelliReal">
          <div className="rail-logo-icon">IR</div>
        </div>

        <NavLink
          to="/"
          className={`rail-item ${isCurrent('/') ? 'active' : ''}`}
          title="Reports Snapshot"
        >
          <BarChart2 size={20} />
        </NavLink>

        <NavLink
          to="/documents"
          className={`rail-item ${isCurrent('/documents') ? 'active' : ''}`}
          title="Documents"
        >
          <FileText size={20} />
        </NavLink>

        <NavLink
          to="/chat"
          className={`rail-item ${isCurrent('/chat') ? 'active' : ''}`}
          title="Financial Chat"
        >
          <MessageSquare size={20} />
        </NavLink>

        <div className="rail-item" title="SEC EDGAR (Phase 2)" style={{ opacity: 0.5 }}>
          <Search size={20} />
        </div>

        <div className="rail-item" title="Analytics (Phase 2)" style={{ opacity: 0.5 }}>
          <TrendingUp size={20} />
        </div>

        <div className="rail-item" title="Risk Monitor (Phase 2)" style={{ opacity: 0.5 }}>
          <Shield size={20} />
        </div>

        {/* Bottom Rail items */}
        <div className="rail-bottom">
          <button className="rail-item" title="Settings">
            <Settings size={20} />
          </button>
          <button className="rail-item" onClick={() => signOut()} title="Sign Out">
            <LogOut size={20} color="var(--google-red)" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Navigation Expansion Drawer (200px) */}
      <div className="subnav-panel">
        <div className="subnav-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={16} />
            <span>Reports snapshot</span>
          </div>
          <button
            onClick={() => setIsPinned?.(!isPinned)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--google-blue)',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isPinned ? 'Unpin sidebar' : 'Pin sidebar open'}
          >
            {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
          </button>
        </div>

        <div>
          <div className="subnav-group-label">Life cycle</div>

          <NavLink
            to="/"
            className={`subnav-item ${isCurrent('/') ? 'active' : ''}`}
          >
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/documents"
            className={`subnav-item ${isCurrent('/documents') ? 'active' : ''}`}
          >
            <span>Documents</span>
          </NavLink>

          <NavLink
            to="/chat"
            className={`subnav-item ${isCurrent('/chat') ? 'active' : ''}`}
          >
            <span>Financial Chat</span>
          </NavLink>
        </div>

        <div>
          <div className="subnav-group-label">Financial Agents</div>

          <div className="subnav-item active" style={{ background: 'transparent' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={14} color="var(--google-blue)" /> Research Agent
            </span>
          </div>

          <div className="subnav-item" style={{ opacity: 0.8 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PieChart size={14} color="var(--google-green)" /> Summary Agent
            </span>
          </div>

          <div className="subnav-item" style={{ opacity: 0.5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} /> Risk Analysis
            </span>
            <span className="subnav-badge">Phase 2</span>
          </div>

          <div className="subnav-item" style={{ opacity: 0.5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} /> Market Trends
            </span>
            <span className="subnav-badge">Phase 2</span>
          </div>
        </div>

        <div>
          <div className="subnav-group-label">User & System</div>
          <button
            className="subnav-item"
            style={{ width: '100%', border: 'none', background: 'none', textDecoration: 'none' }}
            onClick={() => signOut()}
          >
            <span style={{ color: 'var(--google-red)' }}>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
