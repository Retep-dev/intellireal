import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, User, Sparkles, FileText, PieChart, Search, Shield, TrendingUp } from 'lucide-react';
import { apiRequest } from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AGENTS = [
  { type: 'research', label: '🔍 Research Agent', available: true },
  { type: 'summary', label: '📋 Summary Agent', available: true },
  { type: 'risk', label: '⚠️ Risk Analysis', available: true },
  { type: 'trend', label: '📈 Market Trends', available: true },
];

const SUGGESTED_PROMPTS = [
  {
    icon: PieChart,
    color: 'var(--google-blue)',
    bg: 'var(--google-blue-light)',
    title: 'Executive Financial Summary',
    prompt: 'Summarize the financial statements with key KPI tables and metrics.',
    agent: 'summary',
  },
  {
    icon: Search,
    color: 'var(--google-green)',
    bg: 'var(--google-green-light)',
    title: 'Factual Revenue & Profit Q&A',
    prompt: 'What is the total revenue, net income, and gross profit margin?',
    agent: 'research',
  },
  {
    icon: Shield,
    color: 'var(--google-yellow)',
    bg: 'var(--google-yellow-light)',
    title: 'Risk Severity Matrix',
    prompt: 'Extract top legal risks, credit liabilities, and litigation items into a risk matrix.',
    agent: 'risk',
  },
  {
    icon: TrendingUp,
    color: 'var(--google-purple)',
    bg: 'var(--google-purple-light)',
    title: 'YoY Growth & Guidance Sentiment',
    prompt: 'Analyze YoY revenue growth trajectory, operating margin behavior, and forward guidance.',
    agent: 'trend',
  },
];

export default function ChatPanel() {
  const [searchParams] = useSearchParams();
  const agentFromUrl = searchParams.get('agent');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(agentFromUrl || 'summary');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (agentFromUrl && ['research', 'summary', 'risk', 'trend'].includes(agentFromUrl)) {
      setSelectedAgent(agentFromUrl);
    }
  }, [agentFromUrl]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (overridePrompt, overrideAgent) => {
    const text = (overridePrompt || input).trim();
    const agentToUse = overrideAgent || selectedAgent;
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiRequest('/chat/', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          agent_type: agentToUse,
        }),
      });

      const assistantMsg = {
        role: 'assistant',
        content: response.answer,
        citations: response.citations || [],
        agent: response.agent_type,
        processingTime: response.processing_time,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure the backend is running and you have documents uploaded.`,
        citations: [],
        agent: agentToUse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-container">
      {/* Chat Header Bar */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #1a73e8, #9334e6)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(26,115,232,0.2)',
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
              IntelliReal Financial Copilot
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              4 Active AI Agents • NVIDIA NIM • LangChain RAG
            </div>
          </div>
        </div>

        {/* Agent Selector Segment Pills */}
        <div className="agent-selector">
          {AGENTS.map(agent => (
            <button
              key={agent.type}
              className={`agent-option ${selectedAgent === agent.type ? 'active' : ''} ${!agent.available ? 'disabled' : ''}`}
              onClick={() => {
                if (agent.available) setSelectedAgent(agent.type);
              }}
              disabled={!agent.available}
            >
              {agent.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{
            maxWidth: 680,
            margin: '20px auto 0',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {/* Hero Badge */}
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #1a73e8, #9334e6)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 4px 12px rgba(26,115,232,0.25)',
            }}>
              <Sparkles size={28} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Financial Intelligence Assistant
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 480, lineHeight: 1.5 }}>
              Select an AI Agent or starter prompt below to analyze your SEC filings and financial reports.
            </p>

            {/* 2x2 Grid of Interactive Starter Prompt Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              width: '100%',
              textAlign: 'left',
            }}>
              {SUGGESTED_PROMPTS.map((sp, idx) => {
                const IconComp = sp.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedAgent(sp.agent);
                      sendMessage(sp.prompt, sp.agent);
                    }}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 10,
                      padding: 14,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--google-blue)';
                      e.currentTarget.style.background = 'var(--google-blue-light)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = 'var(--bg-surface)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        background: sp.bg,
                        color: sp.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <IconComp size={14} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {sp.title}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {sp.prompt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="message-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="citation-list">
                  {msg.citations.map((citation, j) => (
                    <div key={j} className="citation-card" title={citation.text_excerpt}>
                      <FileText size={12} color="var(--google-blue)" />
                      <span style={{ fontWeight: 500 }}>{citation.document_name}</span>
                      {citation.page_number && (
                        <span style={{ color: 'var(--text-tertiary)', margin: '0 2px' }}>
                          · Page {citation.page_number}
                        </span>
                      )}
                      <span className="citation-score">
                        {(citation.relevance_score * 100).toFixed(0)}% match
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Processing time footer */}
              {msg.processingTime && (
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-tertiary)',
                  marginTop: 6,
                  fontFamily: 'var(--font-mono)',
                }}>
                  Generated in {msg.processingTime.toFixed(2)}s via {msg.agent} agent
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="message assistant">
            <div className="message-avatar">
              <Bot size={15} />
            </div>
            <div className="message-content">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder={`Ask ${selectedAgent.toUpperCase()} Agent about your documents...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            style={{ height: 38, width: 38, padding: 0, borderRadius: 8 }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
