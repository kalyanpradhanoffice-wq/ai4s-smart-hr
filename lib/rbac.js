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
 * Calculate the distance between two points in meters using the Haversine formula.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

/**
 * Check if the location restriction applies to this user.
 * Returns true if the user is OUTSIDE the allowed geofence area.
 */
export function isLocationRestricted(user, securityConfig, userCoords = null) {
    if (!user || !securityConfig) return false;
    
    // Geofencing is bypassed ONLY if: 
    // 1. It is explicitly disabled in the system config AND the user is not an 'employee' 
    // (We keep it mandatory for employees even if disabled for 'Strict Rule' security)
    const isStrictEnforced = securityConfig.geofencingEnabled || user.role === 'employee';
    
    if (!isStrictEnforced) return false;

    // 2. Roles Check: Super Admins are ALWAYS exempt
    if (user.role === 'super_admin' || user.isSuperAdmin) return false;

    // 3. Geofence Check
    if (userCoords && userCoords.lat && userCoords.lng) {
        const distance = calculateDistance(
            userCoords.lat, 
            userCoords.lng, 
            securityConfig.officeLat, 
            securityConfig.officeLng
        );
        
        // Use configured radius or fallback to 100m
        const allowedRadius = securityConfig.officeRadius || 100;
        
        if (distance <= allowedRadius) {
            return false; // Within radius, not restricted
        }
        
        console.warn(`Location Block: User is ${Math.round(distance)}m away (Max: ${allowedRadius}m)`);
    }

    // Default to restricted if we reached here (outside radius or coords missing)
    return true;
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
