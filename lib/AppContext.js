'use client';
// ============================================================
// AI4S Smart HR — Global Application Context
// Manages auth state, RBAC data, and app-wide state
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    DEFAULT_USERS, DEFAULT_ROLES, DEFAULT_SECURITY_CONFIG,
    INITIAL_LEAVE_REQUESTS, INITIAL_LEAVE_BALANCES,
    INITIAL_ATTENDANCE, INITIAL_REGULARIZATIONS,
    INITIAL_PAYROLL, INITIAL_OKRS, INITIAL_FEEDBACK,
    INITIAL_LOANS, INITIAL_SALARY_UPGRADES,
    INITIAL_NOTIFICATIONS, INITIAL_KUDOS, INITIAL_AUDIT_LOG,
    INITIAL_INTERVIEWS, INITIAL_ACTIVITY_HISTORY,
    getUserByEmail, LEAVE_TYPES,
} from './mockData';
import { getDashboardRoute, isNetworkRestricted } from './rbac';
import { supabase } from './supabase';

const AppContext = createContext(null);

const STORAGE_KEY = 'ai4s_hr_state';
export const PRODUCTION_MODE = true; // Toggle this to show/hide demo info

function loadState() {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveState(state) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { }
}

export function AppProvider({ children }) {
    // Initial state from localStorage to prevent flicker (browser-only)
    const initialState = typeof window !== 'undefined' ? loadState() || {} : {};

    const [currentUser, setCurrentUser] = useState(initialState.currentUser || null);
    const [users, setUsers] = useState(initialState.users || DEFAULT_USERS);
    const [customRoles, setCustomRoles] = useState(initialState.customRoles || []);
    const [securityConfig, setSecurityConfig] = useState(initialState.securityConfig || DEFAULT_SECURITY_CONFIG);
    const [leaveRequests, setLeaveRequests] = useState(initialState.leaveRequests || INITIAL_LEAVE_REQUESTS);
    const [leaveBalances, setLeaveBalances] = useState(initialState.leaveBalances || INITIAL_LEAVE_BALANCES);
    const [attendance, setAttendance] = useState(initialState.attendance || INITIAL_ATTENDANCE);
    const [regularizations, setRegularizations] = useState(initialState.regularizations || INITIAL_REGULARIZATIONS);
    const [payroll, setPayroll] = useState(initialState.payroll || INITIAL_PAYROLL);
    const [okrs, setOkrs] = useState(initialState.okrs || INITIAL_OKRS);
    const [feedback, setFeedback] = useState(initialState.feedback || INITIAL_FEEDBACK);
    const [loans, setLoans] = useState(initialState.loans || INITIAL_LOANS);
    const [salaryUpgrades, setSalaryUpgrades] = useState(initialState.salaryUpgrades || INITIAL_SALARY_UPGRADES);
    const [notifications, setNotifications] = useState(initialState.notifications || INITIAL_NOTIFICATIONS);
    const [kudos, setKudos] = useState(initialState.kudos || INITIAL_KUDOS);
    const [auditLog, setAuditLog] = useState(initialState.auditLog || INITIAL_AUDIT_LOG);
    const [interviews, setInterviews] = useState(initialState.interviews || INITIAL_INTERVIEWS);
    const [activityHistory, setActivityHistory] = useState(initialState.activityHistory || INITIAL_ACTIVITY_HISTORY);
    const [isInitialized, setIsInitialized] = useState(false);

    // Synchronize with Supabase Auth on mount
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                // Fetch user profile from database
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                
                if (profile) {
                    setCurrentUser(profile);
                    // Fetch all other data once authenticated
                    fetchAllData(session.user.id);
                }
            } else {
                setCurrentUser(null);
            }
            setIsInitialized(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Helper to fetch all data from Supabase
    const fetchAllData = async (userId) => {
        // We will implement individual fetcher calls here in the next step
        // For now, let's keep the existing mock data state
    };

    // Persist to localStorage whenever state changes
    useEffect(() => {
        if (!isInitialized) return;
        saveState({
            currentUser, users, customRoles, securityConfig,
            leaveRequests, leaveBalances, attendance, regularizations,
            payroll, okrs, feedback, loans, salaryUpgrades,
            notifications, kudos, auditLog, interviews, activityHistory,
        });
    }, [
        currentUser, users, customRoles, securityConfig,
        leaveRequests, leaveBalances, attendance, regularizations,
        payroll, okrs, feedback, loans, salaryUpgrades,
        notifications, kudos, auditLog, interviews, activityHistory, isInitialized,
    ]);

    // ---- AUDIT ----
    const addAuditEntry = useCallback(async (userId, action, target, details) => {
        const entry = { id: `AUD${Date.now()}`, userId, action, target, details, timestamp: new Date().toISOString() };
        setAuditLog(prev => [entry, ...prev.slice(0, 499)]);
        // Also log to activity_history in DB
        await logActivity({ 
            module: 'System', action, actionCode: 'AUDIT', 
            performedById: userId, description: details, referenceId: target 
        });
    }, []);

    // ---- ACTIVITY HISTORY LOGGER ----
    const logActivity = useCallback(async (entry) => {
        const histEntry = {
            id: `HIS${Date.now()}${Math.floor(Math.random() * 1000)}`,
            timestamp: new Date().toISOString(),
            module: entry.module || 'System',
            action: entry.action || 'Action',
            action_code: entry.actionCode || 'GENERIC',
            performed_by_id: entry.performedById || currentUser?.id,
            performed_by_name: entry.performedByName || currentUser?.name || 'System',
            target_employee_id: entry.targetEmployeeId || null,
            target_employee_name: entry.targetEmployeeName || null,
            description: entry.description || '',
            previous_value: entry.previousValue !== undefined ? String(entry.previousValue) : null,
            new_value: entry.newValue !== undefined ? String(entry.newValue) : null,
            reference_id: entry.referenceId || null,
        };
        
        setActivityHistory(prev => [histEntry, ...prev.slice(0, 999)]);
        await supabase.from('activity_history').insert([histEntry]);
    }, [currentUser]);

    // ---- NOTIFICATIONS (Defined early for other functions) ----
    const addNotification = useCallback((userId, type, title, message, link = '/') => {
        const newNotif = { id: `NOT${Date.now()}`, userId, type, title, message, read: false, createdAt: new Date().toISOString(), link };
        setNotifications(prev => [newNotif, ...prev]);
    }, []);

    // ---- AUTH ----
    const login = useCallback(async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (!profile) return { success: false, error: 'User profile not found.' };

        setCurrentUser(profile);
        addAuditEntry(profile.id, 'LOGIN', 'system', `User logged in from web`);
        logActivity({ module: 'Auth', action: 'User Login', actionCode: 'LOGIN', performedById: profile.id, performedByName: profile.name, targetEmployeeId: profile.id, targetEmployeeName: profile.name, description: `${profile.name} logged into the system`, newValue: 'active' });
        
        return { success: true, user: profile, redirectTo: getDashboardRoute(profile) };
    }, [addAuditEntry, logActivity]);

    const logout = useCallback(async () => {
        if (currentUser) {
            addAuditEntry(currentUser.id, 'LOGOUT', 'system', 'User logged out');
            logActivity({ module: 'Auth', action: 'User Logout', actionCode: 'LOGOUT', performedById: currentUser.id, performedByName: currentUser.name, targetEmployeeId: currentUser.id, targetEmployeeName: currentUser.name, description: `${currentUser.name} logged out`, previousValue: 'active', newValue: 'inactive' });
        }
        await supabase.auth.signOut();
        setCurrentUser(null);
    }, [currentUser, addAuditEntry, logActivity]);

    const signUp = useCallback(async (email, password, profileData) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { success: false, error: error.message };

        const newProfile = {
            id: data.user.id,
            ...profileData,
            email,
            status: 'active'
        };

        const { error: profileError } = await supabase.from('profiles').insert([newProfile]);
        if (profileError) return { success: false, error: profileError.message };

        return { success: true };
    }, []);

    // ---- NETWORK CHECK ----
    const checkNetworkRestriction = useCallback(() => {
        if (!currentUser) return false;
        return isNetworkRestricted(currentUser, securityConfig);
    }, [currentUser, securityConfig]);

    // ---- USER MANAGEMENT ----
    const createUser = useCallback((userData) => {
        const newUser = {
            ...userData,
            id: `USR${String(users.length + 1).padStart(3, '0')}`,
            employeeId: `AI4S${String(users.length + 1).padStart(3, '0')}`,
            status: 'active',
        };
        setUsers(prev => [...prev, newUser]);
        addAuditEntry(currentUser?.id, 'USER_CREATED', newUser.id, `Created user: ${newUser.name}`);
        logActivity({ module: 'Employee', action: 'Employee Created', actionCode: 'EMPLOYEE_CREATED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeId: newUser.id, targetEmployeeName: newUser.name, description: `New employee profile created — ${newUser.name} (${newUser.employeeId})`, newValue: 'Active', referenceId: newUser.id });
        return newUser;
    }, [users, currentUser, addAuditEntry, logActivity]);

    const updateUser = useCallback((userId, updates, fieldDescriptions) => {
        let targetName = null;
        setUsers(prev => {
            const existing = prev.find(u => u.id === userId);
            targetName = existing?.name;
            // Log each changed field
            if (existing && fieldDescriptions) {
                Object.entries(fieldDescriptions).forEach(([field, { label, old: oldVal, new: newVal }]) => {
                    logActivity({ module: 'Employee', action: 'Profile Updated', actionCode: 'EMPLOYEE_UPDATED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeId: userId, targetEmployeeName: existing.name, description: `${label} changed`, previousValue: String(oldVal ?? ''), newValue: String(newVal ?? ''), referenceId: userId });
                });
            } else if (existing) {
                logActivity({ module: 'Employee', action: 'Profile Updated', actionCode: 'EMPLOYEE_UPDATED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeId: userId, targetEmployeeName: existing.name, description: 'Employee profile updated', referenceId: userId });
            }
            return prev.map(u => u.id === userId ? { ...u, ...updates } : u);
        });
        if (currentUser?.id === userId) setCurrentUser(prev => ({ ...prev, ...updates }));
        addAuditEntry(currentUser?.id, 'USER_UPDATED', userId, `Updated user profile`);
    }, [currentUser, addAuditEntry, logActivity]);

    const resetPassword = useCallback((userId, newPassword) => {
        const target = users.find(u => u.id === userId);
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
        addAuditEntry(currentUser?.id, 'PASSWORD_RESET', userId, `Password reset by ${currentUser?.name}`);
        logActivity({ module: 'Security', action: 'Password Reset', actionCode: 'PASSWORD_RESET', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeId: userId, targetEmployeeName: target?.name, description: `Password reset by ${currentUser?.name}`, referenceId: userId });
        return { success: true };
    }, [users, currentUser, addAuditEntry, logActivity]);

    // ---- ROLE MANAGEMENT ----
    const createRole = useCallback((roleData) => {
        const newRole = { ...roleData, id: `role_${Date.now()}`, isSystemRole: false };
        setCustomRoles(prev => [...prev, newRole]);
        addAuditEntry(currentUser?.id, 'ROLE_CREATED', newRole.id, `Created role: ${newRole.name}`);
        logActivity({ module: 'Security', action: 'Role Created', actionCode: 'ROLE_CREATED', performedById: currentUser?.id, performedByName: currentUser?.name, description: `New custom role "${newRole.name}" created`, newValue: newRole.name, referenceId: newRole.id });
        return newRole;
    }, [currentUser, addAuditEntry, logActivity]);

    const updateRole = useCallback((roleId, updates) => {
        setCustomRoles(prev => prev.map(r => r.id === roleId ? { ...r, ...updates } : r));
        addAuditEntry(currentUser?.id, 'ROLE_MODIFIED', roleId, `Modified role permissions`);
        logActivity({ module: 'Security', action: 'Role Modified', actionCode: 'ROLE_MODIFIED', performedById: currentUser?.id, performedByName: currentUser?.name, description: `Role permissions updated`, referenceId: roleId });
    }, [currentUser, addAuditEntry, logActivity]);

    const deleteRole = useCallback((roleId) => {
        const role = customRoles.find(r => r.id === roleId);
        setCustomRoles(prev => prev.filter(r => r.id !== roleId));
        addAuditEntry(currentUser?.id, 'ROLE_DELETED', roleId, `Deleted custom role`);
        logActivity({ module: 'Security', action: 'Role Deleted', actionCode: 'ROLE_DELETED', performedById: currentUser?.id, performedByName: currentUser?.name, description: `Custom role "${role?.name || roleId}" deleted`, previousValue: role?.name, referenceId: roleId });
    }, [customRoles, currentUser, addAuditEntry, logActivity]);

    // ---- SECURITY CONFIG ----
    const updateSecurityConfig = useCallback((updates) => {
        setSecurityConfig(prev => ({ ...prev, ...updates }));
        addAuditEntry(currentUser?.id, 'SECURITY_CONFIG_UPDATED', 'system', `Security config updated`);
        logActivity({ module: 'Security', action: 'Security Config Updated', actionCode: 'SECURITY_CONFIG_UPDATED', performedById: currentUser?.id, performedByName: currentUser?.name, description: 'Security configuration was updated', referenceId: 'system' });
    }, [currentUser, addAuditEntry, logActivity]);

    // ---- LEAVE MANAGEMENT ----
    const applyLeave = useCallback(async (leaveData) => {
        const newLeave = {
            ...leaveData,
            id: `LR${String(leaveRequests.length + 1).padStart(3, '0')}`,
            status: 'pending', current_level: 1, approvals: [],
            applied_on: new Date().toISOString(),
        };
        setLeaveRequests(prev => [...prev, newLeave]);
        
        const { error } = await supabase.from('leaves').insert([{
            ...newLeave,
            employee_id: currentUser.id,
            from_date: leaveData.from,
            to_date: leaveData.to
        }]);

        if (error) console.error('Error applying leave:', error);

        addNotification(leaveData.approverId, 'leave', 'New Leave Request', `${currentUser?.name} applied for ${leaveData.type} leave`);
        logActivity({ module: 'Leave', action: 'Leave Applied', actionCode: 'LEAVE_APPLIED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeId: currentUser?.id, targetEmployeeName: currentUser?.name, description: `${newLeave.type} leave applied from ${newLeave.from} to ${newLeave.to}`, previousValue: 'None', newValue: 'Pending', referenceId: newLeave.id });
        return newLeave;
    }, [leaveRequests, currentUser, addNotification, logActivity]);

    const approveLeave = useCallback(async (leaveId, approverId, comments, nextLevel, totalLevels) => {
        let fullyApproved = false;
        setLeaveRequests(prev => prev.map(lr => {
            if (lr.id !== leaveId) return lr;
            const approval = { level: lr.current_level, approvedBy: approverId, approvedOn: new Date().toISOString(), status: 'approved', comments };
            const newApprovals = [...lr.approvals, approval];
            fullyApproved = lr.current_level >= totalLevels;
            return {
                ...lr,
                approvals: newApprovals,
                current_level: fullyApproved ? lr.current_level : lr.current_level + 1,
                status: fullyApproved ? 'approved' : 'pending',
            };
        }));

        const lr = leaveRequests.find(l => l.id === leaveId);
        if (lr) {
            await supabase.from('leaves').update({
                status: fullyApproved ? 'approved' : 'pending',
                current_level: fullyApproved ? lr.current_level : lr.current_level + 1,
                approvals: [...lr.approvals, { level: lr.current_level, approvedBy: approverId, approvedOn: new Date().toISOString(), status: 'approved', comments }]
            }).eq('id', leaveId);

            addNotification(lr.employee_id, 'approval', 'Leave Approved', 'Your leave request has been approved');
            logActivity({ module: 'Leave', action: 'Leave Approved', actionCode: 'LEAVE_APPROVED', performedById: approverId, performedByName: users.find(u => u.id === approverId)?.name, targetEmployeeId: lr.employee_id, targetEmployeeName: users.find(u => u.id === lr.employee_id)?.name, description: `${lr.type} leave approved`, previousValue: 'Pending', newValue: fullyApproved ? 'Approved' : 'Level Approved', referenceId: leaveId });
        }
    }, [leaveRequests, users, addNotification, logActivity]);

    const rejectLeave = useCallback((leaveId, approverId, comments) => {
        setLeaveRequests(prev => prev.map(lr => {
            if (lr.id !== leaveId) return lr;
            const approval = { level: lr.currentLevel, approvedBy: approverId, approvedOn: new Date().toISOString(), status: 'rejected', comments };
            return { ...lr, approvals: [...lr.approvals, approval], status: 'rejected' };
        }));
        const lr = leaveRequests.find(l => l.id === leaveId);
        if (lr) {
            addNotification(lr.employeeId, 'approval', 'Leave Rejected', 'Your leave request has been rejected');
            addAuditEntry(approverId, 'LEAVE_REJECTED', lr.id, `Rejected ${lr.employeeId}'s ${lr.type} leave`);
            logActivity({ module: 'Leave', action: 'Leave Rejected', actionCode: 'LEAVE_REJECTED', performedById: approverId, performedByName: users.find(u => u.id === approverId)?.name, targetEmployeeId: lr.employeeId, targetEmployeeName: users.find(u => u.id === lr.employeeId)?.name, description: `${lr.type} leave rejected from ${lr.from} to ${lr.to}`, previousValue: 'Pending', newValue: 'Rejected', referenceId: leaveId });
        }
    }, [leaveRequests, users, addNotification, addAuditEntry, logActivity]);

    // ---- ATTENDANCE REGULARIZATION ----
    const requestRegularization = useCallback(async (regData) => {
        const newReg = {
            ...regData,
            id: `REG${String(regularizations.length + 1).padStart(3, '0')}`,
            status: 'pending', requestedOn: new Date().toISOString(),
            approvals: [],
        };
        setRegularizations(prev => [...prev, newReg]);
        
        // Note: For now we'll keep regularizations in local state or add a table if needed.
        // Let's focus on the primary tables for now.
        
        logActivity({
            module: 'Attendance',
            action: 'Regularization Requested',
            actionCode: 'REGULARIZATION_REQUESTED',
            performedById: regData.employeeId,
            description: `Attendance regularization requested for ${regData.date}`,
            newValue: 'Pending',
            referenceId: newReg.id
        });
        return newReg;
    }, [regularizations, users, logActivity]);

    const approveRegularization = useCallback(async (regId, approverId, comments) => {
        let targetReg = null;
        setRegularizations(prev => prev.map(r => {
            if (r.id !== regId) return r;
            targetReg = r;
            return { ...r, status: 'approved', approvals: [...r.approvals, { approvedBy: approverId, approvedOn: new Date().toISOString(), comments }] };
        }));

        if (targetReg) {
            // Update attendance in Supabase
            const { data: existingAtt } = await supabase
                .from('attendance')
                .select('*')
                .eq('user_id', targetReg.employeeId)
                .eq('date', targetReg.date)
                .single();

            if (existingAtt) {
                await supabase.from('attendance').update({ status: 'present', regularized: true }).eq('id', existingAtt.id);
            } else {
                await supabase.from('attendance').insert([{ id: `ATT${Date.now()}`, user_id: targetReg.employeeId, date: targetReg.date, status: 'present', regularized: true }]);
            }

            addNotification(targetReg.employeeId, 'approval', 'Regularization Approved', `Attendance for ${targetReg.date} has been regularized`);
            logActivity({
                module: 'Attendance',
                action: 'Regularization Approved',
                actionCode: 'REGULARIZATION_APPROVED',
                performedById: approverId,
                targetEmployeeId: targetReg.employeeId,
                description: `Regularization for ${targetReg.date} approved`,
                previousValue: 'Pending',
                newValue: 'Approved',
                referenceId: regId
            });
        }
    }, [regularizations, users, addNotification, logActivity]);

    // ---- INTERVIEW SCHEDULING ----
    const createInterview = useCallback((interviewData) => {
        const newInterview = {
            ...interviewData,
            id: `INT${Date.now()}`,
            status: 'scheduled',
            assessment: null,
            createdAt: new Date().toISOString(),
        };
        setInterviews(prev => [...prev, newInterview]);
        if (interviewData.interviewerId) {
            addNotification(interviewData.interviewerId, 'system', 'Interview Assigned', `You have been assigned as interviewer for ${interviewData.candidateName} on ${interviewData.interviewDate}`, '/dashboard/interviews');
        }
        addAuditEntry(currentUser?.id, 'INTERVIEW_SCHEDULED', newInterview.id, `Scheduled interview for ${interviewData.candidateName}`);
        logActivity({ module: 'Interview', action: 'Interview Scheduled', actionCode: 'INTERVIEW_SCHEDULED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeName: `${interviewData.candidateName} (Candidate)`, description: `Interview scheduled for ${interviewData.appliedPosition} on ${interviewData.interviewDate}`, newValue: 'Scheduled', referenceId: newInterview.id });
        return newInterview;
    }, [currentUser, addNotification, addAuditEntry, logActivity]);

    const updateInterviewAssessment = useCallback((interviewId, assessment) => {
        const inv = interviews.find(i => i.id === interviewId);
        setInterviews(prev => prev.map(i => i.id === interviewId ? { ...i, assessment, status: 'completed' } : i));
        addAuditEntry(currentUser?.id, 'INTERVIEW_ASSESSED', interviewId, `Submitted assessment: ${assessment.recommendation}`);
        logActivity({ module: 'Interview', action: 'Assessment Submitted', actionCode: 'INTERVIEW_ASSESSED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeName: inv ? `${inv.candidateName} (Candidate)` : null, description: `Interview assessment submitted. Recommendation: ${assessment.recommendation}`, previousValue: 'Scheduled', newValue: assessment.recommendation, referenceId: interviewId });
    }, [interviews, currentUser, addAuditEntry, logActivity]);

    // ---- HR ATTENDANCE CORRECTION ----
    const hrCorrectAttendance = useCallback((userId, date, updates) => {
        const existing = attendance.find(a => a.userId === userId && a.date === date);
        const prevStatus = existing?.status || 'absent';
        if (existing) {
            setAttendance(prev => prev.map(a => a.userId === userId && a.date === date ? { ...a, ...updates, hrCorrected: true } : a));
        } else {
            setAttendance(prev => [...prev, { id: `ATT${Date.now()}`, userId, date, ...updates, hrCorrected: true }]);
        }
        const targetEmp = users.find(u => u.id === userId);
        // If HR sets attendance to 'leave', deduct from leave balance
        if (updates.status === 'leave' && updates.leaveType) {
            setLeaveBalances(prev => prev.map(b => {
                if (b.userId !== userId) return b;
                const lt = updates.leaveType;
                if (b[lt] !== undefined && b[lt] > 0) {
                    logActivity({ module: 'Leave', action: 'Leave Balance Adjusted', actionCode: 'LEAVE_BALANCE_ADJUSTED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeId: userId, targetEmployeeName: targetEmp?.name, description: `${updates.leaveType} Leave balance deducted due to attendance correction on ${date}`, previousValue: String(b[lt]), newValue: String(b[lt] - 1), referenceId: userId });
                    return { ...b, [lt]: b[lt] - 1 };
                }
                return b;
            }));
            if (targetEmp) addNotification(userId, 'approval', 'Attendance Corrected', `HR has updated your attendance for ${date} to ${updates.leaveType} Leave.`, '/dashboard/attendance');
        }
        addAuditEntry(currentUser?.id, 'ATTENDANCE_HR_CORRECTION', `${userId}:${date}`, `HR corrected attendance to ${updates.status}`);
        logActivity({ module: 'Attendance', action: 'Attendance Corrected', actionCode: 'ATT_HR_CORRECTION', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeId: userId, targetEmployeeName: targetEmp?.name, description: `Attendance for ${date} corrected from ${prevStatus} to ${updates.status}`, previousValue: prevStatus, newValue: updates.status, referenceId: `ATT_${userId}_${date}` });
    }, [attendance, users, currentUser, addNotification, addAuditEntry, logActivity]);

    const adjustLeaveBalance = useCallback((userId, leaveType, delta, reason) => {
        const targetEmp = users.find(u => u.id === userId);
        let oldVal;
        setLeaveBalances(prev => prev.map(b => {
            if (b.userId !== userId) return b;
            oldVal = b[leaveType] || 0;
            return { ...b, [leaveType]: Math.max(0, oldVal + delta) };
        }));
        addAuditEntry(currentUser?.id, 'LEAVE_BALANCE_ADJUSTED', userId, `${reason}: ${leaveType} ${delta > 0 ? '+' : ''}${delta}`);
        logActivity({ module: 'Leave', action: 'Leave Balance Adjusted', actionCode: 'LEAVE_BALANCE_ADJUSTED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeId: userId, targetEmployeeName: targetEmp?.name, description: `${reason}: ${leaveType} ${delta > 0 ? '+' : ''}${delta}`, previousValue: String(oldVal ?? ''), newValue: String((oldVal ?? 0) + delta), referenceId: userId });
    }, [users, currentUser, addAuditEntry, logActivity]);

    // ---- LOANS ----
    const applyLoan = useCallback(async (loanData) => {
        const newLoan = {
            ...loanData,
            id: `LOAN${String(loans.length + 1).padStart(3, '0')}`,
            status: 'pending', currentLevel: 1, approvals: [],
            requestedOn: new Date().toISOString().split('T')[0],
        };
        setLoans(prev => [...prev, newLoan]);
        
        // Potential: supabase.from('loans').insert(...)
        
        logActivity({
            module: 'Payroll',
            action: 'Loan Applied',
            actionCode: 'LOAN_APPLIED',
            performedById: loanData.employeeId,
            description: `Applied for a loan of ₹${loanData.amount.toLocaleString()}`,
            newValue: 'Pending',
            referenceId: newLoan.id
        });
        return newLoan;
    }, [loans, users, logActivity]);

    const approveLoan = useCallback((loanId, approverId, comments, level, totalLevels) => {
        setLoans(prev => prev.map(l => {
            if (l.id !== loanId) return l;
            const approval = { level, approvedBy: approverId, approvedOn: new Date().toISOString(), comments };
            const isFullyApproved = level >= totalLevels;
            return { ...l, approvals: [...l.approvals, approval], currentLevel: isFullyApproved ? level : level + 1, status: isFullyApproved ? 'approved' : 'pending' };
        }));
        const loan = loans.find(l => l.id === loanId);
        if (loan) {
            addAuditEntry(approverId, 'LOAN_APPROVED', loan.id, `Approved loan for ${loan.employeeId}`);
            logActivity({
                module: 'Payroll',
                action: 'Loan Approved',
                actionCode: 'LOAN_APPROVED',
                performedById: approverId,
                performedByName: users.find(u => u.id === approverId)?.name,
                targetEmployeeId: loan.employeeId,
                targetEmployeeName: users.find(u => u.id === loan.employeeId)?.name,
                description: `Loan of ₹${loan.amount.toLocaleString()} approved`,
                previousValue: 'Pending',
                newValue: 'Approved',
                referenceId: loanId
            });
        }
    }, [loans, users, addAuditEntry, logActivity]);

    // ---- SALARY UPGRADES ----
    const approveSalaryUpgrade = useCallback((suId, approverId, comments, level, totalLevels) => {
        setSalaryUpgrades(prev => prev.map(su => {
            if (su.id !== suId) return su;
            const approval = { level, approvedBy: approverId, approvedOn: new Date().toISOString(), comments };
            const isFullyApproved = level >= totalLevels;
            if (isFullyApproved) {
                // Update employee salary
                setUsers(u => u.map(emp => {
                    if (emp.id !== su.employeeId) return emp;
                    return { ...emp, salary: { ...emp.salary, gross: su.proposedSalary } };
                }));
            }
            return { ...su, approvals: [...su.approvals, approval], currentLevel: isFullyApproved ? level : level + 1, status: isFullyApproved ? 'approved' : 'pending' };
        }));
        const su = salaryUpgrades.find(s => s.id === suId);
        if (su) {
            addAuditEntry(approverId, 'SALARY_UPGRADE_APPROVED', su.id, `Approved salary upgrade for ${su.employeeId}`);
            logActivity({
                module: 'Payroll',
                action: 'Salary Upgrade Approved',
                actionCode: 'SALARY_UPGRADE_APPROVED',
                performedById: approverId,
                performedByName: users.find(u => u.id === approverId)?.name,
                targetEmployeeId: su.employeeId,
                targetEmployeeName: users.find(u => u.id === su.employeeId)?.name,
                description: `Salary upgrade to ₹${su.proposedSalary.toLocaleString()} approved`,
                previousValue: 'Pending',
                newValue: 'Approved',
                referenceId: suId
            });
        }
    }, [salaryUpgrades, users, addAuditEntry, logActivity]);

    const markNotificationRead = useCallback((notifId) => {
        setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    }, []);

    const markAllRead = useCallback((userId) => {
        setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, read: true } : n));
    }, []);

    // ---- KUDOS ----
    const sendKudos = useCallback((fromId, toId, badge, message) => {
        const newKudo = { id: `KUD${Date.now()}`, fromId, toId, badge, message, createdAt: new Date().toISOString() };
        setKudos(prev => [newKudo, ...prev]);
        addNotification(toId, 'kudos', 'You received a Kudos! 🎉', `${currentUser?.name} sent you a kudos: "${message}"`);
        logActivity({
            module: 'Employee',
            action: 'Kudos Sent',
            actionCode: 'KUDOS_SENT',
            performedById: fromId,
            performedByName: currentUser?.name,
            targetEmployeeId: toId,
            targetEmployeeName: users.find(u => u.id === toId)?.name,
            description: `Sent Kudo: ${badge} "${message}"`,
            referenceId: newKudo.id
        });
    }, [currentUser, users, addNotification, logActivity]);

    // ---- OKRs ----
    const updateOKRProgress = useCallback(async (okrId, krId, newValue) => {
        let okrFound = null;
        let krFound = null;
        setOkrs(prev => prev.map(okr => {
            if (okr.id !== okrId) return okr;
            okrFound = okr;
            const newKRs = okr.keyResults.map(kr => {
                if (kr.id === krId) {
                    krFound = kr;
                    return { ...kr, current: newValue };
                }
                return kr;
            });
            const overallProgress = Math.round(newKRs.reduce((sum, kr) => sum + (kr.current / kr.target * 100), 0) / newKRs.length);
            
            return { ...okr, keyResults: newKRs, overallProgress };
        }));

        if (okrFound && krFound) {
            // Update in Supabase
            const updatedKRs = okrFound.keyResults.map(kr => kr.id === krId ? { ...kr, current: newValue } : kr);
            const newProgress = Math.round(updatedKRs.reduce((sum, kr) => sum + (kr.current / kr.target * 100), 0) / updatedKRs.length);
            
            await supabase.from('okrs').update({ key_results: updatedKRs, overall_progress: newProgress }).eq('id', okrId);

            logActivity({
                module: 'Employee',
                action: 'OKR Progress Updated',
                performedById: currentUser?.id,
                description: `Updated progress for "${krFound.title}"`,
                previousValue: `${krFound.current}/${krFound.target}`,
                newValue: `${newValue}/${krFound.target}`,
                referenceId: okrId
            });
        }
    }, [currentUser, logActivity]);

    const downloadPDF = useCallback((filename, type) => {
        if (typeof window !== 'undefined') {
            window.print();
            addAuditEntry(currentUser?.id, 'PDF_DOWNLOAD', type, `Triggered print for ${filename}`);
            logActivity({
                module: 'System',
                action: 'PDF Exported',
                actionCode: 'PDF_EXPORT',
                performedById: currentUser?.id,
                performedByName: currentUser?.name,
                description: `Exported/Printed ${filename} (${type})`,
                referenceId: type
            });
        }
    }, [currentUser, addAuditEntry, logActivity]);

    const value = {
        // State
        currentUser, users, customRoles, securityConfig,
        users, customRoles, securityConfig,
        leaveRequests, leaveBalances, attendance, regularizations,
        payroll, okrs, feedback, loans, salaryUpgrades,
        notifications, kudos, auditLog, interviews, activityHistory, isInitialized,

        // Auth
        login, logout, signUp, currentUser,
        checkNetworkRestriction,
        PRODUCTION_MODE,

        // User Management
        createUser, updateUser, resetPassword,

        // Role Management
        createRole, updateRole, deleteRole,

        // Security
        updateSecurityConfig,

        // Leave
        applyLeave, approveLeave, rejectLeave,

        // Attendance
        requestRegularization, approveRegularization,
        setAttendance, hrCorrectAttendance,

        // Interviews
        createInterview, updateInterviewAssessment, setInterviews,

        // Loans
        applyLoan, approveLoan,

        // Salary
        approveSalaryUpgrade, setSalaryUpgrades,

        // Leave Balance
        adjustLeaveBalance,

        // Notifications
        addNotification, markNotificationRead, markAllRead,

        // Kudos
        sendKudos,

        // OKRs
        updateOKRProgress,

        // Audit
        addAuditEntry, logActivity,

        // Feedback
        setFeedback,

        // Utils/Baseline
        downloadPDF, LEAVE_TYPES,
        PRODUCTION_MODE,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
