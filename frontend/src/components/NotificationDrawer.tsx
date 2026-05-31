import React, { useState } from 'react';
import { NotificationService } from '../services/notification.service.js';
import type { Notification } from '../services/notification.service.js';
import { X, Bell, Check, CheckCheck, Clock, MailOpen } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  setNotifications,
  unreadCount,
  setUnreadCount,
}) => {
  const [loading, setLoading] = useState(false);

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setLoading(true);
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'transparent',
            zIndex: 999,
          }}
        />
      )}

      <div style={{
        position: 'fixed',
        top: '72px',
        right: isOpen ? '24px' : '-420px',
        width: '380px',
        height: 'calc(100vh - 96px)',
        background: 'hsl(var(--card-bg))',
        border: '1px solid hsl(var(--card-border))',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 1000,
        transition: 'right var(--transition-normal)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid hsl(var(--card-border) / 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={18} style={{ color: 'hsl(var(--accent-violet))' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white' }}>Inbox Notifications</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{
          padding: '12px 24px',
          background: 'hsl(var(--bg-secondary) / 0.3)',
          borderBottom: '1px solid hsl(var(--card-border) / 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
            {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: 'hsl(var(--accent-teal))',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
              <MailOpen size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 500, color: 'white', marginBottom: '4px' }}>Inbox Empty</div>
              <div style={{ fontSize: '0.75rem' }}>No recent activity or status updates found.</div>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                style={{
                  padding: '16px 24px',
                  borderBottom: '1px solid hsl(var(--card-border) / 0.3)',
                  background: notif.isRead ? 'transparent' : 'hsl(var(--accent-violet) / 0.03)',
                  transition: 'background var(--transition-fast)',
                  position: 'relative',
                  display: 'flex',
                  gap: '12px',
                }}
              >
                {!notif.isRead && (
                  <span style={{
                    position: 'absolute',
                    left: '10px',
                    top: '24px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'hsl(var(--accent-violet))',
                  }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    color: notif.isRead ? 'hsl(var(--text-secondary))' : 'white',
                    fontSize: '0.85rem',
                    marginBottom: '4px',
                  }}>
                    {notif.title}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: 'hsl(var(--text-muted))',
                    lineHeight: '1.4',
                    marginBottom: '8px',
                  }}>
                    {notif.message}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>
                    <Clock size={10} />
                    <span>{formatTimestamp(notif.createdAt)}</span>
                  </div>
                </div>

                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    style={{
                      alignSelf: 'center',
                      background: 'none',
                      border: '1px solid hsl(var(--card-border))',
                      borderRadius: '4px',
                      color: 'hsl(var(--text-muted))',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
