import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/index.js';
import { logoutUser } from '../store/authSlice.js';
import { ProjectService } from '../services/project.service.js';
import type { Project } from '../types/project.types.js';
import { Users as UsersIcon, BarChart3, LogOut, User as UserIcon, Building2, Copy, Briefcase, ChevronDown, ChevronRight, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: 'tasks' | 'users' | 'analytics' | 'projects';
  setActiveTab: (tab: 'tasks' | 'users' | 'analytics' | 'projects') => void;
  sidebarOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, sidebarOpen }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedProjectId = searchParams.get('projectId') || '';

  const [copied, setCopied] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      try {
        const res = await ProjectService.listProjects(1, 100);
        setProjects(res.items);
      } catch (err) {
      }
    };
    fetchProjects();
  }, [user, location.pathname]);

  const handleCopyOrgId = () => {
    if (user?.organizationId) {
      navigator.clipboard.writeText(user.organizationId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleProjectClick = (projectId: string) => {
    setActiveTab('tasks');
    navigate(`/tasks?projectId=${projectId}`);
  };

  const handleProjectTabClick = () => {
    setActiveTab('projects');
    setProjectsExpanded(!projectsExpanded);
    navigate('/projects');
  };

  return (
    <aside className="glass-panel" style={{
      width: sidebarOpen ? '280px' : '0',
      minWidth: sidebarOpen ? '280px' : '0',
      transition: 'all var(--transition-normal)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      borderTopWidth: 0,
      borderBottomWidth: 0,
      borderLeftWidth: 0,
      background: 'hsl(var(--bg-secondary) / 0.6)',
      backdropFilter: 'blur(20px)',
      zIndex: 100,
      position: 'relative',
    }}>
      <div style={{
        padding: '24px',
        borderBottom: '1px solid hsl(var(--card-border) / 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'hsl(var(--accent-violet) / 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'hsl(var(--accent-violet))',
            border: '1px solid hsl(var(--accent-violet) / 0.3)',
          }}>
            <UserIcon size={20} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              color: 'white',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.email}
            </div>
            <span className={`badge badge-${user?.role?.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 6px', marginTop: '2px' }}>
              {user?.role}
            </span>
          </div>
        </div>

        <div style={{
          background: 'hsl(var(--card-bg) / 0.3)',
          border: '1px solid hsl(var(--card-border) / 0.3)',
          padding: '10px',
          borderRadius: '8px',
          marginTop: '8px',
        }}>
          <div style={{ 
            fontSize: '0.7rem', 
            color: 'hsl(var(--text-muted))', 
            textTransform: 'uppercase', 
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <Building2 size={12} /> Tenant ID
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '6px',
            marginTop: '4px',
          }}>
            <span style={{ 
              fontFamily: 'monospace', 
              fontSize: '0.75rem', 
              color: 'hsl(var(--text-primary))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '160px',
            }}>
              {user?.organizationId}
            </span>
            <button 
              onClick={handleCopyOrgId}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? 'hsl(var(--color-success))' : 'hsl(var(--text-muted))',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Copy Org ID"
            >
              {copied ? '✓' : <Copy size={12} />}
            </button>
          </div>
        </div>
      </div>

      <nav style={{ padding: '20px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
        <div>
          <button
            onClick={handleProjectTabClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'var(--transition-fast)',
              background: activeTab === 'projects' ? 'hsl(var(--accent-violet) / 0.15)' : 'transparent',
              color: activeTab === 'projects' ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
              borderLeft: activeTab === 'projects' ? '3px solid hsl(var(--accent-violet))' : '3px solid transparent',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Briefcase size={18} /> Project Management
            </div>
            {projectsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          {projectsExpanded && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingLeft: '32px',
              marginTop: '4px',
              borderLeft: '1px solid hsl(var(--card-border) / 0.3)',
              marginLeft: '24px',
            }}>
              <button
                onClick={() => {
                  setActiveTab('projects');
                  navigate('/projects');
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  transition: 'var(--transition-fast)',
                  background: activeTab === 'projects' && !selectedProjectId ? 'hsl(var(--accent-violet) / 0.1)' : 'transparent',
                  color: activeTab === 'projects' && !selectedProjectId ? 'white' : 'hsl(var(--text-secondary))',
                  textAlign: 'left',
                }}
              >
                <Settings size={14} style={{ opacity: 0.7 }} />
                <span>Manage All Projects</span>
              </button>

              {projects.map((proj) => {
                const isSelected = activeTab === 'tasks' && selectedProjectId === proj.id;
                const dotColor = `hsl(${Math.abs(proj.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360}, 70%, 60%)`;
                return (
                  <button
                    key={proj.id}
                    onClick={() => handleProjectClick(proj.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: isSelected ? 600 : 500,
                      fontSize: '0.85rem',
                      transition: 'var(--transition-fast)',
                      background: isSelected ? 'hsl(var(--accent-violet) / 0.12)' : 'transparent',
                      color: isSelected ? 'white' : 'hsl(var(--text-secondary))',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: dotColor,
                      flexShrink: 0,
                    }} />
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {proj.name}
                    </span>
                  </button>
                );
              })}

              {projects.length === 0 && (
                <div style={{
                  fontSize: '0.8rem',
                  color: 'hsl(var(--text-muted))',
                  padding: '8px 12px',
                }}>
                  No projects joined
                </div>
              )}
            </div>
          )}
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => {
              setActiveTab('users');
              navigate('/users');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'var(--transition-fast)',
              background: activeTab === 'users' ? 'hsl(var(--accent-violet) / 0.15)' : 'transparent',
              color: activeTab === 'users' ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
              borderLeft: activeTab === 'users' ? '3px solid hsl(var(--accent-violet))' : '3px solid transparent',
              textAlign: 'left',
            }}
          >
            <UsersIcon size={18} /> Staff Members
          </button>
        )}

        {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
          <button
            onClick={() => {
              setActiveTab('analytics');
              navigate('/analytics');
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.95rem',
              transition: 'var(--transition-fast)',
              background: activeTab === 'analytics' ? 'hsl(var(--accent-violet) / 0.15)' : 'transparent',
              color: activeTab === 'analytics' ? 'hsl(var(--text-primary))' : 'hsl(var(--text-secondary))',
              borderLeft: activeTab === 'analytics' ? '3px solid hsl(var(--accent-violet))' : '3px solid transparent',
              textAlign: 'left',
            }}
          >
            <BarChart3 size={18} /> Analytics Panel
          </button>
        )}
      </nav>

      <div style={{
        padding: '20px 16px',
        borderTop: '1px solid hsl(var(--card-border) / 0.5)',
      }}>
        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '10px 16px', fontSize: '0.9rem' }}
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  );
};
