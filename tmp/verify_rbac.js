
import { can } from './lib/rbac.js';
import { PERMISSIONS } from './lib/constants.js';

const roles = ['super_admin', 'core_admin', 'hr_admin', 'manager', 'employee'];

roles.forEach(role => {
    const user = { role };
    const hasPermission = can(user, PERMISSIONS.VIEW_EMPLOYEE_DASHBOARD);
    console.log(`Role: ${role.padEnd(12)} | Has VIEW_EMPLOYEE_DASHBOARD: ${hasPermission}`);
});
