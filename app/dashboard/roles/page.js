'use client';
import DashboardLayout from '@/components/DashboardLayout';
import { useApp } from '@/lib/AppContext';
import { useState } from 'react';
import { DEFAULT_ROLES, PERMISSIONS } from '@/lib/constants';
import { getRoleMeta } from '@/lib/rbac';
import { Plus, Trash2, Shield, Check, Search, ChevronDown, ChevronRight, Users, Layers, Lock, Copy } from 'lucide-react';

// ─── NAVIGATION-STRUCTURED PERMISSION GROUPS ───
const NAV_SECTIONS = [
    {
        section: 'Overview',
        icon: '🏠',
        groups: [
            {
                group: 'Super Admin Dashboard',
                route: '/dashboard/superadmin',
                subGroups: [
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_SUPER_ADMIN_DASHBOARD', label: 'Access Super Admin Dashboard' },
                        { key: 'VIEW_SUPER_ADMIN_HEADCOUNT', label: 'View Headcount Analytics' },
                        { key: 'VIEW_SUPER_ADMIN_PAYROLL_SUMMARY', label: 'View Payroll Summary Card' },
                        { key: 'VIEW_SUPER_ADMIN_ATTENDANCE_RATE', label: 'View Attendance Rate Card' },
                        { key: 'VIEW_SUPER_ADMIN_ACTIVITY_FEED', label: 'View Activity Feed' },
                    ]},
                ],
            },
            {
                group: 'Admin Hub',
                route: '/dashboard/admin',
                subGroups: [
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_ADMIN_DASHBOARD', label: 'Access Admin Hub' },
                        { key: 'VIEW_ADMIN_TEAM_STATS', label: 'View Team Stats' },
                        { key: 'VIEW_ADMIN_PENDING_APPROVALS', label: 'View Pending Approvals Widget' },
                        { key: 'VIEW_ADMIN_SECURITY_STATUS', label: 'View Security Status Widget' },
                    ]},
                ],
            },
            {
                group: 'HR Dashboard',
                route: '/dashboard/hr',
                subGroups: [
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_HR_DASHBOARD', label: 'Access HR Dashboard' },
                        { key: 'VIEW_HR_LEAVE_SUMMARY', label: 'View Leave Summary' },
                        { key: 'VIEW_HR_PAYROLL_OVERVIEW', label: 'View Payroll Overview Widget' },
                        { key: 'VIEW_HR_LIFECYCLE_STATUS', label: 'View Lifecycle Status' },
                    ]},
                ],
            },
            {
                group: 'Manager Hub',
                route: '/dashboard/manager',
                subGroups: [
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_MANAGER_DASHBOARD', label: 'Access Manager Hub' },
                        { key: 'VIEW_MANAGER_TEAM_ATTENDANCE', label: 'View Team Attendance Today' },
                        { key: 'VIEW_MANAGER_PENDING_ITEMS', label: 'View Pending Approvals Widget' },
                        { key: 'VIEW_MANAGER_TEAM_LEAVE_STATUS', label: 'View Team Leave Status' },
                    ]},
                ],
            },
            {
                group: 'My Dashboard',
                route: '/dashboard/employee',
                subGroups: [
                    { label: 'For Own', icon: '👤', perms: [
                        { key: 'VIEW_EMPLOYEE_DASHBOARD', label: 'Access My Dashboard' },
                        { key: 'VIEW_OWN_PROFILE', label: 'View Own Profile Page' },
                        { key: 'VIEW_OWN_KPIs', label: 'View Personal KPIs Widget' },
                        { key: 'VIEW_OWN_UPCOMING_EVENTS', label: 'View Upcoming Events Widget' },
                    ]},
                ],
            },
        ],
    },
    {
        section: 'Workforce',
        icon: '👥',
        groups: [
            {
                group: 'Employees',
                route: '/dashboard/employees',
                subGroups: [
                    { label: 'For Own', icon: '👤', perms: [
                        { key: 'VIEW_OWN_PROFILE', label: 'View Own Employee Profile' },
                    ]},
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_ALL_EMPLOYEES', label: 'View All Employees List' },
                        { key: 'VIEW_EMPLOYEE_DIRECTORY', label: 'Access Employee Directory' },
                        { key: 'VIEW_EMPLOYEE_CONTACT', label: 'View Contact Details (Email / Phone)' },
                        { key: 'VIEW_EMPLOYEE_DESIGNATION', label: 'View Designation & Department' },
                        { key: 'VIEW_EMPLOYEE_JOIN_DATE', label: 'View Join Date' },
                        { key: 'VIEW_EMPLOYEE_SALARY', label: 'View Salary Information' },
                        { key: 'VIEW_INACTIVE_EMPLOYEES', label: 'View Inactive / Retired Employees' },
                        { key: 'FILTER_EMPLOYEES_BY_DEPT', label: 'Filter by Department / Role' },
                        { key: 'EXPORT_EMPLOYEE_DATA', label: 'Export Employee Data (CSV)' },
                        { key: 'CREATE_EMPLOYEE', label: 'Add New Employee Account' },
                        { key: 'EDIT_EMPLOYEE', label: 'Edit Employee Profile Details' },
                        { key: 'EDIT_EMPLOYEE_SALARY', label: 'Edit Employee Salary Figures' },
                        { key: 'DEACTIVATE_EMPLOYEE', label: 'Deactivate / Retire Employee' },
                        { key: 'DELETE_EMPLOYEE', label: 'Permanently Delete Employee' },
                        { key: 'RESET_PASSWORDS', label: 'Reset Employee Login Password' },
                        { key: 'MANAGE_EMPLOYEE_DOCS', label: 'Manage Employee Documents' },
                    ]},
                ],
            },
            {
                group: 'Onboarding',
                route: '/dashboard/onboarding',
                subGroups: [
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_ONBOARDING_LIST', label: 'View Onboarding Employee List' },
                        { key: 'VIEW_ONBOARDING_PROGRESS', label: 'View KYC / Document Progress' },
                        { key: 'INITIATE_ONBOARDING', label: 'Initiate Onboarding for an Employee' },
                        { key: 'UPDATE_KYC_STATUS', label: 'Update KYC Document Checklist' },
                        { key: 'FINALIZE_ONBOARDING', label: 'Finalize Onboarding & Generate Employee ID' },
                        { key: 'MANAGE_ONBOARDING', label: 'Full Onboarding Module Management' },
                    ]},
                ],
            },
            {
                group: 'Offboarding',
                route: '/dashboard/onboarding#offboarding',
                subGroups: [
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_OFFBOARDING_LIST', label: 'View Departing Employee List' },
                        { key: 'VIEW_FNF_CALCULATIONS', label: 'View F&F / Gratuity Calculations' },
                        { key: 'INITIATE_OFFBOARDING', label: 'Initiate Offboarding Process' },
                        { key: 'MANAGE_CLEARANCE_CHECKLIST', label: 'Manage Department Clearances' },
                        { key: 'APPROVE_CLEARANCE', label: 'Approve / Mark Clearances Green' },
                        { key: 'GENERATE_RELIEVING_LETTER', label: 'Generate Relieving Letter' },
                        { key: 'MANAGE_OFFBOARDING', label: 'Full Offboarding Module Management' },
                    ]},
                ],
            },
            {
                group: 'Interviews',
                route: '/dashboard/interviews',
                subGroups: [
                    { label: 'For Own', icon: '👤', perms: [
                        { key: 'SUBMIT_INTERVIEW_ASSESSMENT', label: 'Submit Assessment for a Candidate' },
                    ]},
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_INTERVIEW_SCHEDULE', label: 'View Interview Schedule / Calendar' },
                        { key: 'SCHEDULE_INTERVIEW', label: 'Schedule a New Interview' },
                        { key: 'ASSIGN_INTERVIEWER', label: 'Assign Interviewer to Candidate' },
                        { key: 'VIEW_ALL_ASSESSMENTS', label: 'View All Candidate Assessments' },
                        { key: 'MANAGE_INTERVIEW_PIPELINE', label: 'Full Interview Pipeline Management' },
                    ]},
                ],
            },
        ],
    },
    {
        section: 'Operations',
        icon: '⚙️',
        groups: [
            {
                group: 'Attendance',
                route: '/dashboard/attendance',
                subGroups: [
                    { label: 'For Own', icon: '👤', perms: [
                        { key: 'VIEW_OWN_ATTENDANCE', label: 'View Own Attendance History' },
                        { key: 'VIEW_ATTENDANCE_CALENDAR', label: 'View 14-Day Attendance Calendar' },
                        { key: 'PUNCH_IN', label: 'Punch In (Clock In)' },
                        { key: 'PUNCH_OUT', label: 'Punch Out (Clock Out)' },
                        { key: 'MARK_ATTENDANCE', label: 'Mark Full-Day / Half-Day' },
                        { key: 'REQUEST_REGULARIZATION', label: 'Submit Attendance Regularization Request' },
                    ]},
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_TEAM_ATTENDANCE', label: 'View Team Members\' Attendance' },
                        { key: 'VIEW_ALL_ATTENDANCE', label: 'View All Employees\' Attendance' },
                        { key: 'VIEW_TEAM_REGULARIZATIONS', label: 'View Team Regularization Requests' },
                        { key: 'VIEW_ALL_REGULARIZATIONS', label: 'View All Regularization Requests' },
                        { key: 'APPROVE_REGULARIZATION', label: 'Approve Regularization Request' },
                        { key: 'REJECT_REGULARIZATION', label: 'Reject Regularization Request' },
                        { key: 'EDIT_ATTENDANCE_LOG', label: 'HR Correct Attendance Entry' },
                        { key: 'DELETE_ATTENDANCE_LOG', label: 'Delete Attendance Entry' },
                        { key: 'MANAGE_GEOFENCE', label: 'Manage Geofence / Location Rules' },
                        { key: 'MANAGE_ATTENDANCE_SETTINGS', label: 'Configure Attendance Settings' },
                        { key: 'VIEW_ATTENDANCE_REPORTS', label: 'View Attendance Reports' },
                        { key: 'EXPORT_ATTENDANCE_DATA', label: 'Export Attendance Data (CSV)' },
                    ]},
                ],
            },
            {
                group: 'Leave Management',
                route: '/dashboard/leaves',
                subGroups: [
                    { label: 'For Own', icon: '👤', perms: [
                        { key: 'VIEW_OWN_LEAVE_BALANCE', label: 'View Own Leave Balance' },
                        { key: 'VIEW_LEAVE_HISTORY', label: 'View Own Leave Request History' },
                        { key: 'APPLY_LEAVE', label: 'Apply for Leave' },
                        { key: 'CANCEL_LEAVE', label: 'Cancel Own Leave Request' },
                        { key: 'VIEW_LEAVE_ENCASHMENT', label: 'View Leave Encashment Details' },
                    ]},
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_TEAM_LEAVES', label: 'View Team Leave Requests' },
                        { key: 'VIEW_TEAM_LEAVE_CALENDAR', label: 'View Team Leave Calendar' },
                        { key: 'VIEW_ALL_LEAVES', label: 'View All Organization Leave Requests' },
                        { key: 'APPROVE_LEAVE', label: 'Approve Leave Request' },
                        { key: 'REJECT_LEAVE', label: 'Reject Leave Request' },
                        { key: 'ADJUST_LEAVE_BALANCE', label: 'Manually Adjust Employee Leave Balance' },
                        { key: 'MANAGE_LEAVE_TYPES', label: 'Manage Leave Types (CL, EL, SL...)' },
                        { key: 'MANAGE_LEAVE_POLICY', label: 'Configure Leave Policy & Quotas' },
                        { key: 'VIEW_LEAVE_REPORTS', label: 'View Leave Analytics & Reports' },
                    ]},
                ],
            },
            {
                group: 'Approvals',
                route: '/dashboard/approvals',
                subGroups: [
                    { label: 'For Own', icon: '👤', perms: [
                        { key: 'VIEW_PENDING_APPROVALS', label: 'View Pending Approvals Queue' },
                        { key: 'VIEW_APPROVAL_HISTORY', label: 'View Approval History Log' },
                    ]},
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'APPROVE_ANY_REQUEST', label: 'Approve Any Type of Request' },
                        { key: 'REJECT_ANY_REQUEST', label: 'Reject Any Type of Request' },
                        { key: 'MANAGE_APPROVAL_RULES', label: 'Configure Approval Rules / SLAs' },
                        { key: 'MANAGE_APPROVAL_WORKFLOWS', label: 'Configure Approval Workflow Levels' },
                    ]},
                ],
            },
        ],
    },
    {
        section: 'Finance',
        icon: '💰',
        groups: [
            {
                group: 'Payroll',
                route: '/dashboard/payroll',
                subGroups: [
                    { label: 'For Own', icon: '👤', perms: [
                        { key: 'VIEW_OWN_PAYSLIP', label: 'View Own Payslip' },
                        { key: 'VIEW_OWN_SALARY_BREAKDOWN', label: 'View Salary Breakdown (Basic, HRA, etc.)' },
                        { key: 'VIEW_OWN_EPF_ESI', label: 'View EPF / ESI Deduction Details' },
                        { key: 'VIEW_OWN_NET_PAY', label: 'View Net Pay Amount' },
                        { key: 'DOWNLOAD_PAYSLIP', label: 'Download Payslip as PDF' },
                        { key: 'REQUEST_SALARY_UPGRADE', label: 'Request Salary Appraisal' },
                    ]},
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_ALL_PAYSLIPS', label: 'View All Employees\' Payslips' },
                        { key: 'VIEW_ALL_SALARY_STRUCTURES', label: 'View All Salary Structures' },
                        { key: 'VIEW_ALL_SALARY_UPGRADES', label: 'View All Salary Appraisal Requests' },
                        { key: 'MANAGE_SALARY', label: 'Manage / Edit Employee Salary' },
                        { key: 'MODIFY_SALARY_COMPONENT', label: 'Modify Individual Salary Component' },
                        { key: 'APPROVE_SALARY_UPGRADE', label: 'Approve Salary Appraisal Request' },
                        { key: 'APPROVE_REJECT_SALARY_UPGRADE', label: 'Approve or Reject Salary Upgrade' },
                        { key: 'PROCESS_PAYROLL', label: 'Process Monthly Payroll Run' },
                        { key: 'RUN_PAYROLL', label: 'Run Full Payroll Cycle' },
                        { key: 'VIEW_PAYROLL_HISTORY', label: 'View Payroll Processing History' },
                        { key: 'VIEW_STATUTORY_REPORTS', label: 'View Statutory Reports (PF, ESI, TDS)' },
                        { key: 'MANAGE_TAX_REGIMES', label: 'Manage Tax Regimes (Old / New)' },
                        { key: 'MANAGE_STATUTORY_LIMITS', label: 'Configure Statutory Limits & Rates' },
                    ]},
                ],
            },
            {
                group: 'Loans & Advances',
                route: '/dashboard/loans',
                subGroups: [
                    { label: 'For Own', icon: '👤', perms: [
                        { key: 'VIEW_OWN_LOANS', label: 'View Own Loan / Advance Requests' },
                        { key: 'APPLY_LOAN', label: 'Apply for a Loan or Advance' },
                        { key: 'VIEW_LOAN_REPAYMENT_SCHEDULE', label: 'View Loan Repayment Schedule' },
                    ]},
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_ALL_LOANS', label: 'View All Loan Requests' },
                        { key: 'APPROVE_LOAN', label: 'Approve Loan Request' },
                        { key: 'REJECT_LOAN', label: 'Reject Loan Request' },
                        { key: 'VIEW_LOAN_DISBURSEMENT', label: 'View Disbursement & Payout Details' },
                        { key: 'MANAGE_LOAN_POLICIES', label: 'Configure Loan Policies & Limits' },
                    ]},
                ],
            },
        ],
    },
    {
        section: 'Growth',
        icon: '📈',
        groups: [
            {
                group: 'OKRs',
                route: '/dashboard/okr',
                subGroups: [
                    { label: 'For Own', icon: '👤', perms: [
                        { key: 'VIEW_OWN_OKR', label: 'View Own OKRs & Key Results' },
                        { key: 'CREATE_OKR', label: 'Create a New OKR' },
                        { key: 'EDIT_OWN_OKR', label: 'Edit Own OKR Details' },
                        { key: 'UPDATE_OKR_PROGRESS', label: 'Update OKR / KR Progress %' },
                        { key: 'DELETE_OKR', label: 'Delete an OKR' },
                        { key: 'LINK_OKR', label: 'Link OKR to a Parent / Company Goal' },
                    ]},
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_TEAM_OKR', label: 'View Team Members\' OKRs' },
                        { key: 'VIEW_ALL_OKR', label: 'View All OKRs (Organization-wide)' },
                        { key: 'MANAGE_OKR', label: 'Full OKR Management & Configuration' },
                        { key: 'VIEW_OKR_ANALYTICS', label: 'View OKR Analytics & Progress Reports' },
                    ]},
                ],
            },
            {
                group: '360° Feedback',
                route: '/dashboard/feedback',
                subGroups: [
                    { label: 'For Own', icon: '👤', perms: [
                        { key: 'SUBMIT_FEEDBACK', label: 'Submit Feedback for a Colleague' },
                        { key: 'GIVE_KUDOS', label: 'Give Kudos / Public Recognition' },
                        { key: 'VIEW_KUDOS_BOARD', label: 'View Kudos Board' },
                        { key: 'VIEW_FEEDBACK', label: 'View Feedback Submitted by Self' },
                        { key: 'VIEW_OWN_RECEIVED_FEEDBACK', label: 'View Feedback Received on Self' },
                    ]},
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_TEAM_FEEDBACK', label: 'View Feedback for Team Members' },
                        { key: 'VIEW_ALL_FEEDBACK', label: 'View All Feedback (Organization)' },
                        { key: 'MANAGE_FEEDBACK_CYCLES', label: 'Manage Feedback Cycles & Rounds' },
                        { key: 'EXPORT_FEEDBACK_REPORTS', label: 'Export Feedback Reports (CSV)' },
                    ]},
                ],
            },
        ],
    },
    {
        section: 'Administration',
        icon: '🛡️',
        groups: [
            {
                group: 'Role Management',
                route: '/dashboard/roles',
                subGroups: [
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_ROLES', label: 'View All Roles List' },
                        { key: 'CREATE_ROLE', label: 'Create a New Custom Role' },
                        { key: 'EDIT_ROLE_PERMISSIONS', label: 'Edit Role Permissions' },
                        { key: 'DELETE_ROLE', label: 'Delete a Custom Role' },
                        { key: 'CLONE_ROLE', label: 'Clone / Duplicate an Existing Role' },
                        { key: 'MANAGE_ROLES', label: 'Full Role Management Access' },
                        { key: 'MANAGE_USERS', label: 'Manage User Accounts' },
                        { key: 'ASSIGN_ROLES', label: 'Assign Roles to Users' },
                    ]},
                ],
            },
            {
                group: 'Network Security',
                route: '/dashboard/security',
                subGroups: [
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_SECURITY_SETTINGS', label: 'View Network Security Settings' },
                        { key: 'MANAGE_NETWORK_SECURITY', label: 'Full Network Security Management' },
                        { key: 'ENABLE_DISABLE_IP_RESTRICTION', label: 'Enable / Disable IP Restriction' },
                        { key: 'MANAGE_ALLOWLISTED_IPS', label: 'Manage Allowlisted IPs & Networks' },
                        { key: 'MANAGE_EXEMPT_ROLES', label: 'Manage Roles Exempt from Restriction' },
                        { key: 'VIEW_SECURITY_LOGS', label: 'View Security Event Logs' },
                    ]},
                ],
            },
            {
                group: 'Audit Logs',
                route: '/dashboard/audit',
                subGroups: [
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_AUDIT_LOGS', label: 'Access the Audit Logs Page' },
                        { key: 'VIEW_ALL_AUDIT_LOGS', label: 'View All Audit Entries' },
                        { key: 'FILTER_AUDIT_BY_MODULE', label: 'Filter Audit Logs by Module / Action' },
                        { key: 'EXPORT_AUDIT_LOGS', label: 'Export Audit Log Data' },
                    ]},
                ],
            },
            {
                group: 'System Settings',
                route: '/dashboard/settings',
                subGroups: [
                    { label: 'For All', icon: '👥', perms: [
                        { key: 'VIEW_SYSTEM_SETTINGS', label: 'View System Settings Page' },
                        { key: 'MANAGE_SYSTEM_SETTINGS', label: 'Full System Settings Access' },
                        { key: 'MANAGE_COMPANY_INFO', label: 'Manage Company Information' },
                        { key: 'MANAGE_APPROVAL_WORKFLOW_CONFIG', label: 'Configure Approval Workflow Settings' },
                        { key: 'MANAGE_NOTIFICATION_SETTINGS', label: 'Manage Notification Preferences' },
                    ]},
                ],
            },
        ],
    },
];

