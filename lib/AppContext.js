'use client';
// ============================================================
// AI4S Smart HR — Global Application Context
// Manages auth state, RBAC data, and app-wide state
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    DEFAULT_ROLES, DEFAULT_SECURITY_CONFIG,
    LEAVE_TYPES,
} from './mockData';
import { getDashboardRoute, isNetworkRestricted } from './rbac';
import { supabase } from './supabase';

const AppContext = createContext(null);
export const PRODUCTION_MODE = true; // Toggle this to show/hide demo info

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
                    employeeId: p.employee_id || p.id,
                    joinDate: p.join_date,
                    managerId: p.manager_id,
                    reportingTo: p.manager_id,
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
                    employeeId: l.employee_id,
                    from: l.from_date,
                    to: l.to_date,
                    appliedOn: l.applied_on
                })));
            }
            if (attData) {
                setAttendance(attData.map(a => ({ 
                    ...a, 
                    userId: a.user_id || a.employee_id,
                    punchIn: a.punch_in || a.clock_in,
                    punchOut: a.punch_out || a.clock_out,
                    halfDayType: a.half_day_type,
                    hrCorrected: a.hr_corrected
                })));
            }
            if (okrData) setOkrs(okrData);
            if (history) setActivityHistory(history);
            if (payrollData) setPayroll(payrollData);
            if (balances) setLeaveBalances(balances.map(b => ({ ...b, userId: b.user_id })));
            if (regs) {
                setRegularizations(regs.map(r => ({ 
                    ...r, 
                    employeeId: r.employee_id,
                    correctionType: r.correction_type 
                })));
            }
            if (loanData) setLoans(loanData.map(l => ({ ...l, employeeId: l.employee_id })));
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

        setActivityHistory(prev => [histEntry, ...prev.slice(0, 999)]);
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
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...userData,
                    employee_id: userData.employeeId || `AI4S${String(users.length + 1).padStart(3, '0')}`
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            await fetchAllData();
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }, [users, fetchAllData]);

    const updateUser = useCallback(async (userId, updates) => {
        try {
            const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
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
    const applyLeave = useCallback(async (leaveData) => {
        const { data, error } = await supabase.from('leaves').insert([{
            employee_id: currentUser.id,
            type: leaveData.type,
            from_date: leaveData.from,
            to_date: leaveData.to,
            days: leaveData.days,
            reason: leaveData.reason,
            status: 'pending',
            current_level: 1,
            approvals: []
        }]).select();

        if (data) {
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
            return newLeave;
        }
    }, [currentUser, addNotification, logActivity]);

    const approveLeave = useCallback(async (leaveId, approverId, comments, nextLevel, totalLevels) => {
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

        if (data) {
            setLeaveRequests(prev => prev.map(item => item.id === leaveId ? data[0] : item));
            addNotification(lr.employee_id, 'approval', 'Leave Approved', 'Your leave request has been approved');
            logActivity({ module: 'Leave', action: 'Leave Approved', actionCode: 'LEAVE_APPROVED', performedById: approverId, targetEmployeeId: lr.employee_id, description: `${lr.type} leave approved`, referenceId: leaveId });
        }
    }, [leaveRequests, addNotification, logActivity]);

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
            addNotification(lr.employee_id, 'approval', 'Leave Rejected', 'Your leave request has been rejected');
            logActivity({ module: 'Leave', action: 'Leave Rejected', actionCode: 'LEAVE_REJECTED', performedById: approverId, targetEmployeeId: lr.employee_id, description: `${lr.type} leave rejected`, referenceId: leaveId });
        }
    }, [leaveRequests, addNotification, logActivity]);
    // ---- ATTENDANCE ----
    const markAttendance = useCallback(async (userId, date, type, time, location) => {
        const existing = attendance.find(a => a.userId === userId && a.date === date);
        if (type === 'in') {
            const { data, error } = await supabase.from('attendance').upsert({
                employee_id: userId,
                date: date,
                status: 'present',
                clock_in: time,
                location: location
            }).select();
            
            // Note: fallback column names in case DB uses punch_in instead
            if (error && error.message.includes('clock_in')) {
                const retry = await supabase.from('attendance').upsert({
                    user_id: userId, date: date, status: 'present', punch_in: time, location: location
                }).select();
                if (retry.data) {
                    setAttendance(prev => {
                        const filtered = prev.filter(a => !(a.userId === userId && a.date === date));
                        return [...filtered, { ...retry.data[0], userId: retry.data[0].user_id || retry.data[0].employee_id, punchIn: retry.data[0].punch_in || retry.data[0].clock_in, punchOut: retry.data[0].punch_out || retry.data[0].clock_out }];
                    });
                }
            } else if (data) {
                setAttendance(prev => {
                    const filtered = prev.filter(a => !(a.userId === userId && a.date === date));
                    return [...filtered, { ...data[0], userId: data[0].user_id || data[0].employee_id, punchIn: data[0].punch_in || data[0].clock_in, punchOut: data[0].punch_out || data[0].clock_out }];
                });
                logActivity({ module: 'Attendance', action: 'Punch In', performedById: userId, description: `Punched in at ${time} from ${location}` });
            }
        } else if (type === 'out' && existing) {
            let errorMsg = null;
            const { data, error } = await supabase.from('attendance').update({
                clock_out: time
            }).eq('employee_id', userId).eq('date', date).select();
            
            if (error && error.message.includes('clock_out')) {
                const retry = await supabase.from('attendance').update({
                    punch_out: time
                }).eq('user_id', userId).eq('date', date).select();
                if (retry.data) {
                    setAttendance(prev => prev.map(a => a.userId === userId && a.date === date ? { ...a, punchOut: time } : a));
                }
            } else if (data) {
                setAttendance(prev => prev.map(a => a.userId === userId && a.date === date ? { ...a, punchOut: time } : a));
                logActivity({ module: 'Attendance', action: 'Punch Out', performedById: userId, description: `Punched out at ${time}` });
            }
        }
    }, [attendance, logActivity]);

    // ---- ATTENDANCE REGULARIZATION ----
    const requestRegularization = useCallback(async (regData) => {
        const { data, error } = await supabase.from('regularizations').insert([{
            employee_id: regData.employeeId,
            date: regData.date,
            correction_type: regData.correctionType,
            reason: regData.reason,
            status: 'pending'
        }]).select();

        if (data) {
            const newReg = { 
                ...data[0], 
                employeeId: data[0].employee_id,
                correctionType: data[0].correction_type 
            };
            setRegularizations(prev => [...prev, newReg]);
            logActivity({ module: 'Attendance', action: 'Regularization Requested', performedById: regData.employeeId, description: `Attendance regularization requested for ${regData.date}`, referenceId: newReg.id });
            return newReg;
        }
    }, [logActivity]);

    const approveRegularization = useCallback(async (regId, approverId, comments) => {
        const reg = regularizations.find(r => r.id === regId);
        if (!reg) return;

        const { data: updatedReg } = await supabase.from('regularizations').update({ status: 'approved', approver_id: approverId, comments }).eq('id', regId).select();
        
        if (updatedReg) {
            setRegularizations(prev => prev.map(r => r.id === regId ? { ...updatedReg[0], employeeId: updatedReg[0].employee_id } : r));
            
            // Update/Insert attendance
            const { data: existingAtt } = await supabase.from('attendance').select('*').eq('user_id', reg.employeeId).eq('date', reg.date).single();
            if (existingAtt) {
                await supabase.from('attendance').update({ status: 'present', regularized: true }).eq('id', existingAtt.id);
            } else {
                await supabase.from('attendance').insert([{ user_id: reg.employeeId, date: reg.date, status: 'present', regularized: true, location: 'office' }]);
            }
            // Refresh attendance state
            const { data: allAtt } = await supabase.from('attendance').select('*');
            if (allAtt) setAttendance(allAtt.map(a => ({ ...a, userId: a.user_id })));

            addNotification(reg.employeeId, 'approval', 'Regularization Approved', `Attendance for ${reg.date} has been regularized`);
            logActivity({ module: 'Attendance', action: 'Regularization Approved', performedById: approverId, targetEmployeeId: reg.employeeId, description: `Regularization for ${reg.date} approved`, referenceId: regId });
        }
    }, [regularizations, addNotification, logActivity]);
    // ---- INTERVIEW SCHEDULING ----
    const createInterview = useCallback(async (interviewData) => {
        const { data, error } = await supabase.from('interviews').insert([{
            candidate_name: interviewData.candidateName,
            applied_position: interviewData.appliedPosition,
            interviewer_id: interviewData.interviewerId,
            interview_date: interviewData.interviewDate,
            interview_time: interviewData.interviewTime || '10:00 AM',
            status: 'scheduled'
        }]).select();

        if (data) {
            const newInt = { ...data[0], interviewerId: data[0].interviewer_id, candidateName: data[0].candidate_name, appliedPosition: data[0].applied_position, interviewDate: data[0].interview_date };
            setInterviews(prev => [...prev, newInt]);
            if (interviewData.interviewerId) {
                addNotification(interviewData.interviewerId, 'system', 'Interview Assigned', `Assigned: ${newInt.candidateName} on ${newInt.interviewDate}`, '/dashboard/interviews');
            }
            addAuditEntry(currentUser?.id, 'INTERVIEW_SCHEDULED', newInt.id, `Scheduled interview for ${interviewData.candidateName}`);
            logActivity({ module: 'Interview', action: 'Interview Scheduled', actionCode: 'INTERVIEW_SCHEDULED', performedById: currentUser?.id, performedByName: currentUser?.name, targetEmployeeName: `${newInt.candidateName} (Candidate)`, description: `Interview scheduled for ${newInt.appliedPosition} on ${newInt.interviewDate}`, newValue: 'Scheduled', referenceId: newInt.id });
            return newInt;
        }
    }, [currentUser, addNotification, addAuditEntry, logActivity]);

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
        addAuditEntry(currentUser?.id, 'ATTENDANCE_HR_CORRECTION', `${userId}:${date}`, `HR corrected attendance to ${updates.status}`);
    }, [currentUser, addAuditEntry]);

    const adjustLeaveBalance = useCallback(async (userId, leaveType, delta, reason) => {
        const currentBalance = leaveBalances.find(b => b.userId === userId);
        if (currentBalance) {
            const newVal = Math.max(0, (currentBalance[leaveType.toLowerCase()] || 0) + delta);
            const { data, error } = await supabase.from('leave_balances').update({ [leaveType.toLowerCase()]: newVal }).eq('user_id', userId).select();
            
            if (data) {
                setLeaveBalances(prev => prev.map(b => b.userId === userId ? { ...data[0], userId: data[0].user_id } : b));
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
        }
    }, [leaveBalances, users, currentUser, addAuditEntry, logActivity]);

    // ---- LOANS ----
    const applyLoan = useCallback(async (loanData) => {
        const { data } = await supabase.from('loans').insert([{
            employee_id: loanData.employeeId,
            amount: loanData.amount,
            reason: loanData.reason,
            status: 'pending',
            current_level: 1,
            approvals: []
        }]).select();

        if (data) {
            const newLoan = { ...data[0], employeeId: data[0].employee_id };
            setLoans(prev => [...prev, newLoan]);
            logActivity({ module: 'Payroll', action: 'Loan Applied', performedById: loanData.employeeId, description: `Applied for loan: ₹${loanData.amount}`, referenceId: newLoan.id });
            return newLoan;
        }
    }, [logActivity]);

    const approveLoan = useCallback(async (loanId, approverId, comments, level, totalLevels) => {
        const loan = loans.find(l => l.id === loanId);
        if (!loan) return;

        const fullyApproved = level >= totalLevels;
        const newApproval = { level, approvedBy: approverId, approvedOn: new Date().toISOString(), status: 'approved', comments };
        const newApprovals = [...(loan.approvals || []), newApproval];

        const { data } = await supabase.from('loans').update({
            status: fullyApproved ? 'approved' : 'pending',
            current_level: fullyApproved ? level : level + 1,
            approvals: newApprovals
        }).eq('id', loanId).select();

        if (data) {
            setLoans(prev => prev.map(l => l.id === loanId ? { ...data[0], employeeId: data[0].employee_id } : l));
            logActivity({ module: 'Payroll', action: 'Loan Approved', performedById: approverId, targetEmployeeId: loan.employeeId, description: `Loan approved`, referenceId: loanId });
        }
    }, [loans, logActivity]);

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
            setSalaryUpgrades(prev => prev.map(s => s.id === suId ? { ...data[0], employeeId: data[0].employee_id, proposedSalary: Number(data[0].proposed_salary) } : s));
            
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
                targetEmployeeId: su.employeeId,
                targetEmployeeName: users.find(u => u.id === su.employeeId)?.name,
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
        const { data } = await supabase.from('kudos').insert([{
            from_id: fromId,
            to_id: toId,
            badge,
            message
        }]).select();

        if (data) {
            const newKudo = { ...data[0], fromId: data[0].from_id, toId: data[0].to_id, createdAt: data[0].created_at };
            setKudos(prev => [newKudo, ...prev]);
            addNotification(toId, 'kudos', 'You received a Kudos! 🎉', `${currentUser?.name} sent you a kudos: "${message}"`);
            logActivity({ module: 'Employee', action: 'Kudos Sent', performedById: fromId, targetEmployeeId: toId, description: `Sent Kudo: ${badge}`, referenceId: newKudo.id });
        }
    }, [currentUser, addNotification, logActivity]);

    // ---- FEEDBACK ----
    const submitFeedback = useCallback(async (fbData) => {
        const { data } = await supabase.from('feedback').insert([{
            reviewee_id: fbData.revieweeId,
            reviewer_id: fbData.reviewerId,
            reviewer_role: fbData.reviewerRole,
            quarter: fbData.quarter,
            ratings: fbData.ratings,
            comments: fbData.comments,
            submitted_on: fbData.submittedOn,
            is_anonymous: fbData.isAnonymous
        }]).select();

        if (data) {
            const newFB = { ...data[0], revieweeId: data[0].reviewee_id, reviewerId: data[0].reviewer_id, reviewerRole: data[0].reviewer_role, submittedOn: data[0].submitted_on, isAnonymous: data[0].is_anonymous };
            setFeedback(prev => [...prev, newFB]);
            logActivity({ module: 'Employee', action: 'Feedback Submitted', performedById: fbData.reviewerId, targetEmployeeId: fbData.revieweeId, description: '360 degree feedback submitted', referenceId: newFB.id });
            return newFB;
        }
    }, [logActivity]);

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
        users, customRoles, securityConfig,
        leaveRequests, leaveBalances, attendance, regularizations,
        payroll, okrs, feedback, loans, salaryUpgrades,
        notifications, kudos, auditLog, interviews, activityHistory, isInitialized,

        // Mutations
        applyLeave, approveLeave, rejectLeave, adjustLeaveBalance,
        requestRegularization, approveRegularization, rejectRegularization,
        markAttendance, hrCorrectAttendance,
        login, logout, signUp, currentUser,
        checkNetworkRestriction,
        PRODUCTION_MODE,

        // User Management
        createUser, updateUser, deactivateUser, deleteUser, resetPassword,

        // Payroll
        processPayroll,
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
        submitFeedback, setFeedback,

        // Onboarding
        updateOnboardingKYC, finalizeOnboarding,

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
