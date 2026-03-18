'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { getRoleMeta } from '@/lib/rbac';
import { Bell, Search, LogOut, Settings, User, CheckCheck, Moon, Sun } from 'lucide-react';

export default function TopHeader({ title, customRoles }) {
    const router = useRouter();
    const { currentUser, notifications, markNotificationRead, markAllRead, logout } = useApp();
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const notifRef = useRef(null);
    const profileRef = useRef(null);

    const userNotifs = notifications.filter(n => n.userId === currentUser?.id);
    const unread = userNotifs.filter(n => !n.read).length;
    const roleMeta = getRoleMeta(currentUser?.role, customRoles || []);

    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        // Init theme from localStorage or default to dark
        const savedTheme = localStorage.getItem('ai4s-theme') || 'dark';
        setIsDarkMode(savedTheme === 'dark');
        document.documentElement.setAttribute('data-theme', savedTheme);

        function handleClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function toggleTheme() {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        const theme = newMode ? 'dark' : 'light';
        localStorage.setItem('ai4s-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }

    function handleLogout() {
        logout();
        router.replace('/login');
    }

    function getNotifIcon(type) {
        const icons = { leave: '🌴', approval: '✅', payroll: '💰', regularization: '🕐', kudos: '🏆', system: '⚙️' };
        return icons[type] || '🔔';
    }

    function timeAgo(ts) {
        const diff = (Date.now() - new Date(ts)) / 1000;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    }

    return (
        <header className="header">
            <div style={{ flex: 1 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700 }}>{title}</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Theme Toggle */}
                <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notifications */}
                <div ref={notifRef} style={{ position: 'relative' }}>
                    <button className="btn btn-ghost btn-icon" style={{ position: 'relative' }} onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}>
                        <Bell size={18} />
                        {unread > 0 && (
                            <span className="notification-badge">{unread > 9 ? '9+' : unread}</span>
                        )}
                    </button>
                    {notifOpen && (
                        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 360, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 200, animation: 'slideDown 0.2s ease' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</div>
                                {unread > 0 && (
                                    <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', gap: 4 }} onClick={() => markAllRead(currentUser?.id)}>
                                        <CheckCheck size={13} /> Mark all read
                                    </button>
                                )}
                            </div>
                            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                {userNotifs.length === 0 ? (
                                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No notifications</div>
                                ) : (
                                    userNotifs.slice(0, 10).map(n => (
                                        <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(99,102,241,0.05)', transition: 'background 0.15s' }}
                                            onClick={() => { markNotificationRead(n.id); if (n.link) router.push(n.link); setNotifOpen(false); }}>
                                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                <div style={{ fontSize: '1.1rem', flexShrink: 0 }}>{getNotifIcon(n.type)}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{n.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</div>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                                                </div>
                                                {!n.read && <div className="notification-dot" style={{ flexShrink: 0, marginTop: 4 }} />}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div ref={profileRef} style={{ position: 'relative' }}>
                    <button style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}>
                        <div className="avatar avatar-sm">{currentUser?.avatar}</div>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{currentUser?.name?.split(' ')[0]}</div>
                            <div style={{ fontSize: '0.65rem', color: roleMeta.color, fontWeight: 600 }}>{roleMeta.name}</div>
                        </div>
                    </button>
                    {profileOpen && (
                        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 200, animation: 'slideDown 0.2s ease', padding: '8px' }}>
                            <div style={{ padding: '10px 12px', marginBottom: 4, borderBottom: '1px solid var(--border-subtle)' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{currentUser?.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{currentUser?.email}</div>
                                <div style={{ fontSize: '0.68rem', marginTop: 4, display: 'inline-block', padding: '2px 8px', borderRadius: '20px', background: `${roleMeta.color}20`, color: roleMeta.color, fontWeight: 700 }}>{roleMeta.name}</div>
                            </div>
                            {[
                                { icon: User, label: 'My Profile', href: '/dashboard/profile' },
                                { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
                            ].map(item => (
                                <button key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', transition: 'all 0.15s', fontFamily: 'var(--font-body)' }}
                                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-glass)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => { router.push(item.href); setProfileOpen(false); }}>
                                    <item.icon size={15} /> {item.label}
                                </button>
                            ))}
                            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                            <button style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: 'none', background: 'transparent', cursor: 'pointer', color: '#f87171', fontSize: '0.85rem', transition: 'all 0.15s', fontFamily: 'var(--font-body)' }}
                                onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                onClick={handleLogout}>
                                <LogOut size={15} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
