'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientProviders from './ClientProviders';

function HomeRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/login'); }, [router]);
    return (
        <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="spinner" />
        </div>
    );
}

export default function HomePage() {
    return <ClientProviders><HomeRedirect /></ClientProviders>;
}
