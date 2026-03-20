// ============================================================
// AI4S Smart HR — System Baseline Layer
// Central store for all application structural metadata
// ============================================================

// ---- ROLES & PERMISSIONS ----
export const PERMISSIONS = {
    // Dashboard Access
    VIEW_SUPER_ADMIN_DASHBOARD: 'view_super_admin_dashboard',
    VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
    VIEW_HR_DASHBOARD: 'view_hr_dashboard',
    VIEW_MANAGER_DASHBOARD: 'view_manager_dashboard',
    VIEW_EMPLOYEE_DASHBOARD: 'view_employee_dashboard',

    // Employee Management
    VIEW_ALL_EMPLOYEES: 'view_all_employees',
    CREATE_EMPLOYEE: 'create_employee',
    EDIT_EMPLOYEE: 'edit_employee',
    DELETE_EMPLOYEE: 'delete_employee',
    VIEW_OWN_PROFILE: 'view_own_profile',

    // Attendance
    VIEW_ALL_ATTENDANCE: 'view_all_attendance',
    VIEW_TEAM_ATTENDANCE: 'view_team_attendance',
    MARK_ATTENDANCE: 'mark_attendance',
    APPROVE_REGULARIZATION: 'approve_regularization',
    MANAGE_GEOFENCE: 'manage_geofence',

    // Leave
    APPLY_LEAVE: 'apply_leave',
    APPROVE_LEAVE: 'approve_leave',
    VIEW_TEAM_LEAVES: 'view_team_leaves',
    VIEW_ALL_LEAVES: 'view_all_leaves',
    MANAGE_LEAVE_POLICY: 'manage_leave_policy',

    // Payroll
    VIEW_OWN_PAYSLIP: 'view_own_payslip',
    VIEW_ALL_PAYSLIPS: 'view_all_payslips',
    RUN_PAYROLL: 'run_payroll',
    MANAGE_SALARY: 'manage_salary',
    APPROVE_SALARY_UPGRADE: 'approve_salary_upgrade',
    VIEW_STATUTORY_REPORTS: 'view_statutory_reports',

    // Performance
    VIEW_OWN_OKR: 'view_own_okr',
    MANAGE_OKR: 'manage_okr',
    SUBMIT_FEEDBACK: 'submit_feedback',
    VIEW_FEEDBACK: 'view_feedback',
    VIEW_ALL_FEEDBACK: 'view_all_feedback',

    // Onboarding & Offboarding
    MANAGE_ONBOARDING: 'manage_onboarding',
    MANAGE_OFFBOARDING: 'manage_offboarding',
    APPROVE_CLEARANCE: 'approve_clearance',

    // Loans
    APPLY_LOAN: 'apply_loan',
    APPROVE_LOAN: 'approve_loan',
    VIEW_ALL_LOANS: 'view_all_loans',

    // Role & User Management
    MANAGE_ROLES: 'manage_roles',
    MANAGE_USERS: 'manage_users',
    ASSIGN_ROLES: 'assign_roles',
    RESET_PASSWORDS: 'reset_passwords',

    // Security Settings
    MANAGE_NETWORK_SECURITY: 'manage_network_security',
    VIEW_AUDIT_LOGS: 'view_audit_logs',

    // System
    MANAGE_APPROVAL_WORKFLOWS: 'manage_approval_workflows',
};

