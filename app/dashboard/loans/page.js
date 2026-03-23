'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { APPROVAL_WORKFLOWS, PERMISSIONS } from '@/lib/constants';
import { DollarSign, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';

function LoansContent() {
    const { currentUser, users, loans, applyLoan, approveLoan, rejectLoan } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ amount: '', purpose: '', tenure: 6, emi: null });

    const isEmployee = currentUser?.role === 'employee';
    const allLoans = isEmployee ? loans.filter(l => l.employeeId === currentUser?.id) : loans;

    function calcEMI(amount, tenure) {
        return Math.round(Number(amount) / Number(tenure));
    }

    function handleSubmit(e) {
        e.preventDefault();
        applyLoan({ ...form, emi: calcEMI(form.amount, form.tenure), employeeId: currentUser.id, amount: Number(form.amount), tenure: Number(form.tenure) });
        setShowForm(false);
        setForm({ amount: '', purpose: '', tenure: 6 });
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div><h1 className="page-title">Loans & Advances</h1><p className="page-subtitle">Apply and track loan requests</p></div>
                <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Apply for Loan</button>
            </div>

            {/* Approval Flow Info */}
            <div className="card" style={{ marginBottom: 24, padding: 16 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Approval Hierarchy — Loan Request</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {APPROVAL_WORKFLOWS.LOAN.levels.map((l, idx) => (
                        <div key={l.level} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--brand-primary-light)' }}>
                                L{l.level}: {l.label}
                            </div>
                            {idx < APPROVAL_WORKFLOWS.LOAN.levels.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                        </div>
                    ))}
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead><tr><th>Employee</th><th>Amount</th><th>Purpose</th><th>Tenure</th><th>EMI</th><th>Level</th><th>Status</th><th>Applied</th><th>Actions</th></tr></thead>
                    <tbody>
                        {allLoans.map(ln => {
                            const emp = users.find(u => u.id === ln.employeeId);
                            return (
                                <tr key={ln.id}>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{emp?.name}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--brand-primary-light)' }}>₹{Number(ln.amount).toLocaleString()}</td>
                                    <td style={{ fontSize: '0.82rem' }}>{ln.purpose}</td>
                                    <td style={{ fontSize: '0.82rem' }}>{ln.tenure} months</td>
                                    <td style={{ fontSize: '0.82rem' }}>₹{ln.emi?.toLocaleString()}/mo</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span className="badge badge-neutral" style={{ width: 'fit-content' }}>L{ln.currentLevel}</span>
                                             {ln.status === 'pending' && (
                                                 <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                     {ln.currentLevel === 2
                                                         ? `Awaiting ${users.find(u => u.id === ln.level2_approver_id)?.name || 'Functional Manager'}'s Approval`
                                                         : `Awaiting ${users.find(u => u.id === ln.level1_approver_id)?.name || 'Reporting Manager'}'s Approval`}
                                                 </span>
                                             )}
                                        </div>
                                    </td>
                                    <td><span className={`status-pill status-${ln.status}`}>{ln.status}</span></td>
                                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ln.requestedOn}</td>
                                    <td>
                                        {ln.status === 'pending' && (
                                            (() => {
                                                const isL1 = ln.currentLevel === 1 && ln.level1_approver_id === currentUser.id;
                                                const isL2 = ln.currentLevel === 2 && ln.level2_approver_id === currentUser.id;
                                                const isSuper = currentUser.role === 'super_admin';
                                                const totalLevels = ln.level2_approver_id ? 2 : 1;
                                                
                                                if (isL1 || isL2 || isSuper) {
                                                    return (
                                                        <div style={{ display: 'flex', gap: 6 }}>
                                                            <button 
                                                                className="btn btn-sm btn-ghost" 
                                                                style={{ color: 'var(--brand-primary-light)', padding: '4px 8px' }}
                                                                onClick={() => approveLoan(ln.id, currentUser.id, 'Approved', ln.currentLevel, totalLevels)}
                                                                title="Approve"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                            <button 
                                                                className="btn btn-sm btn-ghost" 
                                                                style={{ color: '#ef4444', padding: '4px 8px' }}
                                                                onClick={() => rejectLoan(ln.id, currentUser.id, 'Rejected')}
                                                                title="Reject"
                                                            >
                                                                <XCircle size={16} />
                                                            </button>
                                                        </div>
                                                    );
                                                }
                                                 return (
                                                     <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                         Waiting for {ln.currentLevel === 2 ? users.find(u => u.id === ln.level2_approver_id)?.name : users.find(u => u.id === ln.level1_approver_id)?.name}
                                                     </span>
                                                 );
                                            })()
                                        )}
                                        {ln.status !== 'pending' && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>N/A</span>}
                                    </td>
                                </tr>
                            );
                        })}
                        {allLoans.length === 0 && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No loan requests found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>Apply for Loan / Advance</h3>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group">
                                <label className="form-label">Loan Amount (₹)</label>
                                <input type="number" className="form-input" placeholder="50000" min="1000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Purpose / Reason</label>
                                <textarea className="form-textarea" placeholder="Describe the reason for this loan..." value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} required style={{ minHeight: 60 }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Repayment Tenure (months): {form.tenure}</label>
                                <input type="range" min={1} max={24} value={form.tenure} onChange={e => setForm(f => ({ ...f, tenure: e.target.value }))} style={{ accentColor: 'var(--brand-primary)', width: '100%' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}><span>1 month</span><span>24 months</span></div>
                            </div>
                            {form.amount && (
                                <div className="alert alert-info" style={{ fontSize: '0.82rem' }}>
                                    <DollarSign size={14} style={{ flexShrink: 0 }} /> Estimated Monthly EMI: <strong>₹{calcEMI(form.amount, form.tenure).toLocaleString()}/month</strong>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function LoansPage() {
    return <DashboardLayout title="Loans & Advances"><LoansContent /></DashboardLayout>;
}
