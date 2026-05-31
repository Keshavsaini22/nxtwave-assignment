import React from 'react';
import { LayoutGrid, BarChart3 } from 'lucide-react';

export const DashboardPlaceholder: React.FC = () => {
  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '60px auto' }}>
      <div style={{
        background: 'hsl(var(--card-bg) / 0.2)',
        border: '1px solid hsl(var(--card-border) / 0.3)',
        borderRadius: '12px',
        padding: '48px 32px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <LayoutGrid size={40} style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'hsl(var(--text-primary))' }}>No tasks found</h3>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
          There are currently no tasks in this view.
        </p>
      </div>
    </div>
  );
};

export const AnalyticsPlaceholder: React.FC = () => {
  return (
    <div style={{ padding: '40px', textAlign: 'center', maxWidth: '600px', margin: '60px auto' }}>
      <div style={{
        background: 'hsl(var(--card-bg) / 0.2)',
        border: '1px solid hsl(var(--card-border) / 0.3)',
        borderRadius: '12px',
        padding: '48px 32px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <BarChart3 size={40} style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'hsl(var(--text-primary))' }}>No analytics data</h3>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
          Productivity analytics will appear here once tasks are completed.
        </p>
      </div>
    </div>
  );
};