export const DEFAULT_ROLES = {
    SUPER_ADMIN: {
        id: 'super_admin',
        name: 'Super Admin',
        description: 'Unrestricted global access — bypasses all RBAC rules',
        color: '#f59e0b',
        isSuperAdmin: true,
        permissions: Object.values(PERMISSIONS),
        isSystemRole: true,
    },
    CORE_ADMIN: {
        id: 'core_admin',
        name: 'Core Admin',
        description: 'Full administrative access including RBAC and security management',
        color: '#6366f1',
        isSuperAdmin: false,
        permissions: [
            PERMISSIONS.VIEW_ADMIN_DASHBOARD,
            PERMISSIONS.VIEW_ALL_EMPLOYEES,
            PERMISSIONS.CREATE_EMPLOYEE, PERMISSIONS.EDIT_EMPLOYEE, PERMISSIONS.DELETE_EMPLOYEE,
            PERMISSIONS.VIEW_ALL_ATTENDANCE, PERMISSIONS.MANAGE_GEOFENCE,
            PERMISSIONS.VIEW_ALL_LEAVES, PERMISSIONS.MANAGE_LEAVE_POLICY,
            PERMISSIONS.VIEW_ALL_PAYSLIPS, PERMISSIONS.RUN_PAYROLL, PERMISSIONS.MANAGE_SALARY,
            PERMISSIONS.VIEW_STATUTORY_REPORTS,
            PERMISSIONS.MANAGE_OKR, PERMISSIONS.VIEW_ALL_FEEDBACK,
            PERMISSIONS.MANAGE_ONBOARDING, PERMISSIONS.MANAGE_OFFBOARDING, PERMISSIONS.APPROVE_CLEARANCE,
            PERMISSIONS.VIEW_ALL_LOANS, PERMISSIONS.APPROVE_LOAN,
            PERMISSIONS.MANAGE_ROLES, PERMISSIONS.MANAGE_USERS, PERMISSIONS.ASSIGN_ROLES, PERMISSIONS.RESET_PASSWORDS,
            PERMISSIONS.MANAGE_NETWORK_SECURITY, PERMISSIONS.VIEW_AUDIT_LOGS,
            PERMISSIONS.MANAGE_APPROVAL_WORKFLOWS,
            PERMISSIONS.APPROVE_REGULARIZATION, PERMISSIONS.APPROVE_LEAVE, PERMISSIONS.APPROVE_SALARY_UPGRADE,
        ],
        isSystemRole: true,
    },
    HR_ADMIN: {
        id: 'hr_admin',
        name: 'HR Admin',
        description: 'HR operations — payroll, compliance, employee records',
        color: '#0ea5e9',
        isSuperAdmin: false,
        permissions: [
            PERMISSIONS.VIEW_HR_DASHBOARD,
            PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.CREATE_EMPLOYEE, PERMISSIONS.EDIT_EMPLOYEE,
            PERMISSIONS.VIEW_ALL_ATTENDANCE, PERMISSIONS.APPROVE_REGULARIZATION,
            PERMISSIONS.VIEW_ALL_LEAVES, PERMISSIONS.APPROVE_LEAVE, PERMISSIONS.MANAGE_LEAVE_POLICY,
            PERMISSIONS.VIEW_ALL_PAYSLIPS, PERMISSIONS.RUN_PAYROLL, PERMISSIONS.MANAGE_SALARY, PERMISSIONS.APPROVE_SALARY_UPGRADE,
            PERMISSIONS.VIEW_STATUTORY_REPORTS,
            PERMISSIONS.MANAGE_OKR, PERMISSIONS.VIEW_ALL_FEEDBACK,
            PERMISSIONS.MANAGE_ONBOARDING, PERMISSIONS.MANAGE_OFFBOARDING, PERMISSIONS.APPROVE_CLEARANCE,
            PERMISSIONS.VIEW_ALL_LOANS, PERMISSIONS.APPROVE_LOAN,
            PERMISSIONS.RESET_PASSWORDS,
        ],
        isSystemRole: true,
    },
    MANAGER: {
        id: 'manager',
        name: 'Manager',
        description: 'Team lead — approve leaves, regularizations, view team',
        color: '#10b981',
        isSuperAdmin: false,
        permissions: [
            PERMISSIONS.VIEW_MANAGER_DASHBOARD,
            PERMISSIONS.VIEW_TEAM_ATTENDANCE, PERMISSIONS.APPROVE_REGULARIZATION,
            PERMISSIONS.VIEW_TEAM_LEAVES, PERMISSIONS.APPROVE_LEAVE,
            PERMISSIONS.VIEW_OWN_PAYSLIP,
            PERMISSIONS.MANAGE_OKR, PERMISSIONS.VIEW_OWN_OKR,
            PERMISSIONS.SUBMIT_FEEDBACK, PERMISSIONS.VIEW_FEEDBACK,
            PERMISSIONS.APPROVE_SALARY_UPGRADE,
            PERMISSIONS.VIEW_OWN_PROFILE,
        ],
        isSystemRole: true,
    },
    EMPLOYEE: {
        id: 'employee',
        name: 'Employee',
        description: 'Standard employee — self-service access',
        color: '#8b5cf6',
        isSuperAdmin: false,
        permissions: [
            PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD,
            PERMISSIONS.VIEW_OWN_PROFILE,
            PERMISSIONS.MARK_ATTENDANCE,
            PERMISSIONS.APPLY_LEAVE, PERMISSIONS.VIEW_OWN_PAYSLIP,
            PERMISSIONS.VIEW_OWN_OKR, PERMISSIONS.SUBMIT_FEEDBACK,
            PERMISSIONS.APPLY_LOAN,
        ],
        isSystemRole: true,
    },
};

