/**
 * AI4S Smart HR — System Constants
 * Central source of truth for Permissions, Roles, and Application Metadata
 */
export const PERMISSIONS = {
    // ─── DASHBOARD ACCESS ───
    VIEW_SUPER_ADMIN_DASHBOARD: 'view_super_admin_dashboard',
    VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
    VIEW_HR_DASHBOARD: 'view_hr_dashboard',
    VIEW_MANAGER_DASHBOARD: 'view_manager_dashboard',
    VIEW_EMPLOYEE_DASHBOARD: 'view_employee_dashboard',

    // ─── OVERVIEW DASHBOARDS (deep features) ───
    VIEW_SUPER_ADMIN_HEADCOUNT: 'view_super_admin_headcount',
    VIEW_SUPER_ADMIN_PAYROLL_SUMMARY: 'view_super_admin_payroll_summary',
    VIEW_SUPER_ADMIN_ATTENDANCE_RATE: 'view_super_admin_attendance_rate',
    VIEW_SUPER_ADMIN_OPEN_POSITIONS: 'view_super_admin_open_positions',
    VIEW_SUPER_ADMIN_ACTIVITY_FEED: 'view_super_admin_activity_feed',
    VIEW_ADMIN_TEAM_STATS: 'view_admin_team_stats',
    VIEW_ADMIN_PENDING_APPROVALS: 'view_admin_pending_approvals',
    VIEW_ADMIN_SECURITY_STATUS: 'view_admin_security_status',
    VIEW_HR_LEAVE_SUMMARY: 'view_hr_leave_summary',
    VIEW_HR_PAYROLL_OVERVIEW: 'view_hr_payroll_overview',
    VIEW_HR_LIFECYCLE_STATUS: 'view_hr_lifecycle_status',
    VIEW_MANAGER_TEAM_ATTENDANCE: 'view_manager_team_attendance',
    VIEW_MANAGER_PENDING_ITEMS: 'view_manager_pending_items',
    VIEW_MANAGER_TEAM_LEAVE_STATUS: 'view_manager_team_leave_status',
    VIEW_OWN_KPIs: 'view_own_kpis',
    VIEW_OWN_UPCOMING_EVENTS: 'view_own_upcoming_events',

    // ─── WORKFORCE: EMPLOYEES ───
    VIEW_ALL_EMPLOYEES: 'view_all_employees',
    VIEW_EMPLOYEE_DIRECTORY: 'view_employee_directory',
    CREATE_EMPLOYEE: 'create_employee',
    EDIT_EMPLOYEE: 'edit_employee',
    DELETE_EMPLOYEE: 'delete_employee',
    DEACTIVATE_EMPLOYEE: 'deactivate_employee',
    VIEW_INACTIVE_EMPLOYEES: 'view_inactive_employees',
    VIEW_EMPLOYEE_SALARY: 'view_employee_salary',
    EDIT_EMPLOYEE_SALARY: 'edit_employee_salary',
    VIEW_EMPLOYEE_CONTACT: 'view_employee_contact',
    VIEW_EMPLOYEE_DESIGNATION: 'view_employee_designation',
    VIEW_EMPLOYEE_JOIN_DATE: 'view_employee_join_date',
    EXPORT_EMPLOYEE_DATA: 'export_employee_data',
    FILTER_EMPLOYEES_BY_DEPT: 'filter_employees_by_dept',
    MANAGE_EMPLOYEE_DOCS: 'manage_employee_docs',
    VIEW_OWN_PROFILE: 'view_own_profile',
    RESET_PASSWORDS: 'reset_passwords',

    // ─── WORKFORCE: ONBOARDING ───
    VIEW_ONBOARDING_LIST: 'view_onboarding_list',
    INITIATE_ONBOARDING: 'initiate_onboarding',
    UPDATE_KYC_STATUS: 'update_kyc_status',
    FINALIZE_ONBOARDING: 'finalize_onboarding',
    VIEW_ONBOARDING_PROGRESS: 'view_onboarding_progress',
    MANAGE_ONBOARDING: 'manage_onboarding',

    // ─── WORKFORCE: OFFBOARDING ───
    VIEW_OFFBOARDING_LIST: 'view_offboarding_list',
    INITIATE_OFFBOARDING: 'initiate_offboarding',
    MANAGE_CLEARANCE_CHECKLIST: 'manage_clearance_checklist',
    GENERATE_RELIEVING_LETTER: 'generate_relieving_letter',
    VIEW_FNF_CALCULATIONS: 'view_fnf_calculations',
    APPROVE_CLEARANCE: 'approve_clearance',
    MANAGE_OFFBOARDING: 'manage_offboarding',

    // ─── WORKFORCE: INTERVIEWS ───
    VIEW_INTERVIEW_SCHEDULE: 'view_interview_schedule',
    SCHEDULE_INTERVIEW: 'schedule_interview',
    ASSIGN_INTERVIEWER: 'assign_interviewer',
    SUBMIT_INTERVIEW_ASSESSMENT: 'submit_interview_assessment',
    VIEW_ALL_ASSESSMENTS: 'view_all_assessments',
    MANAGE_INTERVIEW_PIPELINE: 'manage_interview_pipeline',

    // ─── OPERATIONS: ATTENDANCE ───
    VIEW_OWN_ATTENDANCE: 'view_own_attendance',
    PUNCH_IN: 'punch_in',
    PUNCH_OUT: 'punch_out',
    MARK_ATTENDANCE: 'mark_attendance',
    VIEW_ATTENDANCE_CALENDAR: 'view_attendance_calendar',
    REQUEST_REGULARIZATION: 'request_regularization',
    VIEW_TEAM_ATTENDANCE: 'view_team_attendance',
    VIEW_ALL_ATTENDANCE: 'view_all_attendance',
    VIEW_TEAM_REGULARIZATIONS: 'view_team_regularizations',
    VIEW_ALL_REGULARIZATIONS: 'view_all_regularizations',
    APPROVE_REGULARIZATION: 'approve_regularization',
    REJECT_REGULARIZATION: 'reject_regularization',
    EDIT_ATTENDANCE_LOG: 'edit_attendance_log',
    DELETE_ATTENDANCE_LOG: 'delete_attendance_log',
    MANAGE_GEOFENCE: 'manage_geofence',
    MANAGE_ATTENDANCE_SETTINGS: 'manage_attendance_settings',
    VIEW_ATTENDANCE_REPORTS: 'view_attendance_reports',
    EXPORT_ATTENDANCE_DATA: 'export_attendance_data',

    // ─── OPERATIONS: LEAVE MANAGEMENT ───
    VIEW_OWN_LEAVE_BALANCE: 'view_own_leave_balance',
    VIEW_LEAVE_HISTORY: 'view_leave_history',
    APPLY_LEAVE: 'apply_leave',
    CANCEL_LEAVE: 'cancel_leave',
    VIEW_TEAM_LEAVES: 'view_team_leaves',
    VIEW_ALL_LEAVES: 'view_all_leaves',
    APPROVE_LEAVE: 'approve_leave',
    REJECT_LEAVE: 'reject_leave',
    VIEW_TEAM_LEAVE_CALENDAR: 'view_team_leave_calendar',
    ADJUST_LEAVE_BALANCE: 'adjust_leave_balance',
    MANAGE_LEAVE_POLICY: 'manage_leave_policy',
    MANAGE_LEAVE_TYPES: 'manage_leave_types',
    VIEW_LEAVE_REPORTS: 'view_leave_reports',
    VIEW_LEAVE_ENCASHMENT: 'view_leave_encashment',

    // ─── OPERATIONS: APPROVALS ───
    VIEW_PENDING_APPROVALS: 'view_pending_approvals',
    APPROVE_ANY_REQUEST: 'approve_any_request',
    REJECT_ANY_REQUEST: 'reject_any_request',
    VIEW_APPROVAL_HISTORY: 'view_approval_history',
    MANAGE_APPROVAL_RULES: 'manage_approval_rules',
    MANAGE_APPROVAL_WORKFLOWS: 'manage_approval_workflows',

    // ─── FINANCE: PAYROLL ───
    VIEW_OWN_PAYSLIP: 'view_own_payslip',
    VIEW_OWN_SALARY_BREAKDOWN: 'view_own_salary_breakdown',
    VIEW_OWN_EPF_ESI: 'view_own_epf_esi',
    VIEW_OWN_NET_PAY: 'view_own_net_pay',
    DOWNLOAD_PAYSLIP: 'download_payslip',
    VIEW_ALL_PAYSLIPS: 'view_all_payslips',
    VIEW_ALL_SALARY_STRUCTURES: 'view_all_salary_structures',
    MODIFY_SALARY_COMPONENT: 'modify_salary_component',
    MANAGE_SALARY: 'manage_salary',
    PROCESS_PAYROLL: 'process_payroll',
    RUN_PAYROLL: 'run_payroll',
    VIEW_PAYROLL_HISTORY: 'view_payroll_history',
    REQUEST_SALARY_UPGRADE: 'request_salary_upgrade',
    VIEW_ALL_SALARY_UPGRADES: 'view_all_salary_upgrades',
    APPROVE_SALARY_UPGRADE: 'approve_salary_upgrade',
    APPROVE_REJECT_SALARY_UPGRADE: 'approve_reject_salary_upgrade',
    VIEW_STATUTORY_REPORTS: 'view_statutory_reports',
    MANAGE_TAX_REGIMES: 'manage_tax_regimes',
    MANAGE_STATUTORY_LIMITS: 'manage_statutory_limits',

    // ─── FINANCE: LOANS & ADVANCES ───
    VIEW_OWN_LOANS: 'view_own_loans',
    APPLY_LOAN: 'apply_loan',
    VIEW_LOAN_REPAYMENT_SCHEDULE: 'view_loan_repayment_schedule',
    VIEW_ALL_LOANS: 'view_all_loans',
    APPROVE_LOAN: 'approve_loan',
    REJECT_LOAN: 'reject_loan',
    VIEW_LOAN_DISBURSEMENT: 'view_loan_disbursement',
    MANAGE_LOAN_POLICIES: 'manage_loan_policies',

    // ─── GROWTH: OKRs ───
    VIEW_OWN_OKR: 'view_own_okr',
    CREATE_OKR: 'create_okr',
    EDIT_OWN_OKR: 'edit_own_okr',
    UPDATE_OKR_PROGRESS: 'update_okr_progress',
    DELETE_OKR: 'delete_okr',
    VIEW_TEAM_OKR: 'view_team_okr',
    VIEW_ALL_OKR: 'view_all_okr',
    MANAGE_OKR: 'manage_okr',
    LINK_OKR: 'link_okr',
    VIEW_OKR_ANALYTICS: 'view_okr_analytics',

    // ─── GROWTH: 360° FEEDBACK ───
    SUBMIT_FEEDBACK: 'submit_feedback',
    VIEW_FEEDBACK: 'view_feedback',
    VIEW_OWN_RECEIVED_FEEDBACK: 'view_own_received_feedback',
    VIEW_TEAM_FEEDBACK: 'view_team_feedback',
    VIEW_ALL_FEEDBACK: 'view_all_feedback',
    GIVE_KUDOS: 'give_kudos',
    VIEW_KUDOS_BOARD: 'view_kudos_board',
    MANAGE_FEEDBACK_CYCLES: 'manage_feedback_cycles',
    EXPORT_FEEDBACK_REPORTS: 'export_feedback_reports',

    // ─── ADMINISTRATION: ROLE MANAGEMENT ───
    MANAGE_ROLES: 'manage_roles',
    VIEW_ROLES: 'view_roles',
    CREATE_ROLE: 'create_role',
    EDIT_ROLE_PERMISSIONS: 'edit_role_permissions',
    DELETE_ROLE: 'delete_role',
    CLONE_ROLE: 'clone_role',
    MANAGE_USERS: 'manage_users',
    ASSIGN_ROLES: 'assign_roles',

    // ─── ADMINISTRATION: NETWORK SECURITY ───
    MANAGE_NETWORK_SECURITY: 'manage_network_security',
    VIEW_SECURITY_SETTINGS: 'view_security_settings',
    ENABLE_DISABLE_IP_RESTRICTION: 'enable_disable_ip_restriction',
    MANAGE_ALLOWLISTED_IPS: 'manage_allowlisted_ips',
    MANAGE_EXEMPT_ROLES: 'manage_exempt_roles',
    VIEW_SECURITY_LOGS: 'view_security_logs',

    // ─── ADMINISTRATION: AUDIT LOGS ───
    VIEW_AUDIT_LOGS: 'view_audit_logs',
    VIEW_ALL_AUDIT_LOGS: 'view_all_audit_logs',
    FILTER_AUDIT_BY_MODULE: 'filter_audit_by_module',
    EXPORT_AUDIT_LOGS: 'export_audit_logs',

    // ─── ADMINISTRATION: SYSTEM SETTINGS ───
    MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
    VIEW_SYSTEM_SETTINGS: 'view_system_settings',
    MANAGE_COMPANY_INFO: 'manage_company_info',
    MANAGE_APPROVAL_WORKFLOW_CONFIG: 'manage_approval_workflow_config',
    MANAGE_NOTIFICATION_SETTINGS: 'manage_notification_settings',
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
            PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD,
            PERMISSIONS.VIEW_ADMIN_TEAM_STATS, PERMISSIONS.VIEW_ADMIN_PENDING_APPROVALS,
            PERMISSIONS.VIEW_ADMIN_SECURITY_STATUS,
            // Employees
            PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.VIEW_EMPLOYEE_DIRECTORY,
            PERMISSIONS.CREATE_EMPLOYEE, PERMISSIONS.EDIT_EMPLOYEE, PERMISSIONS.DELETE_EMPLOYEE,
            PERMISSIONS.DEACTIVATE_EMPLOYEE, PERMISSIONS.VIEW_INACTIVE_EMPLOYEES,
            PERMISSIONS.VIEW_EMPLOYEE_SALARY, PERMISSIONS.EDIT_EMPLOYEE_SALARY,
            PERMISSIONS.VIEW_EMPLOYEE_CONTACT, PERMISSIONS.VIEW_EMPLOYEE_DESIGNATION,
            PERMISSIONS.VIEW_EMPLOYEE_JOIN_DATE, PERMISSIONS.EXPORT_EMPLOYEE_DATA,
            PERMISSIONS.FILTER_EMPLOYEES_BY_DEPT, PERMISSIONS.MANAGE_EMPLOYEE_DOCS,
            PERMISSIONS.RESET_PASSWORDS, PERMISSIONS.VIEW_OWN_PROFILE,
            // Onboarding & Offboarding
            PERMISSIONS.VIEW_ONBOARDING_LIST, PERMISSIONS.INITIATE_ONBOARDING,
            PERMISSIONS.UPDATE_KYC_STATUS, PERMISSIONS.FINALIZE_ONBOARDING,
            PERMISSIONS.VIEW_ONBOARDING_PROGRESS, PERMISSIONS.MANAGE_ONBOARDING,
            PERMISSIONS.VIEW_OFFBOARDING_LIST, PERMISSIONS.INITIATE_OFFBOARDING,
            PERMISSIONS.MANAGE_CLEARANCE_CHECKLIST, PERMISSIONS.GENERATE_RELIEVING_LETTER,
            PERMISSIONS.VIEW_FNF_CALCULATIONS, PERMISSIONS.APPROVE_CLEARANCE,
            PERMISSIONS.MANAGE_OFFBOARDING,
            // Interviews
            PERMISSIONS.VIEW_INTERVIEW_SCHEDULE, PERMISSIONS.SCHEDULE_INTERVIEW,
            PERMISSIONS.ASSIGN_INTERVIEWER, PERMISSIONS.SUBMIT_INTERVIEW_ASSESSMENT,
            PERMISSIONS.VIEW_ALL_ASSESSMENTS, PERMISSIONS.MANAGE_INTERVIEW_PIPELINE,
            // Attendance
            PERMISSIONS.VIEW_OWN_ATTENDANCE, PERMISSIONS.MARK_ATTENDANCE,
            PERMISSIONS.VIEW_ATTENDANCE_CALENDAR, PERMISSIONS.PUNCH_IN, PERMISSIONS.PUNCH_OUT,
            PERMISSIONS.REQUEST_REGULARIZATION, PERMISSIONS.VIEW_ALL_ATTENDANCE,
            PERMISSIONS.VIEW_ALL_REGULARIZATIONS, PERMISSIONS.APPROVE_REGULARIZATION,
            PERMISSIONS.REJECT_REGULARIZATION, PERMISSIONS.EDIT_ATTENDANCE_LOG,
            PERMISSIONS.DELETE_ATTENDANCE_LOG, PERMISSIONS.MANAGE_GEOFENCE,
            PERMISSIONS.MANAGE_ATTENDANCE_SETTINGS, PERMISSIONS.VIEW_ATTENDANCE_REPORTS,
            PERMISSIONS.EXPORT_ATTENDANCE_DATA,
            // Leave
            PERMISSIONS.VIEW_OWN_LEAVE_BALANCE, PERMISSIONS.VIEW_LEAVE_HISTORY,
            PERMISSIONS.APPLY_LEAVE, PERMISSIONS.CANCEL_LEAVE,
            PERMISSIONS.VIEW_ALL_LEAVES, PERMISSIONS.APPROVE_LEAVE, PERMISSIONS.REJECT_LEAVE,
            PERMISSIONS.ADJUST_LEAVE_BALANCE, PERMISSIONS.MANAGE_LEAVE_POLICY,
            PERMISSIONS.MANAGE_LEAVE_TYPES, PERMISSIONS.VIEW_LEAVE_REPORTS,
            PERMISSIONS.VIEW_LEAVE_ENCASHMENT,
            // Approvals
            PERMISSIONS.VIEW_PENDING_APPROVALS, PERMISSIONS.APPROVE_ANY_REQUEST,
            PERMISSIONS.REJECT_ANY_REQUEST, PERMISSIONS.VIEW_APPROVAL_HISTORY,
            PERMISSIONS.MANAGE_APPROVAL_RULES, PERMISSIONS.MANAGE_APPROVAL_WORKFLOWS,
            // Payroll
            PERMISSIONS.VIEW_OWN_PAYSLIP, PERMISSIONS.VIEW_OWN_SALARY_BREAKDOWN,
            PERMISSIONS.VIEW_OWN_EPF_ESI, PERMISSIONS.VIEW_OWN_NET_PAY, PERMISSIONS.DOWNLOAD_PAYSLIP,
            PERMISSIONS.VIEW_ALL_PAYSLIPS, PERMISSIONS.VIEW_ALL_SALARY_STRUCTURES,
            PERMISSIONS.MODIFY_SALARY_COMPONENT, PERMISSIONS.MANAGE_SALARY,
            PERMISSIONS.PROCESS_PAYROLL, PERMISSIONS.RUN_PAYROLL, PERMISSIONS.VIEW_PAYROLL_HISTORY,
            PERMISSIONS.REQUEST_SALARY_UPGRADE, PERMISSIONS.VIEW_ALL_SALARY_UPGRADES,
            PERMISSIONS.APPROVE_SALARY_UPGRADE, PERMISSIONS.APPROVE_REJECT_SALARY_UPGRADE,
            PERMISSIONS.VIEW_STATUTORY_REPORTS, PERMISSIONS.MANAGE_TAX_REGIMES,
            PERMISSIONS.MANAGE_STATUTORY_LIMITS,
            // Loans
            PERMISSIONS.VIEW_OWN_LOANS, PERMISSIONS.APPLY_LOAN,
            PERMISSIONS.VIEW_LOAN_REPAYMENT_SCHEDULE, PERMISSIONS.VIEW_ALL_LOANS,
            PERMISSIONS.APPROVE_LOAN, PERMISSIONS.REJECT_LOAN,
            PERMISSIONS.VIEW_LOAN_DISBURSEMENT, PERMISSIONS.MANAGE_LOAN_POLICIES,
            // OKR
            PERMISSIONS.VIEW_OWN_OKR, PERMISSIONS.CREATE_OKR, PERMISSIONS.EDIT_OWN_OKR,
            PERMISSIONS.UPDATE_OKR_PROGRESS, PERMISSIONS.DELETE_OKR,
            PERMISSIONS.VIEW_ALL_OKR, PERMISSIONS.MANAGE_OKR, PERMISSIONS.LINK_OKR,
            PERMISSIONS.VIEW_OKR_ANALYTICS,
            // Feedback
            PERMISSIONS.SUBMIT_FEEDBACK, PERMISSIONS.VIEW_FEEDBACK,
            PERMISSIONS.VIEW_OWN_RECEIVED_FEEDBACK, PERMISSIONS.VIEW_ALL_FEEDBACK,
            PERMISSIONS.GIVE_KUDOS, PERMISSIONS.VIEW_KUDOS_BOARD,
            PERMISSIONS.MANAGE_FEEDBACK_CYCLES, PERMISSIONS.EXPORT_FEEDBACK_REPORTS,
            // Role Management
            PERMISSIONS.MANAGE_ROLES, PERMISSIONS.VIEW_ROLES, PERMISSIONS.CREATE_ROLE,
            PERMISSIONS.EDIT_ROLE_PERMISSIONS, PERMISSIONS.DELETE_ROLE, PERMISSIONS.CLONE_ROLE,
            PERMISSIONS.MANAGE_USERS, PERMISSIONS.ASSIGN_ROLES,
            // Network Security
            PERMISSIONS.MANAGE_NETWORK_SECURITY, PERMISSIONS.VIEW_SECURITY_SETTINGS,
            PERMISSIONS.ENABLE_DISABLE_IP_RESTRICTION, PERMISSIONS.MANAGE_ALLOWLISTED_IPS,
            PERMISSIONS.MANAGE_EXEMPT_ROLES, PERMISSIONS.VIEW_SECURITY_LOGS,
            // Audit
            PERMISSIONS.VIEW_AUDIT_LOGS, PERMISSIONS.VIEW_ALL_AUDIT_LOGS,
            PERMISSIONS.FILTER_AUDIT_BY_MODULE, PERMISSIONS.EXPORT_AUDIT_LOGS,
            // System Settings
            PERMISSIONS.MANAGE_SYSTEM_SETTINGS, PERMISSIONS.VIEW_SYSTEM_SETTINGS,
            PERMISSIONS.MANAGE_COMPANY_INFO, PERMISSIONS.MANAGE_APPROVAL_WORKFLOW_CONFIG,
            PERMISSIONS.MANAGE_NOTIFICATION_SETTINGS,
        ],
        isSystemRole: true,
    },
    HR_ADMIN: {
        id: 'hr_admin',
        name: 'HR Admin',
        description: 'Human Resources management, payroll processing, and employee lifecycle',
        color: '#0ea5e9',
        isSuperAdmin: false,
        permissions: [
            PERMISSIONS.VIEW_HR_DASHBOARD,
            PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD,
            PERMISSIONS.VIEW_HR_LEAVE_SUMMARY, PERMISSIONS.VIEW_HR_PAYROLL_OVERVIEW,
            PERMISSIONS.VIEW_HR_LIFECYCLE_STATUS,
            // Employees
            PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.VIEW_EMPLOYEE_DIRECTORY,
            PERMISSIONS.CREATE_EMPLOYEE, PERMISSIONS.EDIT_EMPLOYEE,
            PERMISSIONS.DEACTIVATE_EMPLOYEE, PERMISSIONS.VIEW_INACTIVE_EMPLOYEES,
            PERMISSIONS.VIEW_EMPLOYEE_SALARY, PERMISSIONS.VIEW_EMPLOYEE_CONTACT,
            PERMISSIONS.VIEW_EMPLOYEE_DESIGNATION, PERMISSIONS.VIEW_EMPLOYEE_JOIN_DATE,
            PERMISSIONS.EXPORT_EMPLOYEE_DATA, PERMISSIONS.FILTER_EMPLOYEES_BY_DEPT,
            PERMISSIONS.MANAGE_EMPLOYEE_DOCS, PERMISSIONS.RESET_PASSWORDS,
            PERMISSIONS.VIEW_OWN_PROFILE,
            // Onboarding & Offboarding
            PERMISSIONS.VIEW_ONBOARDING_LIST, PERMISSIONS.INITIATE_ONBOARDING,
            PERMISSIONS.UPDATE_KYC_STATUS, PERMISSIONS.FINALIZE_ONBOARDING,
            PERMISSIONS.VIEW_ONBOARDING_PROGRESS, PERMISSIONS.MANAGE_ONBOARDING,
            PERMISSIONS.VIEW_OFFBOARDING_LIST, PERMISSIONS.INITIATE_OFFBOARDING,
            PERMISSIONS.MANAGE_CLEARANCE_CHECKLIST, PERMISSIONS.GENERATE_RELIEVING_LETTER,
            PERMISSIONS.VIEW_FNF_CALCULATIONS, PERMISSIONS.APPROVE_CLEARANCE,
            PERMISSIONS.MANAGE_OFFBOARDING,
            // Interviews
            PERMISSIONS.VIEW_INTERVIEW_SCHEDULE, PERMISSIONS.SCHEDULE_INTERVIEW,
            PERMISSIONS.ASSIGN_INTERVIEWER, PERMISSIONS.SUBMIT_INTERVIEW_ASSESSMENT,
            PERMISSIONS.VIEW_ALL_ASSESSMENTS, PERMISSIONS.MANAGE_INTERVIEW_PIPELINE,
            // Attendance
            PERMISSIONS.VIEW_OWN_ATTENDANCE, PERMISSIONS.MARK_ATTENDANCE,
            PERMISSIONS.VIEW_ATTENDANCE_CALENDAR, PERMISSIONS.PUNCH_IN, PERMISSIONS.PUNCH_OUT,
            PERMISSIONS.REQUEST_REGULARIZATION, PERMISSIONS.VIEW_ALL_ATTENDANCE,
            PERMISSIONS.VIEW_ALL_REGULARIZATIONS, PERMISSIONS.APPROVE_REGULARIZATION,
            PERMISSIONS.REJECT_REGULARIZATION, PERMISSIONS.EDIT_ATTENDANCE_LOG,
            PERMISSIONS.MANAGE_ATTENDANCE_SETTINGS, PERMISSIONS.VIEW_ATTENDANCE_REPORTS,
            PERMISSIONS.EXPORT_ATTENDANCE_DATA,
            // Leave
            PERMISSIONS.VIEW_OWN_LEAVE_BALANCE, PERMISSIONS.VIEW_LEAVE_HISTORY,
            PERMISSIONS.APPLY_LEAVE, PERMISSIONS.CANCEL_LEAVE,
            PERMISSIONS.VIEW_ALL_LEAVES, PERMISSIONS.APPROVE_LEAVE, PERMISSIONS.REJECT_LEAVE,
            PERMISSIONS.ADJUST_LEAVE_BALANCE, PERMISSIONS.MANAGE_LEAVE_POLICY,
            PERMISSIONS.MANAGE_LEAVE_TYPES, PERMISSIONS.VIEW_LEAVE_REPORTS,
            PERMISSIONS.VIEW_LEAVE_ENCASHMENT, PERMISSIONS.VIEW_TEAM_LEAVE_CALENDAR,
            // Approvals
            PERMISSIONS.VIEW_PENDING_APPROVALS, PERMISSIONS.APPROVE_ANY_REQUEST,
            PERMISSIONS.REJECT_ANY_REQUEST, PERMISSIONS.VIEW_APPROVAL_HISTORY,
            PERMISSIONS.MANAGE_APPROVAL_WORKFLOWS,
            // Payroll
            PERMISSIONS.VIEW_OWN_PAYSLIP, PERMISSIONS.VIEW_OWN_SALARY_BREAKDOWN,
            PERMISSIONS.VIEW_OWN_EPF_ESI, PERMISSIONS.VIEW_OWN_NET_PAY, PERMISSIONS.DOWNLOAD_PAYSLIP,
            PERMISSIONS.VIEW_ALL_PAYSLIPS, PERMISSIONS.VIEW_ALL_SALARY_STRUCTURES,
            PERMISSIONS.MANAGE_SALARY, PERMISSIONS.PROCESS_PAYROLL, PERMISSIONS.RUN_PAYROLL,
            PERMISSIONS.VIEW_PAYROLL_HISTORY, PERMISSIONS.REQUEST_SALARY_UPGRADE,
            PERMISSIONS.VIEW_ALL_SALARY_UPGRADES, PERMISSIONS.APPROVE_SALARY_UPGRADE,
            PERMISSIONS.APPROVE_REJECT_SALARY_UPGRADE, PERMISSIONS.VIEW_STATUTORY_REPORTS,
            // Loans
            PERMISSIONS.VIEW_OWN_LOANS, PERMISSIONS.APPLY_LOAN,
            PERMISSIONS.VIEW_LOAN_REPAYMENT_SCHEDULE, PERMISSIONS.VIEW_ALL_LOANS,
            PERMISSIONS.APPROVE_LOAN, PERMISSIONS.REJECT_LOAN,
            PERMISSIONS.VIEW_LOAN_DISBURSEMENT, PERMISSIONS.MANAGE_LOAN_POLICIES,
            // OKR
            PERMISSIONS.VIEW_OWN_OKR, PERMISSIONS.CREATE_OKR, PERMISSIONS.EDIT_OWN_OKR,
            PERMISSIONS.UPDATE_OKR_PROGRESS, PERMISSIONS.VIEW_ALL_OKR,
            PERMISSIONS.MANAGE_OKR, PERMISSIONS.VIEW_OKR_ANALYTICS,
            // Feedback
            PERMISSIONS.SUBMIT_FEEDBACK, PERMISSIONS.VIEW_FEEDBACK,
            PERMISSIONS.VIEW_OWN_RECEIVED_FEEDBACK, PERMISSIONS.VIEW_ALL_FEEDBACK,
            PERMISSIONS.GIVE_KUDOS, PERMISSIONS.VIEW_KUDOS_BOARD,
            PERMISSIONS.MANAGE_FEEDBACK_CYCLES, PERMISSIONS.EXPORT_FEEDBACK_REPORTS,
        ],
        isSystemRole: true,
    },
    MANAGER: {
        id: 'manager',
        name: 'Manager',
        description: 'Team management, attendance approvals, and performance reviews',
        color: '#10b981',
        isSuperAdmin: false,
        permissions: [
            PERMISSIONS.VIEW_MANAGER_DASHBOARD,
            PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD,
            PERMISSIONS.VIEW_MANAGER_TEAM_ATTENDANCE, PERMISSIONS.VIEW_MANAGER_PENDING_ITEMS,
            PERMISSIONS.VIEW_MANAGER_TEAM_LEAVE_STATUS,
            // Own Profile
            PERMISSIONS.VIEW_OWN_PROFILE,
            // Attendance - self + team
            PERMISSIONS.VIEW_OWN_ATTENDANCE, PERMISSIONS.VIEW_ATTENDANCE_CALENDAR,
            PERMISSIONS.PUNCH_IN, PERMISSIONS.PUNCH_OUT, PERMISSIONS.MARK_ATTENDANCE,
            PERMISSIONS.REQUEST_REGULARIZATION,
            PERMISSIONS.VIEW_TEAM_ATTENDANCE, PERMISSIONS.VIEW_TEAM_REGULARIZATIONS,
            PERMISSIONS.APPROVE_REGULARIZATION, PERMISSIONS.REJECT_REGULARIZATION,
            // Leave - self + team
            PERMISSIONS.VIEW_OWN_LEAVE_BALANCE, PERMISSIONS.VIEW_LEAVE_HISTORY,
            PERMISSIONS.APPLY_LEAVE, PERMISSIONS.CANCEL_LEAVE,
            PERMISSIONS.VIEW_TEAM_LEAVES, PERMISSIONS.VIEW_TEAM_LEAVE_CALENDAR,
            PERMISSIONS.APPROVE_LEAVE, PERMISSIONS.REJECT_LEAVE,
            // Approvals
            PERMISSIONS.VIEW_PENDING_APPROVALS, PERMISSIONS.APPROVE_ANY_REQUEST,
            PERMISSIONS.REJECT_ANY_REQUEST, PERMISSIONS.VIEW_APPROVAL_HISTORY,
            // Payroll - self only
            PERMISSIONS.VIEW_OWN_PAYSLIP, PERMISSIONS.VIEW_OWN_SALARY_BREAKDOWN,
            PERMISSIONS.VIEW_OWN_EPF_ESI, PERMISSIONS.VIEW_OWN_NET_PAY,
            PERMISSIONS.DOWNLOAD_PAYSLIP, PERMISSIONS.REQUEST_SALARY_UPGRADE,
            PERMISSIONS.APPROVE_SALARY_UPGRADE, PERMISSIONS.APPROVE_REJECT_SALARY_UPGRADE,
            // Loans - self
            PERMISSIONS.VIEW_OWN_LOANS, PERMISSIONS.APPLY_LOAN,
            PERMISSIONS.VIEW_LOAN_REPAYMENT_SCHEDULE,
            // OKR - self + team
            PERMISSIONS.VIEW_OWN_OKR, PERMISSIONS.CREATE_OKR, PERMISSIONS.EDIT_OWN_OKR,
            PERMISSIONS.UPDATE_OKR_PROGRESS, PERMISSIONS.LINK_OKR,
            PERMISSIONS.VIEW_TEAM_OKR, PERMISSIONS.MANAGE_OKR,
            // Feedback
            PERMISSIONS.SUBMIT_FEEDBACK, PERMISSIONS.VIEW_FEEDBACK,
            PERMISSIONS.VIEW_OWN_RECEIVED_FEEDBACK, PERMISSIONS.VIEW_TEAM_FEEDBACK,
            PERMISSIONS.GIVE_KUDOS, PERMISSIONS.VIEW_KUDOS_BOARD,
            PERMISSIONS.VIEW_EMPLOYEE_DIRECTORY,
        ],
        isSystemRole: true,
    },
    EMPLOYEE: {
        id: 'employee',
        name: 'Employee',
        description: 'Standard employee access for self-service portal',
        color: '#8b5cf6',
        isSuperAdmin: false,
        permissions: [
            PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD,
            PERMISSIONS.VIEW_OWN_KPIs, PERMISSIONS.VIEW_OWN_UPCOMING_EVENTS,
            // Own Profile
            PERMISSIONS.VIEW_OWN_PROFILE,
            // Attendance - self only
            PERMISSIONS.VIEW_OWN_ATTENDANCE, PERMISSIONS.VIEW_ATTENDANCE_CALENDAR,
            PERMISSIONS.PUNCH_IN, PERMISSIONS.PUNCH_OUT, PERMISSIONS.MARK_ATTENDANCE,
            PERMISSIONS.REQUEST_REGULARIZATION,
            // Leave - self only
            PERMISSIONS.VIEW_OWN_LEAVE_BALANCE, PERMISSIONS.VIEW_LEAVE_HISTORY,
            PERMISSIONS.APPLY_LEAVE, PERMISSIONS.CANCEL_LEAVE,
            PERMISSIONS.VIEW_LEAVE_ENCASHMENT,
            // Payroll - self only
            PERMISSIONS.VIEW_OWN_PAYSLIP, PERMISSIONS.VIEW_OWN_SALARY_BREAKDOWN,
            PERMISSIONS.VIEW_OWN_EPF_ESI, PERMISSIONS.VIEW_OWN_NET_PAY,
            PERMISSIONS.DOWNLOAD_PAYSLIP, PERMISSIONS.REQUEST_SALARY_UPGRADE,
            // Loans - self only
            PERMISSIONS.VIEW_OWN_LOANS, PERMISSIONS.APPLY_LOAN,
            PERMISSIONS.VIEW_LOAN_REPAYMENT_SCHEDULE,
            // OKR - self only
            PERMISSIONS.VIEW_OWN_OKR, PERMISSIONS.CREATE_OKR, PERMISSIONS.EDIT_OWN_OKR,
            PERMISSIONS.UPDATE_OKR_PROGRESS,
            // Feedback
            PERMISSIONS.SUBMIT_FEEDBACK, PERMISSIONS.VIEW_FEEDBACK,
            PERMISSIONS.VIEW_OWN_RECEIVED_FEEDBACK, PERMISSIONS.GIVE_KUDOS,
            PERMISSIONS.VIEW_KUDOS_BOARD,
            PERMISSIONS.VIEW_EMPLOYEE_DIRECTORY,
        ],
        isSystemRole: true,
    },
};

