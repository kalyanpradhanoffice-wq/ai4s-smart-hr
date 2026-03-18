'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState, useMemo } from 'react';
import { Search, Filter, Download, Clock, ChevronLeft, ChevronRight, Activity, Shield, User, Calendar } from 'lucide-react';

const MODULES = ['All', 'Attendance', 'Leave', 'Payroll', 'Employee', 'Interview', 'Security', 'Auth', 'System'];

const MODULE_COLORS = {
    Attendance: '#06b6d4', Leave: '#10b981', Payroll: '#f59e0b',
    Employee: '#6366f1', Interview: '#8b5cf6', Security: '#ef4444',
    Auth: '#84cc16', System: '#64748b',
};

const PAGE_SIZE = 20;

function HistoryContent() {
    const { currentUser, activityHistory, users } = useApp();
    const [search, setSearch] = useState('');
    const [moduleFilter, setModuleFilter] = useState('All');
    const [empFilter, setEmpFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);

    // Role-based filtering: employees see only their own history
    const isHROrAbove = ['super_admin', 'core_admin', 'hr_admin', 'manager'].includes(currentUser?.role);

    const filtered = useMemo(() => {
        let list = activityHistory;

        // RBAC: employees see only their own entries
        if (!isHROrAbove) {
            list = list.filter(h => h.performedById === currentUser?.id || h.targetEmployeeId === currentUser?.id);
        }

        if (moduleFilter !== 'All') list = list.filter(h => h.module === moduleFilter);
        if (empFilter) list = list.filter(h => h.targetEmployeeId === empFilter);
        if (dateFrom) list = list.filter(h => h.timestamp >= dateFrom);
        if (dateTo) list = list.filter(h => h.timestamp <= dateTo + 'T23:59:59');
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(h =>
                h.action?.toLowerCase().includes(q) ||
                h.description?.toLowerCase().includes(q) ||
                h.performedByName?.toLowerCase().includes(q) ||
                h.targetEmployeeName?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [activityHistory, isHROrAbove, currentUser, moduleFilter, empFilter, dateFrom, dateTo, search]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Stats
    const today = new Date().toISOString().split('T')[0];
    const todayCount = activityHistory.filter(h => h.timestamp?.startsWith(today)).length;
    const activeModules = [...new Set(activityHistory.map(h => h.module))].length;

    async function handleExport() {
        const XLSX = await import('xlsx');
        const data = filtered.map(h => ({
            Timestamp: new Date(h.timestamp).toLocaleString('en-IN'),
            Module: h.module,
            Action: h.action,
            'Performed By': h.performedByName,
            'Target Employee': h.targetEmployeeName || '—',
            'Previous Value': h.previousValue || '—',
            'New Value': h.newValue || '—',
            Description: h.description,
            'Reference ID': h.referenceId || '—',
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Activity History');
        XLSX.writeFile(wb, `AI4S_ActivityHistory_${today}.xlsx`);
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">History Center</h1>
                    <p className="page-subtitle">Complete audit trail & activity log — {filtered.length} entries</p>
                </div>
                {isHROrAbove && (
                    <button className="btn btn-ghost btn-sm" onClick={handleExport} style={{ gap: 6 }}>
                        <Download size={14} /> Export Excel
                    </button>
                )}
            </div>

            {/* Stats */}
            <div className="grid-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Total Entries', value: activityHistory.length, icon: Activity, color: '#6366f1' },
                    { label: "Today's Actions", value: todayCount, icon: Clock, color: '#10b981' },
                    { label: 'Active Modules', value: activeModules, icon: Shield, color: '#f59e0b' },
                    { label: 'Showing Now', value: filtered.length, icon: Filter, color: '#06b6d4' },
                ].map(s => (
                    <div key={s.label} className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <s.icon size={18} color={s.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search actions, descriptions, employees..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                </div>
                <select className="form-select" style={{ width: 150 }} value={moduleFilter} onChange={e => { setModuleFilter(e.target.value); setPage(1); }}>
                    {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {isHROrAbove && (
                    <select className="form-select" style={{ width: 180 }} value={empFilter} onChange={e => { setEmpFilter(e.target.value); setPage(1); }}>
                        <option value="">All Employees</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                )}
                <input type="date" className="form-input" style={{ width: 145 }} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} placeholder="From" title="From date" />
                <input type="date" className="form-input" style={{ width: 145 }} value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} placeholder="To" title="To date" />
                {(search || moduleFilter !== 'All' || empFilter || dateFrom || dateTo) && (
                    <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setModuleFilter('All'); setEmpFilter(''); setDateFrom(''); setDateTo(''); setPage(1); }}>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: 130 }}>Timestamp</th>
                            <th style={{ width: 110 }}>Module</th>
                            <th>Action</th>
                            <th>Performed By</th>
                            <th>Target Employee</th>
                            <th>Previous Value</th>
                            <th>New Value</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginated.map(h => {
                            const color = MODULE_COLORS[h.module] || '#6366f1';
                            return (
                                <tr key={h.id}>
                                    <td style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                        {new Date(h.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.68rem', fontWeight: 700, background: `${color}18`, color, border: `1px solid ${color}30` }}>
                                            {h.module}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.82rem', fontWeight: 600 }}>{h.action}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {h.performedById && (() => {
                                                const u = users.find(u => u.id === h.performedById);
                                                return u ? <div className="avatar avatar-sm" style={{ width: 22, height: 22, fontSize: '0.55rem', background: `${u.avatarColor}30`, color: u.avatarColor }}>{u.avatar}</div> : null;
                                            })()}
                                            <span style={{ fontSize: '0.8rem' }}>{h.performedByName || '—'}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{h.targetEmployeeName || '—'}</td>
                                    <td style={{ fontSize: '0.78rem' }}>
                                        {h.previousValue != null ? (
                                            <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontSize: '0.72rem' }}>{String(h.previousValue)}</span>
                                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>}
                                    </td>
                                    <td style={{ fontSize: '0.78rem' }}>
                                        {h.newValue != null ? (
                                            <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(16,185,129,0.08)', color: '#10b981', fontSize: '0.72rem' }}>{String(h.newValue)}</span>
                                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>}
                                    </td>
                                    <td style={{ fontSize: '0.78rem', maxWidth: 280, color: 'var(--text-secondary)' }}>{h.description}</td>
                                </tr>
                            );
                        })}
                        {paginated.length === 0 && (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                                <Activity size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                                <div>No history entries matching your filters</div>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '0 4px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} style={{ padding: '5px 10px' }}><ChevronLeft size={14} /></button>
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            const p = i + 1;
                            return (
                                <button key={p} onClick={() => setPage(p)} className={page === p ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'} style={{ padding: '5px 10px', minWidth: 32 }}>{p}</button>
                            );
                        })}
                        <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={{ padding: '5px 10px' }}><ChevronRight size={14} /></button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AuditPage() {
    return <DashboardLayout title="History Center"><HistoryContent /></DashboardLayout>;
}
