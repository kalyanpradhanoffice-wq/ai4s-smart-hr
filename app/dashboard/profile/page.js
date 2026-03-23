'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Edit2 } from 'lucide-react';
import { getRoleMeta } from '@/lib/rbac';

function ProfileContent() {
    const { currentUser, customRoles, users } = useApp();
    const roleMeta = getRoleMeta(currentUser?.role, customRoles || []);
    
    const myManager = users.find(u => u.id === currentUser?.managerId);
    const myFunctionalManager = users.find(u => u.id === currentUser?.functionalManagerId);

    if (!currentUser) return null;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div><h1 className="page-title">My Profile</h1><p className="page-subtitle">Personal and employment information</p></div>
                <button className="btn btn-secondary"><Edit2 size={16} /> Request Edit</button>
            </div>

            <div className="grid-2">
                <div className="card">
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div className="avatar avatar-xl" style={{ margin: '0 auto 16px', background: `${currentUser.avatarColor}30`, color: currentUser.avatarColor, fontSize: '2rem' }}>{currentUser.avatar}</div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>{currentUser.name}</h2>
                        <p style={{ color: 'var(--text-muted)', font: '0.875rem' }}>{currentUser.designation}</p>
                        <div style={{ marginTop: 8, display: 'inline-block', padding: '3px 12px', borderRadius: 'var(--radius-full)', background: `${roleMeta.color}18`, color: roleMeta.color, fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${roleMeta.color}30` }}>{roleMeta.name}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                            { icon: Mail, label: 'Email', value: currentUser.email },
                            { icon: Phone, label: 'Phone', value: currentUser.phone },
                            { icon: MapPin, label: 'Location', value: currentUser.location },
                            { icon: Calendar, label: 'Join Date', value: currentUser.joinDate },
                            { icon: Briefcase, label: 'Department', value: currentUser.department },
                            { icon: User, label: 'Employee ID', value: currentUser.displayId },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <item.icon size={16} color="var(--text-muted)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{item.label}</div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.value || '—'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card">
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Salary Information</h3>
                        {[
                            { label: 'Basic', value: currentUser.salary?.basic },
                            { label: 'HRA', value: currentUser.salary?.hra },
                            { label: 'Allowances', value: currentUser.salary?.allowances },
                            { label: 'Gross', value: currentUser.salary?.gross },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                                <span style={{ fontWeight: 700 }}>₹{s.value?.toLocaleString() || '—'}</span>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Management Team</h3>
                        {[
                            { label: 'Reporting Manager', value: myManager?.name || 'Not Assigned' },
                            { label: 'Functional Manager', value: myFunctionalManager?.name || 'Not Applicable' },
                        ].map(m => (
                            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
                                <span style={{ fontWeight: 700, color: 'var(--brand-primary-light)' }}>{m.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="card">
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>KYC Status</h3>
                        {['PAN Card', 'Aadhaar Card', 'Bank Details', 'Address Proof'].map(doc => (
                            <div key={doc} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>{doc}</span>
                                <span className="status-pill status-approved">Verified</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProfilePage() {
    return <DashboardLayout title="My Profile"><ProfileContent /></DashboardLayout>;
}
