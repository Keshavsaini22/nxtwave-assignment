import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../store/index.js';
import { ProjectService } from '../services/project.service.js';
import { UserService } from '../services/user.service.js';
import { FormField } from '../components/FormField.js';
import type { Project } from '../types/project.types.js';
import type { StaffUser } from '../types/user.types.js';
import { FolderKanban, Plus, Trash2, Edit2, UserPlus, UserMinus, AlertCircle, CheckCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

export const Projects: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);

  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const [activeManageProject, setActiveManageProject] = useState<Project | null>(null);
  const [orgUsers, setOrgUsers] = useState<StaffUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [membersLoading, setMembersLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAuthorizedToWrite = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ProjectService.listProjects(page, limit);
      setProjects(response.items);
      setTotal(response.total);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  };

  const loadOrgUsers = async () => {
    if (!isAuthorizedToWrite) return;
    try {
      const response = await UserService.listUsers(1, 100);
      setOrgUsers(response.items.filter(u => !u.isBlocked));
    } catch (err) {
    }
  };

  useEffect(() => {
    loadProjects();
  }, [page]);

  useEffect(() => {
    if (isAuthorizedToWrite) {
      loadOrgUsers();
    }
  }, [currentUser]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError(null);
    setSuccess(null);
    setFormLoading(true);

    try {
      const newProj = await ProjectService.createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setSuccess(`Project "${newProj.name}" created successfully.`);
      setName('');
      setDescription('');
      setPage(1);
      loadProjects();
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to create project.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStartEdit = (proj: Project) => {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditDescription(proj.description || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !editName.trim()) return;

    setError(null);
    setSuccess(null);
    setFormLoading(true);

    try {
      await ProjectService.updateProject(editingProject.id, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      setSuccess('Project details updated successfully.');
      setEditingProject(null);
      loadProjects();
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to update project.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProject = async (proj: Project) => {
    if (!window.confirm(`Are you absolutely sure you want to delete project "${proj.name}"? This action is permanent and will delete all associated tasks.`)) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await ProjectService.deleteProject(proj.id);
      setSuccess('Project removed successfully.');
      setPage(1);
      loadProjects();
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to delete project.');
    }
  };

  const handleOpenMembers = async (proj: Project) => {
    setActiveManageProject(proj);
    setSelectedUserId('');
    setMembersLoading(true);
    try {
      const detailed = await ProjectService.getProject(proj.id);
      setActiveManageProject(detailed);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to load project details.');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeManageProject || !selectedUserId) return;

    setError(null);
    setSuccess(null);

    try {
      await ProjectService.assignMember(activeManageProject.id, selectedUserId);
      const detailed = await ProjectService.getProject(activeManageProject.id);
      setActiveManageProject(detailed);
      setSelectedUserId('');
      setSuccess('Project member assigned successfully.');
      loadProjects();
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to assign project member.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeManageProject) return;

    setError(null);
    setSuccess(null);

    try {
      await ProjectService.removeMember(activeManageProject.id, userId);
      const detailed = await ProjectService.getProject(activeManageProject.id);
      setActiveManageProject(detailed);
      setSuccess('Project member removed successfully.');
      loadProjects();
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to remove project member.');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Project Management</h1>
          <p style={{ color: 'hsl(var(--text-secondary))' }}>
            Initialize, structure, and delegate members to organizational workspace projects
          </p>
        </div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        {isAuthorizedToWrite && !editingProject && !activeManageProject && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
              <Plus style={{ color: 'hsl(var(--accent-violet))' }} />
              <h2 style={{ fontSize: '1.5rem' }}>Create New Project</h2>
            </div>

            <form onSubmit={handleCreateProject} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              alignItems: 'end',
            }}>
              <FormField
                label="Project Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Website Overhaul"
                required
              />

              <FormField
                label="Project Description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe project deliverables..."
              />

              <div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', height: '46px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={18} />
                  {formLoading ? 'Creating...' : 'Initialize Project'}
                </button>
              </div>
            </form>
          </div>
        )}

        {editingProject && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Edit2 style={{ color: 'hsl(var(--accent-teal))' }} />
                <h2 style={{ fontSize: '1.5rem' }}>Edit Project Details</h2>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              alignItems: 'end',
            }}>
              <FormField
                label="Project Name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <FormField
                label="Project Description"
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn btn-primary"
                  style={{ flex: 1, height: '46px' }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: '46px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {activeManageProject && (
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>Manage Members: {activeManageProject.name}</h2>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>
                  Assign and revoke workspace employee delegation for this project
                </p>
              </div>
              <button
                onClick={() => setActiveManageProject(null)}
                style={{ background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Assign New Member</h3>
                <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <FormField
                    label="Select Staff User"
                    type="select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    options={[
                      { value: '', label: '-- Choose User --' },
                      ...orgUsers
                        .filter(u => !activeManageProject.members?.some(m => m.id === u.id))
                        .map(u => ({
                          value: u.id,
                          label: `${u.email} (${u.role})`
                        }))
                    ]}
                  />
                  <button type="submit" className="btn btn-primary" style={{ height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <UserPlus size={18} /> Assign to Project
                  </button>
                </form>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Current Project Members</h3>
                {membersLoading ? (
                  <div style={{ color: 'hsl(var(--text-secondary))' }}>Loading members...</div>
                ) : !activeManageProject.members || activeManageProject.members.length === 0 ? (
                  <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', padding: '16px 0' }}>
                    No members are currently delegated to this project.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeManageProject.members.map((member) => (
                      <div key={member.id} className="glass-panel" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'hsl(var(--card-bg) / 0.1)',
                      }}>
                        <div>
                          <div style={{ fontSize: '0.9rem', color: 'white' }}>{member.email}</div>
                          <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                            Role: {member.role}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'hsl(var(--color-danger))',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                          title="Revoke project access"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <FolderKanban style={{ color: 'hsl(var(--accent-violet))' }} />
            <h2 style={{ fontSize: '1.5rem' }}>Active Projects</h2>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: '3px solid hsl(var(--card-border))',
                borderTopColor: 'hsl(var(--accent-violet))',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            </div>
          ) : projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <FolderKanban size={40} style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '1.2rem', color: 'hsl(var(--text-primary))', marginBottom: '8px' }}>No projects found</h3>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '0.9rem', margin: 0 }}>
                There are currently no projects in this workspace.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--card-border) / 0.5)' }}>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-muted))', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Project Info</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-muted))', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Members Assigned</th>
                    <th style={{ padding: '16px 20px', color: 'hsl(var(--text-muted))', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Date Created</th>
                    {isAuthorizedToWrite && (
                      <th style={{ padding: '16px 20px', color: 'hsl(var(--text-muted))', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((proj) => (
                    <tr key={proj.id} style={{ borderBottom: '1px solid hsl(var(--card-border) / 0.3)', transition: 'all var(--transition-fast)' }}>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 600, color: 'white', fontSize: '1.05rem', marginBottom: '4px' }}>{proj.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))' }}>
                          {proj.description || 'No description provided.'}
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <span className="badge badge-member" style={{ fontSize: '0.85rem' }}>
                          {proj.members ? proj.members.length : 0} members
                        </span>
                      </td>
                      <td style={{ padding: '20px', color: 'hsl(var(--text-secondary))', fontSize: '0.85rem' }}>
                        {new Date(proj.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      {isAuthorizedToWrite && (
                        <td style={{ padding: '20px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenMembers(proj)}
                              className="btn btn-secondary"
                              style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                              title="Manage active project members"
                            >
                              <UserPlus size={14} /> Team
                            </button>
                            <button
                              onClick={() => handleStartEdit(proj)}
                              className="btn btn-secondary"
                              style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                              title="Edit project name & description"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj)}
                              className="btn btn-secondary"
                              style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--color-danger))' }}
                              title="Delete project"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid hsl(var(--card-border) / 0.3)' }}>
                  <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))' }}>
                    Showing page {page} of {totalPages} ({total} active projects)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <ChevronLeft size={16} /> Prev
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
