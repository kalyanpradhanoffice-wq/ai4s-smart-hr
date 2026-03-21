'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Clock, CheckCircle, XCircle, Calendar, Users, Bell, ChevronRight, Cake } from 'lucide-react';
import BirthdayTile from '@/components/BirthdayTile';
import { APPROVAL_WORKFLOWS, PERMISSIONS } from '@/lib/constants';

function ManagerContent() {
    const router = useRouter();
    const { 
        currentUser, users, leaveRequests, regularizations, attendance,
        approveLeave, rejectLeave, approveRegularization, getAttendanceStatus 
    } = useApp();
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
    const todayStr = new Date().toISOString().split('T')[0];

    const teamOnLeave = leaveRequests.filter(l =>
        teamMembers.some(m => m.id === l.employeeId) &&
        l.status === 'approved' &&
        todayStr >= (l.from_date || l.from) &&
        todayStr <= (l.to_date || l.to)
    );

    const teamAttendanceHistory = attendance
        .filter(a => teamMembers.some(m => m.id === a.userId))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 15);

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
                        const att = attendance.find(a => a.userId === member.id && a.date === todayStr);
                        const status = getAttendanceStatus(member.id, todayStr);
                        const isWFH = status === 'wfh';
                        const isOnLeave = status === 'leave';

                        return (
                            <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="avatar avatar-sm" style={{ background: member.avatarColor || 'var(--primary-light)' }}>
                                        {member.name?.split(' ').map(n => n[0]).join('') || member.avatar}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{member.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.designation}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                                            {att?.punchIn || '--:--'} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>→</span> {att?.punchOut || '--:--'}
                                        </div>
                                        {att?.punchIn && att?.punchOut && (
                                            <div style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 600 }}>
                                                {(() => {
                                                    const [h1, m1] = att.punchIn.split(':').map(Number);
                                                    const [h2, m2] = att.punchOut.split(':').map(Number);
                                                    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                                                    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                    <span className={`status-pill status-${status}`}>
                                        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {teamMembers.length === 0 && (
                        <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No direct reports assigned yet.</div>
                    )}
                </div>
            </div>

            {/* Team Attendance History */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Recent Team Attendance</h3>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>Punch In</th>
                                <th>Punch Out</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamAttendanceHistory.map(record => {
                                const emp = getEmp(record.userId);
                                return (
                                    <tr key={record.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="avatar avatar-xs" style={{ fontSize: '0.6rem', background: emp?.avatarColor }}>{emp?.name?.[0]}</div>
                                                <span style={{ fontWeight: 500 }}>{emp?.name}</span>
                                            </div>
                                        </td>
                                        <td>{record.date}</td>
                                        <td>{record.punchIn || '--:--'}</td>
                                        <td>{record.punchOut || '--:--'}</td>
                                        <td>
                                            <span className={`status-pill status-${record.status}`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {teamAttendanceHistory.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No attendance history found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ marginBottom: 28 }}>
                <BirthdayTile users={users} />
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
