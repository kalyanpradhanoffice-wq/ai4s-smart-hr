'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { can, getRoleMeta } from '@/lib/rbac';
import { PERMISSIONS } from '@/lib/constants';
import { Plus, Search, Mail, Phone, Edit2, Key, Filter, UserPlus, Trash2 } from 'lucide-react';

const DEPARTMENTS = ['Technical', 'Functional', 'Techno-Functional'];
const DESIGNATIONS = [
    'Chief Executive Officer(CEO)',
    'Chief Development Officer(CDO)',
    'Developer Admin - Accounts',
    'Administration',
    'Associate HR',
    'Associate MM Consultant',
    'Associate FICO Consultant',
    'Associate SucessFactor Consultant',
    'SAP Cloud Platform & System Architect',
    'SAP BTP Solution Architect',
    'SAP Cloud ALM Administrator',
    'SAP Build App Developer',
    'SAP Integration Architect',
    'SAP Full Stack Solution Developer',
    'Social Media Manger',
    'SAP CAPM Developer',
    'CAPM Developer',
    'AI/ML',
    'SAP - ABAP Trainee',
    'SAP BASIS Intern'
];
const EMPLOYEE_TYPES = ['Trainee', 'Confirm'];

function EmployeesContent() {
    const { currentUser, users, customRoles, resetPassword, createUser, updateUser, deactivateUser, deleteUser } = useApp();
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showResetModal, setShowResetModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);

    // Add Employee State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEmpForm, setNewEmpForm] = useState({
        name: '', email: '', password: '', role: 'employee',
        department: 'Technical', designation: 'Developer Admin - Accounts', type: 'Confirm',
        joinDate: new Date().toISOString().split('T')[0],
        salaryBasic: '', salaryHra: '',
        // Optional fields
        phone: '', location: '', dob: '', gender: '', pan: '', managerId: ''
    });
    // Generate the next employee ID for display
    const nextEmpNum = users.length + 1;
    const previewEmpId = `AI4S${String(nextEmpNum).padStart(3, '0')}`;

    // Edit Employee State
    const [showEditModal, setShowEditModal] = useState(null);
    const [editForm, setEditForm] = useState({});

    const canResetPwd = can(currentUser, PERMISSIONS.RESET_PASSWORDS, customRoles);
    const canEdit = can(currentUser, PERMISSIONS.EDIT_EMPLOYEE, customRoles);
    const canCreate = can(currentUser, PERMISSIONS.CREATE_EMPLOYEE, customRoles);

    const departments = [...new Set(users.map(u => u.department))];
    const roles = [...new Set(users.map(u => u.role))];

    const filtered = users.filter(u => {
        const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.employeeId.toLowerCase().includes(search.toLowerCase());
        const matchDept = !deptFilter || u.department === deptFilter;
        const matchRole = !roleFilter || u.role === roleFilter;
        return matchSearch && matchDept && matchRole;
    });

    function handleResetPassword(e) {
        e.preventDefault();
        if (!newPassword || newPassword.length < 6) return;
        resetPassword(showResetModal.id, newPassword);
        setResetSuccess(true);
        setTimeout(() => { setResetSuccess(false); setShowResetModal(null); setNewPassword(''); }, 1500);
    }

    async function handleAddEmployee(e) {
        e.preventDefault();
        const { salaryBasic, salaryHra, ...rest } = newEmpForm;

        // Generate initials for avatar
        const initials = rest.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        const colors = ['#f59e0b', '#10b981', '#6366f1', '#8b5cf6', '#0ea5e9', '#f43f5e'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];

        const userData = {
            ...rest,
            avatar: initials,
            avatarColor: randomColor,
            salary: {
                basic: Number(salaryBasic) || 0,
                hra: Number(salaryHra) || 0,
                allowances: (Number(salaryBasic) || 0) * 0.2,
                gross: (Number(salaryBasic) || 0) + (Number(salaryHra) || 0) + ((Number(salaryBasic) || 0) * 0.2)
            }
        };

        const { success, error } = await createUser(userData);
        
        if (success) {
            setShowAddModal(false);
            setNewEmpForm({
                name: '', email: '', password: '', role: 'employee',
                department: 'Technical', designation: 'Developer Admin - Accounts', type: 'Confirm',
                joinDate: new Date().toISOString().split('T')[0],
                salaryBasic: '', salaryHra: '',
                phone: '', location: '', dob: '', gender: '', pan: '', managerId: ''
            });
            alert("Employee created and registered successfully!");
        } else {
            alert("Error: " + error);
        }
    }

    function handleEditClick(emp) {
        setEditForm({
            name: emp.name, email: emp.email, role: emp.role,
            department: emp.department, designation: emp.designation,
            type: emp.type || 'Confirm',
            salaryBasic: emp.salary?.basic || '',
            salaryHra: emp.salary?.hra || '',
            managerId: emp.managerId || ''
        });
        setShowEditModal(emp);
    }

    function handleEditSubmit(e) {
        e.preventDefault();
        const { salaryBasic, salaryHra, ...rest } = editForm;

        const updates = {
            ...rest,
            salary: {
                ...showEditModal.salary,
                basic: Number(salaryBasic) || showEditModal.salary?.basic || 0,
                hra: Number(salaryHra) || showEditModal.salary?.hra || 0,
                allowances: (Number(salaryBasic) || 0) * 0.2,
                gross: (Number(salaryBasic) || 0) + (Number(salaryHra) || 0) + ((Number(salaryBasic) || 0) * 0.2)
            }
        };

        updateUser(showEditModal.id, updates);
        setShowEditModal(null);
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Employee Directory</h1>
                    <p className="page-subtitle">{filtered.length} of {users.length} employees</p>
                </div>
                {canCreate && <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={16} /> Add Employee</button>}
            </div>

            {/* Search & Filters */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="form-input" style={{ paddingLeft: 38 }} placeholder="Search by name, email, or ID..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-select" style={{ width: 180 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="form-select" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                    <option value="">All Roles</option>
                    {roles.map(r => <option key={r} value={r}>{getRoleMeta(r, customRoles).name}</option>)}
                </select>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>ID</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Type</th>
                            <th>Reporting To</th>
                            <th>Role</th>
                            <th>Join Date</th>
                            <th>Status</th>
                            {(canEdit || canResetPwd) && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(emp => {
                            const roleMeta = getRoleMeta(emp.role, customRoles);
                            return (
                                <tr key={emp.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div className="avatar avatar-sm" style={{ background: `${emp.avatarColor}30`, color: emp.avatarColor, fontWeight: 700 }}>{emp.avatar}</div>
                                            <div>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{emp.name}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: 'var(--brand-primary-light)' }}>{emp.employeeId}</td>
                                    <td style={{ fontSize: '0.85rem' }}>{emp.department}</td>
                                    <td style={{ fontSize: '0.82rem' }}>{emp.designation}</td>
                                    <td><span className="badge badge-neutral">{emp.type || 'Confirm'}</span></td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {emp.managerId ? users.find(u => u.id === emp.managerId)?.name || 'Unknown' : '—'}
                                    </td>
                                    <td>
                                        <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-full)', background: `${roleMeta.color || '#6366f1'}18`, color: roleMeta.color || '#818cf8', fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${roleMeta.color || '#6366f1'}30` }}>
                                            {roleMeta.name}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.82rem' }}>{emp.joinDate}</td>
                                    <td>
                                        <span className={`status-pill ${emp.status === 'active' ? 'status-approved' : 'status-rejected'}`}>{emp.status}</span>
                                    </td>
                                    {(canEdit || canResetPwd) && (
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {canEdit && <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={() => handleEditClick(emp)} title="Edit Employee"><Edit2 size={13} /></button>}
                                                {canResetPwd && (
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', color: '#fbbf24' }} onClick={() => setShowResetModal(emp)} title="Reset Password">
                                                        <Key size={13} />
                                                    </button>
                                                )}
                                                {canEdit && emp.status === 'active' && (
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', color: '#f59e0b' }} onClick={() => { if(confirm(`Are you sure you want to retire ${emp.name}?`)) deactivateUser(emp.id); }} title="Retire Employee (Mark Inactive)">
                                                        <UserPlus size={13} style={{ transform: 'rotate(45deg)' }} />
                                                    </button>
                                                )}
                                                {currentUser?.role === 'super_admin' && (
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', color: '#ef4444' }} onClick={() => { if(confirm(`⚠️ WARNING: This will PERMANENTLY delete ${emp.name} and all their cloud data. \n\nAre you absolutely sure?`)) deleteUser(emp.id); }} title="HARD DELETE (Permanent)">
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                        {filtered.length === 0 && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No employees found matching your search.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowResetModal(null)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 8, fontFamily: 'var(--font-display)' }}>Reset Password</h3>
                        <p style={{ marginBottom: 20, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Setting new password for <strong style={{ color: 'var(--text-primary)' }}>{showResetModal.name}</strong></p>
                        {resetSuccess ? (
                            <div className="alert alert-success">Password reset successfully!</div>
                        ) : (
                            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <input type="password" className="form-input" placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                                </div>
                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowResetModal(null)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary"><Key size={14} /> Reset Password</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
                    <div className="modal-box" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ marginBottom: 6, fontFamily: 'var(--font-display)' }}>Add New Employee</h3>

                        {/* Auto-generated Employee ID preview */}
                        <div style={{ marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Auto Employee ID:</span>
                            <strong style={{ fontFamily: 'monospace', color: 'var(--brand-primary-light)', fontSize: '1rem' }}>{previewEmpId}</strong>
                        </div>

                        <form onSubmit={handleAddEmployee}>
                            <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, marginBottom: 14 }}>Mandatory Fields</div>
                            <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input type="text" className="form-input" value={newEmpForm.name} onChange={e => setNewEmpForm(f => ({ ...f, name: e.target.value }))} required placeholder="Full legal name" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Email *</label>
                                    <input type="email" className="form-input" value={newEmpForm.email} onChange={e => setNewEmpForm(f => ({ ...f, email: e.target.value }))} required placeholder="work@email.com" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Temporary Password *</label>
                                    <input type="text" className="form-input" value={newEmpForm.password} onChange={e => setNewEmpForm(f => ({ ...f, password: e.target.value }))} required placeholder="Min. 8 characters" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role *</label>
                                    <select className="form-select" value={newEmpForm.role} onChange={e => setNewEmpForm(f => ({ ...f, role: e.target.value }))}>
                                        <option value="employee">Employee</option>
                                        <option value="manager">Manager</option>
                                        <option value="hr_admin">HR Admin</option>
                                        {customRoles?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department *</label>
                                    <select className="form-select" value={newEmpForm.department} onChange={e => setNewEmpForm(f => ({ ...f, department: e.target.value }))}>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Designation *</label>
                                    <select className="form-select" value={newEmpForm.designation} onChange={e => setNewEmpForm(f => ({ ...f, designation: e.target.value }))}>
                                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Employee Type *</label>
                                    <select className="form-select" value={newEmpForm.type} onChange={e => setNewEmpForm(f => ({ ...f, type: e.target.value }))}>
                                        {EMPLOYEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Joining *</label>
                                    <input type="date" className="form-input" value={newEmpForm.joinDate} onChange={e => setNewEmpForm(f => ({ ...f, joinDate: e.target.value }))} required />
                                </div>
                            </div>

                            <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, marginBottom: 14 }}>Optional Fields</div>
                            <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Phone Number</label>
                                    <input type="tel" className="form-input" value={newEmpForm.phone} onChange={e => setNewEmpForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Location / City</label>
                                    <input type="text" className="form-input" value={newEmpForm.location} onChange={e => setNewEmpForm(f => ({ ...f, location: e.target.value }))} placeholder="Mumbai, MH" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date of Birth</label>
                                    <input type="date" className="form-input" value={newEmpForm.dob} onChange={e => setNewEmpForm(f => ({ ...f, dob: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select className="form-select" value={newEmpForm.gender} onChange={e => setNewEmpForm(f => ({ ...f, gender: e.target.value }))}>
                                        <option value="">Prefer not to say</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">PAN Number</label>
                                    <input type="text" className="form-input" style={{ textTransform: 'uppercase' }} value={newEmpForm.pan} onChange={e => setNewEmpForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} placeholder="ABCDE1234F" maxLength={10} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reporting Manager</label>
                                    <select className="form-select" value={newEmpForm.managerId} onChange={e => setNewEmpForm(f => ({ ...f, managerId: e.target.value }))}>
                                        <option value="">None / Self-Directed</option>
                                        {users.filter(u => ['manager', 'core_admin', 'super_admin', 'hr_admin'].includes(u.role)).map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({getRoleMeta(m.role, customRoles).name})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, marginBottom: 14 }}>Payroll Baseline</div>
                            <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
                                <div className="form-group">
                                    <label className="form-label">Basic Salary (₹/mo) *</label>
                                    <input type="number" className="form-input" value={newEmpForm.salaryBasic} onChange={e => setNewEmpForm(f => ({ ...f, salaryBasic: e.target.value }))} required placeholder="e.g. 50000" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">HRA (₹/mo) *</label>
                                    <input type="number" className="form-input" value={newEmpForm.salaryHra} onChange={e => setNewEmpForm(f => ({ ...f, salaryHra: e.target.value }))} required placeholder="e.g. 20000" />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><UserPlus size={15} /> Create Profile ({previewEmpId})</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {showEditModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowEditModal(null)}>
                    <div className="modal-box" style={{ maxWidth: 650 }}>
                        <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>Edit Profile</h3>
                        <form onSubmit={handleEditSubmit}>
                            <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" className="form-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact Email</label>
                                    <input type="email" className="form-input" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select className="form-select" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                                        <option value="employee">Employee</option>
                                        <option value="manager">Manager</option>
                                        <option value="hr_admin">HR Admin</option>
                                        <option value="core_admin">Core Admin</option>
                                        {customRoles?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Department</label>
                                    <select className="form-select" value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))}>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Designation</label>
                                    <select className="form-select" value={editForm.designation} onChange={e => setEditForm(f => ({ ...f, designation: e.target.value }))}>
                                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Employee Type</label>
                                    <select className="form-select" value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}>
                                        {EMPLOYEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Reporting Manager</label>
                                    <select className="form-select" value={editForm.managerId} onChange={e => setEditForm(f => ({ ...f, managerId: e.target.value }))}>
                                        <option value="">None / Self-Directed</option>
                                        {users.filter(u => ['manager', 'core_admin', 'super_admin', 'hr_admin'].includes(u.role) && u.id !== showEditModal.id).map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({getRoleMeta(m.role, customRoles).name})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <h4 style={{ fontSize: '0.9rem', marginBottom: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>Payroll Baseline</h4>
                            <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
                                <div className="form-group">
                                    <label className="form-label">Basic Salary (₹/mo)</label>
                                    <input type="number" className="form-input" value={editForm.salaryBasic} onChange={e => setEditForm(f => ({ ...f, salaryBasic: e.target.value }))} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">HRA (₹/mo)</label>
                                    <input type="number" className="form-input" value={editForm.salaryHra} onChange={e => setEditForm(f => ({ ...f, salaryHra: e.target.value }))} required />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowEditModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><Edit2 size={15} /> Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmployeesPage() {
    return <DashboardLayout title="Employee Directory"><EmployeesContent /></DashboardLayout>;
}
