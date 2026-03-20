'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import ToastContainer from '@/components/ToastContainer';
import ClientProviders from '@/app/ClientProviders';

function DashboardShell({ children, title }) {
    const router = useRouter();
    const { currentUser, customRoles, isInitialized } = useApp();

    useEffect(() => {
        if (isInitialized && !currentUser) router.replace('/login');
    }, [currentUser, isInitialized, router]);

    if (!isInitialized || !currentUser) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, background: 'var(--gradient-brand)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 900, color: 'white' }}>AI</div>
                    <div className="spinner" style={{ width: 24, height: 24 }} />
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading AI4S Smart HR...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-shell">
            <Sidebar customRoles={customRoles} />
            <div className="main-content">
                <TopHeader title={title} customRoles={customRoles} />
                <main className="page-body animate-fade-in">
                    {children}
                </main>
            </div>
            <ToastContainer />
        </div>
    );
}

export default function DashboardLayout({ children, title = 'Dashboard' }) {
    return <ClientProviders><DashboardShell title={title}>{children}</DashboardShell></ClientProviders>;
}
