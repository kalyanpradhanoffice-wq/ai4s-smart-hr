'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useRouter } from 'next/navigation';
import { ClipboardList, Calendar, DollarSign, User, ChevronRight } from 'lucide-react';

function ApprovalsContent() {
    const router = useRouter();
    const { leaveRequests, loans, salaryUpgrades, regularizations, users, currentUser, attendance } = useApp();

    const all = [
        ...leaveRequests.filter(l => l.status === 'pending').map(l => ({ ...l, type: 'Leave', cat: 'leave', href: '/dashboard/leaves' })),
        ...loans.filter(l => l.status === 'pending').map(l => ({ ...l, type: 'Loan', cat: 'loan', href: '/dashboard/loans' })),
        ...salaryUpgrades.filter(s => s.status === 'pending').map(s => ({ ...s, type: 'Salary Upgrade', cat: 'salary', href: '/dashboard/payroll' })),
        ...regularizations.filter(r => r.status === 'pending').map(r => ({ ...r, type: 'Regularization', cat: 'attendance', href: '/dashboard/attendance' })),
    ].filter(item => {
        if (currentUser?.role === 'super_admin') return true;
        if (item.current_level === 1) return item.level1_approver_id === currentUser?.id;
        if (item.current_level === 2) return item.level2_approver_id === currentUser?.id;
        return false;
    });

    const catIcons = { leave: Calendar, loan: DollarSign, salary: TrendingUp, attendance: ClipboardList };
    const catColors = { leave: '#06b6d4', loan: '#10b981', salary: '#8b5cf6', attendance: '#f59e0b' };

    function TrendingUp(props) { return <DollarSign {...props} /> }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div><h1 className="page-title">Approval Inbox</h1><p className="page-subtitle">{all.length} items awaiting action</p></div>
            </div>

            {all.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                    <ClipboardList size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                    <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>All Clear!</h3>
                    <p style={{ color: 'var(--text-muted)' }}>No pending approvals at this time.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {all.map(item => {
                        const emp = users.find(u => u.id === (item.employeeId || item.userId));
                        const color = catColors[item.cat] || '#6366f1';
                        return (
                            <div key={item.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '16px 20px', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', transition: 'all 0.15s' }}
                                onClick={() => router.push(item.href)}
                                onMouseOver={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = `${color}08`; }}
                                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-card)'; }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <ClipboardList size={20} color={color} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{item.type}</span>
                                         <span className="badge" style={{ fontSize: '0.65rem', background: item.current_level === 2 ? 'rgba(99,102,241,0.1)' : 'rgba(0,0,0,0.05)', color: item.current_level === 2 ? 'var(--brand-primary-light)' : 'var(--text-muted)' }}>
                                             {item.current_level === 2 
                                                 ? `L2: ${users.find(u => u.id === item.level2_approver_id)?.name || 'Functional'} Approval` 
                                                 : `L1: ${users.find(u => u.id === item.level1_approver_id)?.name || 'Reporting'} Approval`}
                                         </span>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                        {emp?.name} • {item.cat === 'attendance' ? (() => {
                                            const existing = attendance.find(a => a.userId === item.employeeId && a.date === item.date);
                                            return `Ext: ${existing?.punchIn || '--:--'}-${existing?.punchOut || '--:--'} | Prop: ${item.punchIn || '--:--'}-${item.punchOut || '--:--'} • `;
                                        })() : ''}{item.reason || item.purpose || `₹${item.proposedSalary?.toLocaleString()}`}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <span className="status-pill status-pending">Pending</span>
                                    <ChevronRight size={16} color="var(--text-muted)" style={{ marginTop: 4 }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function ApprovalsPage() {
    return <DashboardLayout title="Approvals"><ApprovalsContent /></DashboardLayout>;
}
