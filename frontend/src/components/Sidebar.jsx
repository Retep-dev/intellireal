import { Link, useLocation } from 'react-router-dom';
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

  const isCurrent = (path) => location.pathname === path && !location.search;
  const isAgentActive = (agentType) => {
    const params = new URLSearchParams(location.search);
    return location.pathname === '/chat' && params.get('agent') === agentType;
  };
  const isCopilotActive = () => {
    const params = new URLSearchParams(location.search);
    return location.pathname === '/chat' && !params.get('agent');
  };

  return (
    <aside className={`sidebar-container ${isPinned ? 'pinned' : ''}`}>
      {/* 1. Left Narrow Icon Rail (56px) */}
      <div className="icon-rail">
        <div className="rail-logo" title="IntelliReal">
          <div className="rail-logo-icon">IR</div>
        </div>

        <Link
          to="/"
          className={`rail-item ${isCurrent('/') ? 'active' : ''}`}
          title="Reports Snapshot"
        >
          <BarChart2 size={20} />
        </Link>

        <Link
          to="/documents"
          className={`rail-item ${isCurrent('/documents') ? 'active' : ''}`}
          title="Documents"
        >
          <FileText size={20} />
        </Link>

        <Link
          to="/chat"
          className={`rail-item ${isCopilotActive() ? 'active' : ''}`}
          title="Financial Chat Copilot"
        >
          <MessageSquare size={20} />
        </Link>

        <Link
          to="/chat?agent=research"
          className={`rail-item ${isAgentActive('research') ? 'active' : ''}`}
          title="Research Q&A Agent"
        >
          <Search size={20} />
        </Link>

        <Link
          to="/chat?agent=summary"
          className={`rail-item ${isAgentActive('summary') ? 'active' : ''}`}
          title="Financial Summary Agent"
        >
          <PieChart size={20} />
        </Link>

        <Link
          to="/chat?agent=risk"
          className={`rail-item ${isAgentActive('risk') ? 'active' : ''}`}
          title="Risk Analysis Agent"
        >
          <Shield size={20} />
        </Link>

        <Link
          to="/chat?agent=trend"
          className={`rail-item ${isAgentActive('trend') ? 'active' : ''}`}
          title="Market Trend Agent"
        >
          <TrendingUp size={20} />
        </Link>

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

          <Link
            to="/"
            className={`subnav-item ${isCurrent('/') ? 'active' : ''}`}
          >
            <span>Overview</span>
          </Link>

          <Link
            to="/documents"
            className={`subnav-item ${isCurrent('/documents') ? 'active' : ''}`}
          >
            <span>Documents</span>
          </Link>

          <Link
            to="/chat"
            className={`subnav-item ${isCopilotActive() ? 'active' : ''}`}
          >
            <span>Financial Copilot</span>
          </Link>
        </div>

        <div>
          <div className="subnav-group-label">Financial AI Agents</div>

          <Link
            to="/chat?agent=research"
            className={`subnav-item ${isAgentActive('research') ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Search size={14} color="var(--google-blue)" /> Research Agent
            </span>
          </Link>

          <Link
            to="/chat?agent=summary"
            className={`subnav-item ${isAgentActive('summary') ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PieChart size={14} color="var(--google-green)" /> Summary Agent
            </span>
          </Link>

          <Link
            to="/chat?agent=risk"
            className={`subnav-item ${isAgentActive('risk') ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} color="var(--google-yellow)" /> Risk Analysis
            </span>
          </Link>

          <Link
            to="/chat?agent=trend"
            className={`subnav-item ${isAgentActive('trend') ? 'active' : ''}`}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={14} color="var(--google-purple)" /> Market Trends
            </span>
          </Link>
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
