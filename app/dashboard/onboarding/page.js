'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { ONBOARDING_DOCUMENTS, calculateGratuity, OFFBOARDING_CLEARANCES } from '@/lib/mockData';
import { UserPlus, UserMinus, CheckCircle, Circle, AlertCircle, FileText, Award, CheckCheck } from 'lucide-react';

import { useEffect } from 'react';

export function OnboardingContent({ defaultActiveView = 'onboarding' }) {
    const { users, updateOnboardingKYC, finalizeOnboarding } = useApp();
    const [activeView, setActiveView] = useState(defaultActiveView);
    const [selectedEmp, setSelectedEmp] = useState('');
    const [docs, setDocs] = useState(Object.fromEntries(ONBOARDING_DOCUMENTS.map(d => [d.id, false])));
    const [clearances, setClearances] = useState(Object.fromEntries(OFFBOARDING_CLEARANCES.map(c => [c.id, false])));
    const [offEmp, setOffEmp] = useState('');

    const emp = users.find(u => u.id === selectedEmp);

    useEffect(() => {
        if (emp && emp.onboarding_status) {
            setDocs(d => ({ ...d, ...emp.onboarding_status }));
        } else {
            setDocs(Object.fromEntries(ONBOARDING_DOCUMENTS.map(d => [d.id, false])));
        }
    }, [emp]);

    const allRequired = ONBOARDING_DOCUMENTS.filter(d => d.required).every(d => docs[d.id]);
    const empIdGenerated = allRequired;

    const offboardEmp = users.find(u => u.id === offEmp);
    const gratuity = offboardEmp ? calculateGratuity(offboardEmp.salary?.basic || 0, offboardEmp.joinDate) : null;
    const allClearancesGreen = Object.values(clearances).every(Boolean);

    const handleDocChange = async (docId, checked) => {
        const newDocs = { ...docs, [docId]: checked };
        setDocs(newDocs);
        if (selectedEmp) {
            await updateOnboardingKYC(selectedEmp, newDocs);
        }
    };

    const handleFinalize = async () => {
        if (selectedEmp) {
            await finalizeOnboarding(selectedEmp);
            alert('Employee onboarding finalized. Status updated to Active.');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Employee Lifecycle</h1>
                    <p className="page-subtitle">Onboarding and Full & Final Settlement</p>
                </div>
                <div className="tabs">
                    <button className={`tab-btn ${activeView === 'onboarding' ? 'active' : ''}`} onClick={() => setActiveView('onboarding')}><UserPlus size={14} /> Onboarding</button>
                    <button className={`tab-btn ${activeView === 'offboarding' ? 'active' : ''}`} onClick={() => setActiveView('offboarding')}><UserMinus size={14} /> F&F Settlement</button>
                </div>
            </div>

            {activeView === 'onboarding' && (
                <div className="grid-2">
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Select Employee for Onboarding</h3>
                        <select className="form-select" style={{ marginBottom: 20 }} value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}>
                            <option value="">Select an employee...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.employeeId}</option>)}
                        </select>

                        {emp && (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-default)' }}>
                                    <div className="avatar avatar-md">{emp.avatar}</div>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>{emp.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.designation} • {emp.department}</div>
                                        {empIdGenerated ? (
                                            <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, marginTop: 4 }}>✓ Employee ID Generated: {emp.employeeId}</div>
                                        ) : (
                                            <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: 4 }}>⏳ Employee ID pending KYC completion</div>
                                        )}
                                    </div>
                                </div>

                                <div className="alert alert-info" style={{ marginBottom: 16, fontSize: '0.8rem' }}>
                                    <AlertCircle size={14} style={{ flexShrink: 0 }} /> All mandatory documents (marked with *) must be submitted before the Employee ID is generated.
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {ONBOARDING_DOCUMENTS.map(doc => (
                                        <label key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--radius-md)', border: `1px solid ${docs[doc.id] ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`, background: docs[doc.id] ? 'rgba(16,185,129,0.05)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                                            {docs[doc.id] ? <CheckCircle size={18} color="#34d399" /> : <Circle size={18} color="var(--text-muted)" />}
                                            <input type="checkbox" hidden checked={docs[doc.id]} onChange={e => handleDocChange(doc.id, e.target.checked)} />
                                            <div>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{doc.name}</span>
                                                {doc.required && <span style={{ color: '#f87171', marginLeft: 4, fontSize: '0.8rem' }}>*</span>}
                                            </div>
                                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: docs[doc.id] ? '#34d399' : 'var(--text-muted)', fontWeight: 600 }}>{docs[doc.id] ? 'Submitted' : doc.required ? 'Mandatory' : 'Optional'}</span>
                                        </label>
                                    ))}
                                </div>

                                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                                    <button className="btn btn-primary" disabled={!empIdGenerated} onClick={handleFinalize} style={{ justifyContent: 'center', flex: 1 }}>
                                        {empIdGenerated ? <><CheckCheck size={15} /> Finalize Onboarding</> : <>Complete KYC First</>}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Onboarding Progress</h3>
                        {emp ? (
                            <div>
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.85rem' }}>
                                        <span>KYC Completion</span>
                                        <span style={{ fontWeight: 700, color: 'var(--brand-primary-light)' }}>
                                            {Object.values(docs).filter(Boolean).length}/{ONBOARDING_DOCUMENTS.length}
                                        </span>
                                    </div>
                                    <div className="progress-bar" style={{ height: 8 }}>
                                        <div className="progress-fill" style={{ width: `${(Object.values(docs).filter(Boolean).length / ONBOARDING_DOCUMENTS.length) * 100}%` }} />
                                    </div>
                                </div>
                                {[
                                    { label: 'Documents Submitted', done: Object.values(docs).filter(Boolean).length > 0 },
                                    { label: 'Mandatory KYC Complete', done: allRequired },
                                    { label: 'Employee ID Generated', done: empIdGenerated },
                                    { label: 'Offer Letter Signed', done: docs['DOC006'] },
                                    { label: 'System Access Granted', done: empIdGenerated },
                                ].map(step => (
                                    <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
                                        {step.done ? <CheckCircle size={18} color="#34d399" /> : <Circle size={18} color="var(--text-muted)" />}
                                        <span style={{ color: step.done ? 'var(--text-primary)' : 'var(--text-muted)' }}>{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Select an employee to begin onboarding</div>}
                    </div>
                </div>
            )}

            {activeView === 'offboarding' && (
                <div className="grid-2">
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>F&F Settlement — Employee Selection</h3>
                        <select className="form-select" style={{ marginBottom: 20 }} value={offEmp} onChange={e => { setOffEmp(e.target.value); setClearances(Object.fromEntries(OFFBOARDING_CLEARANCES.map(c => [c.id, false]))); }}>
                            <option value="">Select departing employee...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name} — {u.employeeId}</option>)}
                        </select>

                        {offboardEmp && (
                            <div>
                                <div style={{ marginBottom: 20 }}>
                                    {/* Gratuity */}
                                    <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: gratuity?.eligible ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${gratuity?.eligible ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`, marginBottom: 12 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 4, color: gratuity?.eligible ? '#34d399' : '#fbbf24' }}>
                                            <Award size={15} style={{ display: 'inline', marginRight: 6 }} />
                                            {gratuity?.eligible ? 'Gratuity Eligible ✓' : 'Gratuity Not Eligible'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Service: {gratuity?.years} year(s) • {gratuity?.eligible ? `Amount: ₹${gratuity.amount.toLocaleString()}` : 'Requires 5+ years of service'}
                                        </div>
                                    </div>

                                    {/* Notice Period */}
                                    <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', marginBottom: 12 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 4 }}>Notice Period Calculation</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>30 days notice • Serves: 30 days • Recovery: ₹0</div>
                                    </div>
                                </div>

                                <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>Department Clearance Checklist</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {OFFBOARDING_CLEARANCES.map(clr => (
                                        <label key={clr.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--radius-md)', border: `1px solid ${clearances[clr.id] ? 'rgba(16,185,129,0.3)' : 'var(--border-subtle)'}`, background: clearances[clr.id] ? 'rgba(16,185,129,0.05)' : 'transparent', cursor: 'pointer' }}>
                                            {clearances[clr.id] ? <CheckCircle size={18} color="#34d399" /> : <Circle size={18} color="var(--text-muted)" />}
                                            <input type="checkbox" hidden checked={clearances[clr.id]} onChange={e => setClearances(c => ({ ...c, [clr.id]: e.target.checked }))} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{clr.item}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{clr.dept} • {clr.responsible}</div>
                                            </div>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: clearances[clr.id] ? '#34d399' : '#fbbf24' }}>{clearances[clr.id] ? 'GREEN' : 'PENDING'}</span>
                                        </label>
                                    ))}
                                </div>

                                <button className="btn btn-primary" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }} disabled={!allClearancesGreen}>
                                    {allClearancesGreen ? <><FileText size={15} /> Generate Relieving Letter</> : <>⛔ All clearances must be GREEN</>}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>F&F Summary</h3>
                        {offboardEmp ? (
                            <div>
                                {[
                                    { label: 'Last Working Day Salary', value: `₹${(offboardEmp.salary?.gross || 0).toLocaleString()}` },
                                    { label: 'Gratuity Amount', value: gratuity?.eligible ? `₹${gratuity.amount.toLocaleString()}` : 'Not Eligible', color: gratuity?.eligible ? '#34d399' : '#fbbf24' },
                                    { label: 'Notice Period Recovery', value: '₹0' },
                                    { label: 'Pending Loans/Advances', value: '₹0' },
                                    { label: 'Leave Encashment (EL)', value: '₹5,000' },
                                ].map(item => (
                                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                                        <span style={{ fontWeight: 700, color: item.color || 'var(--text-primary)' }}>{item.value}</span>
                                    </div>
                                ))}
                                <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                                    <span>Estimated F&F Amount</span>
                                    <span style={{ color: 'var(--brand-primary-light)' }}>₹{((offboardEmp.salary?.gross || 0) + (gratuity?.amount || 0) + 5000).toLocaleString()}</span>
                                </div>
                                <div style={{ marginTop: 12 }}>
                                    <div className="progress-bar" style={{ marginBottom: 6 }}>
                                        <div className="progress-fill" style={{ width: `${(Object.values(clearances).filter(Boolean).length / OFFBOARDING_CLEARANCES.length) * 100}%`, background: allClearancesGreen ? '#10b981' : 'var(--gradient-brand)' }} />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{Object.values(clearances).filter(Boolean).length}/{OFFBOARDING_CLEARANCES.length} clearances completed</div>
                                </div>
                            </div>
                        ) : <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Select a departing employee to run F&F calculations</div>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function OnboardingPage() {
    return <DashboardLayout title="Employee Lifecycle"><OnboardingContent /></DashboardLayout>;
}
