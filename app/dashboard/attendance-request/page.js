'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { can } from '@/lib/rbac';
import { PERMISSIONS, LEAVE_TYPES } from '@/lib/constants';
import { 
    Clock, Calendar, History, Edit, Navigation, 
    Home, Award, CheckCircle, Search, 
    ChevronRight, MapPin, UserPlus
} from 'lucide-react';

export default function AttendanceRequestPage() {
    return <DashboardLayout title="Attendance Request"><AttendanceRequestContent /></DashboardLayout>;
}

function AttendanceRequestContent() {
    const { 
        currentUser, users, attendance, leaveRequests, leaveBalances, 
        regularizations, applyLeave, requestRegularization,
        countWorkingDays, isWorkingDay
    } = useApp();

    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'requests');
    
    // Request Modals
    const [showRequestModal, setShowRequestModal] = useState(null); 
    const [regForm, setRegForm] = useState({ date: '', correctionType: 'missing_in', reason: '', punchIn: '', punchOut: '' });
    const [leaveForm, setLeaveForm] = useState({ type: 'CL', from: '', to: '', reason: '', halfDay: false });
    const [odForm, setOdForm] = useState({ from: '', to: '', reason: '', location: '' });
    const [wfhForm, setWfhForm] = useState({ from: '', to: '', reason: '' });
    const [compoffForm, setCompoffForm] = useState({ date: '', reason: '', hours: '8' });
    
    const [isSubmitting, setIsSubmitting] = useState(false);

    const myAttendance = attendance.filter(a => a.userId === currentUser?.id);
    const myBalance = leaveBalances.find(b => b.userId === currentUser?.id);

    const unifiedHistory = [
        ...leaveRequests.filter(l => l.employeeId === currentUser?.id).map(l => {
            const type = l.type?.toUpperCase();
            let category = 'Leave';
            let icon = Calendar;
            let color = '#6366f1';

            if (type === 'OD') { category = 'On-Duty'; icon = Navigation; color = '#06b6d4'; }
            else if (type === 'WFH') { category = 'WFH'; icon = Home; color = '#8b5cf6'; }
            else if (type === 'COMPOFF_CREDIT') { category = 'Comp-Off'; icon = Award; color = '#10b981'; }

            return { ...l, category, icon, color };
        }),
        ...regularizations.filter(r => r.employeeId === currentUser?.id).map(r => ({ ...r, category: 'Regularization', icon: Edit, color: '#f59e0b', type: r.correctionType })),
    ].sort((a, b) => new Date(b.appliedOn || b.timestamp || 0) - new Date(a.appliedOn || a.timestamp || 0));

    // Submit Handlers
    async function handleLeaveSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const days = leaveForm.halfDay ? 0.5 : countWorkingDays(leaveForm.from, leaveForm.to);
            
            // Validate Comp-Off Balance
            if (leaveForm.type === 'COMPOFF') {
                const balance = myBalance?.compoff || 0;
                if (balance < days) {
                    alert(`Insufficient Comp-Off balance. You have ${balance} days left.`);
                    return;
                }
            }

            const res = await applyLeave({ ...leaveForm, days });
            if (res) {
                setShowRequestModal(null);
                setLeaveForm({ type: 'CL', from: '', to: '', reason: '', halfDay: false });
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleRegSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await requestRegularization({ ...regForm, employeeId: currentUser.id });
            if (res) {
                setShowRequestModal(null);
                setRegForm({ date: '', correctionType: 'missing_in', reason: '', punchIn: '', punchOut: '' });
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleOdSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const days = countWorkingDays(odForm.from, odForm.to);
            const res = await applyLeave({ type: 'OD', from: odForm.from, to: odForm.to, reason: `[OD at ${odForm.location}] ${odForm.reason}`, days });
            if (res) {
                setShowRequestModal(null);
                setOdForm({ from: '', to: '', reason: '', location: '' });
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleWfhSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const days = countWorkingDays(wfhForm.from, wfhForm.to);
            const res = await applyLeave({ type: 'WFH', from: wfhForm.from, to: wfhForm.to, reason: wfhForm.reason, days });
            if (res) {
                setShowRequestModal(null);
                setWfhForm({ from: '', to: '', reason: '' });
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleCompoffSubmit(e) {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // 1. Validate if it's a Holiday/WO
            if (isWorkingDay(compoffForm.date)) {
                alert("Comp-Off can only be claimed for working on a Holiday or Weekly Off.");
                return;
            }

            // 2. Validate if the employee was Present (had punches)
            const dayAtt = attendance.find(a => a.userId === currentUser.id && a.date === compoffForm.date);
            if (!dayAtt || !dayAtt.punchIn || !dayAtt.punchOut) {
                alert("No attendance record found for this date. You must be present to claim Comp-Off.");
                return;
            }

            const res = await applyLeave({ 
                type: 'COMPOFF_CREDIT', 
                from: compoffForm.date, 
                to: compoffForm.date, 
                reason: compoffForm.reason, 
                days: 1 
            });
            if (res) {
                setShowRequestModal(null);
                setCompoffForm({ date: '', reason: '', hours: '8' });
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance Request</h1>
                    <p className="page-subtitle">Manage all your attendance-related applications in one place</p>
                </div>
            </div>

            <div className="tabs" style={{ marginBottom: 28 }}>
                <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
                    <UserPlus size={13} style={{ marginRight: 6 }} /> Attendance Request
                </button>
                <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                    <History size={13} style={{ marginRight: 6 }} /> My History
                </button>
            </div>

            {activeTab === 'requests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        {/* Attendance Regularization Tile */}
                        <div className="stat-card" onClick={() => setShowRequestModal('regularization')}
                            style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 28, cursor: 'pointer', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', transition: 'all 0.2s' }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(245,158,11,0.12)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Edit size={28} color="#f59e0b" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>Attendance Regularization</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>Missed a punch or arrived late? Correct your attendance logs here.</p>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{regularizations.filter(r => r.employeeId === currentUser.id && r.status === 'pending').length} Pending Requests</span>
                                </div>
                                <ChevronRight size={18} color="#f59e0b" />
                            </div>
                        </div>

                        {/* OD Tile */}
                        <div className="stat-card" onClick={() => setShowRequestModal('od')}
                            style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 28, cursor: 'pointer', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', transition: 'all 0.2s' }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(6,182,212,0.12)'; e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Navigation size={28} color="#06b6d4" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>On-Duty (OD)</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>Official visits, client meetings, or field work outside the office.</p>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Unlimited Policy</span>
                                </div>
                                <ChevronRight size={18} color="#06b6d4" />
                            </div>
                        </div>

                        {/* WFH Tile */}
                        <div className="stat-card" onClick={() => setShowRequestModal('wfh')}
                            style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 28, cursor: 'pointer', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', transition: 'all 0.2s' }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(139,92,246,0.12)'; e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Home size={28} color="#8b5cf6" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>Work From Home</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>Request to work remotely for personal comfort or emergencies.</p>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Balance: {myBalance?.wfh || 0} Days</span>
                                </div>
                                <ChevronRight size={18} color="#8b5cf6" />
                            </div>
                        </div>

                        {/* Comp-Off Tile */}
                        <div className="stat-card" onClick={() => setShowRequestModal('compoff')}
                            style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 28, cursor: 'pointer', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', transition: 'all 0.2s' }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(16,185,129,0.12)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}>
                            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Award size={28} color="#10b981" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>Earn Comp-Off Credit</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>Worked on a holiday? Claim your compensatory credit here to use as leave later.</p>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{myBalance?.compoff || 0} Earned Credits Available</span>
                                </div>
                                <ChevronRight size={18} color="#10b981" />
                            </div>
                        </div>

                        {/* Leave Tile */}
                        <div className="stat-card" onClick={() => setShowRequestModal('leave')}
                            style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 28, cursor: 'pointer', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', transition: 'all 0.2s', gridColumn: 'span 2' }}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.12)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = ''; }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Calendar size={28} color="#6366f1" />
                                </div>
                                <div style={{ display: 'flex', gap: 12 }}>
                                    {[
                                        { id: 'CL', color: '#10b981' },
                                        { id: 'SL', color: '#ef4444' },
                                        { id: 'EL', color: '#6366f1' },
                                        { id: 'COMPOFF', label: 'CO', color: '#10b981' }
                                    ].map(lt => (
                                        <div key={lt.id} style={{ textAlign: 'center', padding: '8px 16px', background: 'var(--bg-glass)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{lt.label || lt.id}</div>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 2 }}>{myBalance ? (myBalance[lt.id] || 0) : 0}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>Apply for Leave</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>Official leaves for vacation, health, or personal matters. Planned or emergency.</p>
                            </div>
                            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    Open Leave Portal <ChevronRight size={16} />
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-glass)' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Activity</h3>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Track your latest applications and their status</p>
                            </div>
                            <div style={{ position: 'relative', width: 260 }}>
                                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="Filter requests..." className="form-input" style={{ paddingLeft: 38, height: 38, fontSize: '0.85rem', borderRadius: 10 }} />
                            </div>
                        </div>
                        <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                            <table className="data-table">
                                <thead><tr><th>Category</th><th>Request Type</th><th>Dates</th><th>Details</th><th>Status</th></tr></thead>
                                <tbody>
                                    {unifiedHistory.slice(0, 8).map((h, i) => (
                                        <tr key={i}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: 6, background: `${h.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h.icon size={14} color={h.color} /></div>
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{h.category}</span>
                                                </div>
                                            </td>
                                            <td><span className="badge badge-primary" style={{ fontSize: '0.68rem', background: `${h.color}10`, color: h.color }}>{h.type || h.workflow || 'Request'}</span></td>
                                            <td style={{ fontSize: '0.82rem' }}>{h.from_date || h.date} {h.to_date ? `– ${h.to_date}` : ''}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 200, truncate: true }}>{h.reason}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <span className={`status-pill status-${h.status}`}>{h.status}</span>
                                                    
                                                    {h.status === 'pending' && (
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                            L{h.current_level || 1} Pending: {(() => {
                                                                const approverId = h.current_level === 2 ? h.level2_approver_id : h.level1_approver_id;
                                                                const approver = users.find(u => u.id === approverId);
                                                                return approver?.name || 'Manager';
                                                            })()}
                                                        </div>
                                                    )}

                                                    {h.status === 'approved' && h.approvals && h.approvals.length > 0 && (
                                                        <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 500 }}>
                                                            Approved by: {h.approvals.map(a => a.approverName || users.find(u => u.id === (a.approverId || a.approvedBy))?.name).filter(Boolean).join(', ')}
                                                        </div>
                                                    )}

                                                    {h.status === 'rejected' && (
                                                        <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 500 }}>
                                                            Rejected by: {(() => {
                                                                const rejection = h.approvals?.find(a => a.status === 'rejected' || a.approvedBy);
                                                                return rejection?.approverName || users.find(u => u.id === (rejection?.approverId || rejection?.approvedBy))?.name || 'Manager';
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {unifiedHistory.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No recent requests found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {/* Request History */}
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-glass)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Request History</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Detailed log of all your applications and their approval status</p>
                        </div>
                        <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                            <table className="data-table">
                                <thead><tr><th>Category</th><th>Type</th><th>Dates</th><th>Details</th><th>Status</th></tr></thead>
                                <tbody>
                                    {unifiedHistory.map((h, i) => (
                                        <tr key={i}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 28, height: 28, borderRadius: 6, background: `${h.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><h.icon size={14} color={h.color} /></div>
                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{h.category}</span>
                                                </div>
                                            </td>
                                            <td><span className="badge badge-primary" style={{ fontSize: '0.68rem', background: `${h.color}10`, color: h.color }}>{h.type || h.workflow || 'Request'}</span></td>
                                            <td style={{ fontSize: '0.82rem' }}>{h.from_date || h.date} {h.to_date ? `– ${h.to_date}` : ''}</td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 250 }}>{h.reason}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <span className={`status-pill status-${h.status}`}>{h.status}</span>
                                                    
                                                    {h.status === 'pending' && (
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                                            L{h.current_level || 1} Pending: {(() => {
                                                                const approverId = h.current_level === 2 ? h.level2_approver_id : h.level1_approver_id;
                                                                const approver = users.find(u => u.id === approverId);
                                                                return approver?.name || 'Manager';
                                                            })()}
                                                        </div>
                                                    )}

                                                    {h.status === 'approved' && h.approvals && h.approvals.length > 0 && (
                                                        <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 500 }}>
                                                            Approved by: {h.approvals.map(a => a.approverName || users.find(u => u.id === (a.approverId || a.approvedBy))?.name).filter(Boolean).join(', ')}
                                                        </div>
                                                    )}

                                                    {h.status === 'rejected' && (
                                                        <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 500 }}>
                                                            Rejected by: {(() => {
                                                                const rejection = h.approvals?.find(a => a.status === 'rejected' || a.approvedBy);
                                                                return rejection?.approverName || users.find(u => u.id === (rejection?.approverId || rejection?.approvedBy))?.name || 'Manager';
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {unifiedHistory.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No requests found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Attendance Logs */}
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-glass)' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Attendance Logs</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Your actual daily punch records and calculated hours</p>
                        </div>
                        <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                            <table className="data-table">
                                <thead><tr><th>Date</th><th>Status</th><th>In</th><th>Out</th><th>Location</th><th>Hours</th></tr></thead>
                                <tbody>
                                    {myAttendance.slice().reverse().map(a => (
                                        <tr key={a.id}>
                                            <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.date}</td>
                                            <td><span className={`status-pill status-${a.status}`}>{a.status}</span></td>
                                            <td style={{ fontSize: '0.85rem' }}>{a.punchIn || '--:--'}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{a.punchOut || '--:--'}</td>
                                            <td style={{ fontSize: '0.82rem' }}>{a.location || 'office'}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--brand-primary-light)', fontSize: '0.85rem' }}>
                                                {a.punchIn && a.punchOut ? (() => { 
                                                    const [ih, im] = a.punchIn.split(':').map(Number); 
                                                    const [oh, om] = a.punchOut.split(':').map(Number); 
                                                    const diff = (oh * 60 + om) - (ih * 60 + im); 
                                                    return `${Math.floor(diff / 60)}h ${diff % 60}m`; 
                                                })() : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals remain same as before but without camera */}
            {showRequestModal === 'leave' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRequestModal(null)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 20 }}>Apply for Leave</h3>
                        <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Leave Type</label>
                                <select className="form-select" value={leaveForm.type} onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value }))}>
                                    {LEAVE_TYPES.filter(lt => lt.id !== 'WFH' && lt.id !== 'OD' && lt.id !== 'COMPOFF_CREDIT').map(lt => (
                                        <option key={lt.id} value={lt.id}>{lt.name} ({myBalance ? (myBalance[lt.id] || 0) : 0} left)</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group"><label className="form-label">From</label><input type="date" className="form-input" value={leaveForm.from} onChange={e => setLeaveForm(f => ({ ...f, from: e.target.value }))} required /></div>
                                <div className="form-group"><label className="form-label">To</label><input type="date" className="form-input" value={leaveForm.to} onChange={e => setLeaveForm(f => ({ ...f, to: e.target.value }))} required /></div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reason</label>
                                <textarea className="form-textarea" value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} required placeholder="Why are you taking leave?" />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowRequestModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Apply Leave'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showRequestModal === 'regularization' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRequestModal(null)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 20 }}>Attendance Regularization</h3>
                        <form onSubmit={handleRegSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                             <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={regForm.date} onChange={e => setRegForm(f => ({ ...f, date: e.target.value }))} required /></div>
                             <div className="form-group">
                                <label className="form-label">Correction Type</label>
                                <select className="form-select" value={regForm.correctionType} onChange={e => setRegForm(f => ({ ...f, correctionType: e.target.value }))}>
                                    <option value="missing_in">Missing Punch In</option>
                                    <option value="missing_out">Missing Punch Out</option>
                                    <option value="both">Both Missing</option>
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group"><label className="form-label">Punch In</label><input type="time" className="form-input" value={regForm.punchIn} onChange={e => setRegForm(f => ({ ...f, punchIn: e.target.value }))} /></div>
                                <div className="form-group"><label className="form-label">Punch Out</label><input type="time" className="form-input" value={regForm.punchOut} onChange={e => setRegForm(f => ({ ...f, punchOut: e.target.value }))} /></div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reason</label>
                                <textarea className="form-textarea" value={regForm.reason} onChange={e => setRegForm(f => ({ ...f, reason: e.target.value }))} required placeholder="Why is this correction needed?" />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowRequestModal(null)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Request'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showRequestModal === 'od' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRequestModal(null)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 20 }}>On-Duty (OD) Application</h3>
                        <form onSubmit={handleOdSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group"><label className="form-label">From</label><input type="date" className="form-input" value={odForm.from} onChange={e => setOdForm(f => ({ ...f, from: e.target.value }))} required /></div>
                                <div className="form-group"><label className="form-label">To</label><input type="date" className="form-input" value={odForm.to} onChange={e => setOdForm(f => ({ ...f, to: e.target.value }))} required /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Visit Location</label><input type="text" className="form-input" value={odForm.location} onChange={e => setOdForm(f => ({ ...f, location: e.target.value }))} required placeholder="Client site, field office, etc." /></div>
                            <div className="form-group"><label className="form-label">Reason</label><textarea className="form-textarea" value={odForm.reason} onChange={e => setOdForm(f => ({ ...f, reason: e.target.value }))} required /></div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button type="button" className="btn btn-ghost" onClick={() => setShowRequestModal(null)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={isSubmitting}>Submit OD Request</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showRequestModal === 'wfh' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRequestModal(null)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 20 }}>Work From Home Request</h3>
                        <form onSubmit={handleWfhSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group"><label className="form-label">From</label><input type="date" className="form-input" value={wfhForm.from} onChange={e => setWfhForm(f => ({ ...f, from: e.target.value }))} required /></div>
                                <div className="form-group"><label className="form-label">To</label><input type="date" className="form-input" value={wfhForm.to} onChange={e => setWfhForm(f => ({ ...f, to: e.target.value }))} required /></div>
                            </div>
                            <div className="form-group"><label className="form-label">Reason</label><textarea className="form-textarea" value={wfhForm.reason} onChange={e => setWfhForm(f => ({ ...f, reason: e.target.value }))} required /></div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button type="button" className="btn btn-ghost" onClick={() => setShowRequestModal(null)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={isSubmitting}>Submit WFH Request</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showRequestModal === 'compoff' && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRequestModal(null)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 20 }}>Comp-Off Credit Request</h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>Request credit for working on a holiday or weekly off.</p>
                        <form onSubmit={handleCompoffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="form-group"><label className="form-label">Date Worked</label><input type="date" className="form-input" value={compoffForm.date} onChange={e => setCompoffForm(f => ({ ...f, date: e.target.value }))} required /></div>
                            <div className="form-group"><label className="form-label">Total Hours</label><input type="number" className="form-input" value={compoffForm.hours} onChange={e => setCompoffForm(f => ({ ...f, hours: e.target.value }))} required /></div>
                            <div className="form-group"><label className="form-label">Work Description</label><textarea className="form-textarea" value={compoffForm.reason} onChange={e => setCompoffForm(f => ({ ...f, reason: e.target.value }))} required placeholder="What tasks were performed?" /></div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}><button type="button" className="btn btn-ghost" onClick={() => setShowRequestModal(null)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={isSubmitting}>Submit Credit Request</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
