import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/index.js';
import { Users } from '../pages/Users.js';
import { Projects } from '../pages/Projects.js';
import { Tasks } from '../pages/Tasks.js';
import { Analytics } from '../pages/Analytics.js';
import { Sidebar } from './Sidebar.js';
import { NotificationDrawer } from './NotificationDrawer.js';
import { NotificationService } from '../services/notification.service.js';
import type { Notification } from '../services/notification.service.js';
import { ShieldCheck, Bell, Menu, X } from 'lucide-react';

export const MainWorkspace: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<any[]>([]);

  const activeTab = (location.pathname.replace('/', '') || 'tasks') as any;

  const handleTabChange = (tab: 'tasks' | 'users' | 'analytics' | 'projects') => {
    navigate(`/${tab}`);
  };

  const showToast = (title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/tasks', { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const res = await NotificationService.listNotifications(1, 50);
        setNotifications(res.data.items);
        setUnreadCount(res.data.items.filter((n: any) => !n.isRead).length);
      } catch (err) {
      }
    };

    fetchNotifications();

    const token = localStorage.getItem('accessToken');
    const host = window.location.origin.includes('localhost') ? 'http://localhost:5000' : '';
    const sseUrl = `${host}/api/v1/notifications/stream?token=${token || ''}`;

    const es = new EventSource(sseUrl);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newNotif: Notification = {
          id: data.id || Math.random().toString(36).substring(2, 9),
          userId: user.userId,
          title: data.title || 'Notification',
          message: data.message || '',
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
        showToast(data.title || 'Notification', data.message || '');
      } catch (err) {
      }
    };

    return () => {
      es.close();
    };
  }, [user]);

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
            <button 
              onClick={() => setDrawerOpen(!drawerOpen)}
              style={{
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
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '16px',
                  height: '16px',
                  borderRadius: '8px',
                  background: 'hsl(var(--color-danger))',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 0 0 2px hsl(var(--bg-secondary))',
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', background: 'transparent' }}>
          <Routes>
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/users" element={user?.role === 'ADMIN' ? <Users /> : <Navigate to="/tasks" replace />} />
            <Route path="/analytics" element={(user?.role === 'ADMIN' || user?.role === 'MANAGER') ? <Analytics /> : <Navigate to="/tasks" replace />} />
            <Route path="*" element={<Navigate to="/tasks" replace />} />
          </Routes>
        </main>
      </div>

      <NotificationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        notifications={notifications}
        setNotifications={setNotifications}
        unreadCount={unreadCount}
        setUnreadCount={setUnreadCount}
      />

      {toasts.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '380px',
        }}>
          {toasts.map((toast) => (
            <div key={toast.id} className="glass-panel" style={{
              padding: '16px',
              borderLeft: '4px solid hsl(var(--accent-violet))',
              background: 'hsl(var(--card-bg))',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'slideIn 200ms ease-out',
            }}>
              <Bell size={18} style={{ color: 'hsl(var(--accent-violet))', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'white', fontSize: '0.9rem', marginBottom: '4px' }}>{toast.title}</div>
                <div style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.8rem', lineHeight: '1.4' }}>{toast.message}</div>
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
