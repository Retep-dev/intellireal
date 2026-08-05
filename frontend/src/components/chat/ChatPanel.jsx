import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { apiRequest } from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';

const AGENTS = [
  { type: 'research', label: '🔍 Research', available: true },
  { type: 'summary', label: '📋 Summary', available: true },
  { type: 'risk', label: '⚠️ Risk', available: false },
  { type: 'trend', label: '📈 Trends', available: false },
];

export default function ChatPanel() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('research');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Add user message
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
          <Sparkles size={18} color="var(--accent-blue)" />
          <span style={{ fontWeight: 600 }}>IntelliReal AI</span>
        </div>

        {/* Agent Selector */}
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
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏦</div>
            <h3 className="empty-state-title">Financial Intelligence at Your Fingertips</h3>
            <p className="empty-state-text">
              Ask questions about your uploaded financial documents. I'll provide answers with citations.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {[
                'What was Apple\'s revenue in the latest fiscal year?',
                'Summarize the key risk factors',
                'Compare profit margins across all uploaded companies',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  style={{ fontSize: 12 }}
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
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div>
              <div className="message-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>

              {/* Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="citation-list">
                  {msg.citations.map((citation, j) => (
                    <div key={j} className="citation-card" title={citation.text_excerpt}>
                      📄 {citation.document_name}
                      {citation.page_number && ` · p.${citation.page_number}`}
                      <span className="citation-score" style={{ marginLeft: 6 }}>
                        {(citation.relevance_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Processing time */}
              {msg.processingTime && (
                <div style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 6,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {msg.processingTime.toFixed(2)}s · {msg.agent} agent
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="message assistant">
            <div className="message-avatar">
              <Bot size={16} />
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
            placeholder="Ask about your financial documents..."
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
            style={{ height: 44, width: 44, padding: 0 }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
