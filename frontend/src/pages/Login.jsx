import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Info, Sparkles, AlertCircle } from 'lucide-react';

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
      console.warn('Sign in error:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid credentials. If you just created an account, please check your email inbox to confirm your registration, or click "⚡ Quick Demo Login" below.');
      } else {
        setError(err.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await signIn('analyst@intellireal.com', 'demo123456');
      navigate('/');
    } catch (e) {
      console.error('Demo login failed:', e);
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

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--google-red-light)',
            border: '1px solid var(--google-red)',
            borderRadius: '6px',
            color: 'var(--google-red)',
            fontSize: '12.5px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
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

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginBottom: 10 }}>
            {loading ? <div className="spinner" /> : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Quick Demo Login Button */}
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDemoLogin}
            disabled={loading}
            style={{ width: '100%', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Sparkles size={14} color="var(--google-purple)" /> ⚡ Quick Demo Sign In
          </button>
        </div>

        <div className="auth-footer" style={{ marginTop: 16 }}>
          Don't have an account?{' '}
          <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
