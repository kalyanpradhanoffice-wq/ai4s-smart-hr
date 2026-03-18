'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DollarSign, Calendar, Target, Award, Star, TrendingUp, Clock, Heart, Send, Download } from 'lucide-react';
import { calculateEPF, calculateESI } from '@/lib/mockData';

function EmployeeContent() {
    const router = useRouter();
    const { currentUser, users, leaveRequests, leaveBalances, payroll, okrs, kudos, sendKudos, LEAVE_TYPES, activityHistory } = useApp();
    const [kudosMsg, setKudosMsg] = useState('');
    const [kudosTo, setKudosTo] = useState('');
    const [kudosBadge, setKudosBadge] = useState('🚀');

    const myLeaves = leaveRequests.filter(l => l.employeeId === currentUser?.id);
    const myBalance = leaveBalances.find(b => b.userId === currentUser?.id);
    const myPayslip = payroll.filter(p => p.userId === currentUser?.id).sort((a, b) => new Date(b.paidOn || 0) - new Date(a.paidOn || 0))[0];
    const myOKR = okrs.find(o => o.userId === currentUser?.id);
    const myKudos = kudos.filter(k => k.toId === currentUser?.id);
    const allKudos = kudos.slice(0, 8);
    const peers = users.filter(u => u.id !== currentUser?.id && u.role === 'employee');

    function handleSendKudos(e) {
        e.preventDefault();
        if (!kudosTo || !kudosMsg) return;
        sendKudos(currentUser.id, kudosTo, kudosBadge, kudosMsg);
        setKudosMsg('');
        setKudosTo('');
    }

    async function handleDownloadPayslip() {
        if (!myPayslip) return;
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();

        const basic = myPayslip.basic || 0;
        const hra = myPayslip.hra || 0;
        const allowances = myPayslip.specialAllowance || 0;
        const gross = myPayslip.gross || 0;
        const epf = calculateEPF(basic, false);
        const esi = calculateESI(gross);
        const pt = myPayslip.professionalTax || 0;
        const tds = myPayslip.tds || 0;
        const totalDeductions = myPayslip.totalDeductions || 0;
        const netPay = myPayslip.netPay || 0;
        const regime = myPayslip.regime || 'new';

        // Header
        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageW, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('AI4S Smart HR', 14, 12);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('EMPLOYEE PAYSLIP', 14, 22);
        doc.text(myPayslip.month || 'February 2025', pageW - 14, 22, { align: 'right' });

        // Employee Info
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Details', 14, 42);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const details = [
            [`Name: ${currentUser?.name}`, `Employee ID: ${currentUser?.employeeId}`],
            [`Designation: ${currentUser?.designation}`, `Department: ${currentUser?.department}`],
            [`Tax Regime: ${regime.toUpperCase()}`, `Working Days: ${myPayslip.workingDays || 28}`],
        ];
        details.forEach((row, i) => {
            doc.text(row[0], 14, 52 + i * 8);
            doc.text(row[1], pageW / 2, 52 + i * 8);
        });
        doc.setDrawColor(220, 220, 220);
        doc.line(14, 78, pageW - 14, 78);

        // Earnings
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129);
        doc.text('EARNINGS', 14, 86);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        [
            ['Basic Salary', `Rs ${basic.toLocaleString()}`],
            ['House Rent Allowance', `Rs ${hra.toLocaleString()}`],
            ['Special Allowances', `Rs ${allowances.toLocaleString()}`],
        ].forEach((row, i) => {
            doc.text(row[0], 14, 94 + i * 8);
            doc.text(row[1], pageW / 2 - 10, 94 + i * 8, { align: 'right' });
        });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('Gross Salary', 14, 122);
        doc.text(`Rs ${gross.toLocaleString()}`, pageW / 2 - 10, 122, { align: 'right' });
        doc.line(14, 126, pageW / 2 - 10, 126);

        // Deductions
        doc.setTextColor(239, 68, 68);
        doc.text('DEDUCTIONS', pageW / 2 + 5, 86);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        [
            ['EPF (Employee 12%)', `Rs ${epf.employee.toLocaleString()}`],
            ['ESI (0.75%)', `Rs ${esi.employee.toLocaleString()}`],
            ['Professional Tax', `Rs ${pt.toLocaleString()}`],
            [`TDS (${regime === 'old' ? 'Old' : 'New'} Regime)`, `Rs ${tds.toLocaleString()}`],
        ].forEach((row, i) => {
            doc.text(row[0], pageW / 2 + 5, 94 + i * 8);
            doc.text(row[1], pageW - 14, 94 + i * 8, { align: 'right' });
        });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text('Total Deductions', pageW / 2 + 5, 122);
        doc.text(`Rs ${totalDeductions.toLocaleString()}`, pageW - 14, 122, { align: 'right' });
        doc.line(pageW / 2 + 5, 126, pageW - 14, 126);

        // Net Pay highlight
        doc.setFillColor(99, 102, 241);
        doc.rect(14, 132, pageW - 28, 22, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('NET PAY (TAKE HOME)', 20, 142);
        doc.setFontSize(14);
        doc.text(`Rs ${netPay.toLocaleString()}`, pageW - 20, 142, { align: 'right' });

        // Footer
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('This is a system-generated payslip from AI4S Smart HR. No signature required.', 14, 168);
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 174);

        doc.save(`Payslip_${currentUser?.name?.replace(/\s+/g, '_')}_${(myPayslip.month || 'Feb_2025').replace(/\s+/g, '_')}.pdf`);
    }

    const badges = ['🚀', '⭐', '💡', '🏆', '❤️', '🎯', '🔥', '👏'];

    return (
        <div className="animate-fade-in">
            {/* Welcome Banner */}
            <div style={{ background: 'var(--gradient-card)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '24px 32px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, background: 'var(--gradient-brand)', borderRadius: '50%', opacity: 0.06 }} />
                <div className="avatar avatar-lg">{currentUser?.avatar}</div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>{currentUser?.name}</h2>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{currentUser?.designation} • {currentUser?.department} • {currentUser?.employeeId}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => router.push('/dashboard/leaves')}>Apply Leave</button>
                    <button className="btn btn-primary btn-sm" onClick={handleDownloadPayslip} disabled={!myPayslip}>
                        <Download size={14} /> Download Payslip
                    </button>
                </div>
            </div>

            <div className="grid-4" style={{ marginBottom: 28 }}>
                {[
                    { label: 'Net Pay (Feb)', value: `₹${myPayslip?.netPay?.toLocaleString() || '—'}`, color: '#10b981', sub: 'February 2025' },
                    { label: 'Leave Balance (CL)', value: myBalance?.CL ?? '—', color: '#06b6d4', sub: 'Casual Leave' },
                    { label: 'Leave Balance (EL)', value: myBalance?.EL ?? '—', color: '#6366f1', sub: 'Earned Leave' },
                    { label: 'OKR Progress', value: myOKR ? `${myOKR.overallProgress}%` : '—', color: '#f59e0b', sub: 'Q1 2025' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginTop: 8 }}>{s.value}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
                {/* My OKR Progress */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>My OKR — Q1 2025</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/okr')}>Details →</button>
                    </div>
                    {myOKR ? (
                        <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12 }}>{myOKR.objective}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {myOKR.keyResults.map(kr => {
                                    const pct = Math.round((kr.current / kr.target) * 100);
                                    return (
                                        <div key={kr.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
                                                <span style={{ color: 'var(--text-secondary)' }}>{kr.title}</span>
                                                <span style={{ color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>{pct}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div className="progress-bar" style={{ flex: 1 }}>
                                    <div className="progress-fill" style={{ width: `${myOKR.overallProgress}%` }} />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary-light)' }}>{myOKR.overallProgress}% overall</span>
                            </div>
                        </div>
                    ) : <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No OKRs assigned yet.</div>}
                </div>

                {/* Recent Leaves */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>My Leave History</h3>
                        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/leaves')}>Apply →</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {myLeaves.length === 0 ? <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No leave requests yet.</div> : (
                            myLeaves.map(lr => (
                                <div key={lr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{lr.type} Leave</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lr.from} → {lr.to}</div>
                                    </div>
                                    <span className={`status-pill status-${lr.status}`}>{lr.status}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Kudos Feed + Send Kudos */}
            <div className="grid-2">
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>🏆 Team Kudos Feed</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {allKudos.map(k => {
                            const from = users.find(u => u.id === k.fromId);
                            const to = users.find(u => u.id === k.toId);
                            return (
                                <div key={k.id} style={{ display: 'flex', gap: 10, padding: '12px', borderRadius: 'var(--radius-md)', background: k.toId === currentUser?.id ? 'rgba(99,102,241,0.06)' : 'var(--bg-glass)', border: `1px solid ${k.toId === currentUser?.id ? 'rgba(99,102,241,0.2)' : 'var(--border-subtle)'}` }}>
                                    <div style={{ fontSize: '1.5rem' }}>{k.badge}</div>
                                    <div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}><span style={{ color: 'var(--brand-primary-light)' }}>{from?.name}</span> → <span style={{ color: '#34d399' }}>{to?.name}</span></div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 3 }}>{k.message}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>✨ Send Kudos</h3>
                    <form onSubmit={handleSendKudos} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="form-group">
                            <label className="form-label">Recipient</label>
                            <select className="form-select" value={kudosTo} onChange={e => setKudosTo(e.target.value)} required>
                                <option value="">Select colleague...</option>
                                {users.filter(u => u.id !== currentUser?.id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Badge</label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {badges.map(b => (
                                    <button key={b} type="button" onClick={() => setKudosBadge(b)}
                                        style={{ fontSize: '1.4rem', padding: '4px 8px', borderRadius: 8, border: `2px solid ${kudosBadge === b ? 'var(--brand-primary)' : 'var(--border-subtle)'}`, background: kudosBadge === b ? 'rgba(99,102,241,0.12)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Message</label>
                            <textarea className="form-textarea" placeholder="Write a appreciation message..." value={kudosMsg} onChange={e => setKudosMsg(e.target.value)} required style={{ minHeight: 60 }} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                            <Send size={15} /> Send Kudos
                        </button>
                    </form>
                </div>
            </div>

            {/* My Activity History */}
            <div className="card" style={{ marginTop: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>📋 My Activity History</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 15 events</span>
                </div>
                {(() => {
                    const myHistory = activityHistory
                        .filter(h => h.performedById === currentUser?.id || h.targetEmployeeId === currentUser?.id)
                        .slice(0, 15);
                    const MODULE_COLORS = {
                        Attendance: '#06b6d4', Leave: '#10b981', Payroll: '#f59e0b',
                        Employee: '#6366f1', Interview: '#8b5cf6', Security: '#ef4444',
                        Auth: '#84cc16', System: '#64748b',
                    };
                    if (myHistory.length === 0) return <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No activity recorded yet.</div>;
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {myHistory.map((h, idx) => {
                                const color = MODULE_COLORS[h.module] || '#6366f1';
                                return (
                                    <div key={h.id} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: idx < myHistory.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                                        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${color}18`, border: `2px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                                            </div>
                                            {idx < myHistory.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--border-subtle)', marginTop: 4 }} />}
                                        </div>
                                        <div style={{ flex: 1, paddingBottom: 4 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{h.action}</span>
                                                    <span style={{ marginLeft: 8, display: 'inline-block', padding: '1px 7px', borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: 700, background: `${color}18`, color }}>{h.module}</span>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                                                    {new Date(h.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3 }}>{h.description}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}

export default function EmployeePage() {
    return <DashboardLayout title="My Dashboard"><EmployeeContent /></DashboardLayout>;
}
