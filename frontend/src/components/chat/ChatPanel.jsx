import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, FileText } from 'lucide-react';
import { apiRequest } from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AGENTS = [
  { type: 'research', label: '🔍 Research Agent', available: true },
  { type: 'summary', label: '📋 Summary Agent', available: true },
  { type: 'risk', label: '⚠️ Risk Analysis', available: false },
  { type: 'trend', label: '📈 Market Trends', available: false },
];

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('summary');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
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
          agent_type: selectedAgent,
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
        agent: selectedAgent,
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
      {/* Chat Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'var(--google-blue-light)',
            color: 'var(--google-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>IntelliReal Financial AI</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Powered by NVIDIA NIM & LangGraph</div>
          </div>
        </div>

        {/* Agent Selector Tabs */}
        <div className="agent-selector">
          {AGENTS.map(agent => (
            <button
              key={agent.type}
              className={`agent-option ${selectedAgent === agent.type ? 'active' : ''} ${!agent.available ? 'disabled' : ''}`}
              onClick={() => agent.available && setSelectedAgent(agent.type)}
              disabled={!agent.available}
            >
              {agent.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--google-blue-light)',
              color: 'var(--google-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Sparkles size={28} />
            </div>
            <h3 className="empty-state-title">Financial Intelligence Assistant</h3>
            <p className="empty-state-text">
              Ask questions or request structured summaries for your SEC filings and financial reports.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16, maxWidth: 540 }}>
              {[
                'Summarize the financial statements',
                'What is total revenue and net income?',
                'Extract key business highlights & risks',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  style={{ fontSize: 12, borderRadius: 16 }}
                >
                  {suggestion}
                </button>
              ))}
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
                  Response generated in {msg.processingTime.toFixed(2)}s via {msg.agent} agent
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
            placeholder={`Ask ${selectedAgent === 'summary' ? 'Summary Agent' : 'Research Agent'} about your documents... (Press Enter to send)`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={sendMessage}
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