const SECTION_COLORS = {
    'Overview':       { bg: '#f59e0b', light: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.22)' },
    'Workforce':      { bg: '#0ea5e9', light: 'rgba(14,165,233,0.08)', border: 'rgba(14,165,233,0.22)' },
    'Operations':     { bg: '#10b981', light: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.22)' },
    'Finance':        { bg: '#6366f1', light: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.22)' },
    'Growth':         { bg: '#ec4899', light: 'rgba(236,72,153,0.08)', border: 'rgba(236,72,153,0.22)' },
    'Administration': { bg: '#8b5cf6', light: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.22)' },
};

// Map DEFAULT_ROLES to a flat list of system presets (read-only reference)
const SYSTEM_ROLE_PRESETS = Object.values(DEFAULT_ROLES);

function RolesContent() {
    const { currentUser, customRoles, users, createRole, updateRole, deleteRole, updateUser, addToast } = useApp();
    const [selectedRole, setSelectedRole] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPerms, setEditingPerms] = useState({});
    const [saving, setSaving] = useState(false);
    const [newRole, setNewRole] = useState({ name: '', description: '', color: '#6366f1', permissions: [] });
    const [assignUserId, setAssignUserId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [collapsedSections, setCollapsedSections] = useState({});
    const [activeTab, setActiveTab] = useState('custom'); // 'custom' | 'system'

    function handleSelectRole(role) {
        setSelectedRole(role);
        setEditingPerms(Object.fromEntries((role.permissions || []).map(p => [p, true])));
        setSearchTerm('');
    }

    function getPermValue(key) {
        return PERMISSIONS[key] || key;
    }

    function togglePerm(permValue) {
        setEditingPerms(prev => ({ ...prev, [permValue]: !prev[permValue] }));
    }

    function toggleGroup(perms) {
        const values = perms.map(p => getPermValue(p.key));
        const allIn = values.every(v => !!editingPerms[v]);
        const newState = { ...editingPerms };
        values.forEach(v => { newState[v] = !allIn; });
        setEditingPerms(newState);
    }

    function toggleSection(sectionPerms) {
        const values = sectionPerms.map(p => getPermValue(p.key));
        const allIn = values.every(v => !!editingPerms[v]);
        const newState = { ...editingPerms };
        values.forEach(v => { newState[v] = !allIn; });
        setEditingPerms(newState);
    }

    async function handleSaveRole() {
        if (!selectedRole || selectedRole.isSystemRole) return;
        setSaving(true);
        const perms = Object.entries(editingPerms).filter(([, v]) => v).map(([k]) => k);
        await updateRole(selectedRole.id, { permissions: perms });
        setSelectedRole(r => ({ ...r, permissions: perms }));
        setSaving(false);
        addToast(`Permissions saved for "${selectedRole.name}"`, 'success');
    }

    async function handleDeleteRole(roleId) {
        if (!confirm('Delete this role? Users assigned to it will fall back to Employee access.')) return;
        await deleteRole(roleId);
        setSelectedRole(null);
        addToast('Custom role deleted', 'info');
    }

    async function handleCloneRole() {
        if (!selectedRole) return;
        const clonedPermissions = Object.entries(editingPerms).filter(([, v]) => v).map(([k]) => k);
        const cloneName = `${selectedRole.name} (Copy)`;
        await createRole({ name: cloneName, description: `Clone of ${selectedRole.name}`, color: selectedRole.color || '#6366f1', permissions: clonedPermissions });
        addToast(`Role "${cloneName}" created`, 'success');
    }

    async function handleCreateRole(e) {
        e.preventDefault();
        await createRole({ ...newRole, permissions: [] });
        setShowCreateModal(false);
        setNewRole({ name: '', description: '', color: '#6366f1', permissions: [] });
        addToast(`Role "${newRole.name}" created! Now assign permissions.`, 'success');
    }

    async function handleAssignUser() {
        if (!assignUserId || !selectedRole) return;
        await updateUser(assignUserId, { role: selectedRole.id });
        setAssignUserId('');
        addToast('User assigned to role', 'success');
    }

    function getUsersWithRole(roleId) {
        return users.filter(u => u.role === roleId);
    }

    function toggleSectionCollapse(sectionName) {
        setCollapsedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
    }

    // Get all perms from a group (supports both old perms[] and new subGroups[] format)
    function getGroupPerms(g) {
        return g.subGroups ? g.subGroups.flatMap(sg => sg.perms) : (g.perms || []);
    }

    function getSectionStats(groups) {
        const all = groups.flatMap(g => getGroupPerms(g));
        const enabled = all.filter(p => !!editingPerms[getPermValue(p.key)]).length;
        return { enabled, total: all.length };
    }

    function getGroupStats(perms) {
        const enabled = perms.filter(p => !!editingPerms[getPermValue(p.key)]).length;
        return { enabled, total: perms.length };
    }

    function filterGroups(groups) {
        if (!searchTerm) return groups;
        const q = searchTerm.toLowerCase();
        return groups
            .map(g => {
                if (g.subGroups) {
                    const filteredSGs = g.subGroups
                        .map(sg => ({ ...sg, perms: sg.perms.filter(p => p.label.toLowerCase().includes(q) || g.group.toLowerCase().includes(q) || sg.label.toLowerCase().includes(q)) }))
                        .filter(sg => sg.perms.length > 0);
                    return { ...g, subGroups: filteredSGs };
                }
                return { ...g, perms: g.perms.filter(p => p.label.toLowerCase().includes(q) || g.group.toLowerCase().includes(q)) };
            })
            .filter(g => g.subGroups ? g.subGroups.length > 0 : g.perms.length > 0);
    }

    // Normalize group to always have subGroups for rendering
    function normalizeGroup(g) {
        if (g.subGroups) return g;
        return { ...g, subGroups: [{ label: 'For All', icon: '👥', perms: g.perms || [] }] };
    }

    const totalPerms = Object.keys(PERMISSIONS).length;
    const totalEnabled = Object.values(editingPerms).filter(Boolean).length;

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Role Management</h1>
                    <p className="page-subtitle">Create custom roles and assign granular, feature-level permissions</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={16} /> Create Custom Role
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 20 }}>

                {/* ── LEFT: Role List ── */}
                <div>
                    {/* Tabs */}
                    <div className="tabs" style={{ marginBottom: 12 }}>
                        <button className={`tab-btn ${activeTab === 'custom' ? 'active' : ''}`} onClick={() => { setActiveTab('custom'); setSelectedRole(null); }}>
                            Custom Roles
                        </button>
                        <button className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`} onClick={() => { setActiveTab('system'); setSelectedRole(null); }}>
                            System Roles
                        </button>
                    </div>

                    {activeTab === 'custom' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {customRoles.length === 0 ? (
                                <div className="card" style={{ textAlign: 'center', padding: '28px 16px' }}>
                                    <Plus size={28} color="var(--text-muted)" style={{ marginBottom: 10 }} />
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>No custom roles created yet.</p>
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>Create First Role</button>
                                </div>
                            ) : customRoles.map(role => {
                                const isSelected = selectedRole?.id === role.id;
                                const usersCount = getUsersWithRole(role.id).length;
                                return (
                                    <div
                                        key={role.id}
                                        onClick={() => handleSelectRole(role)}
                                        style={{
                                            padding: '12px 14px', borderRadius: 'var(--radius-md)',
                                            border: `1px solid ${isSelected ? (role.color || '#6366f1') : 'var(--border-subtle)'}`,
                                            background: isSelected ? `${role.color || '#6366f1'}12` : 'var(--bg-card)',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: role.color || '#6366f1' }} />
                                                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: role.color || 'var(--text-primary)' }}>{role.name}</span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: 4 }}>{role.description || '—'}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>{usersCount} user{usersCount !== 1 ? 's' : ''}</span>
                                            <span style={{ color: role.color || 'var(--text-muted)', fontWeight: 600 }}>{(role.permissions || []).length} permissions</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div className="alert alert-info" style={{ fontSize: '0.75rem', padding: '8px 12px' }}>
                                <Lock size={12} style={{ flexShrink: 0 }} />
                                System roles are preset and read-only. Clone them to create editable versions.
                            </div>
                            {SYSTEM_ROLE_PRESETS.map(role => {
                                const isSelected = selectedRole?.id === role.id;
                                const usersCount = getUsersWithRole(role.id).length;
                                return (
                                    <div
                                        key={role.id}
                                        onClick={() => handleSelectRole(role)}
                                        style={{
                                            padding: '12px 14px', borderRadius: 'var(--radius-md)',
                                            border: `1px solid ${isSelected ? (role.color || '#6366f1') : 'var(--border-subtle)'}`,
                                            background: isSelected ? `${role.color || '#6366f1'}10` : 'var(--bg-card)',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                            <Lock size={12} color={role.color || 'var(--text-muted)'} />
                                            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: role.color || 'var(--text-primary)' }}>{role.name}</span>
                                            {role.isSuperAdmin && <span className="badge badge-warning" style={{ fontSize: '0.58rem' }}>∞</span>}
                                        </div>
                                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: 4 }}>{role.description}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                            <span style={{ color: 'var(--text-secondary)' }}>{usersCount} user{usersCount !== 1 ? 's' : ''}</span>
                                            <span style={{ color: role.color || '#6366f1', fontWeight: 600 }}>
                                                {role.isSuperAdmin ? 'All permissions' : `${role.permissions.length} permissions`}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Permission Matrix ── */}
                <div>
                    {selectedRole ? (
                        <div>
                            {/* Role header card */}
                            <div className="card" style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                            {selectedRole.isSystemRole ? <Lock size={14} color={selectedRole.color} /> : null}
                                            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: selectedRole.color || 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{selectedRole.name}</h3>
                                            {selectedRole.isSuperAdmin && <span className="badge badge-warning">Unrestricted — All Permissions</span>}
                                            {selectedRole.isSystemRole && !selectedRole.isSuperAdmin && <span className="badge badge-neutral">Read-Only Preset</span>}
                                        </div>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedRole.description}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                        {/* Clone always available */}
                                        <button className="btn btn-ghost btn-sm" onClick={handleCloneRole} title="Clone this role as a new editable custom role">
                                            <Copy size={13} /> Clone
                                        </button>
                                        {/* Save & Delete only for custom roles */}
                                        {!selectedRole.isSystemRole && (
                                            <>
                                                <button className="btn btn-primary btn-sm" onClick={handleSaveRole} disabled={saving}>
                                                    {saving ? 'Saving...' : 'Save Changes'}
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRole(selectedRole.id)}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Progress bar for custom roles */}
                                {!selectedRole.isSuperAdmin && (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 5, color: 'var(--text-muted)' }}>
                                            <span>Permissions {selectedRole.isSystemRole ? 'granted (preset)' : 'currently enabled'}</span>
                                            <span style={{ fontWeight: 700, color: selectedRole.color || 'var(--brand-primary-light)' }}>
                                                {selectedRole.isSystemRole ? selectedRole.permissions.length : totalEnabled} / {totalPerms}
                                            </span>
                                        </div>
                                        <div className="progress-bar" style={{ height: 5 }}>
                                            <div className="progress-fill" style={{
                                                width: `${((selectedRole.isSystemRole ? selectedRole.permissions.length : totalEnabled) / totalPerms) * 100}%`,
                                                background: selectedRole.color || 'var(--gradient-brand)'
                                            }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Assigned Users */}
                            <div className="card" style={{ marginBottom: 14, padding: '12px 18px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    <Users size={14} color="var(--text-muted)" />
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: 4 }}>Users:</span>
                                    {getUsersWithRole(selectedRole.id).map(u => (
                                        <div key={u.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 'var(--radius-full)', background: `${selectedRole.color || '#6366f1'}15`, border: `1px solid ${selectedRole.color || '#6366f1'}30`, fontSize: '0.73rem', fontWeight: 600, color: selectedRole.color || 'var(--text-primary)' }}>
                                            {u.avatar} {u.name}
                                        </div>
                                    ))}
                                    {getUsersWithRole(selectedRole.id).length === 0 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No users assigned.</span>}
                                    {!selectedRole.isSystemRole && (
                                        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
                                            <select className="form-select" style={{ width: 150, padding: '4px 8px', fontSize: '0.74rem', height: 28 }} value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
                                                <option value="">+ Assign user...</option>
                                                {users.filter(u => u.role !== selectedRole.id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                            <button className="btn btn-primary" style={{ padding: '4px 12px', height: 28, fontSize: '0.73rem' }} onClick={handleAssignUser} disabled={!assignUserId}>Assign</button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Super Admin bypass banner */}
                            {selectedRole.isSuperAdmin ? (
                                <div className="alert alert-warning">
                                    <Shield size={16} style={{ flexShrink: 0 }} />
                                    <span>Super Admin has <strong>unrestricted access</strong> — all features are always granted, no toggles needed.</span>
                                </div>
                            ) : selectedRole.isSystemRole ? (
                                <>
                                    <div className="alert alert-info" style={{ marginBottom: 16 }}>
                                        <Lock size={14} style={{ flexShrink: 0 }} />
                                        <span>This is a system preset role. Permissions shown below are <strong>read-only</strong>. Use <strong>Clone</strong> to create an editable copy.</span>
                                    </div>
                                    {/* Show preset permissions in a grid */}
                                    <div className="card" style={{ padding: 16 }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: 12 }}>Preset Permissions ({selectedRole.permissions.length})</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                            {selectedRole.permissions.map(p => (
                                                <span key={p} style={{ padding: '3px 10px', borderRadius: 'var(--radius-full)', background: `${selectedRole.color || '#6366f1'}15`, border: `1px solid ${selectedRole.color || '#6366f1'}30`, fontSize: '0.7rem', fontFamily: 'monospace', color: selectedRole.color || 'var(--text-secondary)' }}>{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Search */}
                                    <div style={{ position: 'relative', marginBottom: 16 }}>
                                        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Search any feature or action..."
                                            style={{ paddingLeft: 36, background: 'var(--bg-glass)' }}
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    {/* Nav-structured permission tree */}
                                    {NAV_SECTIONS.map(({ section, icon, groups }) => {
                                        const filteredGroups = filterGroups(groups);
                                        if (filteredGroups.length === 0) return null;

                                        const allSectionPerms = filteredGroups.flatMap(g => getGroupPerms(g));
                                        const stats = getSectionStats(groups);
                                        const color = SECTION_COLORS[section];
                                        const isCollapsed = collapsedSections[section];
                                        const allSectionIn = allSectionPerms.every(p => !!editingPerms[getPermValue(p.key)]);

                                        return (
                                            <div key={section} style={{ marginBottom: 10, borderRadius: 'var(--radius-lg)', border: `1px solid ${color.border}`, overflow: 'hidden' }}>
                                                <div
                                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: color.light, cursor: 'pointer', userSelect: 'none' }}
                                                    onClick={() => toggleSectionCollapse(section)}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                                        <span style={{ fontSize: '1rem' }}>{icon}</span>
                                                        <span style={{ fontWeight: 800, fontSize: '0.85rem', color: color.bg }}>{section}</span>
                                                        <span style={{ fontSize: '0.67rem', color: color.bg, fontWeight: 700, background: `${color.bg}18`, padding: '1px 8px', borderRadius: 'var(--radius-full)', border: `1px solid ${color.border}` }}>
                                                            {stats.enabled}/{stats.total}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <button className="btn btn-ghost" onClick={e => { e.stopPropagation(); toggleSection(allSectionPerms); }} style={{ fontSize: '0.67rem', color: color.bg, background: `${color.bg}14`, border: `1px solid ${color.border}`, padding: '2px 10px', height: 24, fontWeight: 700 }}>
                                                            {allSectionIn ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                        {isCollapsed ? <ChevronRight size={15} color={color.bg} /> : <ChevronDown size={15} color={color.bg} />}
                                                    </div>
                                                </div>

                                                {!isCollapsed && (
                                                    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                        {filteredGroups.map(rawGroup => {
                                                            const { group, route, subGroups } = normalizeGroup(rawGroup);
                                                            const allGroupPerms = subGroups.flatMap(sg => sg.perms);
                                                            const gStats = getGroupStats(allGroupPerms);
                                                            const allGroupIn = allGroupPerms.every(p => !!editingPerms[getPermValue(p.key)]);
                                                            return (
                                                                <div key={group} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
                                                                    {/* Group header */}
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: 'var(--bg-glass)' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                                                            <Layers size={12} color={color.bg} />
                                                                            <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>{group}</span>
                                                                            <code style={{ fontSize: '0.62rem', color: 'var(--text-muted)', background: 'var(--bg-glass)', padding: '1px 5px', borderRadius: 3 }}>{route}</code>
                                                                            <span style={{ fontSize: '0.65rem', color: color.bg, fontWeight: 600 }}>{gStats.enabled}/{gStats.total}</span>
                                                                        </div>
                                                                        <button className="btn btn-ghost" onClick={() => toggleGroup(allGroupPerms)} style={{ fontSize: '0.64rem', color: color.bg, background: `${color.bg}10`, border: `1px solid ${color.border}`, padding: '1px 8px', height: 22, fontWeight: 600 }}>
                                                                            {allGroupIn ? 'Deselect All' : 'Select All'}
                                                                        </button>
                                                                    </div>
                                                                    {/* SubGroups */}
                                                                    {subGroups.map(({ label: sgLabel, icon: sgIcon, perms: sgPerms }) => {
                                                                        if (!sgPerms || sgPerms.length === 0) return null;
                                                                        const sgStats = getGroupStats(sgPerms);
                                                                        const allSgIn = sgPerms.every(p => !!editingPerms[getPermValue(p.key)]);
                                                                        const isOwn = sgLabel === 'For Own';
                                                                        const sgColor = isOwn ? '#10b981' : '#6366f1';
                                                                        const sgBg = isOwn ? 'rgba(16,185,129,0.06)' : 'rgba(99,102,241,0.06)';
                                                                        const sgBorder = isOwn ? 'rgba(16,185,129,0.18)' : 'rgba(99,102,241,0.18)';
                                                                        return (
                                                                            <div key={sgLabel}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 12px', background: sgBg, borderTop: '1px solid var(--border-subtle)' }}>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                                        <span style={{ fontSize: '0.8rem' }}>{sgIcon}</span>
                                                                                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: sgColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{sgLabel}</span>
                                                                                        <span style={{ fontSize: '0.61rem', color: sgColor, fontWeight: 600, background: `${sgColor}14`, padding: '0px 6px', borderRadius: 8, border: `1px solid ${sgBorder}` }}>{sgStats.enabled}/{sgStats.total}</span>
                                                                                    </div>
                                                                                    <button className="btn btn-ghost" onClick={() => toggleGroup(sgPerms)} style={{ fontSize: '0.6rem', color: sgColor, background: `${sgColor}10`, border: `1px solid ${sgBorder}`, padding: '1px 7px', height: 20, fontWeight: 600 }}>
                                                                                        {allSgIn ? 'Deselect' : 'Select All'}
                                                                                    </button>
                                                                                </div>
                                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 5, padding: '8px 12px' }}>
                                                                                    {sgPerms.map(({ key, label }) => {
                                                                                        const permValue = getPermValue(key);
                                                                                        const hasIt = !!editingPerms[permValue];
                                                                                        return (
                                                                                            <label key={key} onClick={() => togglePerm(permValue)} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '7px 10px', borderRadius: 'var(--radius-md)', border: `1px solid ${hasIt ? color.border : 'var(--border-subtle)'}`, background: hasIt ? color.light : 'transparent', cursor: 'pointer', transition: 'all 0.12s', userSelect: 'none' }}>
                                                                                                <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1, border: `2px solid ${hasIt ? color.bg : 'var(--border-default)'}`, background: hasIt ? color.bg : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                                                                                                    {hasIt && <Check size={9} color="white" strokeWidth={3} />}
                                                                                                </div>
                                                                                                <span style={{ fontSize: '0.76rem', color: hasIt ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: hasIt ? 600 : 400, lineHeight: 1.35 }}>{label}</span>
                                                                                            </label>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 380, textAlign: 'center' }}>
                            <div>
                                <Shield size={44} color="var(--text-muted)" style={{ marginBottom: 14 }} />
                                <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8, fontSize: '1.1rem' }}>
                                    {activeTab === 'custom' ? 'Select a Custom Role' : 'Select a System Role'}
                                </h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 300 }}>
                                    {activeTab === 'custom'
                                        ? 'Pick a custom role to view and assign granular feature-level permissions.'
                                        : 'Pick a system preset role to view its permissions. Clone it to make an editable version.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Role Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
                    <div className="modal-box">
                        <h3 style={{ marginBottom: 20, fontFamily: 'var(--font-display)' }}>Create Custom Role</h3>
                        <form onSubmit={handleCreateRole} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="form-group">
                                <label className="form-label">Role Name *</label>
                                <input type="text" className="form-input" placeholder="e.g. IT Helpdesk, Recruiter, Finance Analyst" value={newRole.name} onChange={e => setNewRole(r => ({ ...r, name: e.target.value }))} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <input type="text" className="form-input" placeholder="What does this role do?" value={newRole.description} onChange={e => setNewRole(r => ({ ...r, description: e.target.value }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Badge Color</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <input type="color" className="form-input" style={{ height: 42, width: 60, padding: '4px 6px', cursor: 'pointer' }} value={newRole.color} onChange={e => setNewRole(r => ({ ...r, color: e.target.value }))} />
                                    <div style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', background: `${newRole.color}20`, border: `1px solid ${newRole.color}50`, color: newRole.color, fontWeight: 700, fontSize: '0.85rem' }}>{newRole.name || 'Preview'}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                                <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary"><Plus size={14} /> Create Role</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function RolesPage() {
    return <DashboardLayout title="Role Management"><RolesContent /></DashboardLayout>;
}
