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

// Trend data matching GA4 line chart curve
const GA4_LINE_DATA = [
  { date: '24 Oct', value: 4800 },
  { date: '27 Oct', value: 3200 },
  { date: '30 Oct', value: 4900 },
  { date: '02 Nov', value: 3100 },
  { date: '05 Nov', value: 3100 },
  { date: '07 Nov', value: 4700 },
  { date: '10 Nov', value: 5100 },
  { date: '13 Nov', value: 3500 },
  { date: '15 Nov', value: 4300 },
  { date: '18 Nov', value: 2900 },
  { date: '21 Nov', value: 4500 },
];

// Sparkline real-time bars
const SPARKLINE_DATA = [
  { min: 1, count: 2 },
  { min: 2, count: 4 },
  { min: 3, count: 3 },
  { min: 4, count: 6 },
  { min: 5, count: 8 },
  { min: 6, count: 5 },
  { min: 7, count: 7 },
  { min: 8, count: 9 },
  { min: 9, count: 12 },
  { min: 10, count: 10 },
  { min: 11, count: 14 },
  { min: 12, count: 11 },
  { min: 13, count: 8 },
  { min: 14, count: 15 },
];

// Horizontal Bar Data for acquisition sources
const BAR_SOURCE_DATA = [
  { name: '(none)', value: 85 },
  { name: 'organic', value: 78 },
  { name: 'cpc', value: 38 },
  { name: 'referral', value: 18 },
  { name: 'affiliate', value: 4 },
  { name: 'email', value: 3 },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const [documents, setDocuments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const result = await apiRequest('/documents/');
      setDocuments(result.documents || []);
    } catch (e) {
      console.warn('Document loading:', e);
    }
  };

  return (
    <div className="page-enter">
      {/* GA4 Sub-Header / Reports Toolbar */}
      <div className="sub-header-bar">
        <div>
          <div className="page-title-group">
            <h1 className="page-title">Reports snapshot</h1>
            <span className="check-badge">
              <CheckCircle2 size={13} /> Verified
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
              All Filings & Users
            </span>
            <span className="pill">
              <Plus size={12} /> Add comparison
            </span>
          </div>
        </div>

        <div className="toolbar-right">
          <button className="date-picker-btn">
            <Calendar size={14} />
            <span>Last 28 days Oct 21 - Nov 17, 2024</span>
          </button>

          <button className="icon-btn" title="Customize report">
            <Edit2 size={16} />
          </button>
          <button className="icon-btn" title="Share report">
            <Share2 size={16} />
          </button>
          <button className="icon-btn" title="Insights">
            <Sparkles size={16} color="var(--google-purple)" />
          </button>
        </div>
      </div>

      {/* Main GA4 Grid Container */}
      <div className="app-content">
        <div className="ga4-grid">
          {/* Main Card — Metric Tabs + Line Chart */}
          <div className="ga4-card">
            <div className="metric-tabs">
              <div
                className={`metric-tab ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <div className="metric-tab-label">Total Users</div>
                <div className="metric-tab-value">83K</div>
                <div className="metric-tab-sub">↑ 12.4% vs last period</div>
              </div>

              <div
                className={`metric-tab ${activeTab === 'new' ? 'active' : ''}`}
                onClick={() => setActiveTab('new')}
              >
                <div className="metric-tab-label">New users</div>
                <div className="metric-tab-value">70K</div>
                <div className="metric-tab-sub">↑ 8.1% vs last period</div>
              </div>

              <div
                className={`metric-tab ${activeTab === 'time' ? 'active' : ''}`}
                onClick={() => setActiveTab('time')}
              >
                <div className="metric-tab-label">Average engagement time</div>
                <div className="metric-tab-value">2m 00s</div>
              </div>

              <div
                className={`metric-tab ${activeTab === 'revenue' ? 'active' : ''}`}
                onClick={() => setActiveTab('revenue')}
              >
                <div className="metric-tab-label">Total revenue</div>
                <div className="metric-tab-value">$253K</div>
                <div className="metric-tab-sub">↑ 18.2% YoY</div>
              </div>
            </div>

            {/* Main Recharts Line Chart */}
            <div style={{ width: '100%', height: 260, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={GA4_LINE_DATA}>
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#70757a', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#70757a', fontSize: 11 }}
                    domain={[0, 6000]}
                    ticks={[0, 2000, 4000, 6000]}
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
                    dataKey="value"
                    stroke="#1a73e8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, fill: '#1a73e8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Card — USERS IN LAST 30 MINUTES */}
          <div className="ga4-card">
            <div className="realtime-header">USERS IN LAST 30 MINUTES</div>
            <div className="realtime-value">85</div>

            <div className="realtime-chart-label">USERS PER MINUTE</div>

            {/* Sparkline Bar Chart */}
            <div style={{ width: '100%', height: 60 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={SPARKLINE_DATA}>
                  <Bar dataKey="count" fill="#1a73e8" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Countries / Companies List */}
            <div className="top-list">
              <div className="top-list-item" style={{ fontWeight: 600, fontSize: 10, color: 'var(--text-tertiary)' }}>
                <span>TOP COUNTRIES / REGIONS</span>
                <span>USERS</span>
              </div>
              <div className="top-list-item">
                <span className="top-list-country">India</span>
                <span className="top-list-count">15</span>
              </div>
              <div className="top-list-item">
                <span className="top-list-country">United States</span>
                <span className="top-list-count">9</span>
              </div>
              <div className="top-list-item">
                <span className="top-list-country">Tunisia</span>
                <span className="top-list-count">8</span>
              </div>
              <div className="top-list-item">
                <span className="top-list-country">China</span>
                <span className="top-list-count">6</span>
              </div>
              <div className="top-list-item">
                <span className="top-list-country">Netherlands</span>
                <span className="top-list-count">6</span>
              </div>
            </div>

            <div className="realtime-link" onClick={() => navigate('/documents')} style={{ cursor: 'pointer' }}>
              <span>View documents</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>

        {/* Bottom GA4 Grid Row */}
        <div className="ga4-grid">
          {/* Insights Card */}
          <div className="ga4-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, fontSize: 14 }}>
              <Sparkles size={16} color="var(--google-purple)" />
              <span>Insights</span>
              <span className="subnav-badge" style={{ background: 'var(--google-purple-light)', color: 'var(--google-purple)' }}>
                9
              </span>
            </div>

            <div className="insight-item">
              <div className="insight-badge">
                <Sparkles size={10} /> AUTOMATED INSIGHT
              </div>
              <div className="insight-text">
                Users for the Ad Network "Google search" spiked from October 31 to November 6, 2024.
              </div>
            </div>

            <div className="insight-item">
              <div className="insight-badge">
                <Sparkles size={10} /> AUTOMATED INSIGHT
              </div>
              <div className="insight-text">
                Users for the campaign from source "google" and medium "cpc" spiked.
              </div>
            </div>
          </div>

          {/* Horizontal Bar Chart Card */}
          <div className="ga4-card">
            <div className="realtime-header" style={{ marginBottom: 12 }}>
              WHERE DO YOUR NEW USERS COME FROM?
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              New users by First user medium
            </div>

            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={BAR_SOURCE_DATA}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#5f6368', fontSize: 11 }}
                    width={70}
                  />
                  <Bar dataKey="value" fill="#1a73e8" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Floating feedback icon at bottom right */}
      <button className="ga4-floating-btn" onClick={() => navigate('/chat')} title="Ask IntelliReal AI">
        <MessageSquare size={20} />
      </button>
    </div>
  );
}
