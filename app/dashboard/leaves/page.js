'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { LEAVE_TYPES, APPROVAL_WORKFLOWS, applySandwichRule, PERMISSIONS } from '@/lib/constants';
import { can } from '@/lib/rbac';
import { Plus, Calendar, Info, CheckCircle, XCircle, Clock } from 'lucide-react';

function LeavesContent() {
    const { currentUser, users, leaveRequests, leaveBalances, applyLeave, approveLeave, rejectLeave, adjustLeaveBalance, customRoles } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [showAdjust, setShowAdjust] = useState(false);
    const [activeTab, setActiveTab] = useState('my');
    const [form, setForm] = useState({ type: 'casual', from: '', to: '', reason: '' });
    const [adjustForm, setAdjustForm] = useState({ userId: '', type: 'CL', amount: '', reason: '' });
    const [sandwichInfo, setSandwichInfo] = useState(0);

    const canApprove = can(currentUser, PERMISSIONS.APPROVE_LEAVE, customRoles);
    const canViewAll = can(currentUser, PERMISSIONS.VIEW_ALL_LEAVES, customRoles);
    const canManagePolicy = can(currentUser, PERMISSIONS.MANAGE_LEAVE_POLICY, customRoles);

    const isManager = currentUser?.role === 'manager';
    const myBalance = leaveBalances.find(b => b.userId === currentUser?.id);
    
    // Filter by hierarchy for managers
    const teamUserIds = users.filter(u => u.reportingTo === currentUser?.id).map(u => u.id);
    
    const myLeaves = leaveRequests.filter(l => l.employeeId === currentUser?.id);
    
    let allLeaves = leaveRequests;
    if (isManager && !canViewAll) {
        allLeaves = leaveRequests.filter(l => teamUserIds.includes(l.employeeId));
    } else if (!canViewAll) {
        allLeaves = myLeaves;
    }

    const pendingLeaves = allLeaves.filter(l => l.status === 'pending');

    function calcDays(from, to) {
        if (!from || !to) return 0;
        const d1 = new Date(from), d2 = new Date(to);
        if (d2 < d1) return 0;
        
        // Use calendar days inclusive
        const diffTime = Math.abs(d2 - d1);
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return days;
    }

    function handleDateChange(field, val) {
        const updated = { ...form, [field]: val };
        setForm(updated);
        if (updated.from && updated.to && new Date(updated.from) <= new Date(updated.to)) {
            const extra = applySandwichRule(updated.from, updated.to);
            setSandwichInfo(extra);
        }
    }

    async function handleSubmitLeave(e) {
        e.preventDefault();
        const days = calcDays(form.from, form.to);
        const result = await applyLeave({ ...form, days, employeeId: currentUser.id, approverId: currentUser.reportingTo || 'USR004' });
        if (result) {
            setShowForm(false);
            setForm({ type: 'CL', from: '', to: '', reason: '' });
            setSandwichInfo(0);
        }
    }

    function getEmpName(id) { return users.find(u => u.id === id)?.name || id; }

    function handleAdjustSubmit(e) {
        e.preventDefault();
        adjustLeaveBalance(adjustForm.userId, adjustForm.type, Number(adjustForm.amount), adjustForm.reason);
        setShowAdjust(false);
        setAdjustForm({ userId: '', type: 'CL', amount: '', reason: '' });
    }

    const displayLeaves = activeTab === 'my' ? myLeaves : activeTab === 'pending' ? pendingLeaves : allLeaves;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Leave Management</h1>
                    <p className="page-subtitle">Apply, track, and approve leaves</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {canManagePolicy && <button className="btn btn-secondary" onClick={() => setShowAdjust(true)}><Calendar size={16} /> Adjust Balances</button>}
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Apply Leave</button>
                </div>
            </div>

            {/* Leave Balance Cards */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                {LEAVE_TYPES.filter(lt => !lt.applicableGender || lt.applicableGender === currentUser?.gender).map(lt => {
                    const val = myBalance ? (myBalance[lt.id] ?? myBalance[lt.id.toLowerCase()]) : (lt.maxPerYear || 0);
                    return (
                        <div key={lt.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', minWidth: 120, backdropFilter: 'blur(20px)', flex: '1 1 100px' }}>
                            <div style={{ fontSize: '0.68rem', color: lt.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{lt.id}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{val}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{lt.name}</div>
                        </div>
                    );
                })}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
                <div className="tabs">
                    <button className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>My Leaves</button>
                    {canApprove && <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending ({pendingLeaves.length})</button>}
                    {canViewAll && <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Leaves</button>}
                    {(canViewAll || canManagePolicy) && (
                        <button className={`tab-btn ${activeTab === 'balances' ? 'active' : ''}`} onClick={() => setActiveTab('balances')}>
                            Employee Balances
                        </button>
                    )}
                </div>
            </div>

            {/* Leave Table / Balances View */}
            {activeTab === 'balances' ? (
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    {LEAVE_TYPES.map(lt => <th key={lt.id}>{lt.id}</th>)}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                 {users.filter(u => u.status !== 'retired').map(u => {
                                    const bal = leaveBalances.find(b => b.userId === u.id);
                                    return (
                                        <tr key={u.id}>
                                            <td>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.displayId}</div>
                                            </td>
                                            {LEAVE_TYPES.map(lt => {
                                                const val = bal ? (bal[lt.id] ?? bal[lt.id.toLowerCase()]) : (lt.maxPerYear || 0);
                                                return (
                                                    <td key={lt.id} style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                                        {val}
                                                    </td>
                                                );
                                            })}
                                            <td>
                                                <button className="btn btn-ghost btn-sm" onClick={() => {
                                                    setAdjustForm(f => ({ ...f, userId: u.id }));
                                                    setShowAdjust(true);
                                                }}>Adjust</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0 }}>
                    <div className="table-wrapper" style={{ boxShadow: 'none' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {canViewAll && <th>Employee</th>}
                                    <th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th>
                                    {canApprove && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {displayLeaves.length === 0 ? (
                                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No leave records found.</td></tr>
                                ) : displayLeaves.map(lr => (
                                    <tr key={lr.id}>
                                        {canViewAll && <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{getEmpName(lr.employeeId)}</td>}
                                        <td><span className="badge badge-primary">{lr.type}</span></td>
                                        <td style={{ fontSize: '0.85rem' }}>{lr.from}</td>
                                        <td style={{ fontSize: '0.85rem' }}>{lr.to}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--brand-primary-light)' }}>{lr.days}</td>
                                        <td style={{ fontSize: '0.82rem', maxWidth: 200 }}>{lr.reason}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                <span className={`status-pill status-${lr.status}`}>{lr.status}</span>
                                                    {lr.status === 'pending' && (
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                            {lr.current_level === 2 
                                                                ? `Awaiting ${users.find(u => u.id === lr.level2_approver_id)?.name || 'Functional Manager'}'s Approval` 
                                                                : `Awaiting ${users.find(u => u.id === lr.level1_approver_id)?.name || 'Reporting Manager'}'s Approval`}
                                                        </span>
                                                    )}
                                            </div>
                                        </td>
                                        {canApprove && lr.status === 'pending' && (() => {
                                            const isL1 = lr.current_level === 1 && lr.level1_approver_id === currentUser.id;
                                            const isL2 = lr.current_level === 2 && lr.level2_approver_id === currentUser.id;
                                            const isSuper = currentUser.role === 'super_admin';
                                            const totalLevels = lr.level2_approver_id ? 2 : 1;
                                            
                                            if (!isL1 && !isL2 && !isSuper) return <td />;
                                            
                                            return (
                                                <td>
                                                    <div style={{ display: 'flex', gap: 6 }}>
                                                        <button className="btn btn-success btn-sm" title={`Approve L${lr.current_level}`} onClick={() => approveLeave(lr.id, currentUser.id, 'Approved', lr.current_level, totalLevels)}><CheckCircle size={13} /></button>
                                                        <button className="btn btn-danger btn-sm" title="Reject" onClick={() => rejectLeave(lr.id, currentUser.id, 'Rejected')}><XCircle size={13} /></button>
                                                    </div>
                                                </td>
                                            );
                                        })()}
                                        {canApprove && lr.status !== 'pending' && <td />}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Apply Leave Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>Apply for Leave</h3>
                        <form onSubmit={handleSubmitLeave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Leave Type</label>
                                <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                    {LEAVE_TYPES.filter(lt => !lt.applicableGender || lt.applicableGender === currentUser?.gender).map(lt => {
                                        const bal = myBalance ? (myBalance[lt.id] ?? myBalance[lt.id.toLowerCase()] ?? lt.maxPerYear ?? 0) : (lt.maxPerYear || 0);
                                        const isWFH = lt.id === 'WFH';
                                        return (
                                            <option key={lt.id} value={lt.id} disabled={!isWFH && bal <= 0}>
                                                {lt.name} ({lt.id}){isWFH ? '' : ` — ${bal} day${bal !== 1 ? 's' : ''} left`}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            {(() => {
                                const lt = LEAVE_TYPES.find(l => l.id === form.type);
                                const isWFH = form.type === 'WFH';
                                const bal = !isWFH && myBalance ? (myBalance[form.type] ?? myBalance[form.type?.toLowerCase()] ?? lt?.maxPerYear ?? 0) : null;
                                const requestedDays = calcDays(form.from, form.to);
                                if (isWFH) return null;
                                if (bal !== null && bal <= 0) return (
                                    <div className="alert" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                                        <span style={{ fontSize: '1rem' }}>⛔</span>
                                        <span><strong>No balance left</strong> — You have <strong>0</strong> {form.type} days remaining. Please choose a different leave type or contact HR.</span>
                                    </div>
                                );
                                if (bal !== null && requestedDays > bal) return (
                                    <div className="alert alert-warning">
                                        <Info size={15} style={{ flexShrink: 0 }} />
                                        <span><strong>Insufficient balance:</strong> You are requesting <strong>{requestedDays}</strong> days but only have <strong>{bal}</strong> {form.type} day{bal !== 1 ? 's' : ''} left.</span>
                                    </div>
                                );
                                if (bal !== null) return (
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                                        Available {form.type} balance: <strong style={{ color: '#10b981' }}>{bal} day{bal !== 1 ? 's' : ''}</strong>
                                    </div>
                                );
                                return null;
                            })()}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">From Date</label>
                                    <input type="date" className="form-input" value={form.from} onChange={e => handleDateChange('from', e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">To Date</label>
                                    <input type="date" className="form-input" value={form.to} onChange={e => handleDateChange('to', e.target.value)} required />
                                </div>
                            </div>
                            {sandwichInfo > 0 && (
                                <div className="alert alert-warning">
                                    <Info size={15} style={{ flexShrink: 0 }} />
                                    <span><strong>Sandwich Rule Applied:</strong> {sandwichInfo} weekend day(s) will be counted as leave days per company policy.</span>
                                </div>
                            )}
                            {form.from && form.to && (
                                <div className="alert alert-info">
                                    <Calendar size={15} style={{ flexShrink: 0 }} /> Working days requested: <strong>{calcDays(form.from, form.to)}</strong>
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Reason</label>
                                <textarea className="form-textarea" placeholder="Please provide a reason for your leave..." value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} required />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={(() => {
                                        const isWFH = form.type === 'WFH';
                                        if (isWFH) return false;
                                        const bal = myBalance ? (myBalance[form.type] ?? myBalance[form.type?.toLowerCase()] ?? 0) : 0;
                                        return bal <= 0;
                                    })()}
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adjust Balance Modal */}
            {showAdjust && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAdjust(false)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>Adjust Leave Balance</h3>
                        <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Select Employee</label>
                                <select className="form-select" value={adjustForm.userId} onChange={e => setAdjustForm(f => ({ ...f, userId: e.target.value }))} required>
                                    <option value="">Choose an employee...</option>
                                    {users.filter(u => u.id !== currentUser.id).map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.displayId})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">Leave Type</label>
                                    <select className="form-select" value={adjustForm.type} onChange={e => setAdjustForm(f => ({ ...f, type: e.target.value }))}>
                                        {(() => {
                                            const sel = users.find(u => u.id === adjustForm.userId);
                                            return LEAVE_TYPES.filter(lt => !sel || !lt.applicableGender || lt.applicableGender === sel.gender).map(lt => (
                                                <option key={lt.id} value={lt.id}>{lt.name}</option>
                                            ));
                                        })()}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Adjustment (+/-)</label>
                                    <input type="number" className="form-input" placeholder="e.g. 5 or -2" value={adjustForm.amount} onChange={e => setAdjustForm(f => ({ ...f, amount: e.target.value }))} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reason for Adjustment</label>
                                <textarea className="form-textarea" placeholder="e.g. Anniversary credit, correction of error..." value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} required />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowAdjust(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Update Balance</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LeavesPage() {
    return <DashboardLayout title="Leave Management"><LeavesContent /></DashboardLayout>;
}
