'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { can } from '@/lib/rbac';
import { PERMISSIONS } from '@/lib/mockData';
import { Clock, MapPin, CheckCircle, AlertCircle, Plus, Edit, Shield, ChevronDown, History, Search } from 'lucide-react';

const STATUS_COLORS = {
    present: '#10b981', absent: '#ef4444', leave: '#06b6d4',
    wfh: '#8b5cf6', 'half-day': '#f59e0b',
};

const STATUS_OPTIONS = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'leave', label: 'Leave' },
    { value: 'wfh', label: 'Work From Home' },
    { value: 'half-day', label: 'Half Day' },
];

const HALF_DAY_OPTIONS = [
    { value: 'first_half_present', label: 'First Half: Present / Second Half: Leave' },
    { value: 'second_half_present', label: 'First Half: Leave / Second Half: Present' },
    { value: 'first_half_wfh', label: 'First Half: WFH / Second Half: Present' },
    { value: 'second_half_wfh', label: 'First Half: Present / Second Half: WFH' },
];

const LEAVE_TYPES = ['CL', 'EL', 'SL', 'LOP', 'OD'];

function AttendanceContent() {
    const { currentUser, users, attendance, regularizations, requestRegularization, markAttendance, hrCorrectAttendance, leaveBalances, activityHistory } = useApp();
    const [activeTab, setActiveTab] = useState('my');
    const [showRegModal, setShowRegModal] = useState(false);
    const [regForm, setRegForm] = useState({ date: '', correctionType: 'missing_in', reason: '' });
    const [punchStatus, setPunchStatus] = useState('out');
    // Attendance history filters
    const [histEmpFilter, setHistEmpFilter] = useState('');
    const [histDateFrom, setHistDateFrom] = useState('');
    const [histDateTo, setHistDateTo] = useState('');

    // HR correction state
    const [showHRModal, setShowHRModal] = useState(false);
    const [hrForm, setHRForm] = useState({ userId: '', date: '', status: 'present', punchIn: '', punchOut: '', leaveType: 'CL', halfDayType: '', location: 'office' });

    const canManageAttendance = can(currentUser, PERMISSIONS.VIEW_ALL_ATTENDANCE) || can(currentUser, PERMISSIONS.APPROVE_REGULARIZATION);
    const isManager = currentUser?.role === 'manager';
    const canViewAll = can(currentUser, PERMISSIONS.VIEW_ALL_ATTENDANCE);

    // Filter by hierarchy for managers
    const teamUserIds = users.filter(u => u.reportingTo === currentUser?.id).map(u => u.id);

    const myAttendance = attendance.filter(a => a.userId === currentUser?.id);
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = myAttendance.find(a => a.date === today);

    const thisMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-03"
    const thisMonth = myAttendance.filter(a => a.date.startsWith(thisMonthStr));
    const presentDays = thisMonth.filter(a => a.status === 'present' || a.status === 'regularized' || a.status === 'wfh').length;
    const absentDays = thisMonth.filter(a => a.status === 'absent').length;
    const leaveDays = thisMonth.filter(a => a.status === 'leave').length;
    const wfhDays = thisMonth.filter(a => a.status === 'wfh').length;

    const myLeaveBalance = leaveBalances?.find(b => b.userId === currentUser?.id);

    function handlePunchIn() {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        markAttendance(currentUser.id, today, 'in', timeStr, 'office');
        setPunchStatus('in');
    }

    function handlePunchOut() {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        markAttendance(currentUser.id, today, 'out', timeStr, null);
        setPunchStatus('out-done');
    }

    function handleRegularization(e) {
        e.preventDefault();
        requestRegularization({ ...regForm, employeeId: currentUser.id });
        setShowRegModal(false);
        setRegForm({ date: '', correctionType: 'missing_in', reason: '' });
    }

    function handleHRCorrection(e) {
        e.preventDefault();
        const updates = {
            status: hrForm.status,
            punchIn: hrForm.punchIn || null,
            punchOut: hrForm.punchOut || null,
            location: hrForm.location,
        };
        if (hrForm.status === 'leave') updates.leaveType = hrForm.leaveType;
        if (hrForm.status === 'half-day') updates.halfDayType = hrForm.halfDayType;
        hrCorrectAttendance(hrForm.userId, hrForm.date, updates);
        setShowHRModal(false);
        setHRForm({ userId: '', date: '', status: 'present', punchIn: '', punchOut: '', leaveType: 'CL', halfDayType: '', location: 'office' });
    }

    const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - 13 + i);
        return d.toISOString().split('T')[0];
    });

    const pendingRegularizations = regularizations.filter(r => r.status === 'pending');

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Attendance Management</h1>
                    <p className="page-subtitle">Track attendance, request corrections, and manage records</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setShowRegModal(true)}>
                        <Plus size={16} /> Self Correction Request
                    </button>
                    {canManageAttendance && (
                        <button className="btn btn-primary" onClick={() => setShowHRModal(true)}>
                            <Shield size={16} /> HR Attendance Correction
                        </button>
                    )}
                </div>
            </div>

            {/* Tab bar */}
            {canManageAttendance && (
                <div className="tabs" style={{ marginBottom: 24 }}>
                    <button className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>My Attendance</button>
                    <button className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>Team Attendance</button>
                    <button className={`tab-btn ${activeTab === 'regs' ? 'active' : ''}`} onClick={() => setActiveTab('regs')}>Regularization Requests {pendingRegularizations.length > 0 && <span className="notification-badge" style={{ position: 'static', marginLeft: 4 }}>{pendingRegularizations.length}</span>}</button>
                    <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><History size={13} style={{ marginRight: 4 }} />Attendance History</button>
                </div>
            )}

            {activeTab === 'my' && (
                <>
                    {/* Stats */}
                    <div className="grid-4" style={{ marginBottom: 28 }}>
                        {[
                            { label: 'Present (Mar)', value: presentDays, color: '#10b981' },
                            { label: 'Absent (Mar)', value: absentDays, color: '#ef4444' },
                            { label: 'On Leave (Mar)', value: leaveDays, color: '#06b6d4' },
                            { label: 'WFH (Mar)', value: wfhDays, color: '#8b5cf6' },
                        ].map(s => (
                            <div key={s.label} className="stat-card">
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginTop: 8 }}>{s.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid-2" style={{ marginBottom: 24 }}>
                        {/* Today's Punch */}
                        <div className="card" style={{ textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20 }}>Today's Attendance</h3>
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--brand-primary-light)' }}>
                                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
                                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>
                            {todayRecord ? (
                                <div>
                                    <div className="alert alert-success" style={{ justifyContent: 'center', marginBottom: 16 }}>
                                        <CheckCircle size={16} /> Punched in at {todayRecord.punchIn}
                                    </div>
                                    {!todayRecord.punchOut && (
                                        <button className="btn btn-danger w-full" style={{ justifyContent: 'center' }} onClick={handlePunchOut}>
                                            <Clock size={16} /> Punch Out
                                        </button>
                                    )}
                                    {todayRecord.punchOut && (
                                        <div className="alert alert-info" style={{ justifyContent: 'center' }}>
                                            <CheckCircle size={16} /> Punched out at {todayRecord.punchOut}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button className="btn btn-success w-full" style={{ justifyContent: 'center', fontSize: '1rem', padding: '14px' }} onClick={handlePunchIn}>
                                    <Clock size={18} /> Punch In
                                </button>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 14, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <MapPin size={13} /> IP-verified office location
                            </div>
                        </div>

                        {/* Last 14 days calendar */}
                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Last 14 Days</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                                {last14.map(date => {
                                    const rec = myAttendance.find(a => a.date === date);
                                    const status = rec?.status || (new Date(date) > new Date() ? 'future' : 'absent');
                                    const color = STATUS_COLORS[status] || STATUS_COLORS.absent;
                                    const dayNum = new Date(date).getDate();
                                    const isToday = date === today;
                                    return (
                                        <div key={date} title={`${date}: ${status}`} style={{ aspectRatio: 1, borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: status === 'future' ? 'transparent' : `${color}20`, border: isToday ? `2px solid ${color}` : `1px solid ${status === 'future' ? 'var(--border-subtle)' : `${color}40`}`, cursor: 'default', fontSize: '0.7rem', fontWeight: isToday ? 700 : 500, color: status === 'future' ? 'var(--text-muted)' : color }}>
                                            {dayNum}
                                            <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', marginTop: 2, opacity: 0.8 }}>{status === 'future' ? '' : status.slice(0, 3)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                {Object.entries(STATUS_COLORS).map(([s, c]) => (
                                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Leave Balances */}
                    {myLeaveBalance && (
                        <div className="card" style={{ marginBottom: 24 }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Leave Balances</h3>
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                {['CL', 'EL', 'SL'].map(lt => (
                                    <div key={lt} style={{ padding: '12px 20px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', textAlign: 'center', minWidth: 80 }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary-light)' }}>{myLeaveBalance[lt] ?? 0}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{lt}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Attendance Table */}
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Detailed Attendance Log</h3>
                        </div>
                        <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                            <table className="data-table">
                                <thead><tr><th>Date</th><th>Status</th><th>Punch In</th><th>Punch Out</th><th>Location</th><th>Hours</th><th>Corrected</th></tr></thead>
                                <tbody>
                                    {myAttendance.slice().reverse().map(a => {
                                        const hours = a.punchIn && a.punchOut ? (() => {
                                            const [ih, im] = a.punchIn.split(':').map(Number);
                                            const [oh, om] = a.punchOut.split(':').map(Number);
                                            const diff = (oh * 60 + om) - (ih * 60 + im);
                                            return `${Math.floor(diff / 60)}h ${diff % 60}m`;
                                        })() : '—';
                                        return (
                                            <tr key={a.id}>
                                                <td style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{a.date}</td>
                                                <td><span className={`status-pill status-${a.status}`}>{a.regularized ? 'Regularized' : a.halfDayType ? `Half (${a.halfDayType.split('_')[0]})` : a.status}</span></td>
                                                <td style={{ fontSize: '0.85rem' }}>{a.punchIn || '—'}</td>
                                                <td style={{ fontSize: '0.85rem' }}>{a.punchOut || '—'}</td>
                                                <td style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{a.location || '—'}</td>
                                                <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary-light)' }}>{hours}</td>
                                                <td>{a.hrCorrected && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>HR</span>}</td>
                                            </tr>
                                        );
                                    })}
                                    {myAttendance.length === 0 && (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No attendance records found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Team Attendance Tab */}
            {activeTab === 'team' && canManageAttendance && (
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>All Employee Attendance</h3>
                    </div>
                    <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                        <table className="data-table">
                            <thead><tr><th>Employee</th><th>Date</th><th>Status</th><th>Punch In</th><th>Punch Out</th><th>Hours</th><th>Corrected By</th></tr></thead>
                            <tbody>
                                {attendance.slice().reverse().filter(a => {
                                    if (canViewAll) return true;
                                    if (isManager) return teamUserIds.includes(a.userId);
                                    return a.userId === currentUser?.id;
                                }).slice(0, 50).map(a => {
                                    const emp = users.find(u => u.id === a.userId);
                                    const hours = a.punchIn && a.punchOut ? (() => {
                                        const [ih, im] = a.punchIn.split(':').map(Number);
                                        const [oh, om] = a.punchOut.split(':').map(Number);
                                        const diff = (oh * 60 + om) - (ih * 60 + im);
                                        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
                                    })() : '—';
                                    return (
                                        <tr key={a.id}>
                                            <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="avatar avatar-sm">{emp?.avatar}</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{emp?.name || a.userId}</div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{a.date}</td>
                                            <td><span className={`status-pill status-${a.status}`}>{a.status}</span></td>
                                            <td style={{ fontSize: '0.85rem' }}>{a.punchIn || '—'}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{a.punchOut || '—'}</td>
                                            <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary-light)' }}>{hours}</td>
                                            <td>{a.hrCorrected ? <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>HR Admin</span> : '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Regularization Requests Tab */}
            {activeTab === 'regs' && canManageAttendance && (
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Attendance Correction Requests</h3>
                    </div>
                    <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                        <table className="data-table">
                            <thead><tr><th>Employee</th><th>Date</th><th>Correction Type</th><th>Reason</th><th>Status</th></tr></thead>
                            <tbody>
                                {regularizations.filter(r => {
                                    if (canViewAll) return true;
                                    if (isManager) return teamUserIds.includes(r.employeeId);
                                    return r.employeeId === currentUser?.id;
                                }).length === 0 && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No correction requests found.</td></tr>
                                )}
                                {regularizations.filter(r => {
                                    if (canViewAll) return true;
                                    if (isManager) return teamUserIds.includes(r.employeeId);
                                    return r.employeeId === currentUser?.id;
                                }).map(r => {
                                    const emp = users.find(u => u.id === r.employeeId);
                                    return (
                                        <tr key={r.id}>
                                            <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div className="avatar avatar-sm">{emp?.avatar}</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{emp?.name || r.employeeId}</div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{r.date}</td>
                                            <td><span className="badge badge-primary" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>{r.correctionType?.replace(/_/g, ' ') || 'Missing Punch'}</span></td>
                                            <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>{r.reason}</td>
                                            <td><span className={`status-pill status-${r.status}`}>{r.status}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Self-Correction Request Modal */}
            {showRegModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRegModal(false)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-display)' }}>Request Attendance Correction</h3>
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            <AlertCircle size={15} style={{ flexShrink: 0 }} /> Submit a correction request. It will go to your manager for approval.
                        </div>
                        <form onSubmit={handleRegularization} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group">
                                <label className="form-label">Date</label>
                                <input type="date" className="form-input" value={regForm.date} onChange={e => setRegForm(f => ({ ...f, date: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Correction Type</label>
                                <select className="form-select" value={regForm.correctionType} onChange={e => setRegForm(f => ({ ...f, correctionType: e.target.value }))}>
                                    <option value="missing_in">Missing Punch In</option>
                                    <option value="missing_out">Missing Punch Out</option>
                                    <option value="wrong_status">Wrong Status</option>
                                    <option value="both">Both Punch In & Out Missing</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Reason</label>
                                <textarea className="form-textarea" placeholder="Explain the reason for the correction..." value={regForm.reason} onChange={e => setRegForm(f => ({ ...f, reason: e.target.value }))} required />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowRegModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* HR Attendance Correction Modal */}
            {showHRModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowHRModal(false)}>
                    <div className="modal-box" style={{ maxWidth: 520 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Shield size={18} color="var(--brand-primary-light)" />
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-display)' }}>HR Attendance Correction</h3>
                        </div>
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            <AlertCircle size={15} style={{ flexShrink: 0 }} /> This directly overwrites attendance records. If changed to Leave, the employee's leave balance will be deducted automatically.
                        </div>
                        <form onSubmit={handleHRCorrection} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group">
                                <label className="form-label">Select Employee *</label>
                                <select className="form-select" value={hrForm.userId} onChange={e => setHRForm(f => ({ ...f, userId: e.target.value }))} required>
                                    <option value="">Select employee...</option>
                                    {users.filter(u => canViewAll || teamUserIds.includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.name} — {u.employeeId}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date *</label>
                                <input type="date" className="form-input" value={hrForm.date} onChange={e => setHRForm(f => ({ ...f, date: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Attendance Status *</label>
                                <select className="form-select" value={hrForm.status} onChange={e => setHRForm(f => ({ ...f, status: e.target.value }))}>
                                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            {hrForm.status === 'leave' && (
                                <div className="form-group">
                                    <label className="form-label">Leave Type (for balance deduction)</label>
                                    <select className="form-select" value={hrForm.leaveType} onChange={e => setHRForm(f => ({ ...f, leaveType: e.target.value }))}>
                                        {LEAVE_TYPES.map(lt => <option key={lt} value={lt}>{lt}</option>)}
                                    </select>
                                </div>
                            )}
                            {hrForm.status === 'half-day' && (
                                <div className="form-group">
                                    <label className="form-label">Half Day Configuration</label>
                                    <select className="form-select" value={hrForm.halfDayType} onChange={e => setHRForm(f => ({ ...f, halfDayType: e.target.value }))}>
                                        <option value="">Select configuration...</option>
                                        {HALF_DAY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            )}
                            {(hrForm.status === 'present' || hrForm.status === 'wfh') && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group">
                                        <label className="form-label">Add Punch In</label>
                                        <input type="time" className="form-input" value={hrForm.punchIn} onChange={e => setHRForm(f => ({ ...f, punchIn: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Add Punch Out</label>
                                        <input type="time" className="form-input" value={hrForm.punchOut} onChange={e => setHRForm(f => ({ ...f, punchOut: e.target.value }))} />
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <select className="form-select" value={hrForm.location} onChange={e => setHRForm(f => ({ ...f, location: e.target.value }))}>
                                    <option value="office">Office</option>
                                    <option value="wfh">Work From Home</option>
                                    <option value="field">Field</option>
                                    <option value="client_site">Client Site</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowHRModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><Shield size={14} /> Apply HR Correction</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Attendance History Tab */}
            {activeTab === 'history' && (
                <AttendanceHistoryPanel
                    activityHistory={activityHistory}
                    users={users}
                    canManageAttendance={canManageAttendance}
                    histEmpFilter={histEmpFilter}
                    setHistEmpFilter={setHistEmpFilter}
                    histDateFrom={histDateFrom}
                    setHistDateFrom={setHistDateFrom}
                    histDateTo={histDateTo}
                    setHistDateTo={setHistDateTo}
                />
            )}
        </div>

    );
}

function AttendanceHistoryPanel({ activityHistory, users, canManageAttendance, histEmpFilter, setHistEmpFilter, histDateFrom, setHistDateFrom, histDateTo, setHistDateTo }) {
    const STATUS_COLORS_ATT = {
        present: '#10b981', absent: '#ef4444', leave: '#06b6d4',
        wfh: '#8b5cf6', 'half-day': '#f59e0b',
    };
    const attHistory = activityHistory.filter(h => h.module === 'Attendance');
    const filteredHist = attHistory
        .filter(h => !histEmpFilter || h.targetEmployeeId === histEmpFilter)
        .filter(h => !histDateFrom || h.timestamp >= histDateFrom)
        .filter(h => !histDateTo || h.timestamp <= histDateTo + 'T23:59:59');

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Attendance Correction History</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{filteredHist.length} records</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {canManageAttendance && (
                        <select className="form-select" style={{ width: 180 }} value={histEmpFilter} onChange={e => setHistEmpFilter(e.target.value)}>
                            <option value="">All Employees</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </select>
                    )}
                    <input type="date" className="form-input" style={{ width: 140 }} value={histDateFrom} onChange={e => setHistDateFrom(e.target.value)} title="From date" />
                    <input type="date" className="form-input" style={{ width: 140 }} value={histDateTo} onChange={e => setHistDateTo(e.target.value)} title="To date" />
                </div>
            </div>
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Employee</th>
                            <th>Old Status</th>
                            <th>New Status</th>
                            <th>Changed By</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredHist.map(h => (
                            <tr key={h.id}>
                                <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                    {new Date(h.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td style={{ fontSize: '0.82rem', fontWeight: 500 }}>{h.targetEmployeeName || '—'}</td>
                                <td>
                                    {h.previousValue
                                        ? <span style={{ padding: '2px 8px', borderRadius: 4, background: `${STATUS_COLORS_ATT[h.previousValue] || '#64748b'}18`, color: STATUS_COLORS_ATT[h.previousValue] || '#64748b', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>{h.previousValue}</span>
                                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>}
                                </td>
                                <td>
                                    {h.newValue
                                        ? <span style={{ padding: '2px 8px', borderRadius: 4, background: `${STATUS_COLORS_ATT[h.newValue] || '#10b981'}18`, color: STATUS_COLORS_ATT[h.newValue] || '#10b981', fontSize: '0.72rem', fontWeight: 600, textTransform: 'capitalize' }}>{h.newValue}</span>
                                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>}
                                </td>
                                <td style={{ fontSize: '0.8rem' }}>{h.performedByName || '—'}</td>
                                <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: 260 }}>{h.description}</td>
                            </tr>
                        ))}
                        {filteredHist.length === 0 && (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No attendance correction history found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function AttendancePage() {
    return <DashboardLayout title="Attendance Management"><AttendanceContent /></DashboardLayout>;
}
