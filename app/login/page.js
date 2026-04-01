'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { isNetworkRestricted } from '@/lib/rbac';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Wifi, WifiOff, Shield, AlertCircle, X, Lock, Mail, ChevronRight } from 'lucide-react';

function LoginPage() {
    const router = useRouter();
    const { login, logout, signUp, currentUser, securityConfig, isSecurityConfigLoaded, PRODUCTION_MODE } = useApp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isRegister, setIsRegister] = useState(false);
    const [name, setName] = useState('');
    const [designation, setDesignation] = useState('');
    const [wifiModal, setWifiModal] = useState(false);
    const [networkStatus, setNetworkStatus] = useState('checking');
    const [currentIP, setCurrentIP] = useState(null);
    const [isNetworkAllowed, setIsNetworkAllowed] = useState(null);

    useEffect(() => {
        if (currentUser) router.replace(getRoute(currentUser.role));
    }, [currentUser, router]);

    // Detect current public IP on load and verify against allowed list
    useEffect(() => {
        async function detectIP() {
            try {
                // Fetch actual security config directly, as context might not be loaded if logged out
                const { data: secData } = await supabase.from('security_config').select('*').eq('id', 'system_config').single();
                const actualConfig = secData?.config;

                const res = await fetch('https://api.ipify.org?format=json');
                const data = await res.json();
                if (data.ip) {
                    setCurrentIP(data.ip);
                    setNetworkStatus('detected');

                    // Client-side visual verification (optional, purely for UI feedback)
                    if (actualConfig?.wifiRestrictionEnabled && actualConfig?.allowedAccessPoints) {
                        const verified = actualConfig.allowedAccessPoints.some(ap => {
                            if (!ap.ip) return false;
                            return data.ip.startsWith(ap.ip);
                        });
                        setIsNetworkAllowed(verified);
                    } else {
                        setIsNetworkAllowed(true); // If restriction is disabled, all networks are 'allowed'
                    }
                }
            } catch (err) {
                console.error('IP detection failed:', err);
                setNetworkStatus('unverified');
                setIsNetworkAllowed(false);
            }
        }
        detectIP();
    }, []);

    function getRoute(role) {
        const routes = {
            super_admin: '/dashboard/superadmin',
            core_admin: '/dashboard/admin',
            hr_admin: '/dashboard/hr',
            manager: '/dashboard/manager',
            employee: '/dashboard/employee',
        };
        return routes[role] || '/dashboard/employee';
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (isRegister) {
            const result = await signUp(email, password, {
                name,
                designation,
                role: 'super_admin',
                employee_id: `EMP${Date.now().toString().slice(-4)}`
            });
            if (!result.success) {
                setError(result.error);
                setLoading(false);
                return;
            }
            setIsRegister(false);
            setError('Registration successful! Please sign in.');
            setLoading(false);
            return;
        }

        const result = await login(email, password, currentIP);
        if (!result.success) {
            if (result.isRestricted) {
                setError(`Unauthorized Network: Please connect to the designated Office Wi-Fi. (Detected IP: ${currentIP || 'Unknown'})`);
            } else {
                setError(result.error);
            }
            setLoading(false);
            return;
        }

        router.replace(result.redirectTo);
    }

    return (
        <div className="login-root">
            {/* Animated Background */}
            <div className="login-bg">
                <div className="login-orb orb1" />
                <div className="login-orb orb2" />
                <div className="login-orb orb3" />
                <div className="login-grid" />
            </div>

            <div className="login-container">
                {/* Left Panel */}
                <div className="login-left">
                    <div className="login-brand">
                        <div className="login-logo">
                            <span>AI</span>
                        </div>
                        <div>
                            <div className="login-brand-name">AI4S Smart HR</div>
                            <div className="login-brand-tag">Enterprise HRMS Platform</div>
                        </div>
                    </div>

                    <div className="login-hero">
                        <h1 className="login-hero-title">Your Workforce<br /><span className="gradient-text">Intelligence Hub</span></h1>
                        <p className="login-hero-desc">Complete Hire-to-Retire platform with AI-powered insights, real-time compliance, and intuitive workflows built for the modern Indian enterprise.</p>
                    </div>

                    <div className="login-features">
                        {['Statutory Compliance (EPF, ESI, TDS)', '360° Performance Management', 'Multi-Tier Approval Workflows', 'Real-Time Payroll Processing'].map(f => (
                            <div key={f} className="login-feature-item">
                                <div className="login-feature-dot" />
                                <span>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel — Login Card */}
                <div className="login-right">
                    <div className="login-card">
                        <div className="login-card-header">
                            <div className="login-card-icon"><Lock size={20} /></div>
                            <div>
                                <h2 className="login-card-title">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
                                <p className="login-card-sub">{isRegister ? 'Join your enterprise workspace' : 'Sign in to your workspace'}</p>
                            </div>
                        </div>

                        <div className="login-network-status">
                            {networkStatus === 'checking' ? (
                                <div className="network-badge checking"><div className="spinner" style={{ width: 12, height: 12 }} /> Identifying network...</div>
                            ) : networkStatus === 'detected' ? (
                                <div className={`network-badge ${isNetworkAllowed ? 'allowed' : 'restricted'}`}>
                                    {isNetworkAllowed ? <Wifi size={13} /> : <WifiOff size={13} />}
                                    {isNetworkAllowed ? 'Verified Office Network' : 'Guest / Unknown Network'}
                                </div>
                            ) : (
                                <div className="network-badge restricted"><WifiOff size={13} /> Network unverified</div>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="form-group">
                                <label className="form-label">Work Email</label>
                                <div style={{ position: 'relative' }}>
                                    <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type="email"
                                        className="form-input"
                                        style={{ paddingLeft: 38 }}
                                        placeholder="your.email@company.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-input"
                                        style={{ paddingLeft: 38, paddingRight: 42 }}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                    <button type="button" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                        onClick={() => setShowPassword(s => !s)}>
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="alert alert-danger animate-fade-in" style={{ fontSize: '0.82rem' }}>
                                    <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <a href="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--brand-primary-light)' }}>Forgot password?</a>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={loading}
                                style={{ justifyContent: 'center', gap: 8 }}
                            >
                                {loading ? (
                                    <><div className="spinner" style={{ width: 16, height: 16 }} /> Processing...</>
                                ) : (
                                    <>{isRegister ? 'Register Now' : 'Sign In'} <ChevronRight size={16} /></>
                                )}
                            </button>
                        </form>

                        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 16 }}>
                            <Shield size={11} style={{ display: 'inline', marginRight: 4 }} />
                            Protected by enterprise-grade security. Network access policy enforced.
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal removed as per user request */}

            <style>{`
        .login-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; padding: 20px; }
        .login-bg { position: fixed; inset: 0; z-index: 0; }
        .login-orb { position: absolute; border-radius: 50%; filter: blur(80px); opacity: 0.15; animation: float 8s ease-in-out infinite; }
        .orb1 { width: 600px; height: 600px; background: #6366f1; top: -200px; left: -200px; animation-delay: 0s; }
        .orb2 { width: 400px; height: 400px; background: #0ea5e9; bottom: -100px; right: -100px; animation-delay: -3s; }
        .orb3 { width: 300px; height: 300px; background: #f59e0b; top: 40%; left: 40%; animation-delay: -6s; }
        .login-grid { position: absolute; inset: 0; background-image: linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px); background-size: 60px 60px; }
        .login-container { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; max-width: 1100px; width: 100%; align-items: center; }
        .login-left { padding: 20px; }
        .login-brand { display: flex; align-items: center; gap: 14px; margin-bottom: 48px; }
        .login-logo { width: 52px; height: 52px; background: var(--gradient-brand); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 900; font-size: 1rem; color: white; box-shadow: var(--shadow-glow); }
        .login-brand-name { font-family: var(--font-display); font-weight: 800; font-size: 1.3rem; }
        .login-brand-tag { font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .login-hero-title { font-size: 2.8rem; font-weight: 800; margin-bottom: 20px; line-height: 1.1; }
        .login-hero-desc { color: var(--text-secondary); font-size: 1rem; line-height: 1.7; margin-bottom: 36px; }
        .login-features { display: flex; flex-direction: column; gap: 12px; }
        .login-feature-item { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: var(--text-secondary); }
        .login-feature-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gradient-brand); flex-shrink: 0; }
        .login-right { display: flex; justify-content: center; }
        .login-card { background: rgba(22,22,42,0.9); border: 1px solid var(--border-default); border-radius: var(--radius-xl); padding: 40px; width: 100%; max-width: 440px; backdrop-filter: blur(30px); box-shadow: var(--shadow-lg), 0 0 60px rgba(99,102,241,0.1); }
        .login-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
        .login-card-icon { width: 44px; height: 44px; background: var(--gradient-brand); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; color: white; box-shadow: var(--shadow-glow-sm); flex-shrink: 0; }
        .login-card-title { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; margin: 0; }
        .login-card-sub { color: var(--text-muted); font-size: 0.82rem; margin: 0; }
        .login-network-status { margin-bottom: 20px; }
        .network-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: var(--radius-full); font-size: 0.72rem; font-weight: 600; }
        .network-badge.checking { background: rgba(6,182,212,0.1); color: #22d3ee; border: 1px solid rgba(6,182,212,0.2); }
        .network-badge.restricted { background: rgba(245,158,11,0.1); color: #fbbf24; border: 1px solid rgba(245,158,11,0.2); }
        .network-badge.allowed { background: rgba(16,185,129,0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
        .login-form { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
        @keyframes animate-scale-in { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: animate-scale-in 0.25s ease; }
        @media (max-width: 900px) {
          .login-container { grid-template-columns: 1fr; gap: 32px; }
          .login-left { order: 2; text-align: center; padding: 0; }
          .login-right { order: 1; }
          .login-hero-title { font-size: 2rem; }
          .login-features { display: grid; grid-template-columns: 1fr 1fr; }
          .login-brand { justify-content: center; }
        }
        @media (max-width: 480px) {
          .login-card { padding: 24px; }
          .login-demo-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
        </div>
    );
}

export default function LoginWrapper() {
    return <LoginPage />;
}
