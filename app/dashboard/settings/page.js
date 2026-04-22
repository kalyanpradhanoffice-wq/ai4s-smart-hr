'use client';
import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useRouter } from 'next/navigation'; // [NEW] Added useRouter
import { supabase } from '@/lib/supabase'; // [NEW] Added supabase
import { SHIFTS } from '@/lib/shifts';
import {
    Settings, Building2, Clock, Shield, Calendar, Bell, Palette, Plug,
    Save, Plus, Trash2, Edit3, X, Check, ChevronRight, Globe,
    Lock, AlertTriangle, RefreshCw, Sun, Moon, Loader2,
    CalendarDays, CalendarClock, DollarSign, Users, Info, MapPin, Crosshair
} from 'lucide-react';

// ══════════════════════════════════════════
// TAB DEFINITIONS
// ══════════════════════════════════════════
const TABS = [
    { id: 'general', label: 'Organization', icon: Building2, color: '#6366f1' },
    { id: 'attendance', label: 'Attendance & Payroll', icon: Clock, color: '#0ea5e9' },
    { id: 'leaves', label: 'Leave Policies', icon: Calendar, color: '#10b981' },
    { id: 'holidays', label: 'Holiday Calendar', icon: CalendarDays, color: '#f59e0b' },
    { id: 'security', label: 'Security', icon: Shield, color: '#ef4444' },
    { id: 'notifications', label: 'Notifications', icon: Bell, color: '#8b5cf6' },
    { id: 'appearance', label: 'Appearance', icon: Palette, color: '#ec4899' },
    { id: 'integrations', label: 'Integrations', icon: Plug, color: '#06b6d4' },
];

// ══════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════
export default function SettingsPage() {
    const router = useRouter(); // [NEW] Added router for redirection
    const { addToast, fetchAllData, currentUser, securityConfig, updateSecurityConfig } = useApp();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState({});

    // ── Check authorization ──
    useEffect(() => {
        if (currentUser && currentUser.role !== 'super_admin') {
            router.replace('/dashboard/employee'); // Redirect to dashboard if not super admin
        }
    }, [currentUser, router]);

    const [leaveTypes, setLeaveTypes] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // ── Fetch all data on mount ──
    useEffect(() => {
        fetchAllSettings();
    }, []);

    const fetchAllSettings = async () => {
        setLoading(true);
        try {
            // Get session for Bearer token [NEW]
            const { data: { session } } = await supabase.auth.getSession();
            const headers = { 'Authorization': `Bearer ${session?.access_token}` };

            const [settingsRes, leaveRes, holidayRes] = await Promise.all([
                fetch('/api/settings', { headers }).then(r => r.json()),
                fetch('/api/settings/leave-types', { headers }).then(r => r.json()),
                fetch('/api/settings/holidays', { headers }).then(r => r.json()),
            ]);
            if (settingsRes.success) setSettings(settingsRes.settings || {});
            if (leaveRes.success) setLeaveTypes(leaveRes.leaveTypes || []);
            if (holidayRes.success) setHolidays(holidayRes.holidays || []);
        } catch (err) {
            console.error('Failed to load settings:', err);
            addToast('Failed to load settings', 'error');
        }
        setLoading(false);
    };


    // ── Update a setting key locally ──
    const updateSetting = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setDirty(true);
    };

    // ── Save all settings to backend ──
    const saveSettings = async () => {
        setSaving(true);
        try {
            // Get session for Bearer token [NEW]
            const { data: { session } } = await supabase.auth.getSession();
            
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}` 
                },
                body: JSON.stringify({ settings }),
            });
            const data = await res.json();
            if (data.success) {
                addToast('Settings saved successfully', 'success');
                setDirty(false);
                // Sync global state immediately
                if (fetchAllData) fetchAllData();
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            addToast('Failed to save settings: ' + err.message, 'error');
        }
        setSaving(false);
    };


    if (loading) {
        return (
            <DashboardLayout title="System Settings">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12 }}>
                    <Loader2 size={24} className="spin" style={{ color: 'var(--brand-primary)' }} />
                    <span style={{ color: 'var(--text-muted)' }}>Loading settings...</span>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="System Settings">
            <div className="animate-fade-in">
                {/* Page Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 'var(--radius-md)',
                                background: 'var(--gradient-brand)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                boxShadow: 'var(--shadow-glow-sm)'
                            }}>
                                <Settings size={22} color="white" />
                            </div>
                            System Settings
                        </h1>
                        <p className="page-subtitle">Configure your organization's core policies, security, and preferences</p>
                    </div>
                    {dirty && (
                        <button
                            className="btn btn-primary"
                            onClick={saveSettings}
                            disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    )}
                </div>

                {/* Settings Layout */}
                <div style={{ display: 'flex', gap: 'var(--space-lg)', alignItems: 'flex-start' }}>
                    {/* Tab Sidebar */}
                    <div className="card" style={{ width: 260, padding: 'var(--space-sm)', flexShrink: 0, position: 'sticky', top: 'calc(var(--header-height) + var(--space-xl))' }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    width: '100%', padding: '12px 16px',
                                    borderRadius: 'var(--radius-md)', border: 'none',
                                    cursor: 'pointer', textAlign: 'left',
                                    fontFamily: 'var(--font-body)', fontSize: '0.875rem',
                                    fontWeight: activeTab === tab.id ? 600 : 500,
                                    transition: 'all var(--transition-fast)',
                                    background: activeTab === tab.id ? `${tab.color}18` : 'transparent',
                                    color: activeTab === tab.id ? tab.color : 'var(--text-secondary)',
                                    border: activeTab === tab.id ? `1px solid ${tab.color}30` : '1px solid transparent',
                                }}
                            >
                                <div style={{
                                    width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                                    background: activeTab === tab.id ? `${tab.color}20` : 'var(--bg-glass)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all var(--transition-fast)'
                                }}>
                                    <tab.icon size={16} />
                                </div>
                                <span>{tab.label}</span>
                                {activeTab === tab.id && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {activeTab === 'general' && <GeneralTab settings={settings} updateSetting={updateSetting} />}
                        {activeTab === 'attendance' && <AttendanceTab settings={settings} updateSetting={updateSetting} />}
                        {activeTab === 'leaves' && <LeavePoliciesTab leaveTypes={leaveTypes} setLeaveTypes={setLeaveTypes} addToast={addToast} />}
                        {activeTab === 'holidays' && <HolidayCalendarTab holidays={holidays} setHolidays={setHolidays} addToast={addToast} />}
                        {activeTab === 'security' && <SecurityTab settings={settings} updateSetting={updateSetting} securityConfig={securityConfig} updateSecurityConfig={updateSecurityConfig} />}
                        {activeTab === 'notifications' && <NotificationsTab settings={settings} updateSetting={updateSetting} />}
                        {activeTab === 'appearance' && <AppearanceTab settings={settings} updateSetting={updateSetting} />}
                        {activeTab === 'integrations' && <IntegrationsTab />}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

// ══════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════
function SettingSection({ icon: Icon, title, description, color, children }) {
    return (
        <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'var(--space-lg)' }}>
                <div style={{
                    width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                    background: `${color || 'var(--brand-primary)'}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Icon size={18} color={color || 'var(--brand-primary)'} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h3>
                    {description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{description}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

function FieldRow({ label, description, children }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 0', borderBottom: '1px solid var(--border-subtle)',
            gap: 'var(--space-lg)'
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
                {description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>}
            </div>
            <div style={{ flexShrink: 0, minWidth: 200, display: 'flex', justifyContent: 'flex-end' }}>
                {children}
            </div>
        </div>
    );
}

function Toggle({ checked, onChange, label }) {
    return (
        <label className="toggle-wrapper">
            <div className="toggle">
                <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} />
                <span className="toggle-slider" />
            </div>
            {label && <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>}
        </label>
    );
}

