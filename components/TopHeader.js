'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/AppContext';
import { getRoleMeta } from '@/lib/rbac';
import { PERMISSIONS, getInitials } from '@/lib/constants';
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
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const searchRef = useRef(null);
    const { users } = useApp();

    const searchResults = searchQuery.trim() ? users.filter(u => 
        u.status === 'active' && (
            (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.department || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
    ).slice(0, 5) : [];

    useEffect(() => {
        // Init theme from localStorage or default to dark
        const savedTheme = localStorage.getItem('ai4s-theme') || 'dark';
        setIsDarkMode(savedTheme === 'dark');
        document.documentElement.setAttribute('data-theme', savedTheme);

        function handleClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
            if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setSearchOpen(false);
                setSearchQuery('');
                setSelectedEmployee(null);
            }
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
        const icons = { leave: '📅', approval: '✅', payroll: '💰', regularization: '🕐', kudos: '🏆', system: '⚙️' };
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
        <header className="header" style={{ gap: 12 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{title}</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Expandable Search Input */}
                <div ref={searchRef} style={{ position: 'relative', width: searchOpen ? 300 : 40, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: searchOpen ? 'var(--bg-input)' : 'transparent', border: searchOpen ? '1px solid var(--border-default)' : '1px solid transparent', borderRadius: '24px', padding: '0 4px', height: 40, transition: 'all 0.3s' }}>
                        <button className="btn btn-ghost btn-icon" style={{ border: 'none', background: 'transparent' }} onClick={() => setSearchOpen(true)}>
                            <Search size={18} />
                        </button>
                        {searchOpen && (
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Search employees..." 
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '0.9rem', padding: '0 8px' }}
                                value={searchQuery}
                                onChange={e => { setSearchQuery(e.target.value); setSelectedEmployee(null); }}
                            />
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {searchOpen && searchQuery.trim() && !selectedEmployee && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 350, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', zIndex: 300, overflow: 'hidden', animation: 'slideDown 0.2s ease' }}>
                            {searchResults.length > 0 ? (
                                searchResults.map(emp => (
                                    <div key={emp.id} className="sidebar-user" style={{ padding: '10px 14px', borderRadius: 0, borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }} onClick={() => setSelectedEmployee(emp)}>
                                        <div className="avatar avatar-sm" style={{ background: `${emp.avatarColor}15`, color: emp.avatarColor, fontWeight: 700 }}>{emp.avatar}</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{emp.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.designation} • {emp.department}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No matches found</div>
                            )}
                        </div>
                    )}

                    {/* Employee Detail Popover */}
                    {selectedEmployee && (
                        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320, background: 'var(--bg-elevated)', border: '1px solid var(--border-active)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg), 0 0 20px rgba(99,102,241,0.2)', zIndex: 301, overflow: 'hidden', animation: 'scaleIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                            <div style={{ background: 'var(--gradient-brand)', height: 80, position: 'relative' }}>
                                <button style={{ position: 'absolute', right: 10, top: 10, background: 'rgba(0,0,0,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }} onClick={() => setSelectedEmployee(null)}>×</button>
                            </div>
                            <div style={{ padding: '0 20px 20px 20px', marginTop: -40, position: 'relative', zIndex: 5 }}>
                                <div className="avatar avatar-lg" style={{ border: '4px solid var(--bg-elevated)', background: selectedEmployee.avatarColor || 'var(--gradient-brand)', boxShadow: 'var(--shadow-md)', margin: '0 auto 12px', width: 80, height: 80, fontSize: '1.8rem', fontWeight: 800 }}>
                                    {selectedEmployee.avatar}
                                </div>
                                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 4 }}>{selectedEmployee.name}</h3>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary-light)', fontFamily: 'monospace', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '12px', display: 'inline-block' }}>{selectedEmployee.employeeId}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💼</div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Designation</div>
                                            <div style={{ fontWeight: 600 }}>{selectedEmployee.designation}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏢</div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Department</div>
                                            <div style={{ fontWeight: 600 }}>{selectedEmployee.department}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✉️</div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Email</div>
                                            <a href={`mailto:${selectedEmployee.email}`} style={{ fontWeight: 600, color: 'var(--brand-primary-light)', textDecoration: 'none' }}>{selectedEmployee.email}</a>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.85rem' }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📞</div>
                                        <div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Phone</div>
                                            <div style={{ fontWeight: 600 }}>{selectedEmployee.phone || 'Not available'}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

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
