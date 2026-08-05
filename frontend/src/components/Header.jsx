import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  Grid,
  HelpCircle,
  MoreVertical,
  Check,
  Building,
  FileText,
  MessageSquare,
  Shield,
  TrendingUp,
  LogOut,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest } from '../lib/supabase';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // State for dropdowns & modals
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState('IntelliReal Financial Index');
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const headerRef = useRef(null);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'A';

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setShowWorkspaceMenu(false);
        setShowAppsMenu(false);
        setShowUserMenu(false);
        setShowMoreMenu(false);
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Search Input & Live Fetching
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length > 1) {
      setIsSearching(true);
      setShowSearchResults(true);
      try {
        const docs = await apiRequest('/documents/');
        const filtered = docs.filter(doc =>
          doc.filename.toLowerCase().includes(val.toLowerCase()) ||
          doc.file_type.toLowerCase().includes(val.toLowerCase())
        );
        setSearchResults(filtered.slice(0, 5));
      } catch (err) {
        console.warn('Search docs error:', err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setShowSearchResults(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchResults(false);
      navigate(`/chat?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const workspaces = [
    { name: 'IntelliReal Financial Index', desc: 'Main repository & SEC filings', count: 'All Documents' },
    { name: 'SEC EDGAR 10-K & 10-Q Vault', desc: 'Direct SEC EDGAR fetched filings', count: '10-K, 10-Q' },
    { name: 'Tech & Semiconductor Portfolio', desc: 'AAPL, NVDA, MSFT financial models', count: 'Tech Sector' },
    { name: 'Credit Liabilities & Debt Index', desc: 'Litigation & debt covenants', count: 'Risk Analysis' },
  ];

  return (
    <header className="header" ref={headerRef} style={{ position: 'relative' }}>
      {/* 1. Account / Workspace Switcher (Interactive) */}
      <div style={{ position: 'relative' }}>
        <div
          className="account-selector"
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="account-subtitle">Active Workspace</span>
            <span className="account-title">
              {activeWorkspace} <ChevronDown size={14} />
            </span>
          </div>
        </div>

        {/* Workspace Dropdown Menu */}
        {showWorkspaceMenu && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: 320,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(60,64,67,0.15)',
            zIndex: 300,
            padding: '8px 0',
          }}>
            <div style={{
              padding: '8px 16px',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              borderBottom: '1px solid var(--border-light)',
            }}>
              Switch Financial Workspace
            </div>
            {workspaces.map((ws, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setActiveWorkspace(ws.name);
                  setShowWorkspaceMenu(false);
                }}
                style={{
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: activeWorkspace === ws.name ? 'var(--google-blue-light)' : 'transparent',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (activeWorkspace !== ws.name) e.currentTarget.style.background = 'var(--bg-hover)';
                }}
                onMouseLeave={(e) => {
                  if (activeWorkspace !== ws.name) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Building size={16} color={activeWorkspace === ws.name ? 'var(--google-blue)' : 'var(--text-secondary)'} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{ws.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{ws.desc}</div>
                  </div>
                </div>
                {activeWorkspace === ws.name && <Check size={16} color="var(--google-blue)" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Live Global Search Bar */}
      <div className="ga4-search" style={{ position: 'relative' }}>
        <form onSubmit={handleSearchSubmit}>
          <Search size={16} className="ga4-search-icon" />
          <input
            type="text"
            placeholder='Try searching "revenue 2024" or "AAPL 10-K"'
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => { if (searchQuery.trim()) setShowSearchResults(true); }}
          />
        </form>

        {/* Live Search Results Dropdown */}
        {showSearchResults && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(60,64,67,0.15)',
            zIndex: 300,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-light)' }}>
              Quick Search & Chat Actions
            </div>
            <div
              onClick={() => handleSearchSubmit()}
              style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                background: 'var(--google-blue-light)',
                color: 'var(--google-blue)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Sparkles size={16} /> Ask Financial AI Copilot: "{searchQuery}"
            </div>
            {isSearching ? (
              <div style={{ padding: 12, fontSize: 12, color: 'var(--text-secondary)' }}>Searching documents...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((doc, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setShowSearchResults(false);
                    navigate('/documents');
                  }}
                  style={{
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    borderTop: '1px solid var(--border-light)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileText size={14} color="var(--google-blue)" />
                    <span>{doc.filename}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{doc.file_type.toUpperCase()}</span>
                </div>
              ))
            ) : null}
          </div>
        )}
      </div>

      {/* 3. Top Right Controls & Dropdowns */}
      <div className="header-right" style={{ position: 'relative' }}>
        {/* Quick Suite Apps Grid Toggle */}
        <button
          className="icon-btn"
          title="IntelliReal Quick Apps"
          onClick={() => {
            setShowAppsMenu(!showAppsMenu);
            setShowUserMenu(false);
            setShowMoreMenu(false);
          }}
        >
          <Grid size={18} />
        </button>

        {/* Quick Suite Apps Dropdown */}
        {showAppsMenu && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 80,
            width: 280,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(60,64,67,0.15)',
            zIndex: 300,
            padding: 12,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}>
            <div
              onClick={() => { navigate('/chat'); setShowAppsMenu(false); }}
              style={{ padding: 10, borderRadius: 6, cursor: 'pointer', textAlign: 'center', background: 'var(--bg-hover)' }}
            >
              <MessageSquare size={20} color="var(--google-blue)" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: 12, fontWeight: 500 }}>Chat Copilot</div>
            </div>
            <div
              onClick={() => { navigate('/documents'); setShowAppsMenu(false); }}
              style={{ padding: 10, borderRadius: 6, cursor: 'pointer', textAlign: 'center', background: 'var(--bg-hover)' }}
            >
              <FileText size={20} color="var(--google-green)" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: 12, fontWeight: 500 }}>Document Store</div>
            </div>
            <div
              onClick={() => { navigate('/chat?agent=risk'); setShowAppsMenu(false); }}
              style={{ padding: 10, borderRadius: 6, cursor: 'pointer', textAlign: 'center', background: 'var(--bg-hover)' }}
            >
              <Shield size={20} color="var(--google-yellow)" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: 12, fontWeight: 500 }}>Risk Matrix</div>
            </div>
            <div
              onClick={() => { navigate('/chat?agent=trend'); setShowAppsMenu(false); }}
              style={{ padding: 10, borderRadius: 6, cursor: 'pointer', textAlign: 'center', background: 'var(--bg-hover)' }}
            >
              <TrendingUp size={20} color="var(--google-purple)" style={{ margin: '0 auto 4px' }} />
              <div style={{ fontSize: 12, fontWeight: 500 }}>Market Trends</div>
            </div>
          </div>
        )}

        {/* Help & Guide Modal Trigger */}
        <button
          className="icon-btn"
          title="Platform Guide & FAQ"
          onClick={() => setShowHelpModal(true)}
        >
          <HelpCircle size={18} />
        </button>

        {/* Options Menu Toggle */}
        <button
          className="icon-btn"
          title="More options"
          onClick={() => {
            setShowMoreMenu(!showMoreMenu);
            setShowAppsMenu(false);
            setShowUserMenu(false);
          }}
        >
          <MoreVertical size={18} />
        </button>

        {/* More Options Dropdown */}
        {showMoreMenu && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 40,
            width: 200,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(60,64,67,0.15)',
            zIndex: 300,
            padding: '6px 0',
          }}>
            <div
              onClick={() => { setShowHelpModal(true); setShowMoreMenu(false); }}
              style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
            >
              📖 Documentation Guide
            </div>
            <div
              onClick={() => { navigate('/documents'); setShowMoreMenu(false); }}
              style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}
            >
              📂 Manage Documents
            </div>
            <div
              onClick={() => { signOut(); setShowMoreMenu(false); }}
              style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer', color: 'var(--google-red)' }}
            >
              🚪 Sign Out
            </div>
          </div>
        )}

        {/* User Account Avatar Toggle */}
        <div
          className="user-avatar"
          title={user?.email || 'User Account'}
          onClick={() => {
            setShowUserMenu(!showUserMenu);
            setShowAppsMenu(false);
            setShowMoreMenu(false);
          }}
          style={{ userSelect: 'none' }}
        >
          {initials}
        </div>

        {/* User Profile Dropdown Card */}
        {showUserMenu && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 260,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(60,64,67,0.15)',
            zIndex: 300,
            padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div className="user-avatar" style={{ width: 40, height: 40, fontSize: 15 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
                  {user?.user_metadata?.full_name || 'Senior Analyst'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email || 'analyst@intellireal.com'}
                </div>
              </div>
            </div>
            <div style={{
              padding: '6px 10px',
              background: 'var(--google-green-light)',
              color: 'var(--google-green)',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 500,
              marginBottom: 12,
            }}>
              ● Supabase Auth & RAG Engine Active
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => signOut()}
              style={{ width: '100%', color: 'var(--google-red)', borderColor: 'var(--google-red)' }}
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Help & FAQ Documentation Modal */}
      {showHelpModal && (
        <div className="modal-overlay" onClick={() => setShowHelpModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600 }}>
                <HelpCircle color="var(--google-blue)" size={20} /> IntelliReal Guide & Documentation
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>🤖 4 Financial AI Agents:</strong>
                <ul style={{ paddingLeft: 20, marginTop: 4 }}>
                  <li><strong>Research Agent:</strong> Answers factual questions with exact document page citations.</li>
                  <li><strong>Summary Agent:</strong> Creates executive summaries & financial KPI tables.</li>
                  <li><strong>Risk Agent:</strong> Extracts litigation, credit covenant risk severity matrices.</li>
                  <li><strong>Market Trends Agent:</strong> Analyzes YoY growth, margin trajectories, and guidance.</li>
                </ul>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>⚡ SEC EDGAR Automated Fetcher:</strong>
                <p style={{ marginTop: 2 }}>
                  Go to <strong>Documents &gt; Upload Document</strong> to fetch SEC filings directly by ticker symbol (e.g. <code>AAPL</code>, <code>MSFT</code>, <code>NVDA</code>) or click <strong>Pre-seed filings</strong> to populate the vector store instantly.
                </p>
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)' }}>📄 Supported File Formats:</strong>
                <p style={{ marginTop: 2 }}>
                  Upload <code>.pdf</code>, <code>.docx</code>, <code>.txt</code>, or <code>.html</code> reports up to 50MB.
                </p>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'right' }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowHelpModal(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
