'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Users, Clock, CheckCheck, AlertTriangle, TrendingUp, DollarSign, Activity, Shield, FileText, Star, Briefcase, Edit, CreditCard } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell } from 'recharts';

// Constants removed to use dynamic data instead

function HRContent() {
    const router = useRouter();
    const { users, leaveRequests, payroll, notifications, regularizations, loans, salaryUpgrades } = useApp();

    const pendingRegs = (regularizations || []).filter(r => (r.status || '').toLowerCase() === 'pending').length;
    const pendingLoans = (loans || []).filter(l => (l.status || '').toLowerCase() === 'pending').length;
    const pendingUpgrades = (salaryUpgrades || []).filter(s => (s.status || '').toLowerCase() === 'pending').length;
    const pendingTotal = pendingRegs + pendingLoans + pendingUpgrades;
    const approved = leaveRequests.filter(l => (l.status || '').toLowerCase() === 'approved').length;
    const totalPayroll = payroll.reduce((s, p) => s + p.netPay, 0);
    const todayStr = new Date().toISOString().split('T')[0];
    const onLeave = leaveRequests.filter(l => {
        const isApproved = (l.status || '').toLowerCase() === 'approved';
        const s = (l.from_date || l.from || '').split('T')[0];
        const e = (l.to_date || l.to || '').split('T')[0];
        return isApproved && todayStr >= s && todayStr <= e;
    }).length;

    // --- Dynamic Analytics Transformation ---
    const getPayrollTrend = () => {
        if (!payroll || payroll.length === 0) return [];
        
        // Group by month
        const monthlyData = payroll.reduce((acc, p) => {
            const date = new Date(p.processed_on || p.paidOn || new Date());
            const monthKey = date.toLocaleString('en-IN', { month: 'short' });
            acc[monthKey] = (acc[monthKey] || 0) + (Number(p.net_pay || p.netPay) || 0);
            return acc;
        }, {});

        // Get last 6 months in order
        const trend = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const m = d.toLocaleString('en-IN', { month: 'short' });
            trend.push({ month: m, amount: monthlyData[m] || 0 });
        }
        return trend;
    };

    const getComplianceHealth = () => {
        const now = new Date();
        const day = now.getDate();
        const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevMonthKey = prevMonthDate.toISOString().substring(0, 7); // YYYY-MM
        
        // Check if previous month's payroll is processed
        const isPrevMonthPayrollProcessed = payroll.some(p => {
            const pDate = new Date(p.processed_on || p.paidOn);
            return pDate.toISOString().substring(0, 7) === prevMonthKey;
        });

        return [
            { label: 'EPF Filing (15th)', status: isPrevMonthPayrollProcessed ? 'green' : (day > 15 ? 'red' : 'orange'), due: `15th of ${now.toLocaleString('en-IN', { month: 'short' })}` },
            { label: 'ESI Challan (15th)', status: isPrevMonthPayrollProcessed ? 'green' : (day > 15 ? 'red' : 'orange'), due: `15th of ${now.toLocaleString('en-IN', { month: 'short' })}` },
            { label: 'TDS Deposit (7th)', status: isPrevMonthPayrollProcessed ? 'green' : (day > 7 ? 'red' : 'orange'), due: `7th of ${now.toLocaleString('en-IN', { month: 'short' })}` },
            { label: 'Professional Tax', status: 'green', due: 'End of Month' },
            { label: 'Labour Welfare Fund', status: 'green', due: 'Quarterly' },
        ];
    };

    const currentPayrollTrend = getPayrollTrend();
    const currentComplianceItems = getComplianceHealth();

    // --- Analytics Transformation ---
    const deptHeadcount = users.reduce((acc, user) => {
        const dept = user.department || 'Unassigned';
        if (!acc[dept]) {
            acc[dept] = { name: dept, total: 0, designations: {} };
        }
        acc[dept].total++;
        const desg = user.designation || 'Staff';
        acc[dept].designations[desg] = (acc[dept].designations[desg] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.values(deptHeadcount).sort((a, b) => b.total - a.total);
    const chartColors = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6', '#f43f5e', '#ec4899'];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">HR Admin Dashboard</h1>
                    <p className="page-subtitle">Workforce overview & compliance health</p>
                </div>
                <button className="btn btn-primary" onClick={() => router.push('/dashboard/payroll')}>
                    <DollarSign size={16} /> Run Payroll
                </button>
            </div>

            {/* Stats row */}
            <div className="grid-4" style={{ marginBottom: 20 }}>
                {[
                    { label: 'Total Employees', value: users.length, icon: Users, color: '#6366f1', sub: 'All departments', href: '/dashboard/employees' },
                    { label: 'On Leave Today', value: onLeave, icon: Clock, color: '#f59e0b', sub: 'Approved leaves', href: '/dashboard/attendance-request' },
                    { label: 'Pending Approvals', value: pendingTotal, icon: AlertTriangle, color: '#ef4444', sub: 'Non-leave requests', href: '/dashboard/approvals' },
                    { label: 'Payroll (Total)', value: `₹${(totalPayroll / 1000).toFixed(0)}K`, icon: DollarSign, color: '#10b981', sub: 'Net disbursed', href: '/dashboard/payroll' },
                ].map(s => (
                    <div key={s.label} className="stat-card"
                        onClick={() => router.push(s.href)}
                        style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}20`; }}
                        onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginTop: 8 }}>{s.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
                            </div>
                            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <s.icon size={20} color={s.color} />
                            </div>
                        </div>
                        <div style={{ marginTop: 8, fontSize: '0.7rem', color: s.color, fontWeight: 600 }}>Click to view →</div>
                    </div>
                ))}
            </div>

            {/* Sub-Approvals Row */}
            <div className="grid-3" style={{ marginBottom: 28 }}>
                {[
                    { label: 'Attendance Corrections', value: pendingRegs, icon: Edit, color: '#6366f1', href: '/dashboard/attendance-request?tab=requests' },
                    { label: 'Loan Requests', value: pendingLoans, icon: CreditCard, color: '#8b5cf6', href: '/dashboard/loans' },
                    { label: 'Salary Upgrades', value: pendingUpgrades, icon: TrendingUp, color: '#ec4899', href: '/dashboard/payroll?tab=upgrades' },
                ].map(s => (
                    <div key={s.label} className="stat-card"
                        onClick={() => router.push(s.href)}
                        style={{ cursor: 'pointer', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <s.icon size={18} color={s.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{s.label}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-main)', marginTop: 2 }}>{s.value} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Pending</span></div>
                        </div>
                        <div style={{ color: 'var(--text-muted)', opacity: 0.5 }}>→</div>
                    </div>
                ))}
            </div>

            {/* Analytics Section */}
            <div className="grid-2" style={{ marginBottom: 28 }}>
                <div className="card">
                    <div style={{ marginBottom: 20 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Headcount by Department</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Top departments by employee volume</p>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={chartData} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={100} />
                            <Tooltip 
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12 }}
                            />
                            <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={24}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: 20 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Designation Breakdown</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Distribution across core roles</p>
                    </div>
                    <div className="scroll-y" style={{ flex: 1, maxHeight: 260, overflowY: 'auto', paddingRight: 8 }}>
                        {chartData.map((dept, dIdx) => (
                            <div key={dept.name} style={{ marginBottom: 24 }}>
                                <div style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 800, 
                                    color: chartColors[dIdx % chartColors.length], 
                                    marginBottom: 10, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    paddingBottom: 6,
                                    borderBottom: `2px solid ${chartColors[dIdx % chartColors.length]}15`
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Briefcase size={13} /> {dept.name}
                                    </div>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>{dept.total} Total</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {Object.entries(dept.designations).map(([desg, count]) => (
                                        <div key={desg} style={{ 
                                            padding: '8px 12px', 
                                            background: 'var(--bg-glass)', 
                                            border: '1px solid var(--border-subtle)', 
                                            borderRadius: 8, 
                                            fontSize: '0.82rem', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'space-between',
                                            transition: 'transform 0.1s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.01)'}
                                        onMouseOut={e => e.currentTarget.style.transform = ''}
                                        >
                                            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{desg}</span>
                                            <span style={{ 
                                                minWidth: 24, 
                                                height: 24, 
                                                borderRadius: '50%', 
                                                background: `${chartColors[dIdx % chartColors.length]}15`, 
                                                color: chartColors[dIdx % chartColors.length], 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                border: `1px solid ${chartColors[dIdx % chartColors.length]}30`
                                            }}>{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
                {/* Payroll Trend */}
                <div className="card">
                    <div style={{ marginBottom: 16 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Payroll Trend</h3>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Net salary disbursed monthly (₹)</p>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={currentPayrollTrend}>
                            <defs>
                                <linearGradient id="payGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickFormatter={v => `${v / 1000}K`} />
                            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8 }} formatter={v => [`₹${v.toLocaleString()}`, 'Net Pay']} />
                            <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fill="url(#payGrad)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Compliance Health */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Compliance Health</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {currentComplianceItems.map(c => (
                            <div key={c.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.status === 'green' ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{c.label}</span>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due: {c.due}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leave Requests */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Leave Requests</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/attendance-request?tab=history')}>View All →</button>
                </div>
                <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                    <table className="data-table">
                        <thead><tr><th>Employee</th><th>Type</th><th>Duration</th><th>Reason</th><th>Status</th></tr></thead>
                        <tbody>
                            {leaveRequests.map(lr => {
                                const emp = users.find(u => u.id === lr.employeeId);
                                return (
                                    <tr key={lr.id}>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div className="avatar avatar-sm">{emp?.avatar}</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>{emp?.name}</div>
                                        </td>
                                        <td><span className="badge badge-primary">{lr.type}</span></td>
                                        <td style={{ fontSize: '0.82rem' }}>{lr.from} → {lr.to} <span style={{ color: 'var(--text-muted)' }}>({lr.days}d)</span></td>
                                        <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>{lr.reason}</td>
                                        <td><span className={`status-pill status-${lr.status}`}>{lr.status}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function HRPage() {
    return <DashboardLayout title="HR Admin Dashboard"><HRContent /></DashboardLayout>;
}
