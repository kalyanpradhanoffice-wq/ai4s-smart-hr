'use client';
import { AppProvider } from '@/lib/AppContext';
import { useEffect, useState } from 'react';

export default function ClientProviders({ children }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <div style={{ minHeight: '100vh', background: '#0f0f1a' }} />;
    return <AppProvider>{children}</AppProvider>;
}
