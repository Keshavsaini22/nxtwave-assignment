import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/index.js';
import { loginUser } from '../store/authSlice.js';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';

interface LoginProps {
  onNavigateToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigateToRegister }) => {
  const dispatch = useAppDispatch();
  const authError = useAppSelector((state) => state.auth.error);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLoading(true);

    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      if (!result) {
        setLocalError('Authentication failed. Invalid email or password credentials.');
      }
    } catch (err: any) {
      if (err.detail) {
        setLocalError(err.detail);
      } else if (err.message) {
        setLocalError(err.message);
      } else {
        setLocalError('Authentication failed. Invalid email or password credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px',
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '40px',
        boxShadow: 'var(--shadow-lg), 0 0 40px 0 hsl(var(--accent-violet) / 0.1)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'hsl(var(--accent-violet) / 0.1)',
            border: '1px solid hsl(var(--accent-violet) / 0.3)',
            color: 'hsl(var(--accent-violet))',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-glow-violet)',
          }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Welcome Back</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
            Sign in to access your task dashboard
          </p>
        </div>

        {displayError && (
          <div className="toast-danger" style={{
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '24px',
            border: '1px solid hsl(var(--color-danger) / 0.3)',
            background: 'hsl(var(--color-danger) / 0.1)',
            color: 'hsl(var(--color-danger))',
          }}>
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))',
              }} />
              <input
                type="email"
                required
                placeholder="admin@acme.com"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))',
              }} />
              <input
                type="password"
                required
                placeholder="Enter password"
                className="form-input"
                style={{ paddingLeft: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={18} />
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            fontSize: '0.9rem',
            color: 'hsl(var(--text-secondary))',
          }}>
            Don't have an account?{' '}
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(var(--accent-violet))',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              onClick={onNavigateToRegister}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
