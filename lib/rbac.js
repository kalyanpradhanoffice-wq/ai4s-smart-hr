'use client';
// ============================================================
// AI4S Smart HR — RBAC (Role-Based Access Control) Engine
// ============================================================

import { DEFAULT_ROLES, PERMISSIONS } from './constants';

/**
 * Check if a user has a specific permission.
 * Super Admin always returns true (bypasses all restrictions).
 */
export function can(user, permission, customRoles = []) {
    if (!user) return false;

    // Resolve the role definition
    const allRoles = { ...DEFAULT_ROLES };
    customRoles.forEach(r => { allRoles[r.id] = r; });
    const roleKey = Object.keys(allRoles).find(k => allRoles[k].id === user.role);
    const roleDef = allRoles[roleKey];

    if (!roleDef) return false;

    // Super Admin → absolute bypass
    if (roleDef.isSuperAdmin) return true;

    return roleDef.permissions.includes(permission);
}

/**
 * Check if a user has ALL given permissions.
 */
export function canAll(user, permissions, customRoles = []) {
    return permissions.every(p => can(user, p, customRoles));
}

/**
 * Check if a user has ANY of the given permissions.
 */
export function canAny(user, permissions, customRoles = []) {
    return permissions.some(p => can(user, p, customRoles));
}

/**
 * Get all permissions for a user's role.
 */
export function getUserPermissions(user, customRoles = []) {
    if (!user) return [];
    const allRoles = { ...DEFAULT_ROLES };
    customRoles.forEach(r => { allRoles[r.id] = r; });
    const roleKey = Object.keys(allRoles).find(k => allRoles[k].id === user.role);
    const roleDef = allRoles[roleKey];
    if (!roleDef) return [];
    if (roleDef.isSuperAdmin) return Object.values(PERMISSIONS);
    return roleDef.permissions || [];
}

/**
 * Determine the dashboard route for a user based on their role.
 */
export function getDashboardRoute(user) {
    if (!user) return '/login';
    const roleRoutes = {
        super_admin: '/dashboard/superadmin',
        core_admin: '/dashboard/admin',
        hr_admin: '/dashboard/hr',
        manager: '/dashboard/manager',
        employee: '/dashboard/employee',
    };
    return roleRoutes[user.role] || '/dashboard/employee';
}

/**
 * Get the role label with color for display.
 */
export function getRoleMeta(roleId, customRoles = []) {
    const allRoles = { ...DEFAULT_ROLES };
    customRoles.forEach(r => { allRoles[r.id] = r; });
    const roleKey = Object.keys(allRoles).find(k => allRoles[k].id === roleId);
    return allRoles[roleKey] || { name: roleId, color: '#6060a0', description: '' };
}

/**
 * Check if the network restriction applies to this user.
 * Super Admins and Core Admins are always exempt.
 */
export function isNetworkRestricted(user, securityConfig) {
    if (!user || !securityConfig) return false;
    if (!securityConfig.wifiRestrictionEnabled) return false;
    const exemptRoles = securityConfig.exemptRoles || ['super_admin', 'core_admin'];
    return !exemptRoles.includes(user.role);
}

/**
 * Check if the 'manager' is the direct or indirect manager of 'employee'.
 * Current implementation focuses on direct reporting line.
 */
export function isManagerOf(manager, employee) {
    if (!manager || !employee) return false;
    if (manager.id === employee.managerId || manager.id === employee.reportingTo) return true;
    return false;
}

/**
 * Get all employees reporting to a specific manager.
 */
export function getTeamMembers(managerId, allUsers) {
    if (!managerId) return [];
    return allUsers.filter(u => u.managerId === managerId || u.reportingTo === managerId);
}
