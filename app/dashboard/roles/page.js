'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { DEFAULT_ROLES, PERMISSIONS } from '@/lib/mockData';
import { getRoleMeta } from '@/lib/rbac';
import { Plus, Edit2, Trash2, Shield, Check, X } from 'lucide-react';

const PERMISSION_GROUPS = {
    'Dashboard Access': [PERMISSIONS.VIEW_SUPER_ADMIN_DASHBOARD, PERMISSIONS.VIEW_ADMIN_DASHBOARD, PERMISSIONS.VIEW_HR_DASHBOARD, PERMISSIONS.VIEW_MANAGER_DASHBOARD, PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD],
    'Employee Management': [PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.CREATE_EMPLOYEE, PERMISSIONS.EDIT_EMPLOYEE, PERMISSIONS.DELETE_EMPLOYEE, PERMISSIONS.VIEW_OWN_PROFILE],
    'Attendance': [PERMISSIONS.VIEW_ALL_ATTENDANCE, PERMISSIONS.VIEW_TEAM_ATTENDANCE, PERMISSIONS.MARK_ATTENDANCE, PERMISSIONS.APPROVE_REGULARIZATION, PERMISSIONS.MANAGE_GEOFENCE],
    'Leave Management': [PERMISSIONS.APPLY_LEAVE, PERMISSIONS.APPROVE_LEAVE, PERMISSIONS.VIEW_TEAM_LEAVES, PERMISSIONS.VIEW_ALL_LEAVES, PERMISSIONS.MANAGE_LEAVE_POLICY],
    'Payroll & Finance': [PERMISSIONS.VIEW_OWN_PAYSLIP, PERMISSIONS.VIEW_ALL_PAYSLIPS, PERMISSIONS.RUN_PAYROLL, PERMISSIONS.MANAGE_SALARY, PERMISSIONS.APPROVE_SALARY_UPGRADE, PERMISSIONS.VIEW_STATUTORY_REPORTS, PERMISSIONS.APPLY_LOAN, PERMISSIONS.APPROVE_LOAN, PERMISSIONS.VIEW_ALL_LOANS],
    'Performance': [PERMISSIONS.VIEW_OWN_OKR, PERMISSIONS.MANAGE_OKR, PERMISSIONS.SUBMIT_FEEDBACK, PERMISSIONS.VIEW_FEEDBACK, PERMISSIONS.VIEW_ALL_FEEDBACK],
    'Lifecycle': [PERMISSIONS.MANAGE_ONBOARDING, PERMISSIONS.MANAGE_OFFBOARDING, PERMISSIONS.APPROVE_CLEARANCE],
    'Administration': [PERMISSIONS.MANAGE_ROLES, PERMISSIONS.MANAGE_USERS, PERMISSIONS.ASSIGN_ROLES, PERMISSIONS.RESET_PASSWORDS, PERMISSIONS.MANAGE_NETWORK_SECURITY, PERMISSIONS.VIEW_AUDIT_LOGS, PERMISSIONS.MANAGE_APPROVAL_WORKFLOWS],
};

