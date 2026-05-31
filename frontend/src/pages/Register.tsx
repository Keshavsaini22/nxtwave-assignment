import React, { useState } from 'react';
import { useAppDispatch } from '../store/index.js';
import { registerUser } from '../store/authSlice.js';
import { Shield, Building, Lock, Mail, ArrowRight } from 'lucide-react';

interface RegisterProps {
  onNavigateToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigateToLogin }) => {
  const dispatch = useAppDispatch();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await dispatch(
        registerUser({
          email,
          password,
          role: 'ADMIN',
          organizationName,
        })
      ).unwrap();
      setSuccess(true);
    } catch (err: any) {
      if (err.detail) {
        setError(err.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred during registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
        maxWidth: '480px',
        padding: '40px',
        boxShadow: 'var(--shadow-lg)',
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
          }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Create Account</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
            Register to set up your team task tracker organization
          </p>
        </div>

        {error && (
          <div className="toast-danger" style={{
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            marginBottom: '24px',
            border: '1px solid hsl(var(--color-danger) / 0.3)',
            background: 'hsl(var(--color-danger) / 0.1)',
            color: 'hsl(var(--color-danger))',
          }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'hsl(var(--color-success) / 0.1)',
              border: '1px solid hsl(var(--color-success) / 0.3)',
              color: 'hsl(var(--color-success))',
              marginBottom: '20px',
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>Registration Successful!</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem', marginBottom: '24px' }}>
              Your administrator account has been successfully created. You can now log in.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              onClick={onNavigateToLogin}
            >
              Back to Login <ArrowRight size={18} />
            </button>
          </div>
        ) : (
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
                  placeholder="name@company.com"
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
                  placeholder="Min. 8 characters"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Organization Name</label>
              <div style={{ position: 'relative' }}>
                <Building size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'hsl(var(--text-muted))',
                }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Register Account'}
            </button>

            <div style={{
              textAlign: 'center',
              marginTop: '24px',
              fontSize: '0.9rem',
              color: 'hsl(var(--text-secondary))',
            }}>
              Already have an account?{' '}
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'hsl(var(--accent-violet))',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
                onClick={onNavigateToLogin}
              >
                Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