export const DEPARTMENTS = [
    'Technical', 'Functional', 'Techno-Functional',
    'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'IT Support', 'Executive'
];

export const DESIGNATIONS = [
    'Chief Executive Officer(CEO)',
    'Chief Development Officer(CDO)',
    'Developer Admin - Accounts',
    'Administration',
    'Associate HR',
    'Associate MM Consultant',
    'Associate FICO Consultant',
    'Associate SucessFactor Consultant',
    'SAP Cloud Platform & System Architect',
    'SAP BTP Solution Architect',
    'SAP Cloud ALM Administrator',
    'SAP Build App Developer',
    'SAP Integration Architect',
    'SAP Full Stack Solution Developer',
    'Social Media Manger',
    'SAP CAPM Developer',
    'CAPM Developer',
    'AI/ML',
    'SAP - ABAP Trainee',
    'SAP BASIS Intern'
];

export const EMPLOYEE_TYPES = ['Trainee', 'Confirm'];

export const OFFICE_LOCATIONS = [
    { name: 'Headquarters (Bangalore)', lat: 12.9716, lng: 77.5946, radius: 500 },
    { name: 'Pune Hub', lat: 18.5204, lng: 73.8567, radius: 300 },
    { name: 'Hyderabad Office', lat: 17.3850, lng: 78.4867, radius: 300 },
    { name: 'Remote', lat: null, lng: null, radius: null }
];