// ---- NETWORK SECURITY CONFIG ----
export const DEFAULT_SECURITY_CONFIG = {
    wifiRestrictionEnabled: false,
    allowedIPs: [],
    allowedNetworks: [],
    restrictedRoles: [],
    exemptRoles: ['super_admin', 'core_admin'],
    popupMessage: 'Login Restricted: Please connect to the authorized company network to access AI4S Smart HR.',
};

// ---- USERS (EMPTY) ----
export const DEFAULT_USERS = [];

// ---- DEPARTMENTS ----
export const DEPARTMENTS = [
    { id: 'dept1', name: 'Executive', headId: null },
    { id: 'dept2', name: 'Human Resources', headId: null },
    { id: 'dept3', name: 'Engineering', headId: null },
    { id: 'dept4', name: 'Sales', headId: null },
    { id: 'dept5', name: 'Finance', headId: null },
    { id: 'dept6', name: 'Administration', headId: null },
];

// ---- APPROVAL WORKFLOWS ----
export const APPROVAL_WORKFLOWS = {
    LEAVE: {
        id: 'leave',
        name: 'Leave Request',
        levels: [
            { level: 1, role: 'manager', label: 'Immediate Manager', sla: 24 },
            { level: 2, role: 'hr_admin', label: 'HR Admin (if > 3 days)', sla: 48, condition: 'days > 3' },
        ],
    },
    SALARY_UPGRADE: {
        id: 'salary_upgrade',
        name: 'Salary Upgrade',
        levels: [
            { level: 1, role: 'manager', label: 'Department Manager', sla: 48 },
            { level: 2, role: 'hr_admin', label: 'HR Manager', sla: 72 },
            { level: 3, role: 'core_admin', label: 'Core Admin', sla: 96 },
        ],
    },
    LOAN: {
        id: 'loan',
        name: 'Loan / Advance',
        levels: [
            { level: 1, role: 'manager', label: 'Department Manager', sla: 48 },
            { level: 2, role: 'hr_admin', label: 'HR', sla: 48 },
            { level: 3, role: 'core_admin', label: 'Finance / Core Admin', sla: 72 },
        ],
    },
    PROFILE_MODIFICATION: {
        id: 'profile_modification',
        name: 'Profile Modification',
        levels: [
            { level: 1, role: 'hr_admin', label: 'HR Admin', sla: 48 },
        ],
    },
    REGULARIZATION: {
        id: 'regularization',
        name: 'Attendance Regularization',
        levels: [
            { level: 1, role: 'manager', label: 'Immediate Manager', sla: 24 },
        ],
    },
};

// ---- LEAVE TYPES & POLICY ----
export const LEAVE_TYPES = [
    { id: 'CL', name: 'Casual Leave', color: '#06b6d4', maxPerYear: 12, accrualPerMonth: 1, carryForward: false, encashable: false },
    { id: 'EL', name: 'Earned Leave', color: '#6366f1', maxPerYear: 15, accrualPerMonth: 1.25, carryForward: true, maxCarryForward: 45, encashable: true },
    { id: 'SL', name: 'Sick Leave', color: '#ef4444', maxPerYear: 12, accrualPerMonth: 1, carryForward: false, encashable: false },
    { id: 'ML', name: 'Maternity Leave', color: '#f59e0b', maxPerYear: 180, carryForward: false, encashable: false, genderRestricted: 'female' },
    { id: 'PL', name: 'Paternity Leave', color: '#10b981', maxPerYear: 15, carryForward: false, encashable: false, genderRestricted: 'male' },
    { id: 'LOP', name: 'Loss of Pay', color: '#dc2626', maxPerYear: null, carryForward: false, encashable: false },
    { id: 'OD', name: 'On Duty', color: '#8b5cf6', maxPerYear: null, carryForward: false, encashable: false },
    { id: 'WFH', name: 'Work From Home', color: '#8b5cf6', maxPerYear: null, carryForward: false, encashable: false },
];

// ---- LEAVE REQUESTS (EMPTY) ----
export const INITIAL_LEAVE_REQUESTS = [];

// ---- LEAVE BALANCES (EMPTY) ----
export const INITIAL_LEAVE_BALANCES = [];

// ---- ATTENDANCE (EMPTY) ----
export const INITIAL_ATTENDANCE = [];

// ---- REGULARIZATION REQUESTS (EMPTY) ----
export const INITIAL_REGULARIZATIONS = [];

// ---- PAYROLL RECORDS (EMPTY) ----
export const INITIAL_PAYROLL = [];

// ---- OKRs (EMPTY) ----
export const INITIAL_OKRS = [];

// ---- 360 FEEDBACK (EMPTY) ----
export const INITIAL_FEEDBACK = [];

// ---- LOAN REQUESTS (EMPTY) ----
export const INITIAL_LOANS = [];

