'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { calculateEPF, calculateESI, STATUTORY } from '@/lib/mockData';
import { can } from '@/lib/rbac';
import { PERMISSIONS } from '@/lib/mockData';
import { Download, TrendingUp, Info, CheckCircle, FileSpreadsheet, History } from 'lucide-react';

function PayrollContent() {
    const { currentUser, users, payroll, addAuditEntry, attendance, activityHistory, logActivity } = useApp();
    const [selectedUser, setSelectedUser] = useState(currentUser?.id);
    const [regime, setRegime] = useState('new');
    const [voluntaryEPF, setVoluntaryEPF] = useState(false);
    const [activeTab, setActiveTab] = useState('payslip');

    const canRunPayroll = can(currentUser, PERMISSIONS.RUN_PAYROLL);
    const canViewAll = can(currentUser, PERMISSIONS.VIEW_ALL_PAYSLIPS);

    const targetUserId = canViewAll ? (selectedUser || currentUser?.id) : currentUser?.id;
    const emp = users.find(u => u.id === targetUserId);

    // Live statutory calculations
    const gross = emp?.salary?.gross || 0;
    const basic = emp?.salary?.basic || 0;
    const hra = emp?.salary?.hra || 0;
    const allowances = emp?.salary?.allowances || 0;

    const epf = calculateEPF(basic, voluntaryEPF);
    const esi = calculateESI(gross);
    const pt = gross > 25000 ? 200 : gross > 15000 ? 150 : 0;

    function calcTax(income) {
        if (income <= 250000) return 0;
        if (income <= 500000) return (income - 250000) * 0.05;
        if (income <= 750000) return 12500 + (income - 500000) * 0.1;
        if (income <= 1000000) return 37500 + (income - 750000) * 0.15;
        if (income <= 1250000) return 75000 + (income - 1000000) * 0.2;
        return 125000 + (income - 1250000) * 0.3;
    }

    const taxableOld = Math.max(0, gross * 12 - 50000 - (hra * 0.4 * 12) - (epf.employee * 12) - 150000);
    const taxableNew = Math.max(0, gross * 12 - 50000);
    const tdsMontlyOld = Math.max(0, Math.round(calcTax(taxableOld) / 12));
    const tdsMontlyNew = Math.max(0, Math.round(calcTax(taxableNew) / 12));
    const efficientRegime = tdsMontlyOld < tdsMontlyNew ? 'old' : 'new';
    const tds = regime === 'old' ? tdsMontlyOld : tdsMontlyNew;

    const totalDeductions = epf.employee + esi.employee + pt + tds;
    const netPay = gross - totalDeductions;

    const payrollHistory = activityHistory.filter(h => h.module === 'Payroll');

    async function handleDownloadPDF() {
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        const pageW = doc.internal.pageSize.getWidth();

        doc.setFillColor(99, 102, 241);
        doc.rect(0, 0, pageW, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('AI4S Smart HR', 14, 12);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('EMPLOYEE PAYSLIP', 14, 22);
        doc.text('February 2025', pageW - 14, 22, { align: 'right' });

        doc.setTextColor(30, 30, 30);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Employee Details', 14, 42);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const details = [
            [`Name: ${emp?.name}`, `Employee ID: ${emp?.employeeId}`],
            [`Designation: ${emp?.designation}`, `Department: ${emp?.department}`],
            [`Tax Regime: ${regime.toUpperCase()}`, `Working Days: 28`],
        ];
        details.forEach((row, i) => {
            doc.text(row[0], 14, 52 + i * 8);
            doc.text(row[1], pageW / 2, 52 + i * 8);
        });
        doc.setDrawColor(220, 220, 220);
        doc.line(14, 78, pageW - 14, 78);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129);
        doc.text('EARNINGS', 14, 86);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        [['Basic Salary', `Rs ${basic.toLocaleString()}`], ['House Rent Allowance', `Rs ${hra.toLocaleString()}`], ['Special Allowances', `Rs ${allowances.toLocaleString()}`]].forEach((row, i) => {
            doc.text(row[0], 14, 94 + i * 8);
            doc.text(row[1], pageW / 2 - 10, 94 + i * 8, { align: 'right' });
        });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('Gross Salary', 14, 122);
        doc.text(`Rs ${gross.toLocaleString()}`, pageW / 2 - 10, 122, { align: 'right' });
        doc.line(14, 126, pageW / 2 - 10, 126);

        doc.setTextColor(239, 68, 68);
        doc.text('DEDUCTIONS', pageW / 2 + 5, 86);
        doc.setTextColor(30, 30, 30);
        doc.setFont('helvetica', 'normal');
        const deductions = [
            [`EPF (Employee 12%)`, `Rs ${epf.employee.toLocaleString()}`],
            [`ESI (0.75%)`, `Rs ${esi.employee.toLocaleString()}`],
            ['Professional Tax', `Rs ${pt.toLocaleString()}`],
            [`TDS (${regime === 'old' ? 'Old' : 'New'} Regime)`, `Rs ${tds.toLocaleString()}`],
        ].filter(d => !d[1].includes('0') || d[0].includes('Professional'));
        deductions.forEach((row, i) => {
            doc.text(row[0], pageW / 2 + 5, 94 + i * 8);
            doc.text(row[1], pageW - 14, 94 + i * 8, { align: 'right' });
        });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text('Total Deductions', pageW / 2 + 5, 122);
        doc.text(`Rs ${totalDeductions.toLocaleString()}`, pageW - 14, 122, { align: 'right' });
        doc.line(pageW / 2 + 5, 126, pageW - 14, 126);

        doc.setFillColor(99, 102, 241);
        doc.rect(14, 132, pageW - 28, 22, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('NET PAY (TAKE HOME)', 20, 142);
        doc.setFontSize(14);
        doc.text(`Rs ${netPay.toLocaleString()}`, pageW - 20, 142, { align: 'right' });

        doc.setTextColor(120, 120, 120);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('This is a system-generated payslip from AI4S Smart HR. No signature required.', 14, 168);
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 174);

        doc.save(`Payslip_${emp?.name?.replace(/\s+/g, '_')}_Feb_2025.pdf`);
        addAuditEntry(currentUser?.id, 'PDF_DOWNLOAD', 'Payslip', `Downloaded payslip for ${emp?.name}`);
        logActivity({ module: 'Payroll', action: 'Payslip Downloaded', actionCode: 'PAYSLIP_DOWNLOAD', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeId: emp?.id, targetEmployeeName: emp?.name, description: `Payslip downloaded for ${emp?.name} — February 2025`, referenceId: `PAY_FEB2025_${emp?.id}` });
    }

    async function handleProcessPayroll() {
        const XLSX = await import('xlsx');
        const data = users.map(u => {
            const g = u.salary?.gross || 0;
            const b = u.salary?.basic || 0;
            const epfCalc = calculateEPF(b, false);
            const esiCalc = calculateESI(g);
            const ptCalc = g > 25000 ? 200 : g > 15000 ? 150 : 0;
            const totalDed = epfCalc.employee + esiCalc.employee + ptCalc;
            const net = g - totalDed;
            const attRecs = attendance.filter(a => a.userId === u.id && a.date.startsWith('2025-02'));
            const presentD = attRecs.filter(a => a.status === 'present' || a.status === 'wfh').length;
            const leaveD = attRecs.filter(a => a.status === 'leave').length;
            return {
                'Employee ID': u.employeeId, 'Employee Name': u.name, 'Department': u.department,
                'Designation': u.designation, 'Working Days': 28, 'Present Days': presentD || 28,
                'Leave Days': leaveD || 0, 'Basic Salary (Rs)': b, 'HRA (Rs)': u.salary?.hra || 0,
                'Allowances (Rs)': u.salary?.allowances || 0, 'Gross Salary (Rs)': g,
                'EPF Employee (Rs)': epfCalc.employee, 'ESI Employee (Rs)': esiCalc.employee,
                'Professional Tax (Rs)': ptCalc, 'Total Deductions (Rs)': totalDed, 'Net Pay (Rs)': net,
            };
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Payroll Feb 2025');
        XLSX.writeFile(wb, 'AI4S_Payroll_Feb_2025.xlsx');
        addAuditEntry(currentUser?.id, 'PAYROLL_PROCESSED', 'all', 'Processed payroll and downloaded Excel summary');
        logActivity({ module: 'Payroll', action: 'Payroll Processed', actionCode: 'PAYROLL_PROCESSED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeName: 'All Employees', description: `Monthly payroll processed for February 2025 — ${users.length} employees`, referenceId: 'PAYROLL_FEB2025' });
    }

    return (
        <div className="animate-fade-in">

            {/* ── PAGE HEADER ── */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Payroll &amp; Payslips</h1>
                    <p className="page-subtitle">Statutory calculations with EPF, ESI, and TDS</p>
                </div>
                {canRunPayroll && (
                    <button className="btn btn-ghost btn-sm" style={{ gap: 6 }} onClick={handleProcessPayroll}>
                        <TrendingUp size={16} /> Process Payroll (Excel)
                    </button>
                )}
            </div>

            {/* ── TAB BAR ── */}
            <div className="tabs" style={{ marginBottom: 28 }}>
                <button
                    className={`tab-btn ${activeTab === 'payslip' ? 'active' : ''}`}
                    onClick={() => setActiveTab('payslip')}
                >
                    <FileSpreadsheet size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Payslip
                </button>
                {canRunPayroll && (
                    <button
                        className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <History size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                        Payroll History
                        {payrollHistory.length > 0 && (
                            <span className="notification-badge" style={{ position: 'static', marginLeft: 6 }}>
                                {payrollHistory.length}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* ── TAB CONTENT: PAYSLIP ── */}
            {activeTab === 'payslip' && (
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

                    {/* Left panel: Controls */}
                    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {canViewAll && (
                            <div className="card" style={{ padding: 16 }}>
                                <label className="form-label">Select Employee</label>
                                <select
                                    className="form-select"
                                    style={{ marginTop: 6 }}
                                    value={selectedUser}
                                    onChange={e => setSelectedUser(e.target.value)}
                                >
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="card" style={{ padding: 16 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 12 }}>Income Tax Regime</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {['old', 'new'].map(r => (
                                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: `1px solid ${regime === r ? 'var(--brand-primary)' : 'var(--border-subtle)'}`, background: regime === r ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'all 0.15s' }}>
                                        <input type="radio" name="regime" value={r} checked={regime === r} onChange={() => setRegime(r)} />
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize' }}>{r} Regime</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TDS: ₹{r === 'old' ? tdsMontlyOld.toLocaleString() : tdsMontlyNew.toLocaleString()}/mo</div>
                                            {efficientRegime === r && <div style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 700 }}>✓ More Tax Efficient</div>}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ padding: 16 }}>
                            <label className="toggle-wrapper" style={{ cursor: 'pointer' }}>
                                <div className="toggle">
                                    <input type="checkbox" checked={voluntaryEPF} onChange={e => setVoluntaryEPF(e.target.checked)} />
                                    <div className="toggle-slider" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Voluntary EPF</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Contribute on actual basic (above ₹15K cap)</div>
                                </div>
                            </label>
                        </div>

                        {gross <= STATUTORY.ESI_GROSS_LIMIT ? (
                            <div className="alert alert-info" style={{ fontSize: '0.78rem' }}>
                                <Info size={14} style={{ flexShrink: 0 }} /> ESI applicable — gross ≤ ₹{STATUTORY.ESI_GROSS_LIMIT.toLocaleString()}
                            </div>
                        ) : (
                            <div className="alert alert-success" style={{ fontSize: '0.78rem' }}>
                                <CheckCircle size={14} style={{ flexShrink: 0 }} /> ESI not applicable — gross &gt; ₹{STATUTORY.ESI_GROSS_LIMIT.toLocaleString()}
                            </div>
                        )}
                    </div>

                    {/* Right panel: Payslip display */}
                    <div style={{ flex: 1 }}>
                        <div className="card">
                            {/* Payslip header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 40, height: 40, background: 'var(--gradient-brand)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 900, color: 'white' }}>AI</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>AI4S Smart HR</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Payslip — February 2025</div>
                                    </div>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={handleDownloadPDF}>
                                    <Download size={14} /> Download PDF
                                </button>
                            </div>

                            {/* Employee meta */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24, padding: '14px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Employee</div>
                                    <div style={{ fontWeight: 700, marginTop: 4 }}>{emp?.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{emp?.employeeId}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Designation</div>
                                    <div style={{ fontWeight: 600, marginTop: 4 }}>{emp?.designation}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{emp?.department}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Tax Regime</div>
                                    <div style={{ fontWeight: 600, marginTop: 4, textTransform: 'capitalize' }}>{regime} Regime</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>TDS: ₹{tds.toLocaleString()}/mo</div>
                                </div>
                            </div>

                            {/* Earnings + Deductions grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                                <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontWeight: 700, marginBottom: 14, color: '#34d399', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Earnings</div>
                                    {[
                                        { label: 'Basic Salary', value: basic },
                                        { label: 'House Rent Allowance (HRA)', value: hra },
                                        { label: 'Special Allowances', value: allowances },
                                    ].map(e => (
                                        <div key={e.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.83rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>{e.label}</span>
                                            <span style={{ fontWeight: 600 }}>₹{e.value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 800, color: '#34d399', fontSize: '0.9rem' }}>
                                        <span>Gross Salary</span>
                                        <span>₹{gross.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div style={{ background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ fontWeight: 700, marginBottom: 14, color: '#f87171', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deductions</div>
                                    {[
                                        { label: `EPF (Employee 12% of ${voluntaryEPF ? 'basic' : '₹15K cap'})`, value: epf.employee },
                                        { label: 'ESI (0.75%)', value: esi.employee, skip: !esi.applicable },
                                        { label: 'Professional Tax', value: pt },
                                        { label: `TDS (${regime === 'old' ? 'Old' : 'New'} Regime)`, value: tds },
                                    ].filter(d => !d.skip).map(d => (
                                        <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.83rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>{d.label}</span>
                                            <span style={{ fontWeight: 600, color: '#f87171' }}>₹{d.value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 800, color: '#f87171', fontSize: '0.9rem' }}>
                                        <span>Total Deductions</span>
                                        <span>₹{totalDeductions.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Net Pay banner */}
                            <div style={{ background: 'var(--gradient-brand)', borderRadius: 'var(--radius-lg)', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '0.72rem', opacity: 0.8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Net Pay (Take Home)</div>
                                    <div style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'white', marginTop: 4 }}>₹{netPay.toLocaleString()}</div>
                                </div>
                                <div style={{ textAlign: 'right', opacity: 0.85 }}>
                                    <div style={{ fontSize: '0.76rem' }}>Employer EPF: ₹{epf.employer.toLocaleString()}</div>
                                    {esi.applicable && <div style={{ fontSize: '0.76rem' }}>Employer ESI: ₹{esi.employer.toLocaleString()}</div>}
                                    <div style={{ fontSize: '0.76rem', marginTop: 4, fontWeight: 700, opacity: 1 }}>Total CTC: ₹{(gross + epf.employer + esi.employer).toLocaleString()}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── TAB CONTENT: PAYROLL HISTORY ── */}
            {activeTab === 'history' && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Payroll Action History</h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                {payrollHistory.length} records — payslip downloads &amp; payroll processing events
                            </p>
                        </div>
                    </div>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th style={{ width: 140 }}>Timestamp</th>
                                    <th style={{ width: 170 }}>Action</th>
                                    <th>Employee / Scope</th>
                                    <th>Performed By</th>
                                    <th>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrollHistory.map(h => (
                                    <tr key={h.id}>
                                        <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                                            {new Date(h.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td>
                                            <span style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700, background: h.actionCode === 'PAYROLL_PROCESSED' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', color: h.actionCode === 'PAYROLL_PROCESSED' ? '#10b981' : '#6366f1', border: `1px solid ${h.actionCode === 'PAYROLL_PROCESSED' ? '#10b98130' : '#6366f130'}` }}>
                                                {h.action}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.83rem', fontWeight: 500 }}>{h.targetEmployeeName || '—'}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{h.performedByName || '—'}</td>
                                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{h.description}</td>
                                    </tr>
                                ))}
                                {payrollHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                                            <TrendingUp size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25 }} />
                                            <div style={{ fontWeight: 600 }}>No payroll history yet</div>
                                            <div style={{ fontSize: '0.78rem', marginTop: 4 }}>Download a payslip or run Process Payroll to see events here.</div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PayrollPage() {
    return <DashboardLayout title="Payroll"><PayrollContent /></DashboardLayout>;
}