export const LEAVE_TYPES = [
    { id: 'CL', name: 'Casual Leave', color: '#10b981', maxPerYear: 12 },
    { id: 'SL', name: 'Sick Leave', color: '#ef4444', maxPerYear: 8 },
    { id: 'EL', name: 'Earned Leave', color: '#6366f1', maxPerYear: 15 },
    { id: 'ML', name: 'Maternity Leave', color: '#ec4899', maxPerYear: 180, applicableGender: 'female' },
    { id: 'PL', name: 'Paternity Leave', color: '#8b5cf6', maxPerYear: 15, applicableGender: 'male' },
    { id: 'LOP', name: 'Unpaid Leave (LOP)', color: '#94a3b8', maxPerYear: 0 },
    { id: 'WFH', name: 'Work From Home', color: '#8b5cf6', maxPerYear: 0 },
    { id: 'OD', name: 'On Duty', color: '#06b6d4', maxPerYear: 0 },
];

export const DEFAULT_SECURITY_CONFIG = {
    wifiRestrictionEnabled: false,
    allowedIPs: [],
    allowedNetworks: [],
    restrictedRoles: [],
    exemptRoles: ['super_admin', 'core_admin'],
    popupMessage: 'Login Restricted: Please connect to the authorized company network to access AI4S Smart HR.',
};

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

export const APPROVAL_WORKFLOWS = {
    LEAVE: {
        id: 'leave',
        name: 'Leave Request',
        levels: [
            { level: 1, label: 'Reporting Manager' },
            { level: 2, label: 'Functional Manager (Secondary)' },
        ],
    },
    SALARY_UPGRADE: {
        id: 'salary_upgrade',
        name: 'Salary Upgrade',
        levels: [
            { level: 1, label: 'Reporting Manager' },
            { level: 2, label: 'Functional Manager (Secondary)' },
        ],
    },
    LOAN: {
        id: 'loan',
        name: 'Loan / Advance',
        levels: [
            { level: 1, label: 'Reporting Manager' },
            { level: 2, label: 'Functional Manager (Secondary)' },
        ],
    },
    REGULARIZATION: {
        id: 'regularization',
        name: 'Attendance Regularization',
        levels: [
            { level: 1, label: 'Reporting Manager' },
            { level: 2, label: 'Functional Manager (Secondary)' },
        ],
    },
};

export function getInitials(name) {
    if (!name) return '';
    const nameStr = String(name).trim();
    if (!nameStr) return '';
    const parts = nameStr.split(/\s+/);
    if (parts.length === 1) return nameStr.substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
