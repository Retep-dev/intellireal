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
  BookOpen,
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
            width: 220,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(60,64,67,0.15)',
            zIndex: 300,
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}>
            <div
              onClick={() => { setShowHelpModal(true); setShowMoreMenu(false); }}
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--google-blue-light)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <BookOpen size={16} color="var(--google-blue)" />
              <span>Documentation Guide</span>
            </div>

            <div
              onClick={() => { navigate('/documents'); setShowMoreMenu(false); }}
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--google-green-light)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <FileText size={16} color="var(--google-green)" />
              <span>Manage Documents</span>
            </div>

            <div
              onClick={() => { navigate('/chat?agent=research'); setShowMoreMenu(false); }}
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--google-purple-light)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Sparkles size={16} color="var(--google-purple)" />
              <span>Financial AI Copilot</span>
            </div>

            <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />

            <div
              onClick={() => { signOut(); setShowMoreMenu(false); }}
              style={{
                padding: '9px 12px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--google-red)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--google-red-light)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={16} color="var(--google-red)" />
              <span>Sign Out</span>
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580, borderRadius: 16, padding: 24 }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--google-blue-light)',
                  color: 'var(--google-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    IntelliReal Guide & Documentation
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                    Platform features, AI Agent capabilities, and filing ingestion guide
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Sections */}
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Section 1: 4 Financial AI Agents */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--google-blue)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                  4 Specialized Financial AI Agents
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--google-blue-light)', border: '1px solid rgba(26,115,232,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--google-blue)', fontSize: 12.5, marginBottom: 2 }}>
                      <Search size={14} /> Research Agent
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      Answers factual questions with exact document page citations and numbers.
                    </div>
                  </div>

                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--google-green-light)', border: '1px solid rgba(19,115,51,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--google-green)', fontSize: 12.5, marginBottom: 2 }}>
                      <FileText size={14} /> Summary Agent
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      Generates structured executive summaries & financial KPI tables.
                    </div>
                  </div>

                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--google-yellow-light)', border: '1px solid rgba(176,96,0,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--google-yellow)', fontSize: 12.5, marginBottom: 2 }}>
                      <Shield size={14} /> Risk Analysis
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      Extracts litigation, credit liabilities, & risk severity matrices.
                    </div>
                  </div>

                  <div style={{ padding: 10, borderRadius: 8, background: 'var(--google-purple-light)', border: '1px solid rgba(147,52,230,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--google-purple)', fontSize: 12.5, marginBottom: 2 }}>
                      <TrendingUp size={14} /> Market Trends
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      Analyzes YoY growth, margin trajectories, & guidance sentiment.
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: SEC EDGAR Auto-Fetcher */}
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)', fontSize: 12.5, marginBottom: 4 }}>
                  <Sparkles size={14} color="var(--google-purple)" /> SEC EDGAR Automated Fetcher
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Go to <strong>Documents &gt; Upload Document &gt; SEC EDGAR Tab</strong> to fetch SEC filings directly by ticker symbol (e.g., <code style={{ background: '#e8eaed', padding: '2px 5px', borderRadius: 4 }}>AAPL</code>, <code style={{ background: '#e8eaed', padding: '2px 5px', borderRadius: 4 }}>MSFT</code>, <code style={{ background: '#e8eaed', padding: '2px 5px', borderRadius: 4 }}>NVDA</code>) or click <strong>Pre-seed filings</strong> to auto-populate the ChromaDB vector store.
                </div>
              </div>

              {/* Section 3: Supported File Formats */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  Supported File Formats & Limits:
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ padding: '3px 8px', borderRadius: 12, background: 'var(--google-blue-light)', color: 'var(--google-blue)', fontSize: 11, fontWeight: 600 }}>.PDF</span>
                  <span style={{ padding: '3px 8px', borderRadius: 12, background: 'var(--google-green-light)', color: 'var(--google-green)', fontSize: 11, fontWeight: 600 }}>.DOCX</span>
                  <span style={{ padding: '3px 8px', borderRadius: 12, background: 'var(--google-yellow-light)', color: 'var(--google-yellow)', fontSize: 11, fontWeight: 600 }}>.TXT</span>
                  <span style={{ padding: '3px 8px', borderRadius: 12, background: 'var(--google-purple-light)', color: 'var(--google-purple)', fontSize: 11, fontWeight: 600 }}>.HTML</span>
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)', alignSelf: 'center', marginLeft: 'auto' }}>Max 50MB per file</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Action */}
            <div style={{ marginTop: 24, paddingTop: 12, borderTop: '1px solid var(--border-light)', textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setShowHelpModal(false)} style={{ padding: '8px 20px' }}>
                Got it, start analyzing
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
