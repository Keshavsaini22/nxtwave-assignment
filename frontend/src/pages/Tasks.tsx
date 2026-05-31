import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppSelector } from '../store/index.js';
import { ProjectService } from '../services/project.service.js';
import { TaskService } from '../services/task.service.js';
import { FormField } from '../components/FormField.js';
import type { Project } from '../types/project.types.js';
import type { Task } from '../types/task.types.js';
import { FolderKanban, Plus, Trash2, Calendar, User, AlertCircle, CheckCircle, X, Bell, LayoutGrid } from 'lucide-react';

const STATUS_COLUMNS = [
  { key: 'TODO', label: 'To Do', color: 'hsl(var(--color-todo))' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'hsl(var(--accent-violet))' },
  { key: 'IN_REVIEW', label: 'In Review', color: 'hsl(var(--accent-teal))' },
  { key: 'DONE', label: 'Done', color: 'hsl(var(--color-success))' },
  { key: 'BLOCKED', label: 'Blocked', color: 'hsl(var(--color-danger))' },
];

interface ToastAlert {
  id: string;
  title: string;
  message: string;
}

export const Tasks: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  const isAuthorizedToWrite = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const loadProjects = async () => {
    try {
      const response = await ProjectService.listProjects(1, 100);
      setProjects(response.items);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to load projects.');
    }
  };

  const loadTasks = async (projId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await TaskService.listTasks(projId, { page: 1, limit: 100 });
      setTasks(response.items);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveProjectDetails = async (projId: string) => {
    try {
      const details = await ProjectService.getProject(projId);
      setActiveProject(details);
    } catch (err) {
    }
  };

  const showToast = (title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projectIdFromUrl) {
      setSelectedProjectId(projectIdFromUrl);
      loadTasks(projectIdFromUrl);
      loadActiveProjectDetails(projectIdFromUrl);
    } else {
      setSelectedProjectId('');
      setTasks([]);
      setActiveProject(null);
    }
  }, [projectIdFromUrl]);

  useEffect(() => {
    if (projects.length > 0 && !projectIdFromUrl) {
      setSearchParams({ projectId: projects[0].id });
    }
  }, [projects, projectIdFromUrl, setSearchParams]);

  useEffect(() => {
    if (!currentUser) return;

    const token = localStorage.getItem('accessToken');
    const host = window.location.origin.includes('localhost') ? 'http://localhost:5000' : '';
    const sseUrl = `${host}/api/v1/notifications/stream?token=${token || ''}`;

    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        showToast(data.title || 'Notification', data.message || '');
        if (selectedProjectId) {
          loadTasks(selectedProjectId);
        }
      } catch (err) {
      }
    };

    es.onerror = () => {
    };

    return () => {
      es.close();
    };
  }, [selectedProjectId, currentUser]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !selectedProjectId) return;

    setError(null);
    setSuccess(null);
    setFormLoading(true);

    try {
      const payload: any = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        projectId: selectedProjectId,
        assigneeId: taskAssigneeId || undefined,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
      };

      await TaskService.createTask(payload);
      setSuccess('Task created successfully.');
      setShowCreateModal(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('LOW');
      setTaskAssigneeId('');
      setTaskDueDate('');
      loadTasks(selectedProjectId);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to create task.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTransitionStatus = async (task: Task, newStatus: string) => {
    if (task.status === newStatus) return;

    if (currentUser?.role === 'MEMBER' && (!task.assignee || task.assignee.id !== currentUser.userId)) {
      setError('Permission denied. Members can only transition tasks assigned to themselves.');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await TaskService.updateTaskStatus(task.id, newStatus);
      setSuccess(`Task status transitioned to ${newStatus}.`);
      loadTasks(selectedProjectId);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Invalid transition pathway or restriction check.');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Are you absolutely sure you want to permanently delete task "${task.title}"?`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await TaskService.deleteTask(task.id);
      setSuccess('Task deleted successfully.');
      loadTasks(selectedProjectId);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to delete task.');
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((t) => t.status === status);
  };

  const canMoveTask = (task: Task, targetStatus: string): boolean => {
    const current = task.status;
    const target = targetStatus;

    if (current === target) return false;
    if (current === 'DONE') return false;

    if (target === 'BLOCKED') return true;

    if (current === 'TODO') {
      return target === 'IN_PROGRESS';
    }
    if (current === 'IN_PROGRESS') {
      return target === 'IN_REVIEW';
    }
    if (current === 'IN_REVIEW') {
      return target === 'DONE';
    }
    if (current === 'BLOCKED') {
      return target === 'TODO' || target === 'IN_PROGRESS' || target === 'IN_REVIEW';
    }

    return false;
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1440px', margin: '0 auto', position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Task Board</h1>
          <p style={{ color: 'hsl(var(--text-secondary))' }}>
            Organize, schedule, and transition tasks inside your delegated organization projects
          </p>
        </div>

        {activeProject && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', fontWeight: 600 }}>Active Project:</span>
              <span style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'white',
                background: 'hsl(var(--bg-secondary))',
                border: '1px solid hsl(var(--card-border))',
                borderRadius: '8px',
                padding: '8px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: `hsl(${Math.abs(activeProject.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 360}, 70%, 60%)`,
                }} />
                {activeProject.name}
              </span>
            </div>

            {isAuthorizedToWrite && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary"
                style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}
              >
                <Plus size={18} /> Add Task
              </button>
            )}
          </div>
        )}
      </div>

      {success && (
        <div style={{
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
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 40px', maxWidth: '600px', margin: '60px auto' }}>
          <div style={{
            background: 'hsl(var(--card-bg) / 0.2)',
            border: '1px solid hsl(var(--card-border) / 0.3)',
            borderRadius: '12px',
            padding: '48px 32px',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <FolderKanban size={48} style={{ color: 'hsl(var(--text-muted))', marginBottom: '20px' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'white' }}>No projects found</h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
              Please create a project under Project Management first before managing tasks.
            </p>
          </div>
        </div>
      ) : loading ? (
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
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '24px',
          alignItems: 'start',
          overflowX: 'auto',
          paddingBottom: '20px',
          minWidth: '100%',
        }}>
          {STATUS_COLUMNS.map((col) => {
            const columnTasks = getTasksByStatus(col.key);
            return (
              <div key={col.key} className="glass-panel" style={{
                background: 'hsl(var(--card-bg) / 0.3)',
                padding: '20px 16px',
                minHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
                minWidth: '280px',
                flex: '1 1 0%',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  paddingBottom: '12px',
                  borderBottom: `2px solid ${col.color}`,
                }}>
                  <span style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>{col.label}</span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'hsl(var(--text-secondary))',
                    background: 'hsl(var(--bg-secondary))',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    border: '1px solid hsl(var(--card-border))',
                  }}>
                    {columnTasks.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                  {columnTasks.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      color: 'hsl(var(--text-muted))',
                      fontSize: '0.85rem',
                      padding: '32px 0',
                      border: '1px dashed hsl(var(--card-border) / 0.5)',
                      borderRadius: '8px',
                    }}>
                      No tasks
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const allowedDestinations = STATUS_COLUMNS.filter((d) => canMoveTask(task, d.key));
                      return (
                        <div key={task.id} className="glass-panel" style={{
                          padding: '16px',
                          background: 'hsl(var(--card-bg))',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'var(--transition-fast)',
                          position: 'relative',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: task.priority === 'HIGH' ? 'hsl(var(--color-danger) / 0.15)' : task.priority === 'MEDIUM' ? 'hsl(var(--accent-gold) / 0.15)' : 'hsl(var(--accent-teal) / 0.15)',
                              color: task.priority === 'HIGH' ? 'hsl(var(--color-danger))' : task.priority === 'MEDIUM' ? 'hsl(var(--accent-gold))' : 'hsl(var(--accent-teal))',
                            }}>
                              {task.priority}
                            </span>

                            {currentUser?.role === 'ADMIN' && (
                              <button
                                onClick={() => handleDeleteTask(task)}
                                style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer', padding: '2px' }}
                                title="Delete task permanently"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'white', marginBottom: '6px', lineHeight: '1.4' }}>{task.title}</h4>
                          
                          {task.description && (
                            <p style={{
                              fontSize: '0.8rem',
                              color: 'hsl(var(--text-secondary))',
                              lineHeight: '1.4',
                              marginBottom: '12px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              {task.description}
                            </p>
                          )}

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '12px',
                            borderTop: '1px solid hsl(var(--card-border) / 0.5)',
                            fontSize: '0.75rem',
                            color: 'hsl(var(--text-muted))',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} />
                              <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No due date'}</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', maxWidth: '100px', overflow: 'hidden' }}>
                              <User size={12} />
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {task.assignee ? task.assignee.email.split('@')[0] : 'Unassigned'}
                              </span>
                            </div>
                          </div>

                          {allowedDestinations.length > 0 && (
                            <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed hsl(var(--card-border) / 0.3)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>Move:</span>
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                {allowedDestinations.map((dest) => (
                                  <button
                                    key={dest.key}
                                    onClick={() => handleTransitionStatus(task, dest.key)}
                                    style={{
                                      fontSize: '0.65rem',
                                      padding: '2px 6px',
                                      borderRadius: '4px',
                                      background: 'hsl(var(--bg-secondary))',
                                      border: '1px solid hsl(var(--card-border))',
                                      color: 'white',
                                      cursor: 'pointer',
                                    }}
                                    title={`Move to ${dest.label}`}
                                  >
                                    {dest.key === 'BLOCKED' ? 'Block' : dest.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && activeProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '540px',
            padding: '32px',
            background: 'hsl(var(--card-bg))',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <LayoutGrid style={{ color: 'hsl(var(--accent-violet))' }} />
                <h3 style={{ fontSize: '1.5rem', color: 'white' }}>Create Project Task</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <FormField
                label="Task Title"
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g. Code auth route middlewares"
                required
              />

              <FormField
                label="Task Description"
                type="text"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                placeholder="Briefly describe project task deliverables..."
              />

              <FormField
                label="Task Priority"
                type="select"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as any)}
                required
                options={[
                  { value: 'LOW', label: 'LOW' },
                  { value: 'MEDIUM', label: 'MEDIUM' },
                  { value: 'HIGH', label: 'HIGH' },
                ]}
              />

              <FormField
                label="Assignee User"
                type="select"
                value={taskAssigneeId}
                onChange={(e) => setTaskAssigneeId(e.target.value)}
                options={[
                  { value: '', label: '-- Keep Unassigned --' },
                  ...(activeProject.members || []).map((m) => ({
                    value: m.id,
                    label: `${m.email} (${m.role})`,
                  })),
                ]}
              />

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn btn-primary"
                  style={{ flex: 1, height: '46px' }}
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: '46px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