// ---- SALARY UPGRADE REQUESTS (EMPTY) ----
export const INITIAL_SALARY_UPGRADES = [];

// ---- ONBOARDING CHECKLISTS ----
export const ONBOARDING_DOCUMENTS = [
    { id: 'DOC001', name: 'PAN Card', required: true },
    { id: 'DOC002', name: 'Aadhaar Card', required: true },
    { id: 'DOC003', name: 'Bank Account Details', required: true },
    { id: 'DOC004', name: 'Passport Size Photo', required: true },
    { id: 'DOC005', name: 'Address Proof', required: true },
    { id: 'DOC006', name: 'Offer Letter (Signed)', required: true },
];

// ---- OFFBOARDING / F&F ----
export const OFFBOARDING_CLEARANCES = [
    { id: 'CLR001', dept: 'IT', item: 'Laptop Return', responsible: 'IT Team' },
    { id: 'CLR002', dept: 'Admin', item: 'ID Card Submission', responsible: 'Admin' },
    { id: 'CLR003', dept: 'Finance', item: 'Loan/Advance Settlement', responsible: 'Finance' },
    { id: 'CLR004', dept: 'HR', item: 'Exit Interview Completed', responsible: 'HR Admin' },
    { id: 'CLR005', dept: 'Manager', item: 'Knowledge Transfer', responsible: 'Reporting Manager' },
    { id: 'CLR006', dept: 'IT', item: 'Email & Access Revoked', responsible: 'IT Team' },
];

// ---- NOTIFICATIONS (EMPTY) ----
export const INITIAL_NOTIFICATIONS = [];

// ---- INTERVIEWS (EMPTY) ----
export const INITIAL_INTERVIEWS = [];

// ---- KUDOS (EMPTY) ----
export const INITIAL_KUDOS = [];

// ---- AUDIT LOG (EMPTY) ----
export const INITIAL_AUDIT_LOG = [];

// ---- UTILITY: Get user by email ----
export function getUserByEmail(users, email) {
    return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

// ---- UTILITY: Get user by ID ----
export function getUserById(users, id) {
    return users.find(u => u.id === id);
}

// ---- UTILITY: Get leave balance for user ----
export function getLeaveBalance(balances, userId) {
    return balances.find(b => b.userId === userId);
}

// ---- STATUTORY CALCULATIONS ----
export const STATUTORY = {
    ESI_GROSS_LIMIT: 21000,
    ESI_EMPLOYEE_RATE: 0.0075,
    ESI_EMPLOYER_RATE: 0.0325,
    EPF_WAGE_CEILING: 15000,
    EPF_EMPLOYEE_RATE: 0.12,
    EPF_EMPLOYER_RATE: 0.12,
    GRATUITY_MIN_YEARS: 5,
    GRATUITY_FORMULA: (basic, years) => (basic / 26) * 15 * years,
};

export function calculateEPF(basic, voluntaryHigherContribution = false) {
    const cappedWage = voluntaryHigherContribution ? basic : Math.min(basic, STATUTORY.EPF_WAGE_CEILING);
    return {
        employee: Math.round(cappedWage * STATUTORY.EPF_EMPLOYEE_RATE),
        employer: Math.round(Math.min(basic, STATUTORY.EPF_WAGE_CEILING) * STATUTORY.EPF_EMPLOYER_RATE),
    };
}

export function calculateESI(gross) {
    if (gross > STATUTORY.ESI_GROSS_LIMIT) return { employee: 0, employer: 0, applicable: false };
    return {
        employee: Math.round(gross * STATUTORY.ESI_EMPLOYEE_RATE),
        employer: Math.round(gross * STATUTORY.ESI_EMPLOYER_RATE),
        applicable: true,
    };
}

export function calculateGratuity(basic, joinDate) {
    const years = (new Date() - new Date(joinDate)) / (1000 * 60 * 60 * 24 * 365.25);
    if (years < STATUTORY.GRATUITY_MIN_YEARS) return { eligible: false, years: Math.floor(years), amount: 0 };
    return { eligible: true, years: Math.floor(years), amount: Math.round(STATUTORY.GRATUITY_FORMULA(basic, Math.floor(years))) };
}

export function applySandwichRule(fromDate, toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    let extraDays = 0;
    const current = new Date(from);
    while (current <= to) {
        const day = current.getDay();
        if (day === 0 || day === 6) extraDays++;
        current.setDate(current.getDate() + 1);
    }
    return extraDays;
}

// ---- ACTIVITY HISTORY (EMPTY) ----
export const INITIAL_ACTIVITY_HISTORY = [];