// ══════════════════════════════════════════
// TAB 1: GENERAL / ORGANIZATION
// ══════════════════════════════════════════
function GeneralTab({ settings, updateSetting }) {
    return (
        <>
            <SettingSection icon={Building2} title="Company Information" description="Basic details about your organization" color="#6366f1">
                <FieldRow label="Company Logo (SVG Code)" description="Paste your logo's SVG code here for a lightweight, ultra-sharp finish.">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 400 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)', background: 'var(--bg-glass)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: 8, overflow: 'hidden'
                            }}>
                                {settings.company_logo_svg ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: settings.company_logo_svg }}
                                        style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    />
                                ) : (
                                    <Building2 size={24} style={{ opacity: 0.2 }} />
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => updateSetting('company_logo_svg', '')}
                                    disabled={!settings.company_logo_svg}
                                    style={{ color: 'var(--brand-danger)' }}
                                >
                                    <Trash2 size={14} style={{ marginRight: 6 }} /> Clear Code
                                </button>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                    Tip: Paste code starting with &lt;svg...
                                </div>
                            </div>
                        </div>
                        <textarea
                            className="form-input"
                            style={{ fontFamily: 'monospace', fontSize: '0.75rem', height: 100, resize: 'vertical', width: '100%' }}
                            placeholder="<svg ... > ... </svg>"
                            value={settings.company_logo_svg || ''}
                            onChange={e => updateSetting('company_logo_svg', e.target.value)}
                        />
                    </div>
                </FieldRow>
                <FieldRow label="Company Name" description="Displayed across the application and reports">
                    <input
                        className="form-input"
                        style={{ maxWidth: 280 }}
                        value={settings.company_name || ''}
                        onChange={e => updateSetting('company_name', e.target.value)}
                        placeholder="e.g., AI4S Technologies"
                    />
                </FieldRow>
                <FieldRow label="Company Email" description="Primary contact email for your organization">
                    <input
                        className="form-input"
                        style={{ maxWidth: 280 }}
                        value={settings.company_email || ''}
                        onChange={e => updateSetting('company_email', e.target.value)}
                        placeholder="e.g., hr@ai4s.com"
                    />
                </FieldRow>
                <FieldRow label="Registration Number" description="CIN / GSTIN / Company registration">
                    <input
                        className="form-input"
                        style={{ maxWidth: 280 }}
                        value={settings.registration_number || ''}
                        onChange={e => updateSetting('registration_number', e.target.value)}
                        placeholder="e.g., U72200KA2020PTC..."
                    />
                </FieldRow>
                <FieldRow label="Company Address" description="Registered office address">
                    <input
                        className="form-input"
                        style={{ maxWidth: 280 }}
                        value={settings.company_address || ''}
                        onChange={e => updateSetting('company_address', e.target.value)}
                        placeholder="e.g., Bangalore, India"
                    />
                </FieldRow>
            </SettingSection>

            <SettingSection icon={Globe} title="Localization" description="Regional and format preferences" color="#0ea5e9">
                <FieldRow label="Timezone" description="Default timezone for attendance and reports">
                    <select
                        className="form-select"
                        style={{ maxWidth: 280 }}
                        value={settings.timezone || 'Asia/Kolkata'}
                        onChange={e => updateSetting('timezone', e.target.value)}
                    >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</option>
                        <option value="America/Los_Angeles">America/Los Angeles (PST)</option>
                    </select>
                </FieldRow>
                <FieldRow label="Date Format" description="How dates are displayed across the system">
                    <select
                        className="form-select"
                        style={{ maxWidth: 280 }}
                        value={settings.date_format || 'DD/MM/YYYY'}
                        onChange={e => updateSetting('date_format', e.target.value)}
                    >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/03/2026)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (03/31/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (2026-03-31)</option>
                    </select>
                </FieldRow>
                <FieldRow label="Currency" description="Primary currency for payroll and finance">
                    <select
                        className="form-select"
                        style={{ maxWidth: 280 }}
                        value={settings.currency || 'INR'}
                        onChange={e => updateSetting('currency', e.target.value)}
                    >
                        <option value="INR">₹ Indian Rupee (INR)</option>
                        <option value="USD">$ US Dollar (USD)</option>
                        <option value="EUR">€ Euro (EUR)</option>
                        <option value="GBP">£ British Pound (GBP)</option>
                        <option value="AED">د.إ UAE Dirham (AED)</option>
                    </select>
                </FieldRow>
            </SettingSection>
        </>
    );
}