function RolesContent() {
    const { currentUser, customRoles, users, createRole, updateRole, deleteRole, updateUser } = useApp();
    const [selectedRole, setSelectedRole] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPerms, setEditingPerms] = useState({});
    const [newRole, setNewRole] = useState({ name: '', description: '', color: '#6366f1', permissions: [] });
    const [assignUserId, setAssignUserId] = useState('');

    const allRoles = [
        ...Object.values(DEFAULT_ROLES),
        ...customRoles,
    ];

    function handleSelectRole(role) {
        setSelectedRole(role);
        setEditingPerms(Object.fromEntries(role.permissions.map(p => [p, true])));
    }

    function togglePerm(perm) {
        if (selectedRole?.isSystemRole) return;
        setEditingPerms(prev => ({ ...prev, [perm]: !prev[perm] }));
    }

    function handleSaveRole() {
        const perms = Object.entries(editingPerms).filter(([, v]) => v).map(([k]) => k);
        if (selectedRole.isSystemRole) return;
        updateRole(selectedRole.id, { permissions: perms });
        setSelectedRole(r => ({ ...r, permissions: perms }));
    }

    function handleCreateRole(e) {
        e.preventDefault();
        const perms = newRole.permissions;
        createRole({ ...newRole, permissions: perms });
        setShowCreateModal(false);
        setNewRole({ name: '', description: '', color: '#6366f1', permissions: [] });
    }

    function getUsersWithRole(roleId) {
        return users.filter(u => u.role === roleId);
    }

    function handleAssignUser() {
        if (!assignUserId) return;
        updateUser(assignUserId, { role: selectedRole.id });
        setAssignUserId('');
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Role Management</h1>
                    <p className="page-subtitle">Define roles and assign granular permissions</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}><Plus size={16} /> Create Role</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
                {/* Role List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {allRoles.map(role => {
                        const meta = getRoleMeta(role.id, customRoles);
                        const usersWithRole = getUsersWithRole(role.id);
                        return (
                            <div key={role.id}
                                onClick={() => handleSelectRole(role)}
                                style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', border: `1px solid ${selectedRole?.id === role.id ? role.color || 'var(--brand-primary)' : 'var(--border-subtle)'}`, background: selectedRole?.id === role.id ? `${role.color || '#6366f1'}10` : 'var(--bg-card)', cursor: 'pointer', transition: 'all 0.15s', backdropFilter: 'blur(20px)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: role.color || 'var(--text-primary)' }}>{role.name}</div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        {role.isSystemRole && <span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>System</span>}
                                        {role.isSuperAdmin && <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>🔓 Unrestricted</span>}
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>{role.description}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{usersWithRole.length} user{usersWithRole.length !== 1 ? 's' : ''} • {role.permissions.length} permissions</div>
                            </div>
                        );
                    })}
                </div>

                {/* Permission Matrix */}
                <div>
                    {selectedRole ? (
                        <div className="card">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: selectedRole.color }}>{selectedRole.name}</h3>
                                        {selectedRole.isSuperAdmin && <span className="badge badge-warning">Super Admin — All Permissions Auto-Granted</span>}
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{selectedRole.description}</p>
                                </div>
                                {!selectedRole.isSystemRole && (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button className="btn btn-primary btn-sm" onClick={handleSaveRole}>Save Changes</button>
                                        <button className="btn btn-danger btn-sm" onClick={() => deleteRole(selectedRole.id)}><Trash2 size={14} /></button>
                                    </div>
                                )}
                                {selectedRole.isSystemRole && !selectedRole.isSuperAdmin && (
                                    <span className="badge badge-neutral">System roles can be viewed but not modified</span>
                                )}
                            </div>

                            {/* Assigned Users */}
                            <div style={{ marginBottom: 20, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                {getUsersWithRole(selectedRole.id).map(u => (
                                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 'var(--radius-full)', background: `${selectedRole.color || '#6366f1'}15`, border: `1px solid ${selectedRole.color || '#6366f1'}30`, fontSize: '0.78rem', fontWeight: 500, color: selectedRole.color || 'var(--text-primary)' }}>
                                        <div className="avatar avatar-sm" style={{ width: 20, height: 20, fontSize: '0.6rem' }}>{u.avatar}</div>
                                        {u.name}
                                    </div>
                                ))}
                                {getUsersWithRole(selectedRole.id).length === 0 && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No users assigned yet.</span>}

                                {/* Assign User Dropdown */}
                                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                                    <select className="form-select" style={{ width: 140, padding: '4px 8px', fontSize: '0.75rem', height: 28 }} value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
                                        <option value="">+ Assign User...</option>
                                        {users.filter(u => u.role !== selectedRole.id).map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <button className="btn btn-primary" style={{ padding: '4px 10px', height: 28, fontSize: '0.75rem' }} onClick={handleAssignUser} disabled={!assignUserId}>Assign</button>
                                </div>
                            </div>

                            <div className="divider" />

                            {selectedRole.isSuperAdmin ? (
                                <div className="alert alert-warning" style={{ marginTop: 16 }}>
                                    <Shield size={16} style={{ flexShrink: 0 }} />
                                    <span>Super Admin role has <strong>unrestricted access</strong> to all permissions. No restrictions apply — this includes bypassing network security, RBAC checks, and approval workflows.</span>
                                </div>
                            ) : (
                                <div>
                                    {Object.entries(PERMISSION_GROUPS).map(([groupName, perms]) => (
                                        <div key={groupName} style={{ marginBottom: 20 }}>
                                            <div style={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>{groupName}</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                                                {perms.map(perm => {
                                                    const hasIt = selectedRole.isSystemRole ? selectedRole.permissions.includes(perm) : !!editingPerms[perm];
                                                    return (
                                                        <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-md)', border: `1px solid ${hasIt ? 'rgba(99,102,241,0.3)' : 'var(--border-subtle)'}`, background: hasIt ? 'rgba(99,102,241,0.06)' : 'transparent', cursor: selectedRole.isSystemRole ? 'not-allowed' : 'pointer', opacity: selectedRole.isSystemRole ? 0.7 : 1 }}>
                                                            <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${hasIt ? 'var(--brand-primary)' : 'var(--border-default)'}`, background: hasIt ? 'var(--brand-primary)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                                                                {hasIt && <Check size={11} color="white" />}
                                                            </div>
                                                            <input type="checkbox" hidden checked={hasIt} onChange={() => togglePerm(perm)} disabled={selectedRole.isSystemRole} />
                                                            <span style={{ fontSize: '0.75rem', color: hasIt ? 'var(--text-primary)' : 'var(--text-muted)' }}>{perm.replace(/_/g, ' ')}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, textAlign: 'center' }}>
                            <div>
                                <Shield size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                                <p style={{ color: 'var(--text-muted)' }}>Select a role to view and manage its permissions</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Role Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>Create New Role</h3>
                        <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group">
                                <label className="form-label">Role Name</label>
                                <input type="text" className="form-input" placeholder="e.g. IT Helpdesk" value={newRole.name} onChange={e => setNewRole(r => ({ ...r, name: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input type="text" className="form-input" placeholder="Brief description of this role" value={newRole.description} onChange={e => setNewRole(r => ({ ...r, description: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Color</label>
                                <input type="color" className="form-input" style={{ height: 42, padding: '4px 8px' }} value={newRole.color} onChange={e => setNewRole(r => ({ ...r, color: e.target.value }))} />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Create Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RolesPage() {
    return <DashboardLayout title="Role Management"><RolesContent /></DashboardLayout>;
}
