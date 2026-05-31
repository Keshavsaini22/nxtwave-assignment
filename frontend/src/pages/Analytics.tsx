import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../store/index.js';
import { AnalyticsService } from '../services/analytics.service.js';
import type { EmployeeProductivityMetric } from '../services/analytics.service.js';
import { BarChart3, TrendingUp, AlertTriangle, Clock, Award, ShieldAlert } from 'lucide-react';

export const Analytics: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [metrics, setMetrics] = useState<EmployeeProductivityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await AnalyticsService.getTaskAnalytics();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to fetch organization analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') {
      fetchAnalytics();
    }
  }, [currentUser]);

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return 'N/A';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  if (currentUser?.role !== 'ADMIN' && currentUser?.role !== 'MANAGER') {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '60px auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '48px 32px', background: 'hsl(var(--card-bg))' }}>
          <ShieldAlert size={48} style={{ color: 'hsl(var(--color-danger))', marginBottom: '20px' }} />
          <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'white' }}>Unauthorized Access</h3>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem' }}>
            Only organization Administrators and Managers are authorized to view performance metrics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1440px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Analytics Dashboard</h1>
          <p style={{ color: 'hsl(var(--text-secondary))' }}>
            Real-time window-function statistics and performance benchmarking for your staff
          </p>
        </div>
        <button 
          onClick={fetchAnalytics}
          className="btn btn-secondary"
          style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.95rem',
          marginBottom: '24px',
          border: '1px solid hsl(var(--color-danger) / 0.3)',
          background: 'hsl(var(--color-danger) / 0.1)',
          color: 'hsl(var(--color-danger))',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <ShieldAlert size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid hsl(var(--card-border))',
            borderTopColor: 'hsl(var(--accent-violet))',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      ) : metrics.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', maxWidth: '600px', margin: '40px auto' }}>
          <div className="glass-panel" style={{ padding: '48px 32px', background: 'hsl(var(--card-bg))' }}>
            <BarChart3 size={48} style={{ color: 'hsl(var(--text-muted))', marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'white' }}>No data found</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem', margin: 0 }}>
              There are currently no staff performance metrics available inside your organization.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}>
            {metrics.slice(0, 3).map((item, index) => (
              <div key={item.userId} className="glass-panel" style={{
                background: 'hsl(var(--card-bg))',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  right: '-16px',
                  bottom: '-16px',
                  opacity: 0.05,
                  transform: 'rotate(-10deg)',
                }}>
                  <Award size={120} style={{ color: 'hsl(var(--accent-gold))' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: index === 0 ? 'hsl(var(--accent-gold) / 0.15)' : index === 1 ? 'hsl(var(--text-secondary) / 0.15)' : 'hsl(var(--accent-teal) / 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: index === 0 ? 'hsl(var(--accent-gold))' : index === 1 ? 'hsl(var(--text-secondary))' : 'hsl(var(--accent-teal))',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    border: '1px solid',
                    borderColor: index === 0 ? 'hsl(var(--accent-gold) / 0.3)' : index === 1 ? 'hsl(var(--text-secondary) / 0.3)' : 'hsl(var(--accent-teal) / 0.3)',
                  }}>
                    #{item.performanceRank}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>{item.email.split('@')[0]}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>
                      Top Performer
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Avg Time</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                      {formatTime(item.avgCompletionSeconds)}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', display: 'block', marginBottom: '4px' }}>Org Benchmark</span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'hsl(var(--text-secondary))', display: 'block', marginTop: '4px' }}>
                      {formatTime(item.orgWideAvgCompletionSeconds)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="glass-panel" style={{ background: 'hsl(var(--card-bg))', padding: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp size={20} style={{ color: 'hsl(var(--accent-violet))' }} /> Staff Productivity Rankings
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--card-border) / 0.5)' }}>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-muted))', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Rank</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-muted))', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Employee</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-muted))', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-muted))', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Overdue Tasks</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-muted))', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Avg Completion Time</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-muted))', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Vs. Organization Average</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((item) => {
                    const diff = item.avgCompletionSeconds - item.orgWideAvgCompletionSeconds;
                    const pctDiff = item.orgWideAvgCompletionSeconds > 0 ? (diff / item.orgWideAvgCompletionSeconds) * 100 : 0;
                    return (
                      <tr key={item.userId} style={{ borderBottom: '1px solid hsl(var(--card-border) / 0.3)', transition: 'background 100ms' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 600, color: 'white' }}>
                          <span style={{
                            display: 'inline-flex',
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: item.performanceRank === 1 ? 'hsl(var(--accent-gold) / 0.15)' : 'hsl(var(--bg-secondary))',
                            color: item.performanceRank === 1 ? 'hsl(var(--accent-gold))' : 'white',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            border: item.performanceRank === 1 ? '1px solid hsl(var(--accent-gold) / 0.3)' : '1px solid hsl(var(--card-border))',
                          }}>
                            {item.performanceRank}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 600, color: 'white' }}>{item.email}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <span className={`badge badge-${item.role.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '3px 8px' }}>
                            {item.role}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {item.overdueCount > 0 ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--color-danger))', fontWeight: 600 }}>
                              <AlertTriangle size={14} /> {item.overdueCount} Overdue
                            </span>
                          ) : (
                            <span style={{ color: 'hsl(var(--text-muted))' }}>0</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 20px', color: 'white' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={14} style={{ color: 'hsl(var(--text-muted))' }} />
                            <span>{formatTime(item.avgCompletionSeconds)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {item.avgCompletionSeconds === 0 ? (
                            <span style={{ color: 'hsl(var(--text-muted))' }}>No tasks finished</span>
                          ) : diff < 0 ? (
                            <span style={{ color: 'hsl(var(--color-success))', fontWeight: 600 }}>
                              {Math.abs(pctDiff).toFixed(1)}% Faster
                            </span>
                          ) : diff > 0 ? (
                            <span style={{ color: 'hsl(var(--color-danger))', fontWeight: 600 }}>
                              {pctDiff.toFixed(1)}% Slower
                            </span>
                          ) : (
                            <span style={{ color: 'hsl(var(--text-secondary))' }}>Equal to average</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
