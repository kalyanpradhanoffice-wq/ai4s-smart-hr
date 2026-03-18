'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
    return (
        <DashboardLayout title="Settings">
            <div className="animate-fade-in">
                <div className="page-header">
                    <div><h1 className="page-title">System Settings</h1><p className="page-subtitle">Configure approval workflows and system preferences</p></div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                    <Settings size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
                    <p style={{ color: 'var(--text-muted)' }}>Advanced settings panel — coming in next release.</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
