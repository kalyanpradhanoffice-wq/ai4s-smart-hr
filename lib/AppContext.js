'use client';
// ============================================================
// AI4S Smart HR — Global Application Context
// Manages auth state, RBAC data, and app-wide state
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    DEFAULT_ROLES, DEFAULT_SECURITY_CONFIG,
    LEAVE_TYPES, getInitials,
} from './constants';
import { getDashboardRoute, isNetworkRestricted } from './rbac';
import { supabase } from './supabase';

const AppContext = createContext(null);
export const PRODUCTION_MODE = true; // Toggle this to show/hide demo info

const formatTimeForUI = (ts) => {
    if (!ts) return null;
    if (typeof ts === 'string' && ts.includes('T')) {
        const d = new Date(ts);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return ts;
};

export const calculateAttendanceStatus = (punchIn, punchOut, userLeaves, date) => {
    // Check for approved leave/WFH first
    if (userLeaves && userLeaves.length > 0) {
        const todayLeave = userLeaves.find(l => {
            const start = l.from_date || l.from;
            const end = l.to_date || l.to;
            return date >= start && date <= end && l.status === 'approved';
        });
        if (todayLeave) {
            return todayLeave.type === 'WFH' ? 'wfh' : 'leave';
        }
    }

    if (!punchIn || !punchOut) return 'absent';

    const parseTime = (t) => {
        if (!t) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    const inMin = parseTime(punchIn);
    const outMin = parseTime(punchOut);
    const targetIn = 10 * 60; // 10:00 AM
    const targetOut = 19 * 60; // 07:00 PM

    // Full day: In by 10 AM AND Out after 7 PM
    if (inMin <= targetIn && outMin >= targetOut) return 'present';
    
    // Half-day: Total working time >= 4.5 hours (270 minutes)
    const duration = outMin - inMin;
    if (duration >= 4.5 * 60) return 'half-day';

    return 'absent'; // Too little working time or missing punch
};

export function AppProvider({ children }) {
    // Initial state (mostly empty, populated from Supabase)
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [customRoles, setCustomRoles] = useState([]);
    const [securityConfig, setSecurityConfig] = useState(DEFAULT_SECURITY_CONFIG);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [leaveBalances, setLeaveBalances] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [regularizations, setRegularizations] = useState([]);
    const [payroll, setPayroll] = useState([]);
    const [okrs, setOkrs] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loans, setLoans] = useState([]);
    const [salaryUpgrades, setSalaryUpgrades] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [kudos, setKudos] = useState([]);
    const [auditLog, setAuditLog] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [activityHistory, setActivityHistory] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [isInitialized, setIsInitialized] = useState(false);

    const addToast = useCallback((message, type = 'info', icon = null) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, icon }]);
        setTimeout(() => removeToast(id), 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

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
                    const normalized = {
                        ...profile,
                        id: profile.id,
                        employeeId: profile.id, // THE UNIVERSAL UUID
                        displayId: profile.employee_id || profile.id, // THE HUMAN READABLE ID
                        joinDate: profile.join_date,
                        managerId: profile.manager_id,
                        reportingTo: profile.manager_id,
                        functionalManagerId: profile.functional_manager_id,
                        department: profile.department,
                        avatar: getInitials(profile.name),
                        avatarColor: profile.avatar_color,
                        salary: {
                            basic: Number(profile.salary_basic) || 0,
                            hra: Number(profile.salary_hra) || 0,
                            allowances: (Number(profile.salary_basic) || 0) * 0.2,
                            gross: (Number(profile.salary_basic) || 0) + (Number(profile.salary_hra) || 0) + ((Number(profile.salary_basic) || 0) * 0.2)
                        }
                    };
                    setCurrentUser(normalized);
                    // Fetch all other data once authenticated
                    fetchAllData(session.user.id);
                }
            } else {
                setCurrentUser(null);
            }
            setIsInitialized(true);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Periodic refresh for Admins/Managers to see real-time updates
    useEffect(() => {
        if (!currentUser) return;

        const pollInterval = setInterval(() => {
            fetchAllData(currentUser.id);
        }, 30000);

        return () => clearInterval(pollInterval);
    }, [currentUser]);

    // Helper to fetch all data from Supabase
    const fetchAllData = async (userId) => {
        try {
            console.log('Fetching all application data from Supabase...');
            
            // Parallel fetch for better performance
            const [
                { data: profiles },
                { data: leaves },
                { data: attData },
                { data: okrData },
                { data: history },
                { data: payrollData },
                { data: balances },
                { data: regs },
                { data: loanData },
                { data: notifs },
                { data: kudoData },
                { data: feedbackData },
                { data: suData },
                { data: interviewData },
                { data: roles },
                { data: secConfig }
            ] = await Promise.all([
                supabase.from('profiles').select('*').order('name', { ascending: true }),
                supabase.from('leaves').select('*').order('applied_on', { ascending: false }),
                supabase.from('attendance').select('*').order('date', { ascending: false }),
                supabase.from('okrs').select('*'),
                supabase.from('activity_history').select('*').order('timestamp', { ascending: false }).limit(500),
                supabase.from('payroll').select('*'),
                supabase.from('leave_balances').select('*'),
                supabase.from('regularizations').select('*'),
                supabase.from('loans').select('*'),
                supabase.from('notifications').select('*').order('created_at', { ascending: false }),
                supabase.from('kudos').select('*'),
                supabase.from('feedback').select('*'),
                supabase.from('salary_upgrades').select('*'),
                supabase.from('interviews').select('*'),
                supabase.from('custom_roles').select('*'),
                supabase.from('security_config').select('*').eq('id', 'system_config').single()
            ]);

            if (profiles) {
                setUsers(profiles.map(p => ({
                    ...p,
                    id: p.id,
                    employeeId: p.id, // THE UNIVERSAL UUID
                    displayId: p.employee_id || p.id, // THE HUMAN READABLE ID
                    joinDate: p.join_date,
                    managerId: p.manager_id,
                    reportingTo: p.manager_id,
                    functionalManagerId: p.functional_manager_id,
                    department: p.department,
                    avatar: getInitials(p.name),
                    avatarColor: p.avatar_color,
                    salary: {
                        basic: Number(p.salary_basic) || 0,
                        hra: Number(p.salary_hra) || 0,
                        allowances: (Number(p.salary_basic) || 0) * 0.2,
                        gross: (Number(p.salary_basic) || 0) + (Number(p.salary_hra) || 0) + ((Number(p.salary_basic) || 0) * 0.2)
                    }
                })));
            }
            if (leaves) {
                setLeaveRequests(leaves.map(l => ({
                    ...l,
                    employeeId: l.employee_id, // SHOULD BE UUID
                    from: l.from_date,
                    to: l.to_date,
                    appliedOn: l.applied_on
                })));
            }
            if (attData) {
                setAttendance(attData.map(a => ({ 
                    ...a, 
                    userId: a.user_id || a.employee_id, // SHOULD BE UUID
                    punchIn: formatTimeForUI(a.punch_in || a.clock_in),
                    punchOut: formatTimeForUI(a.punch_out || a.clock_out),
                    halfDayType: a.half_day_type,
                    hrCorrected: a.hr_corrected
                })));
            }
            if (okrData) setOkrs(okrData);
            if (history) {
                setActivityHistory(history.map(h => ({
                    ...h,
                    actionCode: h.action_code,
                    performedById: h.performed_by_id,
                    performedByName: h.performed_by_name,
                    targetEmployeeId: h.target_employee_id,
                    targetEmployeeName: h.target_employee_name,
                    previousValue: h.previous_value,
                    newValue: h.new_value,
                    referenceId: h.reference_id
                })));
            }
            if (payrollData) setPayroll(payrollData.map(p => ({
                ...p,
                userId: p.employee_id,
                grossSalary: Number(p.gross_salary),
                netPay: Number(p.net_pay),
                paidOn: p.processed_on,
            })));
            if (balances) {
                setLeaveBalances(balances.map(b => ({
                    ...b,
                    userId: b.user_id,
                    // Provide both lower and uppercase for compatibility
                    cl: b.cl, CL: b.cl,
                    el: b.el, EL: b.el,
                    sl: b.sl, SL: b.sl,
                    ml: b.ml, ML: b.ml,
                    pl: b.pl, PL: b.pl,
                    lop: b.lop || 0, LOP: b.lop || 0,
                    od: b.od || 0, OD: b.od || 0,
                    wfh: b.wfh || 0, WFH: b.wfh || 0
                })));
            }
            if (regs) {
                setRegularizations(regs.map(r => ({ 
                    ...r, 
                    employeeId: r.employee_id,
                    correctionType: r.correction_type 
                })));
            }
            if (loanData) setLoans(loanData.map(l => ({ 
                ...l, 
                employeeId: l.employee_id,
                currentLevel: l.current_level,
                requestedOn: l.requested_on
            })));
            if (notifs) setNotifications(notifs.map(n => ({ ...n, userId: n.user_id, createdAt: n.created_at })));
            if (kudoData) setKudos(kudoData.map(k => ({ ...k, fromId: k.from_id, toId: k.to_id, createdAt: k.created_at })));
            if (feedbackData) setFeedback(feedbackData.map(f => ({ ...f, fromId: f.from_id, toId: f.to_id, createdAt: f.created_at })));
            if (suData) setSalaryUpgrades(suData.map(s => ({ ...s, employeeId: s.employee_id, proposedSalary: Number(s.proposed_salary) })));
            if (interviewData) setInterviews(interviewData.map(i => ({ ...i, interviewerId: i.interviewer_id, candidateName: i.candidate_name, appliedPosition: i.applied_position, interviewDate: i.interview_date, interviewTime: i.interview_time })));
            if (roles) setCustomRoles(roles);
            if (secConfig) setSecurityConfig(secConfig.config || DEFAULT_SECURITY_CONFIG);

            console.log('All data fetched successfully.');
        } catch (error) {
            console.error('Error fetching comprehensive data:', error);
        }
    };

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

        setActivityHistory(prev => [{
            ...histEntry,
            actionCode: histEntry.action_code,
            performedById: histEntry.performed_by_id,
            performedByName: histEntry.performed_by_name,
            targetEmployeeId: histEntry.target_employee_id,
            targetEmployeeName: histEntry.target_employee_name,
            previousValue: histEntry.previous_value,
            newValue: histEntry.new_value,
            referenceId: histEntry.reference_id
        }, ...prev.slice(0, 999)]);
        await supabase.from('activity_history').insert([histEntry]);
    }, [currentUser]);

    // ---- NOTIFICATIONS ----
    const addNotification = useCallback(async (userId, type, title, message, link = '/') => {
        const newNotif = { user_id: userId, type, title, message, read: false, link };
        const { data, error } = await supabase.from('notifications').insert([newNotif]).select();
        if (data) {
            setNotifications(prev => [{ ...data[0], userId: data[0].user_id, createdAt: data[0].created_at }, ...prev]);
        }
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

        if (profile.status === 'inactive') {
            await supabase.auth.signOut();
            return { success: false, error: 'Your account has been deactivated. Please contact the administrator.' };
        }

        const normalizedProfile = {
            ...profile,
            employeeId: profile.employee_id || profile.id,
            joinDate: profile.join_date,
            managerId: profile.manager_id,
            reportingTo: profile.manager_id,
            avatarColor: profile.avatar_color,
            salary: {
                basic: Number(profile.salary_basic) || 0,
                hra: Number(profile.salary_hra) || 0,
                allowances: (Number(profile.salary_basic) || 0) * 0.2,
                gross: (Number(profile.salary_basic) || 0) + (Number(profile.salary_hra) || 0) + ((Number(profile.salary_basic) || 0) * 0.2)
            }
        };

        setCurrentUser(normalizedProfile);
        addAuditEntry(profile.id, 'LOGIN', 'system', `User logged in from web`);
        logActivity({ module: 'Auth', action: 'User Login', actionCode: 'LOGIN', performedById: profile.id, performedByName: profile.name, targetEmployeeId: profile.id, targetEmployeeName: profile.name, description: `${profile.name} logged into the system`, newValue: 'active' });

        return { success: true, user: normalizedProfile, redirectTo: getDashboardRoute(normalizedProfile) };
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
    const createUser = useCallback(async (userData) => {
        try {
            const targetEmpId = userData.employeeId || `AI4S${String(users.length + 1).padStart(3, '0')}`;
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...userData,
                    employee_id: targetEmpId
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            // Fetch background for full sync
            fetchAllData();

            // PROACTIVE: Manually add to users list for instant UI feedback
            const newUser = {
                ...userData,
                id: result.user.id,
                employeeId: targetEmpId,
                status: 'active',
                avatar: userData.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??',
                avatarColor: userData.avatarColor || '#6366f1',
                functionalManagerId: userData.functionalManagerId,
                salary: {
                    basic: Number(userData.salaryBasic) || 0,
                    hra: Number(userData.salaryHra) || 0,
                    allowances: (Number(userData.salaryBasic) || 0) * 0.2,
                    gross: (Number(userData.salaryBasic) || 0) + (Number(userData.salaryHra) || 0) + ((Number(userData.salaryBasic) || 0) * 0.2)
                }
            };
            setUsers(prev => [newUser, ...prev]);

            return { 
                success: true, 
                user: result.user, 
                employee_id: targetEmpId 
            };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }, [users, fetchAllData]);

    const updateUser = useCallback(async (userId, updates) => {
        try {
            // Map camelCase to snake_case for DB
            const dbUpdates = { ...updates };
            // Convert empty strings to null for DB safety
            Object.keys(dbUpdates).forEach(key => {
                if (dbUpdates[key] === '') dbUpdates[key] = null;
            });

            if (updates.employeeId) dbUpdates.employee_id = updates.employeeId;
            if (updates.joinDate) dbUpdates.join_date = updates.joinDate;
            if (updates.hasOwnProperty('managerId')) dbUpdates.manager_id = updates.managerId || null;
            if (updates.hasOwnProperty('functionalManagerId')) dbUpdates.functional_manager_id = updates.functionalManagerId || null;
            if (updates.avatarColor) dbUpdates.avatar_color = updates.avatarColor;
            
            // Handle nested salary object
            if (updates.salary) {
                dbUpdates.salary_basic = Number(updates.salary.basic) || 0;
                dbUpdates.salary_hra = Number(updates.salary.hra) || 0;
                delete dbUpdates.salary;
            }

            // Clean up camelCase keys that have snake_case equivalents
            delete dbUpdates.employeeId;
            delete dbUpdates.joinDate;
            delete dbUpdates.managerId;
            delete dbUpdates.functionalManagerId;
            delete dbUpdates.avatarColor;

            const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userId);
            if (error) throw error;
            await fetchAllData();
            return { success: true };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }, [fetchAllData]);

    const deactivateUser = useCallback(async (userId) => {
        return await updateUser(userId, { status: 'inactive' });
    }, [updateUser]);

    const activateUser = useCallback(async (userId) => {
        return await updateUser(userId, { status: 'active' });
    }, [updateUser]);

    const updateOffboardingClearance = useCallback(async (userId, clearanceStatus) => {
        const { error } = await supabase.from('profiles').update({ offboarding_status: clearanceStatus }).eq('id', userId);
        if (!error) await fetchAllData();
    }, [fetchAllData]);

    const deleteUser = useCallback(async (userId) => {
        try {
            const response = await fetch('/api/admin/delete-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error);
            }

            await fetchAllData();
            return { success: true };
        } catch (error) {
            console.error('Error deleting user:', error);
            return { success: false, error: error.message };
        }
    }, [fetchAllData]);

    const resetPassword = useCallback(async (userId, newPassword) => {
        try {
            const response = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newPassword })
            });

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.error);
            }

            return { success: true };
        } catch (error) {
            console.error('Error resetting password:', error);
            return { success: false, error: error.message };
        }
    }, []);

    // ---- ROLE MANAGEMENT ----
    const createRole = useCallback(async (roleData) => {
        const newRole = { ...roleData, id: `role_${Date.now()}`, is_system_role: false };
        const { error } = await supabase.from('custom_roles').insert([newRole]);
        if (!error) {
            await fetchAllData();
            return newRole;
        }
    }, [fetchAllData]);

    const updateRole = useCallback(async (roleId, updates) => {
        const { error } = await supabase.from('custom_roles').update(updates).eq('id', roleId);
        if (!error) await fetchAllData();
    }, [fetchAllData]);

    const deleteRole = useCallback(async (roleId) => {
        const { error } = await supabase.from('custom_roles').delete().eq('id', roleId);
        if (!error) await fetchAllData();
    }, [fetchAllData]);

    // ---- SECURITY CONFIG ----
    const updateSecurityConfig = useCallback(async (updates) => {
        const newConfig = { ...securityConfig, ...updates };
        const { error } = await supabase.from('security_config').upsert({ id: 'system_config', config: newConfig });
        if (!error) await fetchAllData();
    }, [securityConfig, fetchAllData]);


    // ---- LEAVE MANAGEMENT ----
    const adjustLeaveBalance = useCallback(async (userId, leaveType, delta, reason) => {
        const typeKey = leaveType.toLowerCase();
        
        // 1. Fetch current balance
        const { data: current } = await supabase.from('leave_balances').select().eq('user_id', userId).single();
        
        let success = false;
        let newVal = delta;

        if (current) {
            newVal = Math.max(0, (current[typeKey] || 0) + delta);
            const { error } = await supabase.from('leave_balances')
                .update({ [typeKey]: newVal, last_updated: new Date().toISOString() })
                .eq('user_id', userId);
            if (!error) success = true;
        } else {
            // If no balance record exists, start from the default maxPerYear
            const defaultMax = LEAVE_TYPES.find(lt => lt.id.toLowerCase() === typeKey)?.maxPerYear || 0;
            newVal = Math.max(0, defaultMax + delta);
            const { error } = await supabase.from('leave_balances')
                .insert([{ user_id: userId, [typeKey]: newVal, last_updated: new Date().toISOString() }]);
            if (!error) success = true;
        }

        if (success) {
            await fetchAllData();
            const empName = users.find(u => u.id === userId)?.name || userId;
            addAuditEntry(currentUser?.id, 'LEAVE_BALANCE_ADJUSTED', userId, `Adjusted ${leaveType} balance by ${delta}. Reason: ${reason}`);
            logActivity({
                module: 'Leave',
                action: 'Balance Adjusted',
                actionCode: 'LEAVE_BALANCE_ADJUSTED',
                performedById: currentUser?.id,
                targetEmployeeId: userId,
                targetEmployeeName: empName,
                description: `Manually adjusted ${leaveType} balance by ${delta} days. Reason: ${reason}`,
                newValue: `${newVal}`
            });
        }
    }, [users, currentUser, addAuditEntry, logActivity, fetchAllData]);

    const applyLeave = useCallback(async (leaveData) => {
        const lt = LEAVE_TYPES.find(t => t.id === leaveData.type || t.id.toLowerCase() === leaveData.type.toLowerCase());
        if (lt?.applicableGender && lt.applicableGender !== currentUser?.gender) {
            addToast(`This leave type is only applicable for ${lt.applicableGender} employees`, 'error');
            return null;
        }

        try {
            // Check for overlapping leaves
            const hasOverlap = leaveRequests.some(l => {
                const isEmployee = l.employee_id === currentUser.id;
                const isNotRejected = l.status !== 'rejected';
                if (!isEmployee || !isNotRejected) return false;

                const lStart = l.from_date || l.from;
                const lEnd = l.to_date || l.to;
                const nStart = leaveData.from;
                const nEnd = leaveData.to;

                const overlaps = (nStart <= lEnd && nEnd >= lStart);
                if (overlaps) console.log('Overlap detected with:', l);
                return overlaps;
            });

            if (hasOverlap) {
                addToast('You already have a leave request for these dates', 'warning', '⚠️');
                return null;
            }

            const leaveId = crypto.randomUUID();
            const { data, error } = await supabase.from('leaves').insert([{
                id: leaveId,
                employee_id: currentUser.id,
                type: leaveData.type,
                from_date: leaveData.from,
                to_date: leaveData.to,
                days: leaveData.days,
                reason: leaveData.reason,
                status: 'pending',
                current_level: 1,
                level1_approver_id: currentUser.managerId || currentUser.reportingTo,
                level2_approver_id: currentUser.functionalManagerId || null,
                approvals: []
            }]).select();

            if (error) throw error;

            if (data && data[0]) {
                const newLeave = {
                    ...data[0],
                    employeeId: data[0].employee_id,
                    from: data[0].from_date,
                    to: data[0].to_date,
                    appliedOn: data[0].applied_on
                };
                setLeaveRequests(prev => [newLeave, ...prev]);
                addNotification(leaveData.approverId, 'leave', 'New Leave Request', `${currentUser?.name} applied for ${leaveData.type} leave`);
                logActivity({ module: 'Leave', action: 'Leave Applied', actionCode: 'LEAVE_APPLIED', performedById: currentUser?.id, targetEmployeeId: currentUser?.id, description: `${newLeave.type} leave applied from ${newLeave.from} to ${newLeave.to}`, referenceId: newLeave.id });
                addToast('Leave request submitted successfully', 'success');
                return newLeave;
            }
        } catch (error) {
            console.error('Error applying leave:', error);
            addToast(error.message || 'Failed to submit leave request', 'error');
            return null;
        }
    }, [currentUser, leaveRequests, addNotification, logActivity, addToast]);

    const approveLeave = useCallback(async (leaveId, approverId, comments, nextLevel, totalLevels) => {
        try {
            const lr = leaveRequests.find(l => l.id === leaveId);
            if (!lr) return;

            const fullyApproved = lr.current_level >= totalLevels;
            const newApproval = { level: lr.current_level, approvedBy: approverId, approvedOn: new Date().toISOString(), status: 'approved', comments };
            const newApprovals = [...(lr.approvals || []), newApproval];

            const { data, error } = await supabase.from('leaves').update({
                status: fullyApproved ? 'approved' : 'pending',
                current_level: fullyApproved ? lr.current_level : lr.current_level + 1,
                approvals: newApprovals
            }).eq('id', leaveId).select();

            if (error) throw error;

            if (data) {
                setLeaveRequests(prev => prev.map(item => item.id === leaveId ? data[0] : item));
                
                if (fullyApproved) {
                    const start = new Date(lr.from_date);
                    const end = new Date(lr.to_date);
                    const statusType = lr.type === 'WFH' ? 'wfh' : 'leave';
                    
                    const attendancePromises = [];
                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        const dateStr = d.toISOString().split('T')[0];
                        attendancePromises.push(
                            supabase.from('attendance').upsert({
                                user_id: lr.employee_id,
                                date: dateStr,
                                status: statusType,
                                location: lr.type === 'WFH' ? 'remote' : 'office'
                            }, { onConflict: 'user_id,date' })
                        );
                    }
                    await Promise.all(attendancePromises);

                    // --- NEW: Deduct from leave balance ---
                    const paidLeaveTypes = ['CL', 'EL', 'SL', 'ML', 'PL'];
                    if (paidLeaveTypes.includes(lr.type.toUpperCase())) {
                        await adjustLeaveBalance(lr.employee_id, lr.type, -lr.days, `Approved ${lr.type} leave: ${lr.from_date} to ${lr.to_date}`);
                    }
                    // --- END NEW ---

                    const { data: att } = await supabase.from('attendance').select('*');
                    if (att) setAttendance(att.map(a => ({ 
                        ...a, 
                        userId: a.user_id || a.employee_id,
                        punchIn: formatTimeForUI(a.punch_in || a.clock_in),
                        punchOut: formatTimeForUI(a.punch_out || a.clock_out),
                        halfDayType: a.half_day_type,
                        hrCorrected: a.hr_corrected
                    })));
                }

                const emp = users.find(u => u.id === lr.employee_id);
                addNotification(lr.employee_id, 'approval', 'Leave Approved', `Your ${lr.type} request has been approved`);
                logActivity({ 
                    module: 'Leave', 
                    action: 'Leave Approved', 
                    actionCode: 'LEAVE_APPROVED', 
                    performedById: approverId, 
                    performedByName: users.find(u => u.id === approverId)?.name,
                    targetEmployeeId: lr.employee_id, 
                    targetEmployeeName: emp?.name,
                    description: `${lr.type} approved for ${lr.from_date} to ${lr.to_date}`, 
                    referenceId: leaveId 
                });
                addToast(`Leave request ${fullyApproved ? 'fully approved' : 'approved (Level ' + lr.current_level + ')'}`, 'success');
            }
        } catch (error) {
            console.error('Approve Leave Error:', error);
            addToast(error.message || 'Failed to approve leave', 'error');
        }
    }, [leaveRequests, attendance, adjustLeaveBalance, addNotification, logActivity, addToast]);

    const rejectLeave = useCallback(async (leaveId, approverId, comments) => {
        const lr = leaveRequests.find(l => l.id === leaveId);
        if (!lr) return;

        const newApproval = { level: lr.current_level, approvedBy: approverId, approvedOn: new Date().toISOString(), status: 'rejected', comments };
        const newApprovals = [...(lr.approvals || []), newApproval];

        const { data, error } = await supabase.from('leaves').update({
            status: 'rejected',
            approvals: newApprovals
        }).eq('id', leaveId).select();

        if (data) {
            setLeaveRequests(prev => prev.map(item => item.id === leaveId ? data[0] : item));
            const emp = users.find(u => u.id === lr.employee_id);
            addNotification(lr.employee_id, 'approval', 'Leave Rejected', 'Your leave request has been rejected');
            logActivity({ 
                module: 'Leave', 
                action: 'Leave Rejected', 
                actionCode: 'LEAVE_REJECTED', 
                performedById: approverId, 
                performedByName: users.find(u => u.id === approverId)?.name,
                targetEmployeeId: lr.employee_id, 
                targetEmployeeName: emp?.name,
                description: `${lr.type} leave rejected`, 
                referenceId: leaveId 
            });
        }
    }, [leaveRequests, addNotification, logActivity]);
    // ---- ATTENDANCE ----
    const markAttendance = useCallback(async (userId, date, type, time, location, photoCaptured = false) => {
        const executeUpsert = async (useModern = true, withLocation = true, useIsoTime = false) => {
            const existing = attendance.find(a => a.userId === userId && a.date === date);
            const userLeaves = leaveRequests.filter(l => l.employee_id === userId);
            
            let currentIn = existing?.punchIn || existing?.clock_in;
            let currentOut = existing?.punchOut || existing?.clock_out;
            
            if (type === 'in') currentIn = time;
            if (type === 'out') currentOut = time;

            const computedStatus = calculateAttendanceStatus(currentIn, currentOut, userLeaves, date);

            const payload = {
                user_id: userId,
                date: date,
                status: computedStatus,
                photo_captured: photoCaptured
            };

            let timeVal = time;
            if (useIsoTime && time) {
                try {
                    // Combine date and time to create a valid ISO string
                    timeVal = new Date(`${date}T${time}:00`).toISOString();
                } catch (e) { console.error('ISO conversion failed', e); }
            }

            if (useModern) {
                if (type === 'in') payload.punch_in = timeVal;
                if (type === 'out') payload.punch_out = timeVal;
            } else {
                if (type === 'in') payload.clock_in = timeVal;
                if (type === 'out') payload.clock_out = timeVal;
            }
            if (withLocation && location) payload.location = location;

            const { data, error } = await supabase.from('attendance').upsert(payload, { onConflict: 'user_id,date' }).select();

            if (error) {
                // Dimension 1: Type Mismatch (TIMESTAMPTZ)
                if (error.message.includes('timestamp') && !useIsoTime) {
                    return executeUpsert(useModern, withLocation, true);
                }
                // Dimension 2: Missing Location
                if (withLocation && error.message.includes('location')) {
                    return executeUpsert(useModern, false, useIsoTime);
                }
                // Dimension 3: Missing Modern Columns
                if (useModern && (error.message.includes('punch_in') || error.message.includes('punch_out'))) {
                    return executeUpsert(false, withLocation, useIsoTime);
                }
            }
            return { data, error };
        };

        const existing = attendance.find(a => a.userId === userId && a.date === date);
        if (type === 'in' && existing) return; // Already in
        if (type === 'out' && (!existing || existing.punchOut)) return; // Already out or no in

        if (type === 'in' || type === 'out') {
            const { data, error } = await executeUpsert(true, true, false);
            if (error) {
                console.error('Attendance Error:', error);
                addToast(error.message || 'Attendance Action Failed', 'error', '❌');
            } else if (data) {
                setAttendance(prev => {
                    const filtered = prev.filter(a => !(a.userId === userId && a.date === date));
                    const normalized = {
                        ...data[0],
                        userId: data[0].user_id,
                        punchIn: formatTimeForUI(data[0].punch_in || data[0].clock_in),
                        punchOut: formatTimeForUI(data[0].punch_out || data[0].clock_out)
                    };
                    return [...filtered, normalized];
                });
                const timeStr = formatTimeForUI(time);
                const emp = users.find(u => u.id === userId);
                logActivity({ 
                    module: 'Attendance', 
                    action: type === 'in' ? 'Punch In' : 'Punch Out', 
                    performedById: userId, 
                    performedByName: emp?.name,
                    targetEmployeeId: userId,
                    targetEmployeeName: emp?.name,
                    previousValue: type === 'in' ? 'None' : 'In',
                    newValue: type === 'in' ? 'In' : 'Out',
                    description: `${type === 'in' ? 'Punched in' : 'Punched out'} at ${timeStr} from ${location || 'office'}` 
                });
                addToast(`${type === 'in' ? 'Punched in' : 'Punched out'} successfully at ${timeStr}`, 'success', '🕒');
            }
        }
    }, [attendance, logActivity]);

    // ---- ATTENDANCE REGULARIZATION ----
    const requestRegularization = useCallback(async (regData) => {
        try {
            const regId = crypto.randomUUID();
            const { data, error } = await supabase.from('regularizations').insert([{
                id: regId,
                employee_id: regData.employeeId,
                date: regData.date,
                correction_type: regData.correctionType,
                reason: regData.reason,
                status: 'pending',
                current_level: 1,
                level1_approver_id: currentUser.managerId || currentUser.reportingTo,
                level2_approver_id: currentUser.functionalManagerId || null
            }]).select();

            if (error) throw error;

            if (data && data[0]) {
                const newReg = { 
                    ...data[0], 
                    employeeId: data[0].employee_id,
                    correctionType: data[0].correction_type 
                };
                setRegularizations(prev => [...prev, newReg]);
                const emp = users.find(u => u.id === regData.employeeId);
                logActivity({ 
                    module: 'Attendance', 
                    action: 'Regularization Requested', 
                    performedById: regData.employeeId, 
                    performedByName: emp?.name,
                    targetEmployeeId: regData.employeeId,
                    targetEmployeeName: emp?.name,
                    previousValue: 'Existing',
                    newValue: 'Pending',
                    description: `Attendance regularization requested for ${regData.date}`, 
                    referenceId: newReg.id 
                });
                addToast('Regularization request submitted', 'success', '📝');
                return newReg;
            }
        } catch (error) {
            console.error('Regularization Error:', error);
            addToast(error.message || 'Failed to submit regularization request', 'error', '❌');
            return null;
        }
    }, [logActivity, addToast]);

    const approveRegularization = useCallback(async (regId, approverId, comments, level, totalLevels) => {
        try {
            const reg = regularizations.find(r => r.id === regId);
            if (!reg) return;

            const fullyApproved = level >= totalLevels;
            const newApproval = { level, approvedBy: approverId, approvedOn: new Date().toISOString(), status: 'approved', comments };
            const newApprovals = [...(reg.approvals || []), newApproval];

            const { data: updatedReg, error } = await supabase.from('regularizations').update({ 
                status: fullyApproved ? 'approved' : 'pending',
                current_level: fullyApproved ? level : level + 1,
                approver_id: approverId, // Backwards compatibility
                approvals: newApprovals,
                comments 
            }).eq('id', regId).select();
            
            if (error) throw error;

            if (updatedReg) {
                setRegularizations(prev => prev.map(r => r.id === regId ? { ...updatedReg[0], employeeId: updatedReg[0].employee_id, correctionType: updatedReg[0].correction_type } : r));
                
                if (fullyApproved) {
                    const existingAtt = attendance.find(a => (a.userId || a.employeeId) === reg.employeeId && a.date === reg.date);
                    if (existingAtt) {
                        await supabase.from('attendance').update({ status: 'present', regularized: true }).eq('id', existingAtt.id);
                    } else {
                        await supabase.from('attendance').insert([{ user_id: reg.employeeId, date: reg.date, status: 'present', regularized: true, location: 'office' }]);
                    }
                    const { data: allAtt } = await supabase.from('attendance').select('*');
                    if (allAtt) setAttendance(allAtt.map(a => ({ 
                        ...a, 
                        userId: a.user_id || a.employee_id,
                        punchIn: formatTimeForUI(a.punch_in || a.clock_in),
                        punchOut: formatTimeForUI(a.punch_out || a.clock_out),
                        halfDayType: a.half_day_type,
                        hrCorrected: a.hr_corrected
                    })));
                }

                addNotification(reg.employeeId, 'approval', 'Regularization Update', `Attendance for ${reg.date} has been ${fullyApproved ? 'fully regularized' : 'approved at Level ' + level}`);
                const emp = users.find(u => u.id === reg.employeeId);
                logActivity({ 
                    module: 'Attendance', 
                    action: 'Regularization Approved', 
                    actionCode: 'ATTENDANCE_REGULARIZATION_APPROVED',
                    performedById: approverId, 
                    performedByName: users.find(u => u.id === approverId)?.name,
                    targetEmployeeId: reg.employeeId, 
                    targetEmployeeName: emp?.name,
                    description: `Regularization for ${reg.date} approved`, 
                    previousValue: 'Pending',
                    newValue: 'Present',
                    referenceId: regId 
                });
                addToast(`Regularization for ${reg.date} approved`, 'success', '✅');
            }
        } catch (error) {
            console.error('Approve Regularization Error:', error);
            addToast(error.message || 'Failed to approve regularization', 'error', '❌');
        }
    }, [regularizations, addNotification, logActivity, addToast]);

    const rejectRegularization = useCallback(async (regId, approverId, comments) => {
        const reg = regularizations.find(r => r.id === regId);
        if (!reg) return;

        const { data: updatedReg } = await supabase.from('regularizations').update({ status: 'rejected', approver_id: approverId, comments }).eq('id', regId).select();
        
        if (updatedReg) {
            setRegularizations(prev => prev.map(r => r.id === regId ? { ...updatedReg[0], employeeId: updatedReg[0].employee_id } : r));
            addNotification(reg.employeeId, 'approval', 'Regularization Rejected', `Attendance regularization for ${reg.date} has been rejected`);
            const emp = users.find(u => u.id === reg.employeeId);
            logActivity({ 
                module: 'Attendance', 
                action: 'Regularization Rejected', 
                actionCode: 'ATTENDANCE_REGULARIZATION_REJECTED',
                performedById: approverId, 
                performedByName: users.find(u => u.id === approverId)?.name,
                targetEmployeeId: reg.employee_id, 
                targetEmployeeName: emp?.name,
                description: `Regularization for ${reg.date} rejected`, 
                previousValue: 'Pending',
                newValue: 'Rejected',
                referenceId: regId 
            });
        }
    }, [regularizations, addNotification, logActivity]);
    // ---- INTERVIEW SCHEDULING ----
    const createInterview = useCallback(async (interviewData) => {
        try {
            const { data, error } = await supabase.from('interviews').insert([{
                candidate_name: interviewData.candidateName,
                applied_position: interviewData.appliedPosition,
                interviewer_id: interviewData.interviewerId,
                interview_date: interviewData.interviewDate,
                interview_time: interviewData.interviewTime || '10:00 AM',
                status: 'scheduled'
            }]).select();

            if (error) throw error;

            if (data && data[0]) {
                const newInt = { ...data[0], interviewerId: data[0].interviewer_id, candidateName: data[0].candidate_name, appliedPosition: data[0].applied_position, interviewDate: data[0].interview_date };
                setInterviews(prev => [...prev, newInt]);
                if (interviewData.interviewerId) {
                    addNotification(interviewData.interviewerId, 'system', 'Interview Assigned', `Assigned: ${newInt.candidateName} on ${newInt.interviewDate}`, '/dashboard/interviews');
                }
                addAuditEntry(currentUser?.id, 'INTERVIEW_SCHEDULED', newInt.id, `Scheduled interview for ${interviewData.candidateName}`);
                logActivity({ module: 'Interview', action: 'Interview Scheduled', actionCode: 'INTERVIEW_SCHEDULED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeName: `${newInt.candidateName} (Candidate)`, description: `Interview scheduled for ${newInt.appliedPosition} on ${newInt.interviewDate}`, newValue: 'Scheduled', referenceId: newInt.id });
                addToast('Interview scheduled successfully', 'success', '📅');
                return newInt;
            }
        } catch (error) {
            console.error('Interview Error:', error);
            addToast(error.message || 'Failed to schedule interview', 'error', '❌');
            return null;
        }
    }, [currentUser, addNotification, addAuditEntry, logActivity, addToast]);

    const updateInterviewAssessment = useCallback(async (interviewId, assessment) => {
        const { data } = await supabase.from('interviews').update({ assessment, status: 'completed' }).eq('id', interviewId).select();
        if (data) {
            setInterviews(prev => prev.map(i => i.id === interviewId ? { ...data[0], interviewerId: data[0].interviewer_id, candidateName: data[0].candidate_name, appliedPosition: data[0].applied_position, interviewDate: data[0].interview_date } : i));
            const inv = interviews.find(i => i.id === interviewId);
            addAuditEntry(currentUser?.id, 'INTERVIEW_ASSESSED', interviewId, `Submitted assessment: ${assessment.recommendation}`);
            logActivity({ module: 'Interview', action: 'Assessment Submitted', actionCode: 'INTERVIEW_ASSESSED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeName: inv ? `${inv.candidateName} (Candidate)` : null, description: `Interview assessment submitted. Recommendation: ${assessment.recommendation}`, previousValue: 'Scheduled', newValue: assessment.recommendation, referenceId: interviewId });
        }
    }, [interviews, currentUser, addAuditEntry, logActivity]);

    // ---- HR ATTENDANCE CORRECTION ----
    const hrCorrectAttendance = useCallback(async (userId, date, updates) => {
        const { data, error } = await supabase.from('attendance').select('*').eq('user_id', userId).eq('date', date).single();
        if (data) {
            const { data: updated } = await supabase.from('attendance').update({ ...updates }).eq('id', data.id).select();
            if (updated) setAttendance(prev => prev.map(a => a.id === data.id ? { ...updated[0], userId: updated[0].user_id } : a));
        } else {
            const { data: inserted } = await supabase.from('attendance').insert([{ user_id: userId, date, ...updates, hrCorrected: true }]).select();
            if (inserted) setAttendance(prev => [...prev, { ...inserted[0], userId: inserted[0].user_id }]);
        }
        const emp = users.find(u => u.id === userId);
        addAuditEntry(currentUser?.id, 'ATTENDANCE_HR_CORRECTION', `${userId}:${date}`, `HR corrected attendance to ${updates.status}`);
        logActivity({
            module: 'Attendance',
            action: 'HR Correction',
            performedById: currentUser?.id,
            targetEmployeeId: userId,
            targetEmployeeName: emp?.name,
            description: `Manual attendance correction for ${date}`,
            previousValue: data?.status || 'None',
            newValue: updates.status,
            referenceId: `${userId}:${date}`
        });
    }, [currentUser, users, addAuditEntry, logActivity]);

    // ---- LOANS ----
    const applyLoan = useCallback(async (loanData) => {
        try {
            const loanId = crypto.randomUUID();
            const { data, error } = await supabase.from('loans').insert([{
                id: loanId,
                employee_id: loanData.employeeId,
                amount: loanData.amount,
                reason: loanData.reason,
                status: 'pending',
                current_level: 1,
                level1_approver_id: currentUser.managerId || currentUser.reportingTo,
                level2_approver_id: currentUser.functionalManagerId || null,
                approvals: []
            }]).select();

            if (error) throw error;

            if (data && data[0]) {
                const newLoan = { ...data[0], employeeId: data[0].employee_id };
                setLoans(prev => [...prev, newLoan]);
                logActivity({ module: 'Payroll', action: 'Loan Applied', performedById: loanData.employeeId, description: `Applied for loan: ₹${loanData.amount}`, referenceId: newLoan.id });
                addToast(`Loan application for ₹${loanData.amount.toLocaleString()} submitted`, 'success', '💰');
                return newLoan;
            }
        } catch (error) {
            console.error('Loan Error:', error);
            addToast(error.message || 'Failed to submit loan application', 'error', '❌');
            return null;
        }
    }, [logActivity, addToast]);

    const approveLoan = useCallback(async (loanId, approverId, comments, level, totalLevels) => {
        try {
            const loan = loans.find(l => l.id === loanId);
            if (!loan) return;

            const fullyApproved = level >= totalLevels;
            const newApproval = { level, approvedBy: approverId, approvedOn: new Date().toISOString(), status: 'approved', comments };
            const newApprovals = [...(loan.approvals || []), newApproval];

            const { data, error } = await supabase.from('loans').update({
                status: fullyApproved ? 'approved' : 'pending',
                current_level: fullyApproved ? level : level + 1,
                approvals: newApprovals
            }).eq('id', loanId).select();

            if (error) throw error;

            if (data && data[0]) {
                const updatedLoan = { ...data[0], employeeId: data[0].employee_id, currentLevel: data[0].current_level, requestedOn: data[0].requested_on };
                setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
                const emp = users.find(u => u.id === loan.employee_id);
                addNotification(loan.employee_id, 'approval', 'Loan Request Update', `Your loan request for ₹${loan.amount.toLocaleString()} has been ${fullyApproved ? 'fully approved' : 'approved at Level ' + level}`, '/dashboard/loans');
                logActivity({ 
                    module: 'Payroll', 
                    action: 'Loan Approved', 
                    actionCode: 'LOAN_APPROVED', 
                    performedById: approverId, 
                    performedByName: users.find(u => u.id === approverId)?.name,
                    targetEmployeeId: loan.employee_id, 
                    targetEmployeeName: emp?.name, 
                    description: `Loan for ₹${loan.amount.toLocaleString()} approved (Level ${level})`, 
                    previousValue: 'Pending', 
                    newValue: fullyApproved ? 'Approved' : 'Pending', 
                    referenceId: loanId 
                });
                addToast(`Loan ${fullyApproved ? 'fully approved' : 'approved (Level ' + level + ')'}`, 'success', '✅');
            }
        } catch (error) {
            console.error('Approve Loan Error:', error);
            addToast(error.message || 'Failed to approve loan', 'error', '❌');
        }
    }, [loans, users, addNotification, logActivity, addToast]);

    const rejectLoan = useCallback(async (loanId, approverId, comments) => {
        try {
            const loan = loans.find(l => l.id === loanId);
            if (!loan) return;

            const newApproval = { level: loan.current_level, approvedBy: approverId, approvedOn: new Date().toISOString(), status: 'rejected', comments };
            const newApprovals = [...(loan.approvals || []), newApproval];

            const { data, error } = await supabase.from('loans').update({
                status: 'rejected',
                approvals: newApprovals
            }).eq('id', loanId).select();

            if (error) throw error;

            if (data && data[0]) {
                const updatedLoan = { ...data[0], employeeId: data[0].employee_id, currentLevel: data[0].current_level, requestedOn: data[0].requested_on };
                setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
                const emp = users.find(u => u.id === loan.employee_id);
                addNotification(loan.employee_id, 'approval', 'Loan Request Rejected', `Your loan request for ₹${loan.amount.toLocaleString()} has been rejected`, '/dashboard/loans');
                logActivity({ 
                    module: 'Payroll', 
                    action: 'Loan Rejected', 
                    actionCode: 'LOAN_REJECTED', 
                    performedById: approverId, 
                    performedByName: users.find(u => u.id === approverId)?.name,
                    targetEmployeeId: loan.employee_id, 
                    targetEmployeeName: emp?.name, 
                    description: `Loan request for ₹${loan.amount.toLocaleString()} rejected`, 
                    previousValue: 'Pending', 
                    newValue: 'Rejected', 
                    referenceId: loanId 
                });
                addToast('Loan request rejected', 'warning', '✖️');
            }
        } catch (error) {
            console.error('Reject Loan Error:', error);
            addToast(error.message || 'Failed to reject loan', 'error', '❌');
        }
    }, [loans, users, addNotification, logActivity, addToast]);

    // ---- SALARY UPGRADES ----
    const approveSalaryUpgrade = useCallback(async (suId, approverId, comments, level, totalLevels) => {
        const su = salaryUpgrades.find(s => s.id === suId);
        if (!su) return;

        const isFullyApproved = level >= totalLevels;
        const approval = { level, approvedBy: approverId, approvedOn: new Date().toISOString(), comments };
        const newApprovals = [...(su.approvals || []), approval];

        const { data } = await supabase.from('salary_upgrades').update({
            status: isFullyApproved ? 'approved' : 'pending',
            current_level: isFullyApproved ? level : level + 1,
            approvals: newApprovals
        }).eq('id', suId).select();

        if (data) {
            setSalaryUpgrades(prev => prev.map(s => s.id === suId ? { 
                ...data[0], 
                employeeId: data[0].employee_id, 
                currentLevel: data[0].current_level,
                proposedSalary: Number(data[0].proposed_salary) 
            } : s));
            
            if (isFullyApproved) {
                // Update employee salary in profiles table
                await supabase.from('profiles').update({ salary_basic: su.proposedSalary }).eq('id', su.employeeId);
                await fetchAllData();
            }

            addAuditEntry(approverId, 'SALARY_UPGRADE_APPROVED', su.id, `Approved salary upgrade for ${su.employeeId}`);
            logActivity({
                module: 'Payroll',
                action: 'Salary Upgrade Approved',
                actionCode: 'SALARY_UPGRADE_APPROVED',
                performedById: approverId,
                performedByName: users.find(u => u.id === approverId)?.name,
                targetEmployeeId: su.employee_id,
                targetEmployeeName: users.find(u => u.id === su.employee_id)?.name,
                description: `Salary upgrade to ₹${su.proposedSalary.toLocaleString()} approved`,
                previousValue: 'Pending',
                newValue: 'Approved',
                referenceId: suId
            });
        }
    }, [salaryUpgrades, users, fetchAllData, addAuditEntry, logActivity]);

    const markNotificationRead = useCallback(async (notifId) => {
        const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notifId);
        if (!error) {
            setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
        }
    }, []);

    const markAllRead = useCallback(async (userId) => {
        const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
        if (!error) {
            setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, read: true } : n));
        }
    }, []);

    const processPayroll = useCallback(async (payrollData) => {
        const { data, error } = await supabase.from('payroll').insert(payrollData).select();
        if (data) {
            setPayroll(prev => [...data, ...prev]);
            return data;
        }
        return null;
    }, []);

    // ---- KUDOS ----
    const sendKudos = useCallback(async (fromId, toId, badge, message) => {
        try {
            const kudosId = crypto.randomUUID();
            const { data, error } = await supabase.from('kudos').insert([{
                id: kudosId,
                from_id: fromId,
                to_id: toId,
                badge,
                message
            }]).select();

            if (error) throw error;

            if (data && data[0]) {
                const newKudo = { ...data[0], fromId: data[0].from_id, toId: data[0].to_id, createdAt: data[0].created_at };
                setKudos(prev => [newKudo, ...prev]);
                addNotification(toId, 'kudos', 'You received a Kudos! 🎉', `${currentUser?.name} sent you a kudos: "${message}"`);
                logActivity({ module: 'Employee', action: 'Kudos Sent', performedById: fromId, targetEmployeeId: toId, description: `Sent Kudo: ${badge}`, referenceId: newKudo.id });
                addToast('Kudos sent! 🎉', 'success', '🏆');
            }
        } catch (error) {
            console.error('Kudos Error:', error);
            addToast(error.message || 'Failed to send kudos', 'error', '❌');
        }
    }, [currentUser, addNotification, logActivity, addToast]);

    // ---- FEEDBACK ----
    const submitFeedback = useCallback(async (fbData) => {
        try {
            const feedbackId = crypto.randomUUID();
            const { data, error } = await supabase.from('feedback').insert([{
                id: feedbackId,
                from_id: fbData.reviewerId,
                to_id: fbData.revieweeId,
                ratings: fbData.ratings,
                message: fbData.comments, // Schema has 'message', code was sending 'comments'
                created_at: fbData.submittedOn,
            }]).select();

            if (error) throw error;

            if (data && data[0]) {
                const newFB = { ...data[0], fromId: data[0].from_id, toId: data[0].to_id, ratings: data[0].ratings, comments: data[0].message, submittedOn: data[0].created_at };
                setFeedback(prev => [...prev, newFB]);
                logActivity({ module: 'Employee', action: 'Feedback Submitted', performedById: fbData.reviewerId, targetEmployeeId: fbData.revieweeId, description: '360 degree feedback submitted', referenceId: newFB.id });
                addToast('Feedback submitted successfully', 'success', '💬');
                return newFB;
            }
        } catch (error) {
            console.error('Feedback Error:', error);
            addToast(error.message || 'Failed to submit feedback', 'error', '❌');
            return null;
        }
    }, [logActivity, addToast]);

    // ---- OKRs ----
    const updateOKRProgress = useCallback(async (okrId, krId, newValue) => {
        try {
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
                const updatedKRs = okrFound.keyResults.map(kr => kr.id === krId ? { ...kr, current: newValue } : kr);
                const newProgress = Math.round(updatedKRs.reduce((sum, kr) => sum + (kr.current / kr.target * 100), 0) / updatedKRs.length);

                const { error } = await supabase.from('okrs').update({ key_results: updatedKRs, overall_progress: newProgress }).eq('id', okrId);
                if (error) throw error;

                logActivity({
                    module: 'Employee',
                    action: 'OKR Progress Updated',
                    performedById: currentUser?.id,
                    description: `Updated progress for "${krFound.title}"`,
                    previousValue: `${krFound.current}/${krFound.target}`,
                    newValue: `${newValue}/${krFound.target}`,
                    referenceId: okrId
                });
                addToast('OKR progress updated', 'success', '🚀');
            }
        } catch (error) {
            console.error('OKR Update Error:', error);
            addToast(error.message || 'Failed to update OKR progress', 'error', '❌');
        }
    }, [currentUser, logActivity, addToast]);

    // ---- ONBOARDING ----
    const updateOnboardingKYC = useCallback(async (userId, docsStatus) => {
        const { error } = await supabase.from('profiles').update({ onboarding_status: docsStatus }).eq('id', userId);
        if (!error) await fetchAllData();
    }, [fetchAllData]);

    const finalizeOnboarding = useCallback(async (userId) => {
        const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
        if (!error) {
            await fetchAllData();
            logActivity({ module: 'Employee', action: 'Onboarding Finalized', performedById: currentUser?.id, targetEmployeeId: userId, description: 'Employee onboarding and KYC completed' });
        }
    }, [currentUser, fetchAllData, logActivity]);

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
        leaveRequests, leaveBalances, attendance, regularizations,
        payroll, okrs, feedback, loans, salaryUpgrades,
        notifications, kudos, auditLog, interviews, activityHistory, isInitialized,

        // Mutations
        applyLeave, approveLeave, rejectLeave, adjustLeaveBalance,
        requestRegularization, approveRegularization, rejectRegularization,
        markAttendance, hrCorrectAttendance,
        login, logout, signUp, currentUser,
        checkNetworkRestriction,
        toasts, addToast,
        PRODUCTION_MODE,

        // User Management
        createUser, updateUser, deactivateUser, activateUser, deleteUser, resetPassword,

        // Payroll
        processPayroll,
        createRole, updateRole, deleteRole,

        // Security
        updateSecurityConfig,

        // Leave
        applyLeave, approveLeave, rejectLeave,

        // Attendance
        requestRegularization, approveRegularization, rejectRegularization,
        setAttendance, hrCorrectAttendance, markAttendance,
        getAttendanceStatus: (userId, date) => {
            const att = attendance.find(a => a.userId === userId && a.date === date);
            const userLeaves = leaveRequests.filter(l => l.employee_id === userId);
            return calculateAttendanceStatus(att?.punchIn, att?.punchOut, userLeaves, date);
        },

        // Interviews
        createInterview, updateInterviewAssessment, setInterviews,

        // Loans
        applyLoan, approveLoan, rejectLoan,

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
        submitFeedback, setFeedback,

        // Onboarding
        updateOnboardingKYC, finalizeOnboarding, updateOffboardingClearance,

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
