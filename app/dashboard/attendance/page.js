'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { can } from '@/lib/rbac';
import { PERMISSIONS } from '@/lib/constants';
import { Clock, MapPin, CheckCircle, AlertCircle, Plus, Edit, Shield, History, Info, Calendar, Users, Search, BarChart2, Table, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const STATUS_COLORS = {
    present: '#10b981', absent: '#ef4444', leave: '#06b6d4',
    wfh: '#8b5cf6', 'half-day': '#f59e0b', 'weekly-off': '#94a3b8',
};

const STATUS_LABEL = {
    present: 'P', absent: 'A', leave: 'L', wfh: 'WFH', 'half-day': 'HL', 'weekly-off': 'WO',
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

const LEAVE_TYPES_HR = ['CL', 'EL', 'SL', 'LOP', 'OD'];

export default function AttendancePage() {
    return <DashboardLayout title="Attendance"><AttendanceContent /></DashboardLayout>;
}

function AttendanceContent() {
    const {
        currentUser, users, attendance, regularizations,
        requestRegularization, approveRegularization, rejectRegularization,
        markAttendance, hrCorrectAttendance, leaveBalances, leaveRequests,
        getAttendanceStatus
    } = useApp();

    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'my');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);
    const [showRegModal, setShowRegModal] = useState(false);
    const [regForm, setRegForm] = useState({ date: '', correctionType: 'missing_in', reason: '', punchIn: '', punchOut: '' });
    const [regError, setRegError] = useState('');
    const [isSubmittingReg, setIsSubmittingReg] = useState(false);
    const [punchStatus, setPunchStatus] = useState('out');
    const [isPunching, setIsPunching] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraAction, setCameraAction] = useState('in');
    const [selectedCalDate, setSelectedCalDate] = useState(null);
    const [showHRModal, setShowHRModal] = useState(false);
    const [hrForm, setHRForm] = useState({ userId: '', date: '', status: 'present', punchIn: '', punchOut: '', leaveType: 'CL', halfDayType: '', location: 'office' });

    const isSuperAdmin = currentUser?.role === 'super_admin';
    const isHRAdmin = currentUser?.role === 'hr_admin';
    const isAdminView = isSuperAdmin || isHRAdmin;
    const isManager = currentUser?.role === 'manager';
    const canManageAttendance = can(currentUser, PERMISSIONS.VIEW_ALL_ATTENDANCE) || can(currentUser, PERMISSIONS.APPROVE_REGULARIZATION);
    const canViewAll = can(currentUser, PERMISSIONS.VIEW_ALL_ATTENDANCE);

    const teamUserIds = users.filter(u =>
        u.reportingTo === currentUser?.id || u.managerId === currentUser?.id ||
        u.functionalManagerId === currentUser?.id
    ).map(u => u.id);

    const today = new Date().toISOString().split('T')[0];
    const myAttendance = attendance.filter(a => a.userId === currentUser?.id);
    const todayRecord = myAttendance.find(a => a.date === today);

    const thisMonthStr = new Date().toISOString().slice(0, 7);
    const thisMonth = myAttendance.filter(a => a.date.startsWith(thisMonthStr));
    const thisMonthDays = Array.from({ length: new Date().getDate() }, (_, i) => {
        const d = new Date(); d.setDate(i + 1);
        return d.toISOString().split('T')[0];
    });
    const presentDays = thisMonthDays.filter(date => {
        const s = getAttendanceStatus(currentUser?.id, date);
        return s === 'present' || s === 'late' || s === 'regularized';
    }).length;
    const leaveDays = thisMonthDays.filter(date => getAttendanceStatus(currentUser?.id, date) === 'leave').length;
    const wfhDays = thisMonthDays.filter(date => getAttendanceStatus(currentUser?.id, date) === 'wfh').length;
    const holidayDays = thisMonthDays.filter(date => getAttendanceStatus(currentUser?.id, date) === 'holiday').length;
    const halfDayDays = thisMonth.filter(a => a.status === 'half-day').length;
    const workingMonthDays = thisMonthDays.filter(date => new Date(date).getDay() !== 0).length;
    const absentDays = Math.max(0, workingMonthDays - presentDays - leaveDays - wfhDays - halfDayDays - holidayDays);
    const myLeaveBalance = leaveBalances?.find(b => b.userId === currentUser?.id);

    const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - 13 + i);
        return d.toISOString().split('T')[0];
    });

    const pendingRegularizations = regularizations.filter(r => {
        if (canViewAll) return r.status === 'pending';
        if (isManager) return r.status === 'pending' && teamUserIds.includes(r.employeeId);
        return false;
    });

    async function handlePunchIn() { if (isPunching) return; setCameraAction('in'); setShowCamera(true); }
    async function handlePunchOut() { if (isPunching || !todayRecord) return; setCameraAction('out'); setShowCamera(true); }

    async function finalizePunch() {
        if (isPunching) return;
        setIsPunching(true);
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        try {
            if (cameraAction === 'in') { await markAttendance(currentUser.id, today, 'in', timeStr, 'office', true); setPunchStatus('in'); }
            else { await markAttendance(currentUser.id, today, 'out', timeStr, null, true); setPunchStatus('out-done'); }
            setShowCamera(false);
        } finally { setIsPunching(false); }
    }

    async function handleRegularization(e) {
        e.preventDefault();
        if (isSubmittingReg) return;
        
        // Final validation
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const minDate = sevenDaysAgo.toISOString().split('T')[0];
        
        if (regForm.date < minDate) {
            setRegError('You cannot request correction for dates older than 7 days.');
            return;
        }

        setIsSubmittingReg(true);
        try {
            const res = await requestRegularization({ ...regForm, employeeId: currentUser.id });
            if (res) {
                setShowRegModal(false);
                setRegForm({ date: '', correctionType: 'missing_in', reason: '', punchIn: '', punchOut: '' });
                setRegError('');
            }
        } finally {
            setIsSubmittingReg(false);
        }
    }

    function handleHRCorrection(e) {
        e.preventDefault();
        const updates = { status: hrForm.status, punchIn: hrForm.punchIn || null, punchOut: hrForm.punchOut || null, location: hrForm.location };
        if (hrForm.status === 'leave') updates.leaveType = hrForm.leaveType;
        if (hrForm.status === 'half-day') updates.halfDayType = hrForm.halfDayType;
        hrCorrectAttendance(hrForm.userId, hrForm.date, updates);
        setShowHRModal(false);
        setHRForm({ userId: '', date: '', status: 'present', punchIn: '', punchOut: '', leaveType: 'CL', halfDayType: '', location: 'office' });
    }

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

            {/* Tab Bar */}
            <div className="tabs" style={{ marginBottom: 24 }}>
                <button className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`} onClick={() => setActiveTab('my')}>
                    <Clock size={13} style={{ marginRight: 5 }} />My Attendance
                </button>
                {(isManager || canViewAll) && (
                    <button className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
                        <Users size={13} style={{ marginRight: 5 }} />Team Attendance
                    </button>
                )}
                <button className={`tab-btn ${activeTab === 'regs' ? 'active' : ''}`} onClick={() => setActiveTab('regs')}>
                    <Edit size={13} style={{ marginRight: 5 }} />Correction Requests
                    {pendingRegularizations.length > 0 && <span className="notification-badge" style={{ position: 'static', marginLeft: 4 }}>{pendingRegularizations.length}</span>}
                </button>
                {isAdminView && (
                    <button className={`tab-btn ${activeTab === 'grid-status' ? 'active' : ''}`} onClick={() => setActiveTab('grid-status')}>
                        <BarChart2 size={13} style={{ marginRight: 5 }} />Attendance History By Status
                    </button>
                )}
                {isAdminView && (
                    <button className={`tab-btn ${activeTab === 'grid-punches' ? 'active' : ''}`} onClick={() => setActiveTab('grid-punches')}>
                        <Table size={13} style={{ marginRight: 5 }} />Attendance History By Punches
                    </button>
                )}
            </div>

            {/* ── MY ATTENDANCE TAB ── */}
            {activeTab === 'my' && (
                <>
                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-md)', marginBottom: 28 }}>
                        {[
                            { label: 'Present (Month)', value: presentDays, color: '#10b981' },
                            { label: 'Absent (Month)', value: absentDays, color: '#ef4444' },
                            { label: 'Leave (Month)', value: leaveDays, color: '#06b6d4' },
                            { label: 'WFH (Month)', value: wfhDays, color: '#8b5cf6' },
                            { label: 'Half Day (Month)', value: halfDayDays, color: '#f59e0b' },
                            { label: 'Holiday (Month)', value: holidayDays, color: '#94a3b8' },
                        ].map(s => (
                            <div key={s.label} className="stat-card" style={{ padding: '16px 12px' }}>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginTop: 6 }}>{s.value}</div>
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
                            {(() => {
                                const onLeaveToday = leaveRequests?.some(l => {
                                    const rawStart = l.from_date || l.from || '';
                                    const rawEnd = l.to_date || l.to || '';
                                    const s = rawStart.split('T')[0];
                                    const e = rawEnd.split('T')[0];
                                    const isApproved = (l.status || '').toLowerCase() === 'approved';
                                    const isMatchingUser = (l.employee_id === currentUser?.id) || (l.employeeId === currentUser?.id);
                                    return isMatchingUser && today >= s && today <= e && isApproved && l.type !== 'WFH';
                                });
                                if (onLeaveToday) return <div className="alert alert-info" style={{ justifyContent: 'center', marginBottom: 16 }}><Info size={16} /> You are on approved leave today</div>;
                                return todayRecord ? (
                                    <div>
                                        <div className="alert alert-success" style={{ justifyContent: 'center', marginBottom: 16 }}><CheckCircle size={16} /> Punched in at {todayRecord.punchIn}</div>
                                        {!todayRecord.punchOut && <button className="btn btn-danger w-full" style={{ justifyContent: 'center' }} onClick={handlePunchOut} disabled={isPunching}><Clock size={16} /> {isPunching ? 'Processing...' : 'Punch Out'}</button>}
                                        {todayRecord.punchOut && <div className="alert alert-info" style={{ justifyContent: 'center' }}><CheckCircle size={16} /> Punched out at {todayRecord.punchOut}</div>}
                                    </div>
                                ) : (
                                    <button className="btn btn-success w-full" style={{ justifyContent: 'center', fontSize: '1rem', padding: '14px' }} onClick={handlePunchIn} disabled={isPunching}><Clock size={18} /> {isPunching ? 'Processing...' : 'Punch In'}</button>
                                );
                            })()}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 14, fontSize: '0.75rem', color: 'var(--text-muted)' }}><MapPin size={13} /> IP-verified office location</div>
                        </div>

                        {/* Last 14 Days */}
                        <div className="card">
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Last 14 Days</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                                {last14.map(date => {
                                    const isFuture = new Date(date) > new Date();
                                    const status = isFuture ? 'future' : getAttendanceStatus(currentUser?.id, date);
                                    const color = STATUS_COLORS[status] || STATUS_COLORS.absent;
                                    const isToday = date === today;
                                    const isSelected = selectedCalDate === date;
                                    return (
                                        <div key={date} title={`${date}: ${status}`} onClick={() => setSelectedCalDate(date)} style={{ aspectRatio: 1, borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: status === 'future' ? 'transparent' : `${color}20`, border: isToday ? `2px solid ${color}` : isSelected ? `2px solid var(--brand-primary)` : `1px solid ${status === 'future' ? 'var(--border-subtle)' : `${color}40`}`, cursor: 'pointer', fontSize: '0.7rem', fontWeight: (isToday || isSelected) ? 700 : 500, color: status === 'future' ? 'var(--text-muted)' : color, transform: isSelected ? 'scale(1.05)' : 'none', transition: 'all 0.15s ease' }}>
                                            {new Date(date).getDate()}
                                            <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', marginTop: 2, opacity: 0.8 }}>{status === 'future' ? '' : STATUS_LABEL[status] || status.slice(0, 3)}</div>
                                        </div>
                                    );
                                })}
                            </div>
                            {selectedCalDate && (() => {
                                const rec = myAttendance.find(a => a.date === selectedCalDate);
                                return (
                                    <div style={{ marginTop: 16, padding: 14, borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <h4 style={{ fontSize: '0.82rem', fontWeight: 700 }}><Calendar size={12} style={{ display: 'inline', marginRight: 5 }} />{new Date(selectedCalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</h4>
                                            <button onClick={() => setSelectedCalDate(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                                        </div>
                                        {rec ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>In Time</div>
                                                    <div style={{ fontWeight: 700, color: '#10b981' }}>{rec.punchIn || '--:--'}</div>
                                                </div>
                                                <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.15)' }}>
                                                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>Out Time</div>
                                                    <div style={{ fontWeight: 700, color: '#f43f5e' }}>{rec.punchOut || '--:--'}</div>
                                                </div>
                                            </div>
                                        ) : (() => {
                                            const status = getAttendanceStatus(currentUser?.id, selectedCalDate);
                                            if (status === 'leave') return <div style={{ fontSize: '0.8rem', color: 'var(--brand-primary-light)', fontWeight: 600 }}>No punch records for this date.<br/>Leave Approved</div>;
                                            if (status === 'holiday') return <div style={{ fontSize: '0.8rem', color: 'var(--brand-primary-light)', fontWeight: 600 }}>No punch records for this date.<br/>Public Holiday</div>;
                                            return <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No punch records for this date.</div>;
                                        })()}
                                    </div>
                                );
                            })()}
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                                {Object.entries(STATUS_COLORS).map(([s, c]) => (
                                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{STATUS_LABEL[s]} – {s}
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

                    {/* My Attendance Log */}
                    <div className="card" style={{ padding: 0 }}>
                        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>My Attendance Log</h3>
                        </div>
                        <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                            <table className="data-table">
                                <thead><tr><th>Date</th><th>Status</th><th>Punch In</th><th>Punch Out</th><th>Location</th><th>Hours</th><th>Corrected</th></tr></thead>
                                <tbody>
                                    {myAttendance.slice().reverse().map(a => {
                                        const hours = a.punchIn && a.punchOut ? (() => { const [ih, im] = a.punchIn.split(':').map(Number); const [oh, om] = a.punchOut.split(':').map(Number); const diff = (oh * 60 + om) - (ih * 60 + im); return `${Math.floor(diff / 60)}h ${diff % 60}m`; })() : '—';
                                        return (
                                            <tr key={a.id}>
                                                <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{a.date}</td>
                                                <td><span className={`status-pill status-${a.status}`}>{a.regularized ? 'Regularized' : a.status}</span></td>
                                                <td style={{ fontSize: '0.85rem' }}>{a.punchIn || '—'}</td>
                                                <td style={{ fontSize: '0.85rem' }}>{a.punchOut || '—'}</td>
                                                <td style={{ fontSize: '0.82rem' }}>{a.location || '—'}</td>
                                                <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary-light)' }}>{hours}</td>
                                                <td>{a.hrCorrected && <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>HR</span>}</td>
                                            </tr>
                                        );
                                    })}
                                    {myAttendance.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No attendance records found.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* ── TEAM ATTENDANCE TAB ── */}
            {activeTab === 'team' && (isManager || canViewAll) && (
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Team Attendance</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                            {isManager && !canViewAll ? `Showing attendance for your direct reports (${teamUserIds.length} employees)` : 'Showing attendance for all employees'}
                        </p>
                    </div>
                    <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Employee</th><th>Date</th><th>Status</th><th>Punch In</th><th>Punch Out</th><th>Hours</th><th>Corrected</th>
                                    {canManageAttendance && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.filter(a => {
                                    if (a.userId === currentUser?.id) return false;
                                    if (canViewAll) return true;
                                    if (isManager) return teamUserIds.includes(a.userId);
                                    return false;
                                }).map(a => {
                                    const emp = users.find(u => u.id === a.userId);
                                    const hours = a.punchIn && a.punchOut ? (() => { const [ih, im] = a.punchIn.split(':').map(Number); const [oh, om] = a.punchOut.split(':').map(Number); const diff = (oh * 60 + om) - (ih * 60 + im); return `${Math.floor(diff / 60)}h ${diff % 60}m`; })() : '—';
                                    
                                    const leaveRec = leaveRequests?.find(l => {
                                        const rawStart = l.from_date || l.from || '';
                                        const rawEnd = l.to_date || l.to || '';
                                        const s = rawStart.split('T')[0];
                                        const e = rawEnd.split('T')[0];
                                        const isApproved = (l.status || '').toLowerCase() === 'approved';
                                        const isMatchingUser = (l.employee_id === a.userId) || (l.employeeId === a.userId);
                                        return a.date >= s && a.date <= e && isApproved && isMatchingUser;
                                    });
                                    const status = leaveRec ? (leaveRec.type === 'WFH' ? 'wfh' : 'leave') : a.status;

                                    return (
                                        <tr key={a.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div className="avatar avatar-sm">{emp?.avatar}</div>
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{emp?.name || a.userId}</div>
                                                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{emp?.displayId}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{a.date}</td>
                                            <td><span className={`status-pill status-${status}`}>{status}</span></td>
                                            <td style={{ fontSize: '0.85rem' }}>{a.punchIn || '—'}</td>
                                            <td style={{ fontSize: '0.85rem' }}>{a.punchOut || '—'}</td>
                                            <td style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--brand-primary-light)' }}>{hours}</td>
                                            <td>{a.hrCorrected ? <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>HR</span> : '—'}</td>
                                            {canManageAttendance && (
                                                <td>
                                                    <button className="btn btn-ghost btn-sm" onClick={() => { setHRForm({ userId: a.userId, date: a.date, status: a.status, punchIn: a.punchIn || '', punchOut: a.punchOut || '', leaveType: 'CL', halfDayType: '', location: a.location || 'office' }); setShowHRModal(true); }} title="Correct Attendance"><Edit size={14} /></button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                {attendance.filter(a => {
                                    if (a.userId === currentUser?.id) return false;
                                    if (canViewAll) return true;
                                    if (isManager) return teamUserIds.includes(a.userId);
                                    return false;
                                }).length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No team attendance records found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── CORRECTION REQUESTS TAB ── */}
            {activeTab === 'regs' && (
                <div className="card" style={{ padding: 0 }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Attendance Correction Requests</h3>
                    </div>
                    <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                        <table className="data-table">
                            <thead><tr><th>Employee</th><th>Date</th><th>Correction Type</th><th>Reason</th><th>Status</th>{canManageAttendance && <th style={{ textAlign: 'right' }}>Actions</th>}</tr></thead>
                            <tbody>
                                {regularizations.filter(r => {
                                    if (canViewAll) return true;
                                    if (isManager) return teamUserIds.includes(r.employeeId);
                                    return r.employeeId === currentUser?.id;
                                }).map(r => {
                                    const emp = users.find(u => u.id === r.employeeId);
                                    return (
                                        <tr key={r.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div className="avatar avatar-sm">{emp?.avatar}</div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{emp?.name || emp?.displayId || r.employeeId}</div>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{r.date}</td>
                                            <td><span className="badge badge-primary" style={{ fontSize: '0.68rem', textTransform: 'capitalize' }}>{r.correctionType?.replace(/_/g, ' ') || 'Missing Punch'}</span></td>
                                            <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>{r.reason}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <span className={`status-pill status-${r.status}`}>{r.status}</span>
                                                    {r.status === 'pending' && (
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                            {r.current_level === 2 ? `Awaiting ${users.find(u => u.id === r.level2_approver_id)?.name || 'Functional Manager'}'s Approval` : `Awaiting ${users.find(u => u.id === r.level1_approver_id)?.name || 'Reporting Manager'}'s Approval`}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            {canManageAttendance && (
                                                <td>
                                                    {r.status === 'pending' ? (() => {
                                                        const isL1 = r.current_level === 1 && r.level1_approver_id === currentUser.id;
                                                        const isL2 = r.current_level === 2 && r.level2_approver_id === currentUser.id;
                                                        const isSuper = currentUser.role === 'super_admin' || currentUser.role === 'hr_admin';
                                                        const totalLevels = r.level2_approver_id ? 2 : 1;
                                                        const alreadyActed = (r.approvals || []).some(a => a.approvedBy === currentUser.id);

                                                        if (isL1 || isL2 || isSuper) return (
                                                            <div style={{ display: 'flex', gap: 6 }}>
                                                                {alreadyActed ? (
                                                                    <span style={{ fontSize: '0.72rem', color: 'var(--brand-primary-light)', fontWeight: 600 }}>✓ Action Taken</span>
                                                                ) : (
                                                                    <>
                                                                        <button className="btn btn-primary btn-sm" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => approveRegularization(r.id, currentUser.id, 'Approved', r.current_level, totalLevels)}>Approve</button>
                                                                        <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => rejectRegularization(r.id, currentUser.id, 'Rejected')}>Reject</button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                        return <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Waiting for {r.current_level === 2 ? users.find(u => u.id === r.level2_approver_id)?.name : users.find(u => u.id === r.level1_approver_id)?.name}</span>;
                                                    })() : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No actions</span>}
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                                {regularizations.filter(r => canViewAll ? true : isManager ? teamUserIds.includes(r.employeeId) : r.employeeId === currentUser?.id).length === 0 && (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No correction requests found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── ADMIN GRID TABS ── */}
            {(activeTab === 'grid-status' || activeTab === 'grid-punches') && isAdminView && (
                <AttendanceGridAdmin
                    mode={activeTab === 'grid-status' ? 'status' : 'punches'}
                    attendance={attendance}
                    users={users}
                    leaveRequests={leaveRequests}
                />
            )}

            {showRegModal && (() => {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const minRegDate = sevenDaysAgo.toISOString().split('T')[0];
                const maxRegDate = new Date().toISOString().split('T')[0];
                const existing = attendance.find(a => (a.userId === currentUser.id) && a.date === regForm.date);
                
                return (
                    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRegModal(false)}>
                        <div className="modal-box" style={{ maxWidth: 480 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit size={18} color="var(--brand-primary-light)" /></div>
                                <h3 style={{ fontFamily: 'var(--font-display)' }}>Attendance Correction</h3>
                            </div>
                            
                            <div className="alert alert-info" style={{ marginBottom: 20, fontSize: '0.8rem' }}>
                                <AlertCircle size={14} style={{ flexShrink: 0 }} /> 
                                Corrections allowed for last 7 days only (since {new Date(sevenDaysAgo).toLocaleDateString()}).
                            </div>

                            {regError && <div className="alert alert-danger" style={{ marginBottom: 16, fontSize: '0.8rem' }}>{regError}</div>}

                            <form onSubmit={handleRegularization} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={regForm.date} 
                                        min={minRegDate}
                                        max={maxRegDate}
                                        onChange={e => {
                                            const d = e.target.value;
                                            const rec = attendance.find(a => (a.userId === currentUser.id) && a.date === d);
                                            setRegForm(f => ({ ...f, date: d, punchIn: rec?.punchIn || '', punchOut: rec?.punchOut || '' }));
                                            if (d < minRegDate) setRegError('Selection restricted to the last 7 days.');
                                            else setRegError('');
                                        }} 
                                        required 
                                    />
                                </div>

                                {regForm.date && (
                                    <div style={{ background: 'var(--bg-glass)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>Existing Backend Record</div>
                                        <div style={{ display: 'flex', gap: 24 }}>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Punch In</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{existing?.punchIn || '--:--'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Punch Out</div>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{existing?.punchOut || '--:--'}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Status</div>
                                                <span style={{ fontSize: '0.75rem' }} className={`status-pill status-${existing?.status || 'absent'}`}>{existing?.status || 'No Record'}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">Correction Type</label>
                                    <select className="form-select" value={regForm.correctionType} onChange={e => setRegForm(f => ({ ...f, correctionType: e.target.value }))}>
                                        <option value="missing_in">Missing Punch In</option>
                                        <option value="missing_out">Missing Punch Out</option>
                                        <option value="both">Both Punch In & Out Missing</option>
                                        <option value="wrong_status">Status Correction</option>
                                    </select>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label" style={{ opacity: regForm.correctionType === 'missing_out' ? 0.5 : 1 }}>Correct Punch In</label>
                                        <input 
                                            type="time" 
                                            className="form-input" 
                                            value={regForm.punchIn} 
                                            disabled={regForm.correctionType === 'missing_out'}
                                            onChange={e => setRegForm(f => ({ ...f, punchIn: e.target.value }))}
                                            required={regForm.correctionType !== 'missing_out'}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" style={{ opacity: regForm.correctionType === 'missing_in' ? 0.5 : 1 }}>Correct Punch Out</label>
                                        <input 
                                            type="time" 
                                            className="form-input" 
                                            value={regForm.punchOut} 
                                            disabled={regForm.correctionType === 'missing_in'}
                                            onChange={e => setRegForm(f => ({ ...f, punchOut: e.target.value }))}
                                            required={regForm.correctionType !== 'missing_in'} 
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Reason for Correction</label>
                                    <textarea 
                                        className="form-textarea" 
                                        placeholder="Please provide a valid reason for this request..." 
                                        value={regForm.reason} 
                                        onChange={e => setRegForm(f => ({ ...f, reason: e.target.value }))} 
                                        required 
                                        style={{ minHeight: 80 }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                                    <button type="button" className="btn btn-ghost" onClick={() => setShowRegModal(false)} disabled={isSubmittingReg}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={!!regError || !regForm.date || isSubmittingReg}>
                                        {isSubmittingReg ? 'Submitting...' : 'Submit Request'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}

            {/* HR Correction Modal */}
            {showHRModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowHRModal(false)}>
                    <div className="modal-box" style={{ maxWidth: 520 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={18} color="var(--brand-primary-light)" /></div>
                            <h3 style={{ fontFamily: 'var(--font-display)' }}>HR Attendance Correction</h3>
                        </div>
                        <div className="alert alert-info" style={{ marginBottom: 16 }}><AlertCircle size={15} style={{ flexShrink: 0 }} /> This directly overwrites attendance records.</div>
                        <form onSubmit={handleHRCorrection} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group">
                                <label className="form-label">Select Employee *</label>
                                <select className="form-select" value={hrForm.userId} onChange={e => setHRForm(f => ({ ...f, userId: e.target.value }))} required>
                                    <option value="">Select employee...</option>
                                    {users.filter(u => canViewAll || teamUserIds.includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.name} — {u.displayId}</option>)}
                                </select>
                            </div>
                            <div className="form-group"><label className="form-label">Date *</label><input type="date" className="form-input" value={hrForm.date} onChange={e => setHRForm(f => ({ ...f, date: e.target.value }))} required /></div>
                            <div className="form-group">
                                <label className="form-label">Attendance Status *</label>
                                <select className="form-select" value={hrForm.status} onChange={e => setHRForm(f => ({ ...f, status: e.target.value }))}>
                                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            {hrForm.status === 'leave' && <div className="form-group"><label className="form-label">Leave Type</label><select className="form-select" value={hrForm.leaveType} onChange={e => setHRForm(f => ({ ...f, leaveType: e.target.value }))}>{LEAVE_TYPES_HR.map(lt => <option key={lt} value={lt}>{lt}</option>)}</select></div>}
                            {hrForm.status === 'half-day' && <div className="form-group"><label className="form-label">Half Day Configuration</label><select className="form-select" value={hrForm.halfDayType} onChange={e => setHRForm(f => ({ ...f, halfDayType: e.target.value }))}><option value="">Select configuration...</option>{HALF_DAY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>}
                            {(hrForm.status === 'present' || hrForm.status === 'wfh') && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                    <div className="form-group"><label className="form-label">Punch In</label><input type="time" className="form-input" value={hrForm.punchIn} onChange={e => setHRForm(f => ({ ...f, punchIn: e.target.value }))} /></div>
                                    <div className="form-group"><label className="form-label">Punch Out</label><input type="time" className="form-input" value={hrForm.punchOut} onChange={e => setHRForm(f => ({ ...f, punchOut: e.target.value }))} /></div>
                                </div>
                            )}
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <select className="form-select" value={hrForm.location} onChange={e => setHRForm(f => ({ ...f, location: e.target.value }))}>
                                    <option value="office">Office</option><option value="wfh">Work From Home</option><option value="field">Field</option><option value="client_site">Client Site</option>
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

            {/* Camera Modal */}
            {showCamera && (
                <div className="modal-overlay">
                    <div className="modal-box" style={{ maxWidth: 400, textAlign: 'center' }}>
                        <h3 style={{ marginBottom: 16 }}>Attendance Verification</h3>
                        <div style={{ background: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden', aspectRatio: '4/3', marginBottom: 20, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CameraPreview />
                        </div>
                        <div className="alert alert-info" style={{ marginBottom: 20, fontSize: '0.8rem' }}><Shield size={14} /> Please face the camera to verify your identity for <strong>Punch {cameraAction === 'in' ? 'In' : 'Out'}</strong>.</div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                            <button className="btn btn-ghost" onClick={() => setShowCamera(false)} disabled={isPunching}>Cancel</button>
                            <button className="btn btn-primary" onClick={finalizePunch} disabled={isPunching}>{isPunching ? 'Verifying...' : 'Capture & Punch'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CameraPreview() {
    const videoRef = useRef(null);
    useEffect(() => {
        let stream = null;
        async function start() {
            try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); if (videoRef.current) videoRef.current.srcObject = stream; }
            catch (err) { console.error('Camera access denied', err); }
        }
        start();
        return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
    }, []);
    return <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
}

// ──────────────────────────────────────────────────────────────
// ADMIN GRID – Attendance History By Status / By Punches
// ──────────────────────────────────────────────────────────────
function AttendanceGridAdmin({ mode, attendance, users, leaveRequests }) {
    const now = new Date();
    const [filterMonth, setFilterMonth] = useState(now.getMonth()); // 0-indexed
    const [filterYear, setFilterYear] = useState(now.getFullYear());
    const [search, setSearch] = useState('');

    const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const yearStr = String(filterYear);
    const monthStr = String(filterMonth + 1).padStart(2, '0');

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.displayId?.toLowerCase().includes(search.toLowerCase()) ||
        u.employee_id?.toLowerCase().includes(search.toLowerCase())
    );

    function getStatusForDay(userId, day) {
        const dateStr = `${yearStr}-${monthStr}-${String(day).padStart(2, '0')}`;
        const rec = attendance.find(a => a.userId === userId && a.date === dateStr);
        
        // 1. ALWAYS check leaves first for the status (Source of Truth)
        const leaveRec = leaveRequests?.find(l => {
            const rawStart = l.from_date || l.from || '';
            const rawEnd = l.to_date || l.to || '';
            const s = rawStart.split('T')[0];
            const e = rawEnd.split('T')[0];
            const isApproved = l.status?.toLowerCase() === 'approved';
            const isMatchingUser = (l.employee_id === userId) || (l.employeeId === userId);
            return dateStr >= s && dateStr <= e && isApproved && isMatchingUser;
        });

        if (leaveRec) {
            const type = (leaveRec.type || '').toUpperCase();
            return { 
                status: type === 'WFH' ? 'wfh' : 'leave', 
                punchIn: rec?.punchIn || null, 
                punchOut: rec?.punchOut || null 
            };
        }

        // 2. If no leave, use attendance record status
        if (rec) return { status: rec.status?.toLowerCase(), punchIn: rec.punchIn, punchOut: rec.punchOut };

        // 3. Fallbacks
        const dateObj = new Date(dateStr);
        if (dateObj > new Date()) return { status: 'future', punchIn: null, punchOut: null };
        if (isSunday(day)) return { status: 'weekly-off', punchIn: null, punchOut: null };
        return { status: 'absent', punchIn: null, punchOut: null };
    }

    function isSunday(day) {
        return new Date(filterYear, filterMonth, day).getDay() === 0;
    }

    const cellW = 34;

    function exportToExcel() {
        const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        // Build header row
        const headerRow = [
            'Emp. ID',
            'Employee Name',
            'Designation',
            ...days.map(d => {
                const date = new Date(filterYear, filterMonth, d);
                const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
                return `${d} ${dayName}`;
            }),
            'Total Present',
            'Total Absent',
            'Total Leave',
        ];

        const dataRows = filteredUsers.map(user => {
            let totalP = 0, totalA = 0, totalL = 0;
            const dayCols = days.map(d => {
                const { status, punchIn, punchOut } = getStatusForDay(user.id, d);
                if (status === 'present') totalP++;
                else if (status === 'absent') totalA++;
                else if (status === 'leave') totalL++;
                if (mode === 'status') {
                    return status && status !== 'future' ? (STATUS_LABEL[status] || status) : '';
                } else {
                    if (punchIn || punchOut) return `${punchIn || '--:--'} / ${punchOut || '--:--'}`;
                    if (status === 'weekly-off') return 'WO';
                    if (status === 'absent') return '-';
                    if (status && status !== 'future') return STATUS_LABEL[status] || status;
                    return '';
                }
            });
            return [
                user.displayId || user.employee_id || '',
                user.name || '',
                user.designation || user.department || '',
                ...dayCols,
                totalP,
                totalA,
                totalL,
            ];
        });

        const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);

        // Style header row bold (basic column widths)
        ws['!cols'] = [
            { wch: 12 }, // Emp ID
            { wch: 24 }, // Name
            { wch: 18 }, // Designation
            ...days.map(() => ({ wch: mode === 'status' ? 5 : 14 })),
            { wch: 13 }, { wch: 13 }, { wch: 12 },
        ];

        const wb = XLSX.utils.book_new();
        const sheetName = mode === 'status' ? 'Attendance Status' : 'Attendance Punches';
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        const fileName = `Attendance_${mode === 'status' ? 'Status' : 'Punches'}_${MONTHS[filterMonth]}_${filterYear}.xlsx`;
        XLSX.writeFile(wb, fileName);
    }

    return (
        <div className="card" style={{ padding: 0, overflow: 'clip' }}>
            {/* Header + Filters */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                        {mode === 'status' ? 'Attendance History By Status' : 'Attendance History By Punches'}
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>{MONTHS[filterMonth]} {filterYear} — {filteredUsers.length} employees</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select className="form-select" style={{ width: 130, marginBottom: 0 }} value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}>
                        {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
                    </select>
                    <select className="form-select" style={{ width: 90, marginBottom: 0 }} value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search employee..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ paddingLeft: 32, width: 200, marginBottom: 0 }}
                        />
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={exportToExcel}
                        title="Export to Excel"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                    >
                        <Download size={14} /> Export Excel
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {mode === 'status' ? (
                    Object.entries(STATUS_COLORS).map(([s, c]) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            <div style={{ width: 20, height: 20, borderRadius: 4, background: `${c}22`, border: `1px solid ${c}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: c }}>{STATUS_LABEL[s]}</div>
                            {s}
                        </div>
                    ))
                ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Showing actual Punch In / Punch Out times. Sundays are highlighted.</span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }} />Sun
                </div>
            </div>

            {/* Scrollable Grid */}
            <div style={{ overflowX: 'auto', maxHeight: '65vh', overflowY: 'auto' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: '100%', fontSize: '0.76rem' }}>
                    <thead>
                        <tr>
                            <th style={{ position: 'sticky', left: 0, top: 0, zIndex: 6, background: 'var(--bg-card-solid)', padding: '10px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', minWidth: 90, color: 'var(--text-muted)' }}>Emp. ID</th>
                            <th style={{ position: 'sticky', left: 90, top: 0, zIndex: 6, background: 'var(--bg-card-solid)', padding: '10px 14px', textAlign: 'left', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border-subtle)', borderRight: '2px solid var(--border-subtle)', minWidth: 160, color: 'var(--text-muted)' }}>Employee Name</th>
                            {days.map(d => {
                                const sun = isSunday(d);
                                return (
                                    <th key={d} style={{ position: 'sticky', top: 0, zIndex: 2, padding: '8px 2px', textAlign: 'center', fontWeight: 700, fontSize: '0.68rem', borderBottom: '1px solid var(--border-subtle)', width: cellW, minWidth: cellW, background: sun ? 'rgba(239,68,68,0.15)' : 'var(--bg-card-solid)', color: sun ? '#ef4444' : 'var(--text-muted)' }}>
                                        {d}<br /><span style={{ fontSize: '0.58rem', fontWeight: 400 }}>{new Date(filterYear, filterMonth, d).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                                    </th>
                                );
                            })}
                            <th style={{ position: 'sticky', top: 0, right: 104, zIndex: 4, padding: '8px 10px', textAlign: 'center', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', background: 'rgba(16,185,129,0.18)', color: '#10b981', borderLeft: '2px solid var(--border-subtle)', minWidth: 52 }}>Total P</th>
                            <th style={{ position: 'sticky', top: 0, right: 52, zIndex: 4, padding: '8px 10px', textAlign: 'center', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', background: 'rgba(239,68,68,0.18)', color: '#ef4444', minWidth: 52 }}>Total A</th>
                            <th style={{ position: 'sticky', top: 0, right: 0, zIndex: 4, padding: '8px 10px', textAlign: 'center', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)', whiteSpace: 'nowrap', background: 'rgba(6,182,212,0.18)', color: '#06b6d4', minWidth: 52 }}>Total L</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user, ri) => {
                            const rowBg0 = 'var(--bg-card-solid)';
                            const rowBg1 = 'var(--bg-card-alt)';
                            const rowBg = ri % 2 === 0 ? rowBg0 : rowBg1;
                            let totalP = 0, totalA = 0, totalL = 0;
                            const dayCells = days.map(d => {
                                const { status, punchIn, punchOut } = getStatusForDay(user.id, d);
                                const sun = isSunday(d);
                                const cellBg = sun ? 'rgba(239,68,68,0.05)' : rowBg;
                                if (status === 'present') totalP++;
                                else if (status === 'absent') totalA++;
                                else if (status === 'leave') totalL++;
                                const color = STATUS_COLORS[status] || 'var(--text-muted)';

                                if (mode === 'status') {
                                    return (
                                        <td key={d} style={{ textAlign: 'center', padding: '6px 2px', background: cellBg, borderBottom: '1px solid var(--border-subtle)', width: cellW }}>
                                            {status && status !== 'future' ? (
                                                <div title={status} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 22, borderRadius: 4, background: `${color}20`, border: `1px solid ${color}50`, fontSize: '0.6rem', fontWeight: 700, color, userSelect: 'none' }}>
                                                    {STATUS_LABEL[status] || '?'}
                                                </div>
                                            ) : <span style={{ color: 'var(--border-subtle)', fontSize: '0.65rem' }}>–</span>}
                                        </td>
                                    );
                                } else {
                                    return (
                                        <td key={d} style={{ textAlign: 'center', padding: '4px 1px', background: cellBg, borderBottom: '1px solid var(--border-subtle)', width: cellW, minWidth: cellW }}>
                                            {(punchIn || punchOut) ? (
                                                <div
                                                    title={`In: ${punchIn || '—'}  |  Out: ${punchOut || '—'}`}
                                                    style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 26, height: 22, borderRadius: 4, background: `${STATUS_COLORS['present']}20`, border: `1px solid ${STATUS_COLORS['present']}50`, cursor: 'default', gap: 0, userSelect: 'none' }}
                                                >
                                                    <span style={{ color: '#10b981', fontSize: '0.45rem', lineHeight: 1.1, fontWeight: 700 }}>{punchIn ? punchIn.slice(0,5) : '–'}</span>
                                                    <span style={{ color: '#f43f5e', fontSize: '0.45rem', lineHeight: 1.1, fontWeight: 700 }}>{punchOut ? punchOut.slice(0,5) : '–'}</span>
                                                </div>
                                            ) : status && status !== 'future' ? (
                                                <div
                                                    title={status === 'weekly-off' ? 'Weekly Off' : `In: ${punchIn || '—'}  |  Out: ${punchOut || '—'}`}
                                                    style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 26, height: 22, borderRadius: 4, background: `${color}22`, border: `1px solid ${color}40`, cursor: 'default', gap: 0, userSelect: 'none' }}
                                                >
                                                    {status === 'weekly-off' ? (
                                                        <span style={{ color: color, fontSize: '0.6rem', fontWeight: 800 }}>WO</span>
                                                    ) : status === 'absent' ? (
                                                        <span style={{ color: color, fontSize: '1rem', fontWeight: 700, paddingBottom: 2 }}>-</span>
                                                    ) : (
                                                        <span style={{ color: color, fontSize: '0.6rem', fontWeight: 800 }}>{STATUS_LABEL[status] || status}</span>
                                                    )}
                                                </div>
                                            ) : <span style={{ color: 'var(--border-subtle)', fontSize: '0.65rem' }}>–</span>}
                                        </td>
                                    );
                                }
                            });

                            return (
                                <tr key={user.id}>
                                    <td style={{ position: 'sticky', left: 0, zIndex: 2, width: 90, minWidth: 90, background: rowBg, padding: '8px 12px', fontWeight: 700, fontSize: '0.75rem', color: 'var(--brand-primary-light)', borderBottom: '1px solid var(--border-subtle)', borderRight: '1px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>
                                        {user.displayId || user.employee_id || '—'}
                                    </td>
                                    <td style={{ position: 'sticky', left: 90, zIndex: 2, width: 160, minWidth: 160, background: rowBg, padding: '8px 14px', fontWeight: 600, fontSize: '0.8rem', borderBottom: '1px solid var(--border-subtle)', borderRight: '2px solid var(--border-subtle)', whiteSpace: 'nowrap' }}>
                                        <div>{user.name}</div>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>{user.designation || user.department}</div>
                                    </td>
                                    {dayCells}
                                    <td style={{ position: 'sticky', right: 104, zIndex: 2, width: 52, minWidth: 52, textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', color: '#10b981', background: 'var(--bg-card-solid)', boxShadow: 'inset 0 0 0 9999px rgba(16,185,129,0.1)', borderBottom: '1px solid var(--border-subtle)', borderLeft: '2px solid var(--border-subtle)', padding: '8px 6px' }}>{totalP}</td>
                                    <td style={{ position: 'sticky', right: 52, zIndex: 2, width: 52, minWidth: 52, textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', color: '#ef4444', background: 'var(--bg-card-solid)', boxShadow: 'inset 0 0 0 9999px rgba(239,68,68,0.1)', borderBottom: '1px solid var(--border-subtle)', padding: '8px 6px' }}>{totalA}</td>
                                    <td style={{ position: 'sticky', right: 0, zIndex: 2, width: 52, minWidth: 52, textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', color: '#06b6d4', background: 'var(--bg-card-solid)', boxShadow: 'inset 0 0 0 9999px rgba(6,182,212,0.1)', borderBottom: '1px solid var(--border-subtle)', padding: '8px 6px' }}>{totalL}</td>
                                </tr>
                            );
                        })}
                        {filteredUsers.length === 0 && (
                            <tr><td colSpan={days.length + 5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No employees found matching your search.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