// ══════════════════════════════════════════
// TAB 2: ATTENDANCE & PAYROLL CYCLE
// ══════════════════════════════════════════
function AttendanceTab({ settings, updateSetting }) {
    const dayOptions = Array.from({ length: 28 }, (_, i) => i + 1);

    return (
        <>
            <SettingSection icon={CalendarClock} title="Payroll Cycle" description="Define when your payroll month starts and ends" color="#0ea5e9">
                <div style={{
                    background: 'rgba(14, 165, 233, 0.06)', borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(14, 165, 233, 0.15)', padding: 'var(--space-md)',
                    marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'flex-start', gap: 10
                }}>
                    <Info size={16} color="#0ea5e9" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        The payroll cycle defines when a "working month" starts and ends for salary calculation.
                        For example, if set to the <strong>21st</strong>, the March payroll cycle runs from
                        <strong> 21 Feb → 20 Mar</strong>.
                    </p>
                </div>
                <FieldRow label="Cycle Start Day" description="The day of the month when the payroll cycle begins">
                    <select
                        className="form-select"
                        style={{ maxWidth: 200 }}
                        value={settings.payroll_cycle_start || 21}
                        onChange={e => updateSetting('payroll_cycle_start', Number(e.target.value))}
                    >
                        {dayOptions.map(d => (
                            <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of each month</option>
                        ))}
                    </select>
                </FieldRow>
                <FieldRow label="Pay Date" description="Default salary disbursement date">
                    <select
                        className="form-select"
                        style={{ maxWidth: 200 }}
                        value={settings.pay_date || 1}
                        onChange={e => updateSetting('pay_date', Number(e.target.value))}
                    >
                        {dayOptions.map(d => (
                            <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of each month</option>
                        ))}
                    </select>
                </FieldRow>
            </SettingSection>

            <SettingSection icon={Lock} title="Attendance Lock" description="Control when monthly attendance data is frozen" color="#ef4444">
                <div style={{
                    background: 'rgba(239, 68, 68, 0.06)', borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(239, 68, 68, 0.15)', padding: 'var(--space-md)',
                    marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'flex-start', gap: 10
                }}>
                    <AlertTriangle size={16} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        After the cut-off date, employees and managers <strong>cannot modify</strong> attendance
                        records for the previous cycle. Only Super Admins can override locked records.
                    </p>
                </div>
                <FieldRow label="Cut-off Day" description="Day of the month when previous cycle locks">
                    <select
                        className="form-select"
                        style={{ maxWidth: 200 }}
                        value={settings.attendance_cutoff || 22}
                        onChange={e => updateSetting('attendance_cutoff', Number(e.target.value))}
                    >
                        {dayOptions.map(d => (
                            <option key={d} value={d}>{d}{d === 1 ? 'st' : d === 2 ? 'nd' : d === 3 ? 'rd' : 'th'} of each month</option>
                        ))}
                    </select>
                </FieldRow>
                <FieldRow label="Auto-lock Enabled" description="Automatically freeze attendance after the cut-off">
                    <Toggle
                        checked={settings.attendance_auto_lock}
                        onChange={val => updateSetting('attendance_auto_lock', val)}
                    />
                </FieldRow>
            </SettingSection>

            <SettingSection icon={Clock} title="Working Hours" description="Default shift timings and weekend configuration" color="#10b981">
                <FieldRow label="Default Office Shift" description="Select one of the predefined system shifts">
                    <select
                        className="form-select"
                        style={{ maxWidth: 200 }}
                        value={settings.default_shift || 'GS'}
                        onChange={e => updateSetting('default_shift', e.target.value)}
                    >
                        {Object.entries(SHIFTS).map(([key, s]) => (
                            <option key={key} value={key}>{s.name} ({s.start} - {s.end})</option>
                        ))}
                    </select>
                </FieldRow>
                <div style={{ padding: '12px 16px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.1)', marginTop: 8 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', marginBottom: 6, textTransform: 'uppercase' }}>Shift Rule Summary</div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        <strong>Present</strong>: punch-in within 15m grace. <strong>Late</strong>: punch-in 16-60m late (3 lates = 0.5d LOP). 
                        <strong>Half Day</strong>: punch-in 1-4h late OR total hours 3-6h. <strong>Absent</strong>: No punch OR total hours &lt; 3h.
                    </p>
                </div>

                <FieldRow label="Weekend Days" description="Days counted as weekly off">
                    <select
                        className="form-select"
                        style={{ maxWidth: 200 }}
                        value={settings.weekend_days || 'sat_sun'}
                        onChange={e => updateSetting('weekend_days', e.target.value)}
                    >
                        <option value="sat_sun">Saturday & Sunday</option>
                        <option value="sun">Sunday only</option>
                        <option value="fri_sat">Friday & Saturday</option>
                        <option value="sat_alt">Alternate Saturday + Sunday</option>
                    </select>
                </FieldRow>
            </SettingSection>
        </>
    );
}

// ══════════════════════════════════════════
// TAB 3: LEAVE POLICIES
// ══════════════════════════════════════════
function LeavePoliciesTab({ leaveTypes, setLeaveTypes, addToast }) {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [showAdd, setShowAdd] = useState(false);
    const [newLeave, setNewLeave] = useState({ name: '', yearly_quota: 12, is_active: true });
    const [actionLoading, setActionLoading] = useState(false);

    const handleAdd = async () => {
        if (!newLeave.name.trim()) return addToast('Leave type name is required', 'warning');
        setActionLoading(true);
        try {
            // Get session for Bearer token [NEW]
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch('/api/settings/leave-types', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(newLeave),
            });
            const data = await res.json();

            if (data.success) {
                setLeaveTypes(prev => [...prev, data.leaveType]);
                setNewLeave({ name: '', yearly_quota: 12, is_active: true });
                setShowAdd(false);
                addToast('Leave type added', 'success');
            } else throw new Error(data.error);
        } catch (err) {
            addToast('Failed to add leave type: ' + err.message, 'error');
        }
        setActionLoading(false);
    };

    const handleUpdate = async (id) => {
        setActionLoading(true);
        try {
            // Get session for Bearer token [NEW]
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch('/api/settings/leave-types', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ id, ...editForm }),
            });
            const data = await res.json();

            if (data.success) {
                setLeaveTypes(prev => prev.map(lt => lt.id === id ? { ...lt, ...editForm } : lt));
                setEditingId(null);
                addToast('Leave type updated', 'success');
            } else throw new Error(data.error);
        } catch (err) {
            addToast('Failed to update: ' + err.message, 'error');
        }
        setActionLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this leave type?')) return;
        setActionLoading(true);
        try {
            // Get session for Bearer token [NEW]
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch('/api/settings/leave-types', {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();

            if (data.success) {
                setLeaveTypes(prev => prev.filter(lt => lt.id !== id));
                addToast('Leave type deleted', 'success');
            } else throw new Error(data.error);
        } catch (err) {
            addToast('Failed to delete: ' + err.message, 'error');
        }
        setActionLoading(false);
    };

    return (
        <SettingSection icon={Calendar} title="Leave Types & Quotas" description="Configure available leave types and annual limits" color="#10b981">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-md)' }}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
                    {showAdd ? <X size={14} /> : <Plus size={14} />}
                    {showAdd ? 'Cancel' : 'Add Leave Type'}
                </button>
            </div>

            {/* Add new form */}
            {showAdd && (
                <div style={{
                    background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)',
                    display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end', flexWrap: 'wrap'
                }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
                        <label className="form-label">Leave Name</label>
                        <input className="form-input" value={newLeave.name}
                            onChange={e => setNewLeave(p => ({ ...p, name: e.target.value }))}
                            placeholder="e.g., Paternity Leave" />
                    </div>
                    <div className="form-group" style={{ width: 120 }}>
                        <label className="form-label">Yearly Quota</label>
                        <input className="form-input" type="number" value={newLeave.yearly_quota}
                            onChange={e => setNewLeave(p => ({ ...p, yearly_quota: Number(e.target.value) }))}
                            min={0} />
                    </div>
                    <button className="btn btn-success btn-sm" onClick={handleAdd} disabled={actionLoading}>
                        <Check size={14} /> Add
                    </button>
                </div>
            )}

            {/* Leave Type List */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Leave Type</th>
                            <th style={{ textAlign: 'center' }}>Yearly Quota</th>
                            <th style={{ textAlign: 'center' }}>Status</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaveTypes.map(lt => (
                            <tr key={lt.id}>
                                <td>
                                    {editingId === lt.id ? (
                                        <input className="form-input" style={{ maxWidth: 220, padding: '6px 10px' }}
                                            value={editForm.name ?? lt.name}
                                            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                                    ) : (
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lt.name}</span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {editingId === lt.id ? (
                                        <input className="form-input" type="number" style={{ maxWidth: 80, padding: '6px 10px', textAlign: 'center' }}
                                            value={editForm.yearly_quota ?? lt.yearly_quota}
                                            onChange={e => setEditForm(p => ({ ...p, yearly_quota: Number(e.target.value) }))}
                                            min={0} />
                                    ) : (
                                        <span className="badge badge-primary">{lt.yearly_quota} days</span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className={`badge ${lt.is_active ? 'badge-success' : 'badge-danger'}`}>
                                        {lt.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    {editingId === lt.id ? (
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            <button className="btn btn-success btn-sm" onClick={() => handleUpdate(lt.id)} disabled={actionLoading}>
                                                <Check size={13} />
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>
                                                <X size={13} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => {
                                                setEditingId(lt.id);
                                                setEditForm({ name: lt.name, yearly_quota: lt.yearly_quota });
                                            }}>
                                                <Edit3 size={13} />
                                            </button>
                                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--brand-danger)' }}
                                                onClick={() => handleDelete(lt.id)}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {leaveTypes.length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No leave types configured yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </SettingSection>
    );
}

// ══════════════════════════════════════════
// TAB 4: HOLIDAY CALENDAR
// ══════════════════════════════════════════
function HolidayCalendarTab({ holidays, setHolidays, addToast }) {
    const [showAdd, setShowAdd] = useState(false);
    const [newHoliday, setNewHoliday] = useState({ name: '', date: '', type: 'National' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [actionLoading, setActionLoading] = useState(false);

    const handleAdd = async () => {
        if (!newHoliday.name.trim() || !newHoliday.date) return addToast('Name and date are required', 'warning');
        setActionLoading(true);
        try {
            // Get session for Bearer token [NEW]
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch('/api/settings/holidays', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(newHoliday),
            });
            const data = await res.json();
            if (data.success) {
                setHolidays(prev => [...prev, data.holiday].sort((a, b) => new Date(a.date) - new Date(b.date)));
                setNewHoliday({ name: '', date: '', type: 'National' });
                setShowAdd(false);
                addToast('Holiday added', 'success');
            } else throw new Error(data.error);
        } catch (err) {
            addToast('Failed to add holiday: ' + err.message, 'error');
        }
        setActionLoading(false);
    };


    const handleUpdate = async (id) => {
        setActionLoading(true);
        try {
            // Get session for Bearer token [NEW]
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch('/api/settings/holidays', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ id, ...editForm }),
            });
            const data = await res.json();
            if (data.success) {
                setHolidays(prev => prev.map(h => h.id === id ? { ...h, ...editForm } : h).sort((a, b) => new Date(a.date) - new Date(b.date)));
                setEditingId(null);
                addToast('Holiday updated', 'success');
            } else throw new Error(data.error);
        } catch (err) {
            addToast('Failed to update: ' + err.message, 'error');
        }
        setActionLoading(false);
    };


    const handleDelete = async (id) => {
        if (!confirm('Delete this holiday?')) return;
        setActionLoading(true);
        try {
            // Get session for Bearer token [NEW]
            const { data: { session } } = await supabase.auth.getSession();

            const res = await fetch('/api/settings/holidays', {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.success) {
                setHolidays(prev => prev.filter(h => h.id !== id));
                addToast('Holiday deleted', 'success');
            } else throw new Error(data.error);
        } catch (err) {
            addToast('Failed to delete: ' + err.message, 'error');
        }
        setActionLoading(false);
    };


    const typeColors = {
        National: '#6366f1', Restricted: '#f59e0b', Optional: '#06b6d4', Company: '#10b981'
    };

    return (
        <SettingSection icon={CalendarDays} title="Company Holidays" description="Manage official off-days for the organization" color="#f59e0b">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                    {Object.entries(typeColors).map(([type, color]) => (
                        <span key={type} className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
                            {type}
                        </span>
                    ))}
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
                    {showAdd ? <X size={14} /> : <Plus size={14} />}
                    {showAdd ? 'Cancel' : 'Add Holiday'}
                </button>
            </div>

            {showAdd && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)',
                    borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)',
                    display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end', flexWrap: 'wrap'
                }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 180 }}>
                        <label className="form-label">Holiday Name</label>
                        <input className="form-input" value={newHoliday.name}
                            onChange={e => setNewHoliday(p => ({ ...p, name: e.target.value }))}
                            placeholder="e.g., Diwali" />
                    </div>
                    <div className="form-group" style={{ width: 160 }}>
                        <label className="form-label">Date</label>
                        <input className="form-input" type="date" value={newHoliday.date}
                            onChange={e => setNewHoliday(p => ({ ...p, date: e.target.value }))} />
                    </div>
                    <div className="form-group" style={{ width: 140 }}>
                        <label className="form-label">Type</label>
                        <select className="form-select" value={newHoliday.type}
                            onChange={e => setNewHoliday(p => ({ ...p, type: e.target.value }))}>
                            <option>National</option>
                            <option>Restricted</option>
                            <option>Optional</option>
                            <option>Company</option>
                        </select>
                    </div>
                    <button className="btn btn-success btn-sm" onClick={handleAdd} disabled={actionLoading}>
                        <Check size={14} /> Add
                    </button>
                </div>
            )}

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Holiday</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'center' }}>Type</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holidays.map(h => {
                            const color = typeColors[h.type] || '#6366f1';
                            return (
                                <tr key={h.id}>
                                    <td>
                                        {editingId === h.id ? (
                                            <input className="form-input" style={{ maxWidth: 220, padding: '6px 10px' }}
                                                value={editForm.name ?? h.name}
                                                onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                                        ) : (
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.name}</span>
                                        )}
                                    </td>
                                    <td>
                                        {editingId === h.id ? (
                                            <input className="form-input" type="date" style={{ maxWidth: 160, padding: '6px 10px' }}
                                                value={editForm.date ?? h.date}
                                                onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} />
                                        ) : (
                                            <span style={{ color: 'var(--text-secondary)' }}>
                                                {new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {editingId === h.id ? (
                                            <select className="form-select" style={{ maxWidth: 130, padding: '6px 10px' }}
                                                value={editForm.type ?? h.type}
                                                onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}>
                                                <option>National</option>
                                                <option>Restricted</option>
                                                <option>Optional</option>
                                                <option>Company</option>
                                            </select>
                                        ) : (
                                            <span className="badge" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>{h.type}</span>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {editingId === h.id ? (
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <button className="btn btn-success btn-sm" onClick={() => handleUpdate(h.id)} disabled={actionLoading}><Check size={13} /></button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}><X size={13} /></button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => {
                                                    setEditingId(h.id);
                                                    setEditForm({ name: h.name, date: h.date, type: h.type });
                                                }}><Edit3 size={13} /></button>
                                                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--brand-danger)' }}
                                                    onClick={() => handleDelete(h.id)}><Trash2 size={13} /></button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {holidays.length === 0 && (
                            <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No holidays added yet</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </SettingSection>
    );
}

// ══════════════════════════════════════════
// TAB 5: SECURITY
// ══════════════════════════════════════════
function SecurityTab({ settings, updateSetting, securityConfig, updateSecurityConfig }) {
    const [localConfig, setLocalConfig] = useState(securityConfig || {});

    // Sync local state when securityConfig changes
    useEffect(() => {
        if (securityConfig) setLocalConfig(securityConfig);
    }, [securityConfig]);

    const handleLocalUpdate = (key, value) => {
        setLocalConfig(prev => ({ ...prev, [key]: value }));
    };

    const saveGeofence = () => {
        updateSecurityConfig(localConfig);
    };

    return (
        <>
            <SettingSection icon={Lock} title="Authentication" description="Control login behavior and security policies" color="#ef4444">
                <FieldRow label="Session Timeout (minutes)" description="Auto-logout after inactivity">
                    <input
                        className="form-input" type="number" style={{ maxWidth: 200 }}
                        value={settings.session_timeout || 30}
                        onChange={e => updateSetting('session_timeout', Number(e.target.value))}
                        min={5} max={480}
                    />
                </FieldRow>
                <FieldRow label="Minimum Password Length" description="Enforce strong passwords">
                    <input
                        className="form-input" type="number" style={{ maxWidth: 200 }}
                        value={settings.min_password_length || 8}
                        onChange={e => updateSetting('min_password_length', Number(e.target.value))}
                        min={6} max={32}
                    />
                </FieldRow>
                <FieldRow label="Enforce Two-Factor (2FA)" description="Require 2FA for all users">
                    <Toggle
                        checked={settings.enforce_2fa}
                        onChange={val => updateSetting('enforce_2fa', val)}
                    />
                </FieldRow>
            </SettingSection>

            <SettingSection icon={MapPin} title="Geofencing Guard" description="Enforce location-based attendance and access" color="#f59e0b">
                <div style={{
                    background: 'rgba(245, 158, 11, 0.06)', borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(245, 158, 11, 0.15)', padding: 'var(--space-md)',
                    marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'flex-start', gap: 10
                }}>
                    <Shield size={16} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Geofencing ensures that employees can only mark attendance when they are physically present at the office location. 
                        <strong> Global override</strong>: Super Admins are exempt from geofencing restrictions.
                    </p>
                </div>

                <FieldRow label="Geofencing Protection" description="Enable or disable mandatory location verification">
                    <Toggle
                        checked={localConfig.geofencingEnabled}
                        onChange={val => handleLocalUpdate('geofencingEnabled', val)}
                    />
                </FieldRow>

                <FieldRow label="Office Location Name" description="Human-readable name for the office area">
                    <input
                        className="form-input"
                        style={{ maxWidth: 280 }}
                        value={localConfig.officeLocationName || ''}
                        onChange={e => handleLocalUpdate('officeLocationName', e.target.value)}
                        placeholder="e.g. Headquarters"
                    />
                </FieldRow>

                <FieldRow label="GPS Coordinates" description="Latitude and Longitude of the office center">
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>LAT</span>
                            <input
                                className="form-input" type="number" step="any"
                                style={{ paddingLeft: 34, fontSize: '0.8rem' }}
                                value={localConfig.officeLat || ''}
                                onChange={e => handleLocalUpdate('officeLat', parseFloat(e.target.value))}
                            />
                        </div>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)' }}>LNG</span>
                            <input
                                className="form-input" type="number" step="any"
                                style={{ paddingLeft: 34, fontSize: '0.8rem' }}
                                value={localConfig.officeLng || ''}
                                onChange={e => handleLocalUpdate('officeLng', parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                </FieldRow>

                <FieldRow label="Geofence Radius" description="Allowed distance from center (in meters)">
                    <div style={{ position: 'relative', maxWidth: 120 }}>
                        <Crosshair size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            className="form-input" type="number"
                            style={{ paddingLeft: 32 }}
                            value={localConfig.officeRadius || ''}
                            onChange={e => handleLocalUpdate('officeRadius', parseInt(e.target.value))}
                            min={10} max={5000}
                        />
                    </div>
                </FieldRow>

                <FieldRow label="Restriction Message" description="Message shown when user is outside the fence">
                    <textarea
                        className="form-input"
                        style={{ height: 80, resize: 'none', fontSize: '0.85rem' }}
                        value={localConfig.geofenceMessage || ''}
                        onChange={e => handleLocalUpdate('geofenceMessage', e.target.value)}
                    />
                </FieldRow>

                <div style={{ marginTop: 'var(--space-lg)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                        className="btn btn-primary" 
                        onClick={saveGeofence}
                        style={{ background: 'var(--brand-warning)', borderColor: 'var(--brand-warning-dark)' }}
                    >
                        <Save size={14} style={{ marginRight: 8 }} /> Update Geofencing Guard
                    </button>
                </div>
            </SettingSection>


        </>
    );
}

// ══════════════════════════════════════════
// TAB 6: NOTIFICATIONS
// ══════════════════════════════════════════
function NotificationsTab({ settings, updateSetting }) {
    return (
        <>
            <SettingSection icon={Bell} title="System Notifications" description="Toggle automated alerts for key events" color="#8b5cf6">
                <FieldRow label="Leave Approval Reminders" description="Notify managers about pending leave requests">
                    <Toggle
                        checked={settings.notify_leave_approval !== false}
                        onChange={val => updateSetting('notify_leave_approval', val)}
                    />
                </FieldRow>
                <FieldRow label="Attendance Anomaly Alerts" description="Alert HR when employees have unusual patterns">
                    <Toggle
                        checked={settings.notify_attendance_anomaly}
                        onChange={val => updateSetting('notify_attendance_anomaly', val)}
                    />
                </FieldRow>
                <FieldRow label="Loan Request Alerts" description="Notify finance team on new loan applications">
                    <Toggle
                        checked={settings.notify_loan_request !== false}
                        onChange={val => updateSetting('notify_loan_request', val)}
                    />
                </FieldRow>
                <FieldRow label="Regularization Reminders" description="Remind managers about pending regularization requests">
                    <Toggle
                        checked={settings.notify_regularization !== false}
                        onChange={val => updateSetting('notify_regularization', val)}
                    />
                </FieldRow>
            </SettingSection>

            <SettingSection icon={CalendarDays} title="Event Notifications" description="Celebrate milestones with your team" color="#ec4899">
                <FieldRow label="Birthday Notifications" description="In-app reminders for employee birthdays">
                    <Toggle
                        checked={settings.notify_birthdays !== false}
                        onChange={val => updateSetting('notify_birthdays', val)}
                    />
                </FieldRow>
                <FieldRow label="Work Anniversary" description="Celebrate team member milestones">
                    <Toggle
                        checked={settings.notify_work_anniversary !== false}
                        onChange={val => updateSetting('notify_work_anniversary', val)}
                    />
                </FieldRow>
                <FieldRow label="Probation End Dates" description="Alert HR before probation periods end">
                    <Toggle
                        checked={settings.notify_probation_end}
                        onChange={val => updateSetting('notify_probation_end', val)}
                    />
                </FieldRow>
            </SettingSection>
        </>
    );
}

// ══════════════════════════════════════════
// TAB 7: APPEARANCE
// ══════════════════════════════════════════
function AppearanceTab({ settings, updateSetting }) {
    const themes = [
        { id: 'system', label: 'System Default', icon: Settings, desc: 'Follow OS preference' },
        { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Easy on the eyes' },
        { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Classic bright theme' },
    ];

    const brandColors = [
        { name: 'Indigo', value: '#6366f1' },
        { name: 'Sky Blue', value: '#0ea5e9' },
        { name: 'Emerald', value: '#10b981' },
        { name: 'Rose', value: '#f43f5e' },
        { name: 'Amber', value: '#f59e0b' },
        { name: 'Violet', value: '#8b5cf6' },
    ];

    return (
        <>
            <SettingSection icon={Palette} title="Theme" description="Customize the look and feel of the application" color="#ec4899">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
                    {themes.map(theme => {
                        const isActive = (settings.theme || 'system') === theme.id;
                        return (
                            <button
                                key={theme.id}
                                onClick={() => updateSetting('theme', theme.id)}
                                style={{
                                    padding: 'var(--space-lg)', borderRadius: 'var(--radius-md)',
                                    border: isActive ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                                    background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-input)',
                                    cursor: 'pointer', textAlign: 'center',
                                    transition: 'all var(--transition-fast)',
                                    fontFamily: 'var(--font-body)',
                                }}
                            >
                                <theme.icon size={28} color={isActive ? 'var(--brand-primary)' : 'var(--text-muted)'} style={{ marginBottom: 8 }} />
                                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: isActive ? 'var(--brand-primary)' : 'var(--text-primary)' }}>{theme.label}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{theme.desc}</div>
                            </button>
                        );
                    })}
                </div>
            </SettingSection>

            <SettingSection icon={Palette} title="Brand Color" description="Primary accent color used throughout the app" color="#8b5cf6">
                <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                    {brandColors.map(color => {
                        const isActive = (settings.brand_color || '#6366f1') === color.value;
                        return (
                            <button
                                key={color.value}
                                onClick={() => updateSetting('brand_color', color.value)}
                                style={{
                                    width: 72, height: 72, borderRadius: 'var(--radius-md)',
                                    background: color.value, border: isActive ? '3px solid white' : '2px solid transparent',
                                    cursor: 'pointer', display: 'flex', alignItems: 'flex-end',
                                    justifyContent: 'center', padding: 6,
                                    boxShadow: isActive ? `0 0 20px ${color.value}60` : 'none',
                                    transition: 'all var(--transition-fast)',
                                    outline: isActive ? `2px solid ${color.value}` : 'none',
                                    outlineOffset: 2,
                                }}
                            >
                                <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                                    {color.name}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </SettingSection>
        </>
    );
}

// ══════════════════════════════════════════
// TAB 8: INTEGRATIONS
// ══════════════════════════════════════════
function IntegrationsTab() {
    const integrations = [
        { name: 'Slack', desc: 'Send leave and attendance notifications to Slack channels', status: 'coming_soon', color: '#4A154B', icon: '💬' },
        { name: 'Microsoft Teams', desc: 'Integrate with Teams for approval workflows', status: 'coming_soon', color: '#5B5FC7', icon: '🟦' },
        { name: 'Biometric Devices', desc: 'Sync punch-in/out with ZKTeco, eSSL or HikVision', status: 'coming_soon', color: '#10b981', icon: '🖐️' },
        { name: 'Tally / Zoho Books', desc: 'Export payroll data to accounting software', status: 'coming_soon', color: '#ef4444', icon: '📊' },
        { name: 'Google Calendar', desc: 'Sync holidays and leave info with Google Calendar', status: 'coming_soon', color: '#4285f4', icon: '📅' },
        { name: 'WhatsApp Business', desc: 'Send automated HR notifications via WhatsApp', status: 'coming_soon', color: '#25D366', icon: '📱' },
    ];

    return (
        <SettingSection icon={Plug} title="Third-Party Integrations" description="Connect AI4S Smart HR with external tools" color="#06b6d4">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
                {integrations.map(intg => (
                    <div key={intg.name} style={{
                        background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)', padding: 'var(--space-lg)',
                        display: 'flex', gap: 14, alignItems: 'flex-start',
                        opacity: 0.7, transition: 'opacity var(--transition-fast)',
                    }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                    >
                        <div style={{
                            width: 44, height: 44, borderRadius: 'var(--radius-md)',
                            background: `${intg.color}18`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.4rem', flexShrink: 0
                        }}>
                            {intg.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{intg.name}</span>
                                <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>Coming Soon</span>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{intg.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </SettingSection>
    );
}
