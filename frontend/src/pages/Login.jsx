import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Info } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">IR</div>
          <div className="auth-logo-text">IntelliReal</div>
          <p className="auth-subtitle">Financial Intelligence Platform</p>
        </div>

        {!isSupabaseConfigured && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--accent-blue-glow)',
            border: '1px solid var(--accent-blue)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--accent-blue)',
            fontSize: '12.5px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Local Demo Mode Active</strong>
              <div style={{ fontSize: '11.5px', opacity: 0.9, marginTop: '2px' }}>
                Enter any email & password to sign in. To use real Supabase auth, add your credentials in <code>frontend/.env.local</code>.
              </div>
            </div>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="analyst@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
            {loading ? <div className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
