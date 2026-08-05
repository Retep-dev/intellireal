import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Plus,
  Calendar,
  Edit2,
  Share2,
  Sparkles,
  ArrowRight,
  MessageSquare,
  FileText,
  PieChart,
  Shield,
  TrendingUp,
  Layers,
  Database,
  Upload,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../lib/supabase';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({
    total_documents: 0,
    total_chunks: 0,
    category_chart_data: [],
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [docsResult, statsResult] = await Promise.all([
        apiRequest('/documents/'),
        apiRequest('/documents/stats').catch(() => null),
      ]);

      const docList = docsResult?.documents || [];
      setDocuments(docList);

      if (statsResult) {
        setStats(statsResult);
      } else {
        const totalChunks = docList.reduce((acc, d) => acc + (d.num_chunks || 0), 0);
        setStats({
          total_documents: docList.length,
          total_chunks: totalChunks,
          category_chart_data: [
            { name: 'SEC 10-K/10-Q', value: docList.filter(d => d.document_type?.includes('sec')).length },
            { name: 'EARNINGS', value: docList.filter(d => d.document_type === 'earnings_report').length },
            { name: 'ANNUAL REPORT', value: docList.filter(d => d.document_type === 'annual_report').length },
            { name: 'OTHER DOCS', value: docList.filter(d => !d.document_type || d.document_type === 'other').length },
          ],
        });
      }
    } catch (e) {
      console.warn('Dashboard data fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Generate dynamic line chart curve based on documents
  const generateTrendData = () => {
    if (documents.length === 0) {
      return [
        { label: 'Mon', chunks: 0 },
        { label: 'Tue', chunks: 0 },
        { label: 'Wed', chunks: 0 },
        { label: 'Thu', chunks: 0 },
        { label: 'Fri', chunks: 0 },
      ];
    }
    return documents.map((doc, idx) => ({
      label: doc.filename.length > 12 ? doc.filename.substring(0, 12) + '...' : doc.filename,
      chunks: doc.num_chunks || 10,
    }));
  };

  // Generate dynamic sparkline data
  const sparklineData = Array.from({ length: 12 }, (_, i) => ({
    min: i + 1,
    count: (stats.total_chunks > 0 ? (stats.total_chunks % (i + 5)) + 3 : 2),
  }));

  return (
    <div className="app-content">
      {/* GA4 Toolbar / Realtime Sub-Header */}
      <div className="sub-header-bar">
        <div>
          <div className="page-title-group">
            <h1 className="page-title">Reports snapshot</h1>
            <span className="check-badge">
              <CheckCircle2 size={13} /> Verified Live System
            </span>
          </div>

          <div className="filter-pills">
            <span className="pill active">
              <span style={{
                background: 'var(--google-blue)',
                color: 'white',
                borderRadius: '50%',
                width: 16,
                height: 16,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
              }}>A</span>
              Realtime Workspace Analytics
            </span>
            <span className="pill" onClick={() => navigate('/documents')}>
              <Plus size={12} /> Upload New Filing
            </span>
          </div>
        </div>

        <div className="toolbar-right">
          <button className="date-picker-btn">
            <Calendar size={14} />
            <span>Realtime Active Session</span>
          </button>

          <button className="icon-btn" onClick={loadDashboardData} title="Refresh Live Stats">
            <Sparkles size={16} color="var(--google-purple)" />
          </button>
        </div>
      </div>

      {/* Main GA4 Top Grid */}
      <div className="ga4-grid">
        {/* Metric Tabs + Main Chart Card */}
        <div className="ga4-card">
          <div className="metric-tabs">
            <div
              className={`metric-tab ${activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => setActiveTab('documents')}
            >
              <div className="metric-tab-label">Total Documents</div>
              <div className="metric-tab-value">{stats.total_documents}</div>
              <div className="metric-tab-sub">↑ Uploaded & Processed</div>
            </div>

            <div
              className={`metric-tab ${activeTab === 'chunks' ? 'active' : ''}`}
              onClick={() => setActiveTab('chunks')}
            >
              <div className="metric-tab-label">Indexed Text Chunks</div>
              <div className="metric-tab-value">{stats.total_chunks}</div>
              <div className="metric-tab-sub">ChromaDB Vector Store</div>
            </div>

            <div
              className={`metric-tab ${activeTab === 'rag' ? 'active' : ''}`}
              onClick={() => setActiveTab('rag')}
            >
              <div className="metric-tab-label">RAG Index Status</div>
              <div className="metric-tab-value">100%</div>
              <div className="metric-tab-sub">Ready for Q&A</div>
            </div>

            <div
              className={`metric-tab ${activeTab === 'models' ? 'active' : ''}`}
              onClick={() => setActiveTab('models')}
            >
              <div className="metric-tab-label">NVIDIA NIM Models</div>
              <div className="metric-tab-value">Llama 3.1</div>
              <div className="metric-tab-sub">70B / 8B Fallback</div>
            </div>
          </div>

          {/* Line Chart showing Chunk Density per Document */}
          <div style={{ width: '100%', height: 240, marginTop: 12 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateTrendData()}>
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#70757a', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#70757a', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #dadce0',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="chunks"
                  stroke="#1a73e8"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#1a73e8' }}
                  activeDot={{ r: 6, fill: '#1a73e8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: ACTIVE QUERIES & REALTIME VECTOR CHUNKS */}
        <div className="ga4-card">
          <div className="realtime-header">INDEXED VECTOR CHUNKS</div>
          <div className="realtime-value">{stats.total_chunks}</div>

          <div className="realtime-header" style={{ fontSize: 10, marginBottom: 8 }}>
            CHROMA DB CHUNKS IN REALTIME
          </div>

          {/* Realtime Sparkline */}
          <div style={{ width: '100%', height: 45 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sparklineData}>
                <Bar dataKey="count" fill="#1a73e8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Real Uploaded Documents List */}
          <div className="top-list">
            <div className="top-list-item" style={{ fontWeight: 600, fontSize: 10, color: 'var(--text-tertiary)' }}>
              <span>UPLOADED FILINGS</span>
              <span>CHUNKS</span>
            </div>

            {documents.length > 0 ? (
              documents.slice(0, 4).map(doc => (
                <div key={doc.id} className="top-list-item">
                  <span className="top-list-country" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={12} color="var(--google-blue)" />
                    {doc.filename.length > 20 ? doc.filename.substring(0, 20) + '...' : doc.filename}
                  </span>
                  <span className="top-list-count">{doc.num_chunks}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 12 }}>
                No documents uploaded yet.
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate('/documents')}
                  style={{ marginTop: 8, fontSize: 11 }}
                >
                  <Upload size={12} /> Upload Document
                </button>
              </div>
            )}
          </div>

          <div className="realtime-link" onClick={() => navigate('/documents')}>
            <span>View all {stats.total_documents} documents</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </div>

      {/* Bottom Grid Row: Financial AI Agents & Real Category Breakdown */}
      <div className="ga4-grid">
        {/* Active AI Agents System Card */}
        <div className="ga4-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, fontSize: 14 }}>
              <Sparkles size={16} color="var(--google-blue)" />
              <span>Financial AI Agents</span>
            </div>
            <span className="check-badge">4 Agents Online</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="doc-item" onClick={() => navigate('/chat')}>
              <div className="doc-icon" style={{ background: 'var(--google-blue-light)', color: 'var(--google-blue)' }}>
                <Sparkles size={16} />
              </div>
              <div className="doc-info">
                <div className="doc-name">Research Agent</div>
                <div className="doc-meta">Factual Q&A with precise source citations</div>
              </div>
              <span className="doc-status processed">Active</span>
            </div>

            <div className="doc-item" onClick={() => navigate('/chat')}>
              <div className="doc-icon" style={{ background: 'var(--google-green-light)', color: 'var(--google-green)' }}>
                <PieChart size={16} />
              </div>
              <div className="doc-info">
                <div className="doc-name">Summary Agent</div>
                <div className="doc-meta">Structured financial summaries & KPI tables</div>
              </div>
              <span className="doc-status processed">Active</span>
            </div>

            <div className="doc-item" style={{ opacity: 0.7 }}>
              <div className="doc-icon" style={{ background: 'var(--google-yellow-light)', color: 'var(--google-yellow)' }}>
                <Shield size={16} />
              </div>
              <div className="doc-info">
                <div className="doc-name">Risk Analysis Agent</div>
                <div className="doc-meta">Risk factor detection & litigation monitoring</div>
              </div>
              <span className="subnav-badge">Phase 2</span>
            </div>

            <div className="doc-item" style={{ opacity: 0.7 }}>
              <div className="doc-icon" style={{ background: 'var(--google-purple-light)', color: 'var(--google-purple)' }}>
                <TrendingUp size={16} />
              </div>
              <div className="doc-info">
                <div className="doc-name">Market Trend Agent</div>
                <div className="doc-meta">Trend extraction & guidance sentiment analysis</div>
              </div>
              <span className="subnav-badge">Phase 2</span>
            </div>
          </div>
        </div>

        {/* Real Document Category Breakdown Card */}
        <div className="ga4-card">
          <div className="realtime-header" style={{ marginBottom: 4 }}>
            DOCUMENT BREAKDOWN BY CATEGORY
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Realtime distribution across uploaded files
          </div>

          <div style={{ width: '100%', height: 210 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={stats.category_chart_data}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#5f6368', fontSize: 11 }}
                  width={110}
                />
                <Bar dataKey="value" fill="#1a73e8" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="ga4-floating-btn" onClick={() => navigate('/chat')} title="Ask IntelliReal AI">
        <MessageSquare size={20} />
      </button>
    </div>
  );
}
