import { useState, useEffect } from 'react';
import {
  FileText, MessageSquare, TrendingUp, Shield,
  ArrowUpRight, ArrowDownRight, Upload, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/supabase';

// Sample KPI data (replaced by real data when documents are analyzed)
const DEMO_KPIS = [
  {
    label: 'Documents Analyzed',
    value: '0',
    change: null,
    icon: FileText,
    color: 'blue',
  },
  {
    label: 'Queries Today',
    value: '0',
    change: null,
    icon: MessageSquare,
    color: 'purple',
  },
  {
    label: 'Risk Flags',
    value: '—',
    change: null,
    icon: Shield,
    color: 'amber',
  },
  {
    label: 'Trends Detected',
    value: '—',
    change: null,
    icon: TrendingUp,
    color: 'green',
  },
];

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [kpis, setKpis] = useState(DEMO_KPIS);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const result = await apiRequest('/documents/');
      setDocuments(result.documents || []);

      // Update document count KPI
      setKpis(prev => prev.map((kpi, i) =>
        i === 0 ? { ...kpi, value: String(result.total || 0) } : kpi
      ));
    } catch (error) {
      console.warn('Failed to load documents:', error);
    }
  };

  return (
    <div className="page-enter">
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
        borderColor: 'rgba(59, 130, 246, 0.2)',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            Welcome to IntelliReal
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Upload financial documents and start analyzing with AI-powered agents.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => navigate('/documents')}>
            <Upload size={16} /> Upload Document
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/chat')}>
            <MessageSquare size={16} /> Start Chat
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div className={`kpi-card ${kpi.color}`} key={i}>
              <div className={`kpi-icon ${kpi.color}`}>
                <Icon size={20} />
              </div>
              <div className="card-title">{kpi.label}</div>
              <div className="card-value">{kpi.value}</div>
              {kpi.change && (
                <div className={`card-change ${kpi.change > 0 ? 'positive' : 'negative'}`}>
                  {kpi.change > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {Math.abs(kpi.change)}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid-2">
        {/* Recent Documents */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Documents</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/documents')}>
              View All <ChevronRight size={14} />
            </button>
          </div>

          {documents.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '30px 20px',
              color: 'var(--text-muted)',
            }}>
              <FileText size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p style={{ fontSize: 13 }}>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="doc-list">
              {documents.slice(0, 5).map(doc => (
                <div className="doc-item" key={doc.id} style={{ padding: '10px 12px' }}>
                  <div className="doc-icon pdf" style={{ width: 32, height: 32, fontSize: 14 }}>
                    📄
                  </div>
                  <div className="doc-info">
                    <div className="doc-name" style={{ fontSize: 13 }}>{doc.filename}</div>
                    <div className="doc-meta">{doc.num_chunks} chunks</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions / Agent Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">AI Agents</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                name: 'Research Agent',
                desc: 'Factual Q&A with citations',
                status: 'active',
                emoji: '🔍',
              },
              {
                name: 'Summary Agent',
                desc: 'Structured financial summaries',
                status: 'active',
                emoji: '📋',
              },
              {
                name: 'Risk Analysis Agent',
                desc: 'Risk detection & monitoring',
                status: 'coming',
                emoji: '⚠️',
              },
              {
                name: 'Market Trend Agent',
                desc: 'Trend extraction & sentiment',
                status: 'coming',
                emoji: '📈',
              },
            ].map((agent, i) => (
              <div key={i} className="doc-item" style={{
                padding: '12px 14px',
                opacity: agent.status === 'coming' ? 0.5 : 1,
              }}>
                <span style={{ fontSize: 24 }}>{agent.emoji}</span>
                <div className="doc-info">
                  <div className="doc-name" style={{ fontSize: 13 }}>{agent.name}</div>
                  <div className="doc-meta">{agent.desc}</div>
                </div>
                <span className={`doc-status ${agent.status === 'active' ? 'processed' : 'processing'}`}>
                  {agent.status === 'active' ? 'Active' : 'Phase 2'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
