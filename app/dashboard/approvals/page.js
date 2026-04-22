'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { ClipboardList, Calendar, DollarSign, User, ChevronRight, CheckCircle, XCircle, Clock, TrendingUp, AlertCircle, Navigation, Home, Award, Search } from 'lucide-react';

function ApprovalsContent() {
    const { 
        leaveRequests, loans, salaryUpgrades, regularizations, 
        users, currentUser, attendance,
        approveLeave, rejectLeave,
        approveLoan, rejectLoan,
        approveSalaryUpgrade, rejectSalaryUpgrade,
        approveRegularization, rejectRegularization
    } = useApp();

    const [activeTab, setActiveTab] = useState('all');
    const [actioningId, setActioningId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Helper to check if current user is the pending approver
    const isApprover = (item) => {
        if (currentUser?.role === 'super_admin' || currentUser?.role === 'hr_admin') return true;
        const currentLevel = item.current_level || item.currentLevel || 1;
        if (currentLevel === 1) return item.level1_approver_id === currentUser?.id;
        if (currentLevel === 2) return item.level2_approver_id === currentUser?.id;
        return false;
    };

    const categories = [
        { id: 'leave', label: 'Leaves', data: leaveRequests.filter(l => l.status === 'pending' && isApprover(l) && !['OD', 'WFH', 'COMPOFF_CREDIT', 'COMPOFF'].includes(l.type?.toUpperCase())), icon: Calendar, color: '#6366f1' },
        { id: 'od', label: 'On-Duty', data: leaveRequests.filter(l => l.status === 'pending' && isApprover(l) && l.type?.toUpperCase() === 'OD'), icon: Navigation, color: '#06b6d4' },
        { id: 'wfh', label: 'Work From Home', data: leaveRequests.filter(l => l.status === 'pending' && isApprover(l) && l.type?.toUpperCase() === 'WFH'), icon: Home, color: '#8b5cf6' },
        { id: 'compoff', label: 'Comp-Off Credit', data: leaveRequests.filter(l => l.status === 'pending' && isApprover(l) && l.type?.toUpperCase() === 'COMPOFF_CREDIT'), icon: Award, color: '#10b981' },
        { id: 'attendance', label: 'Regularizations', data: regularizations.filter(r => r.status === 'pending' && isApprover(r)), icon: ClipboardList, color: '#f59e0b' },
        { id: 'loan', label: 'Loans', data: loans.filter(l => l.status === 'pending' && isApprover(l)), icon: DollarSign, color: '#10b981' },
        { id: 'salary', label: 'Salary Upgrades', data: salaryUpgrades.filter(s => s.status === 'pending' && isApprover(s)), icon: TrendingUp, color: '#8b5cf6' },
    ];

    const allPending = categories.reduce((acc, cat) => [...acc, ...cat.data.map(item => ({ ...item, cat: cat.id }))], []);
    
    let displayItems = activeTab === 'all' ? allPending : categories.find(c => c.id === activeTab)?.data.map(item => ({ ...item, cat: activeTab })) || [];

    // Apply Filters
    if (searchQuery) {
        displayItems = displayItems.filter(item => {
            const emp = users.find(u => u.id === (item.employeeId || item.userId || item.employee_id));
            return emp?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   emp?.displayId?.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }

    if (dateRange.start) {
        displayItems = displayItems.filter(item => (item.from_date || item.from || item.date) >= dateRange.start);
    }
    if (dateRange.end) {
        displayItems = displayItems.filter(item => (item.to_date || item.to || item.date) <= dateRange.end);
    }

    async function handleAction(type, action, item) {
        setActioningId(item.id);
        const totalLevels = item.level2_approver_id ? 2 : 1;
        const currentLevel = item.current_level || item.currentLevel || 1;

        try {
            if (['leave', 'od', 'wfh', 'compoff'].includes(type)) {
                if (action === 'approve') await approveLeave(item.id, currentUser.id, 'Approved via Central Dashboard', currentLevel, totalLevels);
                else await rejectLeave(item.id, currentUser.id, 'Rejected via Central Dashboard');
            } else if (type === 'loan') {
                if (action === 'approve') await approveLoan(item.id, currentUser.id, 'Approved via Central Dashboard', currentLevel, totalLevels);
                else await rejectLoan(item.id, currentUser.id, 'Rejected via Central Dashboard');
            } else if (type === 'salary') {
                if (action === 'approve') await approveSalaryUpgrade(item.id, currentUser.id, 'Approved via Central Dashboard', currentLevel, totalLevels);
                else await rejectSalaryUpgrade(item.id, currentUser.id, 'Rejected via Central Dashboard');
            } else if (type === 'attendance') {
                if (action === 'approve') await approveRegularization(item.id, currentUser.id, 'Approved via Central Dashboard', currentLevel, totalLevels);
                else await rejectRegularization(item.id, currentUser.id, 'Rejected via Central Dashboard');
            }
        } finally {
            setActioningId(null);
        }
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Approval Inbox</h1>
                    <p className="page-subtitle">{allPending.length} items awaiting your action</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', background: 'var(--bg-glass)' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        type="text" 
                        placeholder="Search by name or employee ID..." 
                        className="form-input" 
                        style={{ paddingLeft: 42, height: 42, borderRadius: 12 }}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                
                {/* Category Selection Dropdown */}
                <div style={{ minWidth: 200 }}>
                    <select 
                        className="form-select" 
                        style={{ height: 42, borderRadius: 12, fontWeight: 600 }}
                        value={activeTab}
                        onChange={e => setActiveTab(e.target.value)}
                    >
                        <option value="all">All Requests</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label} ({cat.data.length})</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Calendar size={16} color="var(--text-muted)" />
                    <input type="date" className="form-input" style={{ width: 150, height: 42, borderRadius: 12 }} value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
                    <span style={{ color: 'var(--text-muted)' }}>to</span>
                    <input type="date" className="form-input" style={{ width: 150, height: 42, borderRadius: 12 }} value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
                    {(searchQuery || dateRange.start || dateRange.end || activeTab !== 'all') && (
                        <button className="btn btn-ghost" style={{ padding: '0 12px', height: 42, color: '#ef4444' }} onClick={() => { setSearchQuery(''); setDateRange({ start: '', end: '' }); setActiveTab('all'); }}>Reset</button>
                    )}
                </div>
            </div>

            {/* Category Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <div 
                    onClick={() => setActiveTab('all')}
                    style={{ 
                        background: 'var(--bg-card)', 
                        border: `1px solid ${activeTab === 'all' ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
                        borderRadius: 'var(--radius-lg)', 
                        padding: '16px 20px', 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        transform: activeTab === 'all' ? 'translateY(-2px)' : 'none',
                        boxShadow: activeTab === 'all' ? '0 10px 15px -3px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>All Requests</span>
                        <ClipboardList size={18} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>{allPending.length}</div>
                </div>
                {categories.map(cat => (
                    <div 
                        key={cat.id}
                        onClick={() => setActiveTab(cat.id)}
                        style={{ 
                            background: 'var(--bg-card)', 
                            border: `1px solid ${activeTab === cat.id ? cat.color : 'var(--border-subtle)'}`,
                            borderRadius: 'var(--radius-lg)', 
                            padding: '16px 20px', 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            transform: activeTab === cat.id ? 'translateY(-2px)' : 'none',
                            boxShadow: activeTab === cat.id ? `0 10px 15px -3px ${cat.color}20` : 'none'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{cat.label}</span>
                            <cat.icon size={18} color={cat.color} />
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: cat.color, marginTop: 8 }}>{cat.data.length}</div>
                    </div>
                ))}
            </div>

            {displayItems.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ background: 'rgba(16,185,129,0.08)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <CheckCircle size={40} color="#10b981" />
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>All Caught Up!</h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto' }}>
                        No pending requests in this category. You're all clear!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {displayItems.map(item => {
                        const emp = users.find(u => u.id === (item.employeeId || item.userId || item.employee_id));
                        const cat = categories.find(c => c.id === item.cat);
                        const color = cat?.color || 'var(--brand-primary)';
                        
                        return (
                            <div key={item.id} className="card animate-slide-up" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <cat.icon size={22} color={color} />
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{emp?.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({emp?.displayId})</span>
                                        <span className="badge" style={{ background: `${color}10`, color: color, fontSize: '0.65rem' }}>{cat.label}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        {item.cat === 'leave' && `Requested ${item.days} days of ${item.type} (${item.from_date || item.from} to ${item.to_date || item.to})`}
                                        {item.cat === 'od' && `Requested On-Duty from ${item.from_date || item.from} to ${item.to_date || item.to}`}
                                        {item.cat === 'wfh' && `Requested WFH from ${item.from_date || item.from} to ${item.to_date || item.to}`}
                                        {item.cat === 'compoff' && `Comp-Off Credit for working on ${item.from_date || item.from}`}
                                        {item.cat === 'loan' && `Requested Loan of ₹${item.amount?.toLocaleString()} for ${item.tenure} months`}
                                        {item.cat === 'salary' && `Proposed Salary Upgrade: ₹${item.proposedSalary?.toLocaleString()}`}
                                        {item.cat === 'attendance' && `Regularization for ${item.date} (${item.correctionType?.replace(/_/g, ' ') || 'Correction'})`}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                                        "{item.reason || item.purpose || 'No reason provided'}"
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(0,0,0,0.05)', color: 'var(--text-muted)' }}>
                                            Level {item.current_level || item.currentLevel || 1} Pending
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button 
                                            className="btn btn-ghost" 
                                            style={{ color: '#ef4444', padding: '6px 12px', fontSize: '0.85rem' }}
                                            disabled={actioningId === item.id}
                                            onClick={() => handleAction(item.cat, 'reject', item)}
                                        >
                                            <XCircle size={16} /> Reject
                                        </button>
                                        <button 
                                            className="btn btn-primary" 
                                            style={{ padding: '6px 16px', fontSize: '0.85rem' }}
                                            disabled={actioningId === item.id}
                                            onClick={() => handleAction(item.cat, 'approve', item)}
                                        >
                                            <CheckCircle size={16} /> {actioningId === item.id ? 'Processing...' : 'Approve'}
                                        </button>
                                    </div>
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
