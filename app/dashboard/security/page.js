'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { Wifi, WifiOff, Plus, Trash2, Shield, ToggleLeft, ToggleRight, Server, Eye } from 'lucide-react';

function SecurityContent() {
    const { currentUser, securityConfig, updateSecurityConfig, users, auditLog } = useApp();
    const [newIP, setNewIP] = useState('');
    const [newNetwork, setNewNetwork] = useState('');
    const [pairSSID, setPairSSID] = useState('');
    const [pairIP, setPairIP] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);

    async function detectMyIP() {
        setIsDetecting(true);
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            if (data.ip) setPairIP(data.ip);
        } catch (err) {
            console.error('Failed to detect IP:', err);
            alert('Could not detect public IP automatically. Please enter it manually.');
        } finally {
            setIsDetecting(false);
        }
    }

    // Ensure config fields are safe
    const safeConfig = {
        wifiRestrictionEnabled: !!securityConfig?.wifiRestrictionEnabled,
        allowedIPs: securityConfig?.allowedIPs || [],
        allowedNetworks: securityConfig?.allowedNetworks || [],
        allowedAccessPoints: securityConfig?.allowedAccessPoints || [],
        exemptRoles: securityConfig?.exemptRoles || ['super_admin', 'core_admin'],
        popupMessage: securityConfig?.popupMessage || 'Login Restricted: Please connect to the authorized company network to access AI4S Smart HR.'
    };

    function addIP() {
        if (!newIP.trim()) return;
        updateSecurityConfig({ allowedIPs: [...safeConfig.allowedIPs, newIP.trim()] });
        setNewIP('');
    }

    function removeIP(ip) {
        updateSecurityConfig({ allowedIPs: safeConfig.allowedIPs.filter(i => i !== ip) });
    }

    function addNetwork() {
        if (!newNetwork.trim()) return;
        updateSecurityConfig({ allowedNetworks: [...safeConfig.allowedNetworks, newNetwork.trim()] });
        setNewNetwork('');
    }

    function removeNetwork(net) {
        updateSecurityConfig({ allowedNetworks: safeConfig.allowedNetworks.filter(n => n !== net) });
    }

    function addAccessPoint() {
        if (!pairSSID.trim() || !pairIP.trim()) {
            alert('Please provide both Wi-Fi Name (SSID) and IP Address.');
            return;
        }
        const newAP = { id: `AP${Date.now()}`, ssid: pairSSID.trim(), ip: pairIP.trim() };
        updateSecurityConfig(prev => ({
            allowedAccessPoints: [...(prev.allowedAccessPoints || []), newAP]
        }));
        setPairSSID('');
        setPairIP('');
    }

    function removeAccessPoint(id) {
        updateSecurityConfig(prev => ({
            allowedAccessPoints: (prev.allowedAccessPoints || []).filter(ap => ap.id !== id)
        }));
    }

    function toggleGlobal() {
        updateSecurityConfig({ wifiRestrictionEnabled: !safeConfig.wifiRestrictionEnabled });
    }

    const securityAudit = auditLog.filter(a => ['NETWORK_POLICY_UPDATED', 'SECURITY_CONFIG_UPDATED', 'LOGIN', 'LOGOUT'].includes(a.action)).slice(0, 10);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Network Security Settings</h1>
                    <p className="page-subtitle">Control Wi-Fi restriction policies and approved access points</p>
                </div>
            </div>

            <div className="grid-2" style={{ marginBottom: 24 }}>
                {/* Global Toggle */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 6 }}>Wi-Fi Restriction Policy</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>When enabled, restricted roles must be on an approved network to log in.</p>
                        </div>
                        <button onClick={toggleGlobal} style={{ background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                            {safeConfig.wifiRestrictionEnabled
                                ? <ToggleRight size={44} color="var(--brand-primary)" />
                                : <ToggleLeft size={44} color="var(--text-muted)" />}
                        </button>
                    </div>
                    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: safeConfig.wifiRestrictionEnabled ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${safeConfig.wifiRestrictionEnabled ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                        {safeConfig.wifiRestrictionEnabled ? <Wifi size={18} color="#34d399" /> : <WifiOff size={18} color="#f87171" />}
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: safeConfig.wifiRestrictionEnabled ? '#34d399' : '#f87171' }}>
                                {safeConfig.wifiRestrictionEnabled ? 'Network Restriction: ACTIVE' : 'Network Restriction: DISABLED'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{safeConfig.wifiRestrictionEnabled ? 'Employees must use approved networks' : 'All users can log in from any network'}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Role Exemptions (Always Bypass)</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {safeConfig.exemptRoles.map(r => (
                                <span key={r} className="badge badge-warning">{r.replace('_', ' ')}</span>
                            ))}
                        </div>
                        <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <Shield size={13} style={{ display: 'inline', marginRight: 4 }} />
                            Super Admins and Core Admins always bypass network restrictions — this cannot be changed.
                        </div>
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>Custom Error Message</label>
                        <textarea className="form-textarea" style={{ minHeight: 60 }}
                            value={safeConfig.popupMessage}
                            onChange={e => updateSecurityConfig({ popupMessage: e.target.value })} />
                    </div>
                </div>

                {/* Approved Access Points (SSID + IP) */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Approved Access Points (WIFI + IP)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>WIFI Name (SSID)</label>
                                <input type="text" className="form-input" placeholder="e.g. Office-WiFi" value={pairSSID} onChange={e => setPairSSID(e.target.value)} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>IP Address / Range</label>
                                    <button 
                                        onClick={detectMyIP}
                                        disabled={isDetecting}
                                        style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                                    >
                                        {isDetecting ? 'Detecting...' : 'Detect My IP'}
                                    </button>
                                </div>
                                <input type="text" className="form-input" placeholder="e.g. 192.168.1.1" value={pairIP} onChange={e => setPairIP(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button className="btn btn-primary" onClick={addAccessPoint} style={{ padding: '8px 12px' }}><Plus size={18} /></button>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                        {safeConfig.allowedAccessPoints.map(ap => (
                            <div key={ap.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', transition: 'all 0.2s' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Wifi size={16} color="var(--brand-primary)" />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{ap.ssid}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{ap.ip}</div>
                                    </div>
                                </div>
                                <button className="btn btn-ghost btn-sm" onClick={() => removeAccessPoint(ap.id)}><Trash2 size={13} color="#f87171" /></button>
                            </div>
                        ))}
                        {safeConfig.allowedAccessPoints.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                                No approved access points configured.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Security Audit */}
            <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Security Audit Log</h3>
                <div className="table-wrapper" style={{ boxShadow: 'none', border: 'none' }}>
                    <table className="data-table">
                        <thead><tr><th>Action</th><th>User</th><th>Details</th><th>Timestamp</th></tr></thead>
                        <tbody>
                            {securityAudit.map(a => (
                                <tr key={a.id}>
                                    <td><span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>{a.action}</span></td>
                                    <td style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{users.find(u => u.id === a.userId)?.name || a.userId}</td>
                                    <td style={{ fontSize: '0.8rem' }}>{a.details}</td>
                                    <td style={{ fontSize: '0.75rem' }}>{new Date(a.timestamp).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                            {securityAudit.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No security events logged yet.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default function SecurityPage() {
    return <DashboardLayout title="Network Security"><SecurityContent /></DashboardLayout>;
}
