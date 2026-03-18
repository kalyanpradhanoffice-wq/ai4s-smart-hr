'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { Wifi, WifiOff, Plus, Trash2, Shield, ToggleLeft, ToggleRight, Server, Eye } from 'lucide-react';

function SecurityContent() {
    const { currentUser, securityConfig, updateSecurityConfig, users, auditLog } = useApp();
    const [newIP, setNewIP] = useState('');
    const [newNetwork, setNewNetwork] = useState('');

    function addIP() {
        if (!newIP.trim()) return;
        updateSecurityConfig({ allowedIPs: [...securityConfig.allowedIPs, newIP.trim()] });
        setNewIP('');
    }

    function removeIP(ip) {
        updateSecurityConfig({ allowedIPs: securityConfig.allowedIPs.filter(i => i !== ip) });
    }

    function addNetwork() {
        if (!newNetwork.trim()) return;
        updateSecurityConfig({ allowedNetworks: [...securityConfig.allowedNetworks, newNetwork.trim()] });
        setNewNetwork('');
    }

    function removeNetwork(net) {
        updateSecurityConfig({ allowedNetworks: securityConfig.allowedNetworks.filter(n => n !== net) });
    }

    function toggleGlobal() {
        updateSecurityConfig({ wifiRestrictionEnabled: !securityConfig.wifiRestrictionEnabled });
    }

    const securityAudit = auditLog.filter(a => ['NETWORK_POLICY_UPDATED', 'SECURITY_CONFIG_UPDATED', 'LOGIN', 'LOGOUT'].includes(a.action)).slice(0, 10);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Network Security Settings</h1>
                    <p className="page-subtitle">Control Wi-Fi restriction policies and approved networks</p>
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
                            {securityConfig.wifiRestrictionEnabled
                                ? <ToggleRight size={44} color="var(--brand-primary)" />
                                : <ToggleLeft size={44} color="var(--text-muted)" />}
                        </button>
                    </div>
                    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: securityConfig.wifiRestrictionEnabled ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${securityConfig.wifiRestrictionEnabled ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                        {securityConfig.wifiRestrictionEnabled ? <Wifi size={18} color="#34d399" /> : <WifiOff size={18} color="#f87171" />}
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: securityConfig.wifiRestrictionEnabled ? '#34d399' : '#f87171' }}>
                                {securityConfig.wifiRestrictionEnabled ? 'Network Restriction: ACTIVE' : 'Network Restriction: DISABLED'}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{securityConfig.wifiRestrictionEnabled ? 'Employees must use approved networks' : 'All users can log in from any network'}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Role Exemptions (Always Bypass)</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {securityConfig.exemptRoles.map(r => (
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
                            value={securityConfig.popupMessage}
                            onChange={e => updateSecurityConfig({ popupMessage: e.target.value })} />
                    </div>
                </div>

                {/* Approved Networks */}
                <div className="card">
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Approved Wi-Fi Networks</h3>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                        <input type="text" className="form-input" style={{ flex: 1 }} placeholder="Office-WiFi-Name" value={newNetwork} onChange={e => setNewNetwork(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addNetwork()} />
                        <button className="btn btn-primary btn-sm" onClick={addNetwork}><Plus size={14} /></button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                        {securityConfig.allowedNetworks.map(net => (
                            <div key={net} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Wifi size={14} color="#34d399" />
                                    <span style={{ fontSize: '0.875rem' }}>{net}</span>
                                </div>
                                <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => removeNetwork(net)}><Trash2 size={13} color="#f87171" /></button>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: 20 }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: 12 }}>Allowed IP Ranges</h4>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            <input type="text" className="form-input" style={{ flex: 1 }} placeholder="192.168.1.0/24" value={newIP} onChange={e => setNewIP(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addIP()} />
                            <button className="btn btn-primary btn-sm" onClick={addIP}><Plus size={14} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto' }}>
                            {securityConfig.allowedIPs.map(ip => (
                                <div key={ip} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <Server size={13} color="var(--brand-info)" />
                                        <span style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{ip}</span>
                                    </div>
                                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} onClick={() => removeIP(ip)}><Trash2 size={13} color="#f87171" /></button>
                                </div>
                            ))}
                        </div>
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
