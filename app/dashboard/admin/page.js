'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { DEFAULT_ROLES, PERMISSIONS } from '@/lib/mockData';
import { getRoleMeta, can } from '@/lib/rbac';
import { Building, Users, Shield, Wifi, TrendingUp, Settings, Activity, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

function AdminContent() {
    const router = useRouter();
    const { currentUser, users, customRoles, leaveRequests, loans, salaryUpgrades, auditLog, securityConfig } = useApp();

    const canManage = can(currentUser, PERMISSIONS.MANAGE_ROLES, customRoles);

    const pendingApprovals = [
        ...leaveRequests.filter(l => l.status === 'pending').map(l => ({ ...l, workflow: 'Leave Request' })),
        ...loans.filter(l => l.status === 'pending').map(l => ({ ...l, workflow: 'Loan Request' })),
        ...salaryUpgrades.filter(s => s.status === 'pending').map(s => ({ ...s, workflow: 'Salary Upgrade' })),
    ];

    const allRoles = [...Object.values(DEFAULT_ROLES), ...customRoles];
    const quickLinks = [
        { label: 'Role Management', icon: Shield, href: '/dashboard/roles', desc: 'Manage roles & permissions', color: '#6366f1' },
        { label: 'Network Security', icon: Wifi, href: '/dashboard/security', desc: 'Wi-Fi restriction settings', color: '#0ea5e9' },
        { label: 'Employee Directory', icon: Users, href: '/dashboard/employees', desc: `${users.length} employees`, color: '#10b981' },
        { label: 'Payroll Settings', icon: TrendingUp, href: '/dashboard/payroll', desc: 'Statutory & payroll config', color: '#8b5cf6' },
        { label: 'Audit Logs', icon: Activity, href: '/dashboard/audit', desc: `${auditLog.length} entries`, color: '#f59e0b' },
        { label: 'Leave Policies', icon: Settings, href: '/dashboard/leaves', desc: 'Leave type configuration', color: '#ef4444' },
    ];

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Admin Control Hub</h1>
                    <p className="page-subtitle">Manage roles, security, and workflows across the organization</p>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid-4" style={{ marginBottom: 28 }}>
                {[
                    { label: 'Total Roles', value: allRoles.length, color: '#6366f1', href: '/dashboard/roles' },
                    { label: 'Custom Roles', value: customRoles.length, color: '#8b5cf6', href: '/dashboard/roles' },
                    { label: 'Pending Approvals', value: pendingApprovals.length, color: '#f59e0b', href: '/dashboard/approvals' },
                    { label: 'Network Policy', value: securityConfig.wifiRestrictionEnabled ? 'ACTIVE' : 'OFF', color: securityConfig.wifiRestrictionEnabled ? '#10b981' : '#ef4444', href: '/dashboard/security' },
                ].map(s => (
                    <div key={s.label} className="stat-card"
                        onClick={() => router.push(s.href)}
                        style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${s.color}20`; }}
                        onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginTop: 8 }}>{s.value}</div>
                        <div style={{ marginTop: 6, fontSize: '0.7rem', color: s.color, fontWeight: 600 }}>Click to view →</div>
                    </div>
                ))}
            </div>

            {/* Quick Links */}
            <div className="grid-3" style={{ marginBottom: 28 }}>
                {quickLinks.map(ql => (
                    <button key={ql.label} onClick={() => router.push(ql.href)}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: `1px solid ${ql.color}25`, background: `${ql.color}08`, cursor: 'pointer', fontFamily: 'var(--font-body)', textAlign: 'left', transition: 'all 0.15s' }}
                        onMouseOver={e => { e.currentTarget.style.background = `${ql.color}15`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = `${ql.color}08`; e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ql.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ql.icon size={20} color={ql.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: ql.color }}>{ql.label}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{ql.desc}</div>
                        </div>
                        <ChevronRight size={16} color={ql.color} />
                    </button>
                ))}
            </div>

            {/* Pending Approvals */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Pending Approvals (All Workflows)</h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/dashboard/approvals')}>View All →</button>
                </div>
                {pendingApprovals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No pending approvals. All clear! ✓</div>
                ) : (
                    <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                        <table className="data-table">
                            <thead><tr><th>Workflow</th><th>Employee</th><th>Details</th><th>Status</th><th>Level</th></tr></thead>
                            <tbody>
                                {pendingApprovals.slice(0, 8).map(a => {
                                    const emp = users.find(u => u.id === (a.employeeId || a.userId));
                                    return (
                                        <tr key={a.id}>
                                            <td><span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{a.workflow}</span></td>
                                            <td style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{emp?.name || 'Unknown'}</td>
                                            <td style={{ fontSize: '0.8rem' }}>{a.reason || a.purpose || `₹${a.proposedSalary?.toLocaleString()}`}</td>
                                            <td><span className="status-pill status-pending">Pending</span></td>
                                            <td><span className="badge badge-neutral">L{a.currentLevel}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminPage() {
    return <DashboardLayout title="Admin Control Hub"><AdminContent /></DashboardLayout>;
}
