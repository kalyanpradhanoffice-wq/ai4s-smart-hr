'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { calculateEPF, calculateESI, STATUTORY, PERMISSIONS } from '@/lib/constants';
import { can } from '@/lib/rbac';
import { Download, TrendingUp, Info, CheckCircle, FileSpreadsheet, History } from 'lucide-react';

function PayrollContent() {
    const { 
        currentUser, users, payroll, addAuditEntry, attendance, 
        activityHistory, logActivity, processPayroll, salaryUpgrades, 
        approveSalaryUpgrade, addToast, systemSettings, 
        getAttendanceStatus, leaveRequests, companyHolidays 
    } = useApp();
    const [selectedUser, setSelectedUser] = useState(currentUser?.id);
    const [regime, setRegime] = useState('new');
    const [voluntaryEPF, setVoluntaryEPF] = useState(false);
    
    // Dynamic month/year selection
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const [selectedMonth, setSelectedMonth] = useState(prevMonthDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(prevMonthDate.getFullYear());

    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const years = [2024, 2025, 2026, 2027];
    
    // Check if the selected time is in the future
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const isFuture = selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);

    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'payslip');

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

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
        if (isFuture) {
            addToast('Cannot download payslips for future periods.', 'warning');
            return;
        }
        const toastId = addToast('Generating payslip PDF...', 'info');
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();
            const pageW = doc.internal.pageSize.getWidth();
            // --- MINIMALIST PROFESSIONAL HEADER ---
            // Subtle top accent
            doc.setFillColor(79, 70, 229); // Brand Indigo
            doc.rect(0, 0, pageW, 2, 'F');

            // --- COMPANY LOGO (SVG to PNG Rasterization) - RIGHT ALIGNED ---
            if (systemSettings.company_logo_svg) {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const svgData = systemSettings.company_logo_svg;
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const url = URL.createObjectURL(svgBlob);
                    const img = new Image();
                    await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                        img.src = url;
                    });
                    const scale = 4;
                    canvas.width = 100 * scale;
                    canvas.height = 100 * scale;
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    const imgData = canvas.toDataURL('image/png');
                    
                    // Place on the RIGHT side - Large Size
                    doc.addImage(imgData, 'PNG', pageW - 44, 5, 30, 30);
                    URL.revokeObjectURL(url);
                } catch (e) {
                    console.error('Logo Rasterization Error:', e);
                }
            }

            // Company Text
            doc.setTextColor(31, 41, 55); 
            doc.setFontSize(22); // Larger company name
            doc.setFont('helvetica', 'bold');
            doc.text(systemSettings.company_name || 'AI4S Smart HR', 14, 18);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            doc.text(systemSettings.company_address || '', 14, 25);
            if (systemSettings.registration_number) {
                doc.text(`Reg Number: ${systemSettings.registration_number}`, 14, 31);
            }

            // Document Title Section - Moved down to accommodate larger logo
            doc.setFillColor(249, 250, 251);
            doc.rect(0, 42, pageW, 14, 'F');
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('OFFICIAL PAYSLIP', 14, 51);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(107, 114, 128);
            const monthStr = MONTHS[selectedMonth];
            const yearStr = selectedYear;
            const monthYear = `${monthStr} ${yearStr}`.toUpperCase();
            doc.text(`FOR THE MONTH OF ${monthYear}`, pageW - 14, 51, { align: 'right' });
            
            let currentY = 72;

            doc.setTextColor(30, 30, 30);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Employee Details', 14, currentY);
            currentY += 10;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const details = [
                [`Name: ${emp?.name || 'N/A'}`, `Employee ID: ${emp?.displayId || 'N/A'}`],
                [`Designation: ${emp?.designation || 'N/A'}`, `Department: ${emp?.department || 'N/A'}`],
                [`Tax Regime: ${(regime || 'new').toUpperCase()}`, `Working Days: 28`],
            ];
            
            details.forEach((row) => {
                doc.text(row[0], 14, currentY);
                doc.text(row[1], pageW / 2, currentY);
                currentY += 8;
            });

            currentY += 4;
            doc.setDrawColor(220, 220, 220);
            doc.line(14, currentY, pageW - 14, currentY);
            currentY += 10;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(16, 185, 129);
            doc.text('EARNINGS', 14, currentY);
            
            doc.setTextColor(239, 68, 68);
            doc.text('DEDUCTIONS', pageW / 2 + 5, currentY);
            
            currentY += 8;
            const tableStartY = currentY;

            doc.setTextColor(30, 30, 30);
            doc.setFont('helvetica', 'normal');
            
            // Draw Earnings Column
            [['Basic Salary', `Rs ${(basic || 0).toLocaleString()}`], ['House Rent Allowance', `Rs ${(hra || 0).toLocaleString()}`], ['Special Allowances', `Rs ${(allowances || 0).toLocaleString()}`]].forEach((row, i) => {
                doc.text(row[0], 14, tableStartY + i * 8);
                doc.text(row[1], pageW / 2 - 10, tableStartY + i * 8, { align: 'right' });
            });
            
            // Draw Deductions Column
            const deductions = [
                [`EPF (Employee 12%)`, `Rs ${(epf?.employee || 0).toLocaleString()}`],
                [`ESI (0.75%)`, `Rs ${(esi?.employee || 0).toLocaleString()}`],
                ['Professional Tax', `Rs ${(pt || 0).toLocaleString()}`],
                [`TDS (${regime === 'old' ? 'Old' : 'New'} Regime)`, `Rs ${(tds || 0).toLocaleString()}`],
            ].filter(d => !d[1].includes(' 0') || d[0].includes('Professional'));

            deductions.forEach((row, i) => {
                doc.text(row[0], pageW / 2 + 5, tableStartY + i * 8);
                doc.text(row[1], pageW - 14, tableStartY + i * 8, { align: 'right' });
            });

            // Calculate max height of both columns
            const maxRows = Math.max(3, deductions.length);
            currentY = tableStartY + maxRows * 8 + 4;

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(16, 185, 129);
            doc.text('Gross Salary', 14, currentY);
            doc.text(`Rs ${(gross || 0).toLocaleString()}`, pageW / 2 - 10, currentY, { align: 'right' });
            
            doc.setTextColor(239, 68, 68);
            doc.text('Total Deductions', pageW / 2 + 5, currentY);
            doc.text(`Rs ${(totalDeductions || 0).toLocaleString()}`, pageW - 14, currentY, { align: 'right' });
            
            currentY += 4;
            doc.line(14, currentY, pageW / 2 - 10, currentY);
            doc.line(pageW / 2 + 5, currentY, pageW - 14, currentY);
            
            currentY += 12;
            doc.setFillColor(99, 102, 241);
            doc.rect(14, currentY, pageW - 28, 22, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('NET PAY (TAKE HOME)', 20, currentY + 13);
            doc.setFontSize(14);
            doc.text(`Rs ${(netPay || 0).toLocaleString()}`, pageW - 20, currentY + 13, { align: 'right' });

            // --- FOOTER SECTION ---
            const pageH = doc.internal.pageSize.getHeight();
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text('This is a system-generated payslip. No signature required.', 14, pageH - 15);
            doc.setFont('helvetica', 'bold');
            doc.text(`Download Date: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, 14, pageH - 10);

            doc.save(`Payslip_${(emp?.name || 'Employee').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
            addAuditEntry(currentUser?.id, 'PDF_DOWNLOAD', 'Payslip', `Downloaded payslip for ${emp?.name}`);
            addToast('Payslip downloaded successfully', 'success');
            const logMonthStr = `${MONTHS[selectedMonth]} ${selectedYear}`;
            logActivity({ module: 'Payroll', action: 'Payslip Downloaded', actionCode: 'PAYSLIP_DOWNLOAD', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeId: emp?.id, targetEmployeeName: emp?.name, description: `Payslip downloaded for ${emp?.name} — ${logMonthStr}`, referenceId: `PAY_${logMonthStr.replace(/\s+/g, '_')}_${emp?.id}` });
        } catch (err) {
            console.error('PDF Generation failed:', err);
            addToast('Failed to generate PDF: ' + err.message, 'error');
        }
    }

    async function handleProcessPayroll() {
        if (isFuture) {
            addToast('Cannot process payroll for future periods.', 'warning');
            return;
        }

        const XLSX = await import('xlsx');
        const cutoff = systemSettings.attendance_cutoff || 22;
        
        // Define Cycle: from (cutoff+1) of previous month to (cutoff) of selected month
        const cycleEnd = new Date(selectedYear, selectedMonth, cutoff);
        const cycleStart = new Date(selectedYear, selectedMonth - 1, cutoff + 1);
        
        const data = users.map(u => {
            const g = u.salary?.gross || 0;
            const b = u.salary?.basic || 0;
            const dailyRate = g / 30; // Standard 30-day month for rate calculation

            let presentCount = 0;
            let leaveCount = 0;
            let woCount = 0;
            let holCount = 0;
            let lateCount = 0;
            let halfDayCount = 0;
            let absentCount = 0;
            let missingPunchCount = 0;

            const curr = new Date(cycleStart);
            while (curr <= cycleEnd) {
                const dateStr = curr.toISOString().split('T')[0];
                const status = getAttendanceStatus(u.id, dateStr);

                if (status === 'present') presentCount++;
                else if (status === 'late') lateCount++;
                else if (status === 'half-day') halfDayCount++;
                else if (status === 'absent') absentCount++;
                else if (status === 'missing_punch') missingPunchCount++;
                else if (status === 'leave') leaveCount++;
                else if (status === 'wo') woCount++;
                else if (status === 'holiday') holCount++;

                curr.setDate(curr.getDate() + 1);
            }

            // Deduction Logic
            // 1. 3 Lates = 0.5 Day LOP
            const lateDeductionDays = Math.floor(lateCount / 3) * 0.5;
            // 2. Half Day = 0.5 Day LOP
            const halfDayDeductionDays = halfDayCount * 0.5;
            // 3. Absent = 1.0 Day LOP (Missing Punch treated as Absent for payroll if not fixed)
            const absentDeductionDays = absentCount + missingPunchCount;

            const totalLopDays = lateDeductionDays + halfDayDeductionDays + absentDeductionDays;
            const lopAmount = Math.round(totalLopDays * dailyRate);

            const epfCalc = calculateEPF(b, voluntaryEPF);
            const esiCalc = calculateESI(g);
            const ptCalc = g > 25000 ? 200 : g > 15000 ? 150 : 0;
            
            const totalStatutoryDeductions = epfCalc.employee + esiCalc.employee + ptCalc;
            const totalDeductions = totalStatutoryDeductions + lopAmount;
            const net = g - totalDeductions;

            return {
                'Employee ID': u.displayId, 
                'Employee Name': u.name, 
                'Department': u.department,
                'Designation': u.designation, 
                'Cycle Period': `${cycleStart.toLocaleDateString()} to ${cycleEnd.toLocaleDateString()}`,
                'Present Days': presentCount,
                'Late Days': lateCount,
                'Half Days': halfDayCount,
                'Absent Days': absentCount,
                'Missing Punches': missingPunchCount,
                'Weekly Offs': woCount,
                'Holidays': holCount,
                'Leave Days': leaveCount,
                '3-Late LOP (Days)': lateDeductionDays,
                'Total LOP Days': totalLopDays,
                'Gross Salary (Rs)': g,
                'LOP Deduction (Rs)': lopAmount,
                'PF/ESI/PT (Rs)': totalStatutoryDeductions,
                'Net Pay (Rs)': net,
            };
        });

        const logMonthStr = `${MONTHS[selectedMonth]} ${selectedYear}`;
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Payroll ${logMonthStr}`);
        XLSX.writeFile(wb, `AI4S_Payroll_${logMonthStr.replace(/\s+/g, '_')}.xlsx`);

        // Persist to Supabase
        const payrollBatch = data.map(record => ({
            user_id: users.find(u => u.displayId === record['Employee ID'])?.id,
            month: `${MONTHS[selectedMonth]} ${selectedYear}`,
            gross_salary: record['Gross Salary (Rs)'],
            net_pay: record['Net Pay (Rs)'],
            deductions: {
                epf: record['EPF Employee (Rs)'],
                esi: record['ESI Employee (Rs)'],
                pt: record['Professional Tax (Rs)'],
                total: record['Total Deductions (Rs)']
            },
            earnings: {
                basic: record['Basic Salary (Rs)'],
                hra: record['HRA (Rs)'],
                allowances: record['Allowances (Rs)']
            },
            status: 'processed',
            reference_id: `PAY_${selectedYear}${String(selectedMonth + 1).padStart(2, '0')}_${record['Employee ID']}`
        }));

        await processPayroll(payrollBatch);
        addAuditEntry(currentUser?.id, 'PAYROLL_PROCESSED', 'all', 'Processed payroll and downloaded Excel summary');
        // logMonthStr defined above
        logActivity({ module: 'Payroll', action: 'Payroll Processed', actionCode: 'PAYROLL_PROCESSED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeName: 'All Employees', description: `Monthly payroll processed for ${logMonthStr} — ${users.length} employees`, referenceId: `PAYROLL_${logMonthStr.replace(/\s+/g, '_')}` });
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
                    <button 
                        className="btn btn-ghost btn-sm" 
                        style={{ gap: 6, opacity: isFuture ? 0.5 : 1, cursor: isFuture ? 'not-allowed' : 'pointer' }} 
                        onClick={handleProcessPayroll}
                        disabled={isFuture}
                    >
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
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 12 }}>Salary Period</div>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <select className="form-select" style={{ marginBottom: 0 }} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                                    {MONTHS.map((m, i) => {
                                        const isMonthFuture = selectedYear > currentYear || (selectedYear === currentYear && i > currentMonth);
                                        return <option key={m} value={i} disabled={isMonthFuture}>{m}{isMonthFuture ? ' (Future)' : ''}</option>;
                                    })}
                                </select>
                                <select className="form-select" style={{ width: 95, marginBottom: 0 }} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                                    {years.map(y => <option key={y} value={y} disabled={y > currentYear}>{y}{y > currentYear ? ' (Future)' : ''}</option>)}
                                </select>
                            </div>
                        </div>

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
                        {isFuture ? (
                            <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <div style={{ background: 'rgba(99,102,241,0.08)', width: 80, height: 80, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'var(--brand-primary)' }}>
                                    <FileSpreadsheet size={40} />
                                </div>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 10 }}>Payroll Data Unavailable</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
                                    Payslips and statutory records for future periods ({MONTHS[selectedMonth]} {selectedYear}) are not yet calculated or finalized.
                                </p>
                            </div>
                        ) : (
                            <div className="card">
                                {/* Payslip header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '2px solid var(--brand-primary)', background: '#f9fafb', padding: '20px', borderRadius: '12px' }}>
                                    <div>
                                        <div style={{ color: 'var(--brand-primary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
                                            ORGANIZATION
                                        </div>
                                        <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#111827' }}>{systemSettings.company_name || 'AI4S Smart HR'}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: 4, maxWidth: '300px' }}>
                                            {systemSettings.company_address || 'Organization Address'}
                                        </div>
                                        {systemSettings.registration_number && (
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>
                                                Reg: {systemSettings.registration_number}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {systemSettings.company_logo_svg ? (
                                        <div 
                                            dangerouslySetInnerHTML={{ __html: systemSettings.company_logo_svg }} 
                                            style={{ width: 100, height: 100, borderRadius: 12, background: 'white', padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                    ) : (
                                        <div style={{ width: 80, height: 80, background: 'var(--gradient-brand)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'white' }}>
                                            {systemSettings.company_name ? systemSettings.company_name.substring(0, 2).toUpperCase() : 'AI'}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, padding: '0 10px' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827' }}>Pay Advice</h4>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>Statement of Earnings & Deductions</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-primary)' }}>{MONTHS[selectedMonth]} {selectedYear}</div>
                                        <button className="btn btn-ghost btn-sm" onClick={handleDownloadPDF} style={{ marginTop: 4 }}>
                                            <Download size={14} /> Export PDF
                                        </button>
                                    </div>
                                </div>
                                {/* Rest of the payslip UI... */}

                            {/* Employee meta */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24, padding: '14px 16px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                                <div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Employee</div>
                                    <div style={{ fontWeight: 700, marginTop: 4 }}>{emp?.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>{emp?.displayId}</div>
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
                        )}
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
