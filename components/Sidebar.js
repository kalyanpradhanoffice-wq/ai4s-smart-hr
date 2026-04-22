'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/AppContext';
import { can } from '@/lib/rbac';
import { PERMISSIONS } from '@/lib/constants';
import {
    LayoutDashboard, Users, Clock, Calendar, DollarSign, Target, TrendingUp,
    UserPlus, UserMinus, Shield, Settings, Key, Bell, LogOut, ChevronDown, Search,
    ClipboardList, Award, AlertCircle, FileText, Building, Database, UserCheck, UserCircle,
} from 'lucide-react';

// Each item can have a single `permission` string OR a `permissions` array (OR logic).
// If `roles` is specified, item is only visible to those roles (in addition to super_admin).
const NAV_SECTIONS = [
    {
        title: 'Overview',
        items: [
            { label: 'Super Admin', icon: Shield, href: '/dashboard/superadmin', permission: PERMISSIONS.VIEW_SUPER_ADMIN_DASHBOARD, roles: ['super_admin'] },
            { label: 'Admin Hub', icon: Building, href: '/dashboard/admin', permission: PERMISSIONS.VIEW_ADMIN_DASHBOARD },
            { label: 'HR Dashboard', icon: Users, href: '/dashboard/hr', permission: PERMISSIONS.VIEW_HR_DASHBOARD },
            { label: 'Manager Hub', icon: LayoutDashboard, href: '/dashboard/manager', permission: PERMISSIONS.VIEW_MANAGER_DASHBOARD },
            { label: 'My Dashboard', icon: LayoutDashboard, href: '/dashboard/employee', permission: PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD },
        ],
    },
    {
        title: 'Workforce',
        items: [
            { label: 'Employees', icon: Users, href: '/dashboard/employees', permission: PERMISSIONS.VIEW_ALL_EMPLOYEES },
            { label: 'Interviews', icon: UserCheck, href: '/dashboard/interviews', permissions: [PERMISSIONS.MANAGE_INTERVIEW_PIPELINE, PERMISSIONS.VIEW_INTERVIEW_SCHEDULE, PERMISSIONS.SUBMIT_INTERVIEW_ASSESSMENT] },
        ],
    },
    {
        title: 'Operations',
        items: [
            { label: 'Attendance', icon: Clock, href: '/dashboard/attendance', permissions: [PERMISSIONS.MARK_ATTENDANCE, PERMISSIONS.VIEW_OWN_ATTENDANCE, PERMISSIONS.VIEW_ALL_ATTENDANCE, PERMISSIONS.VIEW_TEAM_ATTENDANCE] },
            { label: 'Attendance Request', icon: ClipboardList, href: '/dashboard/attendance-request', permissions: [PERMISSIONS.MARK_ATTENDANCE, PERMISSIONS.APPLY_LEAVE] },
            { label: 'Approvals', icon: ClipboardList, href: '/dashboard/approvals', permissions: [PERMISSIONS.APPROVE_LEAVE, PERMISSIONS.VIEW_PENDING_APPROVALS, PERMISSIONS.APPROVE_ANY_REQUEST] },
        ],
    },
    {
        title: 'Finance',
        items: [
            { label: 'Payroll', icon: DollarSign, href: '/dashboard/payroll', permissions: [PERMISSIONS.VIEW_OWN_PAYSLIP, PERMISSIONS.VIEW_ALL_PAYSLIPS, PERMISSIONS.RUN_PAYROLL] },
            { label: 'Loans & Advances', icon: FileText, href: '/dashboard/loans', permissions: [PERMISSIONS.APPLY_LOAN, PERMISSIONS.VIEW_OWN_LOANS, PERMISSIONS.VIEW_ALL_LOANS] },
        ],
    },
    {
        title: 'Growth',
        items: [
            { label: 'OKRs', icon: Target, href: '/dashboard/okr', permissions: [PERMISSIONS.VIEW_OWN_OKR, PERMISSIONS.MANAGE_OKR, PERMISSIONS.VIEW_ALL_OKR] },
            { label: '360° Feedback', icon: Award, href: '/dashboard/feedback', permissions: [PERMISSIONS.SUBMIT_FEEDBACK, PERMISSIONS.VIEW_FEEDBACK, PERMISSIONS.VIEW_ALL_FEEDBACK] },
        ],
    },
    {
        title: 'Administration',
        items: [
            { label: 'Role Management', icon: Shield, href: '/dashboard/roles', permissions: [PERMISSIONS.MANAGE_ROLES, PERMISSIONS.VIEW_ROLES] },

            { label: 'Audit Logs', icon: Database, href: '/dashboard/audit', permission: PERMISSIONS.VIEW_AUDIT_LOGS },
            { label: 'System Settings', icon: Settings, href: '/dashboard/settings', permissions: [PERMISSIONS.MANAGE_SYSTEM_SETTINGS, PERMISSIONS.VIEW_SYSTEM_SETTINGS, PERMISSIONS.MANAGE_APPROVAL_WORKFLOWS] },
        ],
    },
];

export default function Sidebar({ customRoles }) {
    const router = useRouter(); // Keep for logout if needed
    const pathname = usePathname();
    const { currentUser, logout } = useApp();

    async function handleLogout() {
        // Trigger the Nuclear Logout from AppContext which handles all clearing and the redirect
        await logout();
    }


    const userRole = currentUser?.role;
    const isSuperAdmin = userRole === 'super_admin';

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon"><span style={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>AI</span></div>
                <div>
                    <div className="sidebar-logo-text">AI4S Smart HR</div>
                    <div className="sidebar-logo-sub">Enterprise HRMS</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {NAV_SECTIONS.map(section => {
                    const visibleItems = section.items.filter(item => {
                        if (isSuperAdmin) return true;
                        if (!currentUser) return false;
                        if (item.roles && !item.roles.includes(userRole)) return false;
                        // Support both single permission and permissions array (OR logic)
                        if (item.permissions) {
                            return item.permissions.some(p => can(currentUser, p, customRoles || []));
                        }
                        return can(currentUser, item.permission, customRoles || []);
                    });
                    if (visibleItems.length === 0) return null;
                    return (
                        <div key={section.title}>
                            <div className="sidebar-section-title">{section.title}</div>
                            {visibleItems.map(item => (
                                <Link key={item.href} href={item.href} className={`sidebar-item${pathname === item.href ? ' active' : ''}`}>
                                    <item.icon size={17} />
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="sidebar-footer">
                <div className="sidebar-user" onClick={handleLogout} title="Click to logout">
                    <div className={`avatar avatar-sm`} style={{ background: `var(--gradient-brand)`, width: 32, height: 32, fontSize: '0.7rem' }}>
                        {currentUser?.avatar}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, truncate: true }}>{currentUser?.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{currentUser?.designation}</div>
                    </div>
                    <LogOut size={15} color="var(--text-muted)" />
                </div>
            </div>
        </aside>
    );
}
