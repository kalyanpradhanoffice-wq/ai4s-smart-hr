'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Clock, CheckCircle, XCircle, Calendar, Users, Bell, ChevronRight } from 'lucide-react';
import { APPROVAL_WORKFLOWS } from '@/lib/mockData';

function ManagerContent() {
    const router = useRouter();
    const { currentUser, users, leaveRequests, regularizations, approveLeave, rejectLeave, approveRegularization } = useApp();
    const [activeTab, setActiveTab] = useState('leaves');

    const pendingLeaves = leaveRequests.filter(l => l.status === 'pending');
    const pendingRegs = regularizations.filter(r => r.status === 'pending');

    function getEmp(id) { return users.find(u => u.id === id); }

    function handleApproveLeave(id) {
        approveLeave(id, currentUser.id, 'Approved', 1,
            pendingLeaves.find(l => l.id === id)?.days > 3 ? 2 : 1
        );
    }

    function handleRejectLeave(id) {
        rejectLeave(id, currentUser.id, 'Rejected by manager');
    }

    // Team members (reporting to this manager)
    const teamMembers = users.filter(u => u.reportingTo === currentUser?.id);
    const teamOnLeave = leaveRequests.filter(l =>
        teamMembers.some(m => m.id === l.employeeId) &&
        l.status === 'approved' &&
        new Date(l.from) <= new Date() &&
        new Date(l.to) >= new Date()
    );

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Manager Dashboard</h1>
                    <p className="page-subtitle">Manage your team and pending approvals</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {(pendingLeaves.length + pendingRegs.length) > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '0.82rem', fontWeight: 600 }}>
                            <Bell size={14} />
                            {pendingLeaves.length + pendingRegs.length} Pending
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                {[
                    { label: 'Team Size', value: teamMembers.length, color: '#6366f1', sub: 'Direct reports' },
                    { label: 'On Leave Today', value: teamOnLeave.length, color: '#f59e0b', sub: 'Not available' },
                    { label: 'Leave Approvals', value: pendingLeaves.length, color: '#ef4444', sub: 'Awaiting action' },
                    { label: 'Regularizations', value: pendingRegs.length, color: '#06b6d4', sub: 'Missed punches' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                        <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginTop: 8 }}>{s.value}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Team Calendar */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Team Status Today</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {teamMembers.map(member => {
                        const onLeave = teamOnLeave.some(l => l.employeeId === member.id);
                        const leave = teamOnLeave.find(l => l.employeeId === member.id);
                        return (
                            <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="avatar avatar-sm">{member.avatar}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{member.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.designation}</div>
                                    </div>
                                </div>
                                <div>
                                    {onLeave ? (
                                        <div>
                                            <span className="status-pill status-leave">On Leave</span>
                                            {/* Privacy: don't show reason for manager, only type */}
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: 3 }}>{leave?.type} leave</div>
                                        </div>
                                    ) : (
                                        <span className="status-pill status-present">Present</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {teamMembers.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No direct reports assigned yet.</div>
                    )}
                </div>
            </div>

            {/* Approval Inbox */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Approval Inbox</h3>
                    <div className="tabs">
                        <button className={`tab-btn ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>Leaves ({pendingLeaves.length})</button>
                        <button className={`tab-btn ${activeTab === 'reg' ? 'active' : ''}`} onClick={() => setActiveTab('reg')}>Regularization ({pendingRegs.length})</button>
                    </div>
                </div>

                {activeTab === 'leaves' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {pendingLeaves.length === 0 ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No pending leave requests. 🎉</div> : (
                            pendingLeaves.map(lr => {
                                const emp = getEmp(lr.employeeId);
                                return (
                                    <div key={lr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-default)', gap: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                            <div className="avatar avatar-sm">{emp?.avatar}</div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp?.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lr.type} • {lr.from} to {lr.to} ({lr.days} day{lr.days > 1 ? 's' : ''})</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{lr.reason}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                            <button className="btn btn-success btn-sm" onClick={() => handleApproveLeave(lr.id)}><CheckCircle size={14} /> Approve</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleRejectLeave(lr.id)}><XCircle size={14} /> Reject</button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === 'reg' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {pendingRegs.length === 0 ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No pending regularizations.</div> : (
                            pendingRegs.map(reg => {
                                const emp = getEmp(reg.employeeId);
                                return (
                                    <div key={reg.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-default)', gap: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                            <div className="avatar avatar-sm">{emp?.avatar}</div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp?.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Missed punch on {reg.date}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{reg.reason}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                            <button className="btn btn-success btn-sm" onClick={() => approveRegularization(reg.id, currentUser.id, 'Approved')}><CheckCircle size={14} /> Approve</button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ManagerPage() {
    return <DashboardLayout title="Manager Dashboard"><ManagerContent /></DashboardLayout>;
}
