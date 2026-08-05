import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp, signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to create account');
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

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo">
            <div className="auth-logo-icon">IR</div>
            <div className="auth-logo-text">IntelliReal</div>
          </div>
          <div style={{ margin: '0 auto 16px', color: 'var(--google-green)' }}>
            <CheckCircle2 size={48} />
          </div>
          <h3 style={{ color: 'var(--google-green)', marginBottom: 8 }}>
            Account Registration Initiated
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5 }}>
            A confirmation link was sent to <strong>{email}</strong>. Please check your email inbox to confirm your account.
          </p>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleDemoLogin}>
              <Sparkles size={14} /> Continue to App Immediately (Demo Mode)
            </button>
            <Link to="/login" className="btn btn-secondary" style={{ fontSize: 13 }}>
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">IR</div>
          <div className="auth-logo-text">IntelliReal</div>
          <p className="auth-subtitle">Create your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginBottom: 10 }}>
            {loading ? <div className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div style={{ marginTop: 10, textAlign: 'center' }}>
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
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
