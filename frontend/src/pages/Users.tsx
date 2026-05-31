import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/index.js';
import { 
  fetchUsers, 
  provisionUser, 
  toggleBlockUser, 
  toggleRoleUser, 
  deleteUser, 
  clearUserAlerts 
} from '../store/userSlice.js';
import { UserPlus, Users as UsersIcon, Shield, Trash2, Ban, CheckCircle, Copy, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StaffUser } from '../types/user.types.js';

export const Users: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentAdmin = useAppSelector((state) => state.auth.user);
  
  const users = useAppSelector((state) => state.users.items);
  const total = useAppSelector((state) => state.users.total);
  const loading = useAppSelector((state) => state.users.loading);
  const error = useAppSelector((state) => state.users.error);
  const success = useAppSelector((state) => state.users.success);
  
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'MANAGER' | 'MEMBER'>('MEMBER');
  
  const [copied, setCopied] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers({ page, limit }));
  }, [page, dispatch, limit]);

  useEffect(() => {
    return () => {
      dispatch(clearUserAlerts());
    };
  }, [dispatch]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearUserAlerts());
    setFormLoading(true);

    try {
      await dispatch(provisionUser({
        email,
        password_raw: password,
        role,
      })).unwrap();
      setEmail('');
      setPassword('');
      setPage(1);
      dispatch(fetchUsers({ page: 1, limit }));
    } catch (err) {
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleBlock = async (staffUser: StaffUser) => {
    dispatch(clearUserAlerts());
    try {
      await dispatch(toggleBlockUser({
        id: staffUser.id,
        isBlocked: !staffUser.isBlocked,
      })).unwrap();
      dispatch(fetchUsers({ page, limit }));
    } catch (err) {
    }
  };

  const handleToggleRole = async (staffUser: StaffUser) => {
    dispatch(clearUserAlerts());
    const newRole = staffUser.role === 'MANAGER' ? 'MEMBER' : 'MANAGER';
    try {
      await dispatch(toggleRoleUser({
        id: staffUser.id,
        role: newRole,
      })).unwrap();
      dispatch(fetchUsers({ page, limit }));
    } catch (err) {
    }
  };

  const handleDeleteUser = async (staffUser: StaffUser) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete and de-provision user "${staffUser.email}"?`)) {
      return;
    }
    dispatch(clearUserAlerts());

    try {
      await dispatch(deleteUser(staffUser.id)).unwrap();
      dispatch(fetchUsers({ page, limit }));
    } catch (err) {
    }
  };

  const handleCopyOrgId = () => {
    if (currentAdmin?.organizationId) {
      navigator.clipboard.writeText(currentAdmin.organizationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Staff Provisioning</h1>
          <p style={{ color: 'hsl(var(--text-secondary))' }}>
            Provision and manage credentials for your organization's staff members
          </p>
        </div>

        {currentAdmin?.organizationId && (
          <div className="glass-panel" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            background: 'hsl(var(--card-bg) / 0.2)',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>
                Organization Invite ID
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'hsl(var(--text-primary))' }}>
                {currentAdmin.organizationId}
              </div>
            </div>
            <button
              onClick={handleCopyOrgId}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              title="Copy Org ID for new registrations"
            >
              <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className="toast-success" style={{
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '0.95rem',
          marginBottom: '24px',
          border: '1px solid hsl(var(--color-success) / 0.3)',
          background: 'hsl(var(--color-success) / 0.1)',
          color: 'hsl(var(--color-success))',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {error && (
        <div className="toast-danger" style={{
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
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px',
      }}>
        {currentAdmin?.role === 'ADMIN' && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <UserPlus style={{ color: 'hsl(var(--accent-violet))' }} />
              <h2 style={{ fontSize: '1.5rem' }}>Provision New Member</h2>
            </div>

            <form onSubmit={handleCreateUser} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              alignItems: 'end',
            }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Temporary Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min. 8 characters"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">System Role</label>
                <select
                  className="form-input"
                  style={{ appearance: 'none', background: 'hsl(var(--bg-secondary) / 0.8) url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>\') no-repeat right 14px center', backgroundSize: '16px' }}
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                >
                  <option value="MEMBER">MEMBER (Dashboard & assigned tasks)</option>
                  <option value="MANAGER">MANAGER (CRUD tasks, build projects)</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '12px' }}
                disabled={formLoading}
              >
                {formLoading ? 'Provisioning...' : 'Add Member'}
              </button>
            </form>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <UsersIcon style={{ color: 'hsl(var(--accent-teal))' }} />
            <h2 style={{ fontSize: '1.5rem' }}>Active Team Staff ({total})</h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="counter" style={{ animation: 'spin 1s linear infinite' }}>Loading...</div>
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'hsl(var(--text-secondary))' }}>
              No provisioned staff members found inside your organization.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--card-border) / 0.5)' }}>
                    <th style={{ padding: '12px 16px', color: 'hsl(var(--text-secondary))', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Email</th>
                    <th style={{ padding: '12px 16px', color: 'hsl(var(--text-secondary))', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ padding: '12px 16px', color: 'hsl(var(--text-secondary))', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '12px 16px', color: 'hsl(var(--text-secondary))', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase' }}>Joined Date</th>
                    {currentAdmin?.role === 'ADMIN' && (
                      <th style={{ padding: '12px 16px', color: 'hsl(var(--text-secondary))', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((staff) => (
                    <tr 
                      key={staff.id} 
                      style={{ 
                        borderBottom: '1px solid hsl(var(--card-border) / 0.3)',
                        background: staff.isBlocked ? 'hsl(var(--color-danger) / 0.03)' : 'transparent',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      <td style={{ padding: '16px', fontSize: '0.95rem', fontWeight: 500 }}>
                        {staff.email}
                        {staff.id === currentAdmin?.userId && (
                          <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'hsl(var(--accent-violet))', background: 'hsl(var(--accent-violet) / 0.1)', padding: '2px 6px', borderRadius: '4px' }}>You</span>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge badge-${staff.role.toLowerCase()}`}>
                          {staff.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          color: staff.isBlocked ? 'hsl(var(--color-danger))' : 'hsl(var(--color-success))',
                        }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: staff.isBlocked ? 'hsl(var(--color-danger))' : 'hsl(var(--color-success))',
                          }} />
                          {staff.isBlocked ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: 'hsl(var(--text-secondary))', fontSize: '0.9rem' }}>
                        {new Date(staff.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      {currentAdmin?.role === 'ADMIN' && (
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            {staff.id !== currentAdmin.userId && (
                              <>
                                <button
                                  onClick={() => handleToggleRole(staff)}
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                  title="Change User Role"
                                >
                                  <Shield size={14} /> Promote/Demote
                                </button>
                                <button
                                  onClick={() => handleToggleBlock(staff)}
                                  style={{
                                    padding: '6px 10px',
                                    fontSize: '0.8rem',
                                    borderRadius: '8px',
                                    border: '1px solid',
                                    cursor: 'pointer',
                                    borderColor: staff.isBlocked ? 'hsl(var(--color-success) / 0.4)' : 'hsl(var(--color-danger) / 0.4)',
                                    background: staff.isBlocked ? 'hsl(var(--color-success) / 0.15)' : 'hsl(var(--color-danger) / 0.15)',
                                    color: staff.isBlocked ? 'hsl(var(--color-success))' : 'hsl(var(--color-danger))',
                                  }}
                                  title={staff.isBlocked ? 'Activate User' : 'Suspend User'}
                                >
                                  <Ban size={14} /> {staff.isBlocked ? 'Unblock' : 'Suspend'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(staff)}
                                  className="btn btn-danger"
                                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                  title="Delete Account"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginTop: '24px',
            }}>
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 12px' }}
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span style={{ fontSize: '0.9rem', color: 'hsl(var(--text-secondary))' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                style={{ padding: '8px 12px' }}
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
