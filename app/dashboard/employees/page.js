'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState, useEffect } from 'react';
import { can, getRoleMeta } from '@/lib/rbac';
import { PERMISSIONS, DEPARTMENTS, DESIGNATIONS, EMPLOYEE_TYPES, calculateGratuity } from '@/lib/constants';
import { ONBOARDING_DOCUMENTS, OFFBOARDING_CLEARANCES } from '@/lib/mockData';
import { Plus, Search, Mail, Phone, Edit2, Key, Filter, UserPlus, Trash2, Activity, FileCheck, CheckCircle, Circle, AlertCircle, FileText, Award, CheckCheck, UserMinus, ToggleLeft, ToggleRight } from 'lucide-react';

function EmployeesContent() {
    const { currentUser, users, customRoles, resetPassword, createUser, updateUser, deactivateUser, activateUser, deleteUser, updateOnboardingKYC, finalizeOnboarding, updateOffboardingClearance, addToast } = useApp();
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [showResetModal, setShowResetModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    // Lifecycle Management State
    const [selectedLifecycleEmp, setSelectedLifecycleEmp] = useState(null);
    const [lifecycleView, setLifecycleView] = useState('onboarding'); // 'onboarding' | 'offboarding'
    const [docs, setDocs] = useState({});
    const [clearances, setClearances] = useState({});
    const [resetSuccess, setResetSuccess] = useState(false);

    const lifecycleEmp = users.find(u => u.id === selectedLifecycleEmp);

    useEffect(() => {
        if (lifecycleEmp) {
            // Sync Onboarding Docs
            if (lifecycleEmp.onboarding_status) {
                setDocs(lifecycleEmp.onboarding_status);
            } else {
                setDocs(Object.fromEntries(ONBOARDING_DOCUMENTS.map(d => [d.id, false])));
            }
            // Sync Offboarding Clearances
            if (lifecycleEmp.offboarding_status) {
                setClearances(lifecycleEmp.offboarding_status);
            } else {
                setClearances(Object.fromEntries(OFFBOARDING_CLEARANCES.map(c => [c.id, false])));
            }
        }
    }, [lifecycleEmp]);

    const handleLifecycleDocChange = async (docId, checked) => {
        const newDocs = { ...docs, [docId]: checked };
        setDocs(newDocs);
        if (selectedLifecycleEmp) {
            await updateOnboardingKYC(selectedLifecycleEmp, newDocs);
        }
    };

    const handleLifecycleClearanceChange = async (clearanceId, checked) => {
        const newClearances = { ...clearances, [clearanceId]: checked };
        setClearances(newClearances);
        if (selectedLifecycleEmp) {
            await updateOffboardingClearance(selectedLifecycleEmp, newClearances);
        }
    };

    const handleFinalizeOnboarding = async () => {
        if (selectedLifecycleEmp) {
            await finalizeOnboarding(selectedLifecycleEmp);
            setSelectedLifecycleEmp(null);
            alert('Employee onboarding finalized. Status updated to Active.');
        }
    };

    const gratuity = (lifecycleEmp && lifecycleView === 'offboarding') ? calculateGratuity(lifecycleEmp.salary?.basic || 0, lifecycleEmp.joinDate) : null;
    const allDocsClear = ONBOARDING_DOCUMENTS.filter(d => d.required).every(d => docs[d.id]);

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

        const { success, error, user } = await createUser(userData);
        
        if (success) {
            setShowAddModal(false);
            setNewEmpForm({
                name: '', email: '', password: '', role: 'employee',
                department: 'Technical', designation: 'Developer Admin - Accounts', type: 'Confirm',
                joinDate: new Date().toISOString().split('T')[0],
                salaryBasic: '', salaryHra: '',
                phone: '', location: '', dob: '', gender: '', pan: '', managerId: ''
            });
            addToast("Employee created successfully!", "success", "✅");
            
            if (confirm("Would you like to start their Onboarding KYC now?")) {
                if (user?.id) {
                    setSelectedLifecycleEmp(user.id);
                    setLifecycleView('onboarding');
                }
            }
        } else {
            addToast("Error: " + error, "error", "❌");
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

    async function handleEditSubmit(e) {
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

        const { success, error } = await updateUser(showEditModal.id, updates);
        if (success) {
            setShowEditModal(null);
            addToast("Employee updated successfully!", "success", "✅");
        } else {
            addToast("Error updating employee: " + error, "error", "❌");
        }
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
                                                <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', color: emp.status === 'onboarding' ? '#10b981' : '#f43f5e' }} onClick={() => { setSelectedLifecycleEmp(emp.id); setLifecycleView(emp.status === 'onboarding' ? 'onboarding' : 'offboarding'); }} title="Manage Lifecycle (Onboarding/Offboarding)">
                                                    <Activity size={13} />
                                                </button>
                                                {canEdit && <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px' }} onClick={() => handleEditClick(emp)} title="Edit Employee"><Edit2 size={13} /></button>}
                                                {canResetPwd && (
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', color: '#fbbf24' }} onClick={() => setShowResetModal(emp)} title="Reset Password">
                                                        <Key size={13} />
                                                    </button>
                                                )}
                                                {canEdit && (
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', color: emp.status === 'inactive' ? 'var(--text-muted)' : '#f59e0b' }} 
                                                        onClick={async () => { 
                                                            if (emp.status === 'active') {
                                                                if(confirm(`Deactivate ${emp.name}? They will lose all system access.`)) {
                                                                    const { success } = await deactivateUser(emp.id);
                                                                    if (success) addToast(`${emp.name} deactivated`, "warning", "⚠️");
                                                                }
                                                            } else {
                                                                if(confirm(`Re-activate ${emp.name}?`)) {
                                                                    const { success } = await activateUser(emp.id);
                                                                    if (success) addToast(`${emp.name} re-activated`, "success", "✅");
                                                                }
                                                            }
                                                        }} 
                                                        title={emp.status === 'active' ? "Deactivate Account" : "Re-activate Account"}>
                                                        {emp.status === 'inactive' ? <ToggleLeft size={16} /> : <ToggleRight size={16} color="#10b981" />}
                                                    </button>
                                                )}
                                                {currentUser?.role === 'super_admin' && (
                                                    <button className="btn btn-ghost btn-sm" style={{ padding: '5px 8px', color: '#ef4444' }} onClick={async () => { 
                                                        if(confirm(`⚠️ WARNING: This will PERMANENTLY delete ${emp.name} and all their cloud data. \n\nAre you absolutely sure?`)) {
                                                            const { success, error } = await deleteUser(emp.id);
                                                            if (success) addToast("Employee deleted permanently", "error", "🗑️");
                                                            else addToast("Delete failed: " + error, "error", "❌");
                                                        }
                                                    }} title="HARD DELETE (Permanent)">
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
            {/* Lifecycle Management Modal */}
            {selectedLifecycleEmp && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedLifecycleEmp(null)}>
                    <div className="modal-box" style={{ maxWidth: 800 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div>
                                <h3 style={{ fontFamily: 'var(--font-display)' }}>Lifecycle: {lifecycleEmp?.name}</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{lifecycleEmp?.employeeId} • {lifecycleEmp?.designation}</p>
                            </div>
                            <div className="tabs" style={{ marginBottom: 0 }}>
                                <button className={`tab-btn ${lifecycleView === 'onboarding' ? 'active' : ''}`} onClick={() => setLifecycleView('onboarding')}>
                                    <UserPlus size={14} /> Onboarding
                                </button>
                                <button className={`tab-btn ${lifecycleView === 'offboarding' ? 'active' : ''}`} onClick={() => setLifecycleView('offboarding')}>
                                    <UserMinus size={14} /> Offboarding
                                </button>
                            </div>
                        </div>

                        {lifecycleView === 'onboarding' ? (
                            <div className="grid-2" style={{ gap: 24 }}>
                                <div className="card" style={{ padding: 20 }}>
                                    <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                        <FileCheck size={18} color="var(--brand-primary)" /> KYC Document Checklist
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {ONBOARDING_DOCUMENTS.map(doc => (
                                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: docs[doc.id] ? 'rgba(16,185,129,0.05)' : 'rgba(0,0,0,0.02)', border: '1px solid var(--border-subtle)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    {docs[doc.id] ? <CheckCircle size={16} color="#10b981" /> : <Circle size={16} color="var(--text-muted)" />}
                                                    <span style={{ fontSize: '0.85rem', fontWeight: docs[doc.id] ? 600 : 400 }}>{doc.name} {doc.required && <span style={{ color: '#ef4444' }}>*</span>}</span>
                                                </div>
                                                <input type="checkbox" checked={docs[doc.id] || false} onChange={(e) => handleLifecycleDocChange(doc.id, e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="card" style={{ padding: 20, marginBottom: 16 }}>
                                        <h4 style={{ marginBottom: 12 }}>Current Status</h4>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 'var(--radius-md)', background: lifecycleEmp?.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: lifecycleEmp?.status === 'active' ? '#059669' : '#d97706', fontSize: '0.85rem', fontWeight: 600 }}>
                                            {lifecycleEmp?.status === 'active' ? <CheckCheck size={18} /> : <AlertCircle size={18} />}
                                            {lifecycleEmp?.status === 'active' ? 'Professionally Active' : 'Onboarding in Progress'}
                                        </div>
                                    </div>
                                    {lifecycleEmp?.status !== 'active' && (
                                        <div className="card" style={{ padding: 20, border: '1px solid var(--brand-primary-subtle)', background: 'linear-gradient(to bottom right, #fff, var(--bg-hover))' }}>
                                            <h4 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Award size={18} color="var(--brand-primary)" /> Ready to Finalize?
                                            </h4>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                                                Once all mandatory documents are verified, you can activate the profile.
                                            </p>
                                            <button className="btn btn-primary" style={{ width: '100%' }} disabled={!allDocsClear} onClick={handleFinalizeOnboarding}>
                                                Finalize & Activate
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="grid-2" style={{ gap: 24 }}>
                                <div className="card" style={{ padding: 20 }}>
                                    <h4 style={{ marginBottom: 16 }}>Department Clearances</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {OFFBOARDING_CLEARANCES.map(c => (
                                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
                                                <span style={{ fontSize: '0.85rem' }}>{c.item}</span>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className={`btn ${clearances[c.id] ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => handleLifecycleClearanceChange(c.id, !clearances[c.id])}>
                                                        {clearances[c.id] ? 'Cleared' : 'Mark Clear'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="card" style={{ padding: 20 }}>
                                    <h4 style={{ marginBottom: 16 }}>F&F Settlement (Preview)</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Unpaid Salary:</span>
                                            <span style={{ fontWeight: 600 }}>₹{lifecycleEmp?.salary?.gross?.toLocaleString() || 0}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Gratuity Eli.:</span>
                                            <span style={{ color: gratuity?.eligible ? '#10b981' : '#f43f5e', fontWeight: 600 }}>{gratuity?.eligible ? 'YES' : 'NO'}</span>
                                        </div>
                                        {gratuity?.eligible && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>Gratuity Amt:</span>
                                                <span style={{ fontWeight: 600 }}>₹{gratuity.amount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: '1rem' }}>
                                            <span style={{ fontWeight: 700 }}>Total Payout:</span>
                                            <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>₹{( (lifecycleEmp?.salary?.gross || 0) + (gratuity?.amount || 0) ).toLocaleString()}</span>
                                        </div>
                                    </div>
                                    <button className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} disabled>
                                        Initiate Settlement
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                            <button className="btn btn-ghost" onClick={() => setSelectedLifecycleEmp(null)}>Close Management</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmployeesPage() {
    return <DashboardLayout title="Employee Directory"><EmployeesContent /></DashboardLayout>;
}
