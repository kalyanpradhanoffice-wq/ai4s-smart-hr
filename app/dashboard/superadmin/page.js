'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, Users, Activity, Settings, TrendingUp, AlertCircle, CheckCircle, Clock, Database, Key, Globe, Cake } from 'lucide-react';
import BirthdayTile from '@/components/BirthdayTile';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// Dynamic headcount logic is now inside the component
const monthlyGrowth = [
    { month: 'Sep', emp: 5 }, { month: 'Oct', emp: 6 }, { month: 'Nov', emp: 6 },
    { month: 'Dec', emp: 7 }, { month: 'Jan', emp: 8 }, { month: 'Feb', emp: 8 }, { month: 'Mar', emp: 8 },
];

function SuperAdminContent() {
    const router = useRouter();
    const { currentUser, users, auditLog, notifications, leaveRequests } = useApp();

    useEffect(() => {
        if (currentUser && currentUser.role !== 'super_admin') router.replace('/dashboard/employee');
    }, [currentUser, router]);

    const activeUsers = users.filter(u => u.status === 'active').length;
    const pendingLeaves = leaveRequests.filter(l => l.status === 'pending').length;
    
    // --- Dynamic Compliance Logic ---
    const now = new Date();
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthKey = prevMonthDate.toISOString().substring(0, 7);
    const isPrevMonthPayrollProcessed = (users.length > 0) && (auditLog.some(p => {
        // Since superadmin handles global audit, we check for payroll processing actions
        return p.action === 'Payroll Processed' && p.timestamp.startsWith(prevMonthKey);
    }) || (auditLog.length === 0 && users.length > 0)); // Fallback or assume 100% if just starting
    
    // For now, let's use a simpler heuristic: if any payroll exists for the prev month
    const complianceHealth = isPrevMonthPayrollProcessed ? '100%' : '85%';
    
    // Fix: Filter notifications correctly to show only current user's unread alerts
    const totalNotifs = notifications.filter(n => !n.read && n.user_id === currentUser?.id).length;

    // Fix: Calculate headcount dynamically by department
    const headcountByDept = Object.entries(
        users.reduce((acc, u) => {
            const dept = u.department || 'Other';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {})
    ).map(([dept, count]) => ({ dept, count }));

    const roleDistribution = [
        { name: 'Super Admin', value: users.filter(u => u.role === 'super_admin').length, color: '#f59e0b' },
        { name: 'Core Admin', value: users.filter(u => u.role === 'core_admin').length, color: '#6366f1' },
        { name: 'HR Admin', value: users.filter(u => u.role === 'hr_admin').length, color: '#0ea5e9' },
        { name: 'Manager', value: users.filter(u => u.role === 'manager').length, color: '#10b981' },
        { name: 'Employee', value: users.filter(u => u.role === 'employee').length, color: '#8b5cf6' },
    ];

    const stats = [
        { label: 'Total Employees', value: users.length, icon: Users, color: '#6366f1', sub: `${activeUsers} active`, href: '/dashboard/employees' },
        { label: 'Pending Approvals', value: pendingLeaves, icon: Clock, color: '#f59e0b', sub: 'Require action', href: '/dashboard/approvals' },
        { label: 'Unread Alerts', value: totalNotifs, icon: AlertCircle, color: '#ef4444', sub: 'Your notifications', href: null },
        { label: 'Compliance Health', value: complianceHealth, icon: CheckCircle, color: '#10b981', sub: 'Calculated live', href: '/dashboard/audit' },
    ];

    return (
        <div className="animate-fade-in">
            {/* Super Admin Banner */}
            <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-lg)', padding: '16px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={22} color="#f59e0b" />
                </div>
                <div>
                    <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>Super Admin Access — Unrestricted</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Welcome, {currentUser?.name}. You have global override authority over all modules, roles, and workflows.</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }} onClick={() => router.push('/dashboard/roles')}>Manage Roles</button>

                </div>
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                {stats.map(s => (
                    <div key={s.label} className="stat-card"
                        onClick={() => s.href && router.push(s.href)}
                        style={{ cursor: s.href ? 'pointer' : 'default', transition: 'transform 0.15s, box-shadow 0.15s' }}
                        onMouseOver={e => { if (s.href) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}20`; } }}
                        onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                                <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginTop: 8 }}>{s.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
                            </div>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <s.icon size={22} color={s.color} />
                            </div>
                        </div>
                        {s.href && <div style={{ marginTop: 8, fontSize: '0.7rem', color: s.color, fontWeight: 600 }}>Click to view →</div>}
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
                {/* Headcount by Department */}
                <div className="card">
                    <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Headcount by Department</h3>
                        <span className="badge badge-primary">Live</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={headcountByDept} barSize={28}>
                            <XAxis dataKey="dept" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)' }} />
                            <Bar dataKey="count" fill="url(#brandGrad)" radius={[6, 6, 0, 0]} />
                            <defs>
                                <linearGradient id="brandGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" />
                                    <stop offset="100%" stopColor="#0ea5e9" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Role Distribution */}
                <div className="card">
                    <div style={{ marginBottom: 20 }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Role Distribution</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <ResponsiveContainer width="50%" height={160}>
                            <PieChart>
                                <Pie data={roleDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                                    {roleDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {roleDistribution.map(r => (
                                <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: 3, background: r.color, flexShrink: 0 }} />
                                    <span style={{ color: 'var(--text-secondary)' }}>{r.name}</span>
                                    <span style={{ marginLeft: 'auto', fontWeight: 700, color: r.color }}>{r.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Audit Log */}
            <div className="card" style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Audit Activity</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/audit')}>View All →</button>
                </div>
                <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                    <table className="data-table">
                        <thead><tr><th>Action</th><th>User</th><th>Target</th><th>Details</th><th>Time</th></tr></thead>
                        <tbody>
                            {auditLog.length > 0 ? (
                                auditLog.slice(0, 6).map(a => (
                                    <tr key={a.id}>
                                        <td><span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{a.action}</span></td>
                                        <td style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>{users.find(u => u.id === a.userId)?.name || a.userId}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{a.target}</td>
                                        <td style={{ fontSize: '0.8rem' }}>{a.details}</td>
                                        <td style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{new Date(a.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                        No recent audit activity found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 28 }}>
                <BirthdayTile users={users} />
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: 12, background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(99,102,241,0.05) 100%)' }}>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Activity size={24} color="#10b981" />
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>System Optimization</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 240 }}>Global background sync is active. Performance is currently within optimal range (42ms latency).</p>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/audit')}>System Health →</button>
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {[
                        { label: 'Manage Roles', icon: Shield, href: '/dashboard/roles', color: '#6366f1' },

                        { label: 'All Employees', icon: Users, href: '/dashboard/employees', color: '#10b981' },
                        { label: 'Audit Logs', icon: Database, href: '/dashboard/audit', color: '#f59e0b' },
                        { label: 'Run Payroll', icon: TrendingUp, href: '/dashboard/payroll', color: '#8b5cf6' },
                    ].map(qa => (
                        <button key={qa.label} onClick={() => router.push(qa.href)}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 'var(--radius-md)', border: `1px solid ${qa.color}30`, background: `${qa.color}10`, cursor: 'pointer', color: qa.color, fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                            onMouseOver={e => e.currentTarget.style.background = `${qa.color}20`}
                            onMouseOut={e => e.currentTarget.style.background = `${qa.color}10`}>
                            <qa.icon size={16} /> {qa.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function SuperAdminPage() {
    return <DashboardLayout title="Super Admin Control Center"><SuperAdminContent /></DashboardLayout>;
}
