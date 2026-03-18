'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { LEAVE_TYPES, APPROVAL_WORKFLOWS, applySandwichRule } from '@/lib/mockData';
import { can } from '@/lib/rbac';
import { PERMISSIONS } from '@/lib/mockData';
import { Plus, Calendar, Info, CheckCircle, XCircle, Clock } from 'lucide-react';

function LeavesContent() {
    const { currentUser, users, leaveRequests, leaveBalances, applyLeave, approveLeave, rejectLeave } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [activeTab, setActiveTab] = useState('my');
    const [form, setForm] = useState({ type: 'CL', from: '', to: '', reason: '' });
    const [sandwichInfo, setSandwichInfo] = useState(0);

    const canApprove = can(currentUser, PERMISSIONS.APPROVE_LEAVE);
    const canViewAll = can(currentUser, PERMISSIONS.VIEW_ALL_LEAVES);

    const myBalance = leaveBalances.find(b => b.userId === currentUser?.id);
    const myLeaves = leaveRequests.filter(l => l.employeeId === currentUser?.id);
    const allLeaves = canViewAll ? leaveRequests : myLeaves;
    const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');

    function calcDays(from, to) {
        if (!from || !to) return 0;
        const d1 = new Date(from), d2 = new Date(to);
        let days = 0;
        let cur = new Date(d1);
        while (cur <= d2) {
            const day = cur.getDay();
            if (day !== 0 && day !== 6) days++;
            cur.setDate(cur.getDate() + 1);
        }
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

    function handleSubmitLeave(e) {
        e.preventDefault();
        const days = calcDays(form.from, form.to);
        applyLeave({ ...form, days, employeeId: currentUser.id, approverId: currentUser.reportingTo || 'USR004' });
        setShowForm(false);
        setForm({ type: 'CL', from: '', to: '', reason: '' });
        setSandwichInfo(0);
    }

    function getEmpName(id) { return users.find(u => u.id === id)?.name || id; }

    const displayLeaves = activeTab === 'my' ? myLeaves : activeTab === 'pending' ? pendingLeaves : allLeaves;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Leave Management</h1>
                    <p className="page-subtitle">Apply, track, and approve leaves</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Apply Leave</button>
            </div>

            {/* Leave Balance Cards */}
            {myBalance && (
                <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                    {LEAVE_TYPES.slice(0, 5).map(lt => (
                        <div key={lt.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', minWidth: 120, backdropFilter: 'blur(20px)', flex: '1 1 100px' }}>
                            <div style={{ fontSize: '0.68rem', color: lt.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{lt.id}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{myBalance[lt.id] ?? '—'}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{lt.name}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
                <div className="tabs">
                    <button className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>My Leaves</button>
                    {canApprove && <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending ({pendingLeaves.length})</button>}
                    {canViewAll && <button className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Leaves</button>}
                </div>
            </div>

            {/* Leave Table */}
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
                                    <td><span className={`status-pill status-${lr.status}`}>{lr.status}</span></td>
                                    {canApprove && lr.status === 'pending' && (
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button className="btn btn-success btn-sm" onClick={() => approveLeave(lr.id, currentUser.id, 'Approved', 1, lr.days > 3 ? 2 : 1)}><CheckCircle size={13} /></button>
                                                <button className="btn btn-danger btn-sm" onClick={() => rejectLeave(lr.id, currentUser.id, 'Rejected')}><XCircle size={13} /></button>
                                            </div>
                                        </td>
                                    )}
                                    {canApprove && lr.status !== 'pending' && <td />}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Apply Leave Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>Apply for Leave</h3>
                        <form onSubmit={handleSubmitLeave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Leave Type</label>
                                <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                                    {LEAVE_TYPES.map(lt => <option key={lt.id} value={lt.id}>{lt.name} ({lt.id})</option>)}
                                </select>
                            </div>
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
                                <button type="submit" className="btn btn-primary">Submit Request</button>
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
