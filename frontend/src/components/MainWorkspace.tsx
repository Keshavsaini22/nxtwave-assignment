import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/index.js';
import { Users } from '../pages/Users.js';
import { Projects } from '../pages/Projects.js';
import { Sidebar } from './Sidebar.js';
import { DashboardPlaceholder, AnalyticsPlaceholder } from './Placeholders.js';
import { ShieldCheck, BellRing, Menu, X } from 'lucide-react';

export const MainWorkspace: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeTab = (location.pathname.replace('/', '') || 'tasks') as any;

  const handleTabChange = (tab: 'tasks' | 'users' | 'analytics' | 'projects') => {
    navigate(`/${tab}`);
  };

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/tasks', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        sidebarOpen={sidebarOpen} 
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: '72px',
          borderBottom: '1px solid hsl(var(--card-border) / 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          background: 'hsl(var(--bg-secondary) / 0.3)',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(var(--text-secondary))',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={22} style={{ color: 'hsl(var(--accent-violet))' }} />
              <span style={{ fontFamily: 'var(--font-family-display)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                Tracker<span style={{ color: 'hsl(var(--accent-violet))' }}>API</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--text-secondary))',
              cursor: 'pointer',
              position: 'relative',
              padding: '6px',
              borderRadius: '8px',
              transition: 'var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
            }}>
              <BellRing size={20} />
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'hsl(var(--accent-teal))',
                boxShadow: 'var(--shadow-glow-teal)',
              }} />
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: 'transparent' }}>
          <Routes>
            <Route path="/tasks" element={<DashboardPlaceholder />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/users" element={user?.role === 'ADMIN' ? <Users /> : <Navigate to="/tasks" replace />} />
            <Route path="/analytics" element={(user?.role === 'ADMIN' || user?.role === 'MANAGER') ? <AnalyticsPlaceholder /> : <Navigate to="/tasks" replace />} />
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};
