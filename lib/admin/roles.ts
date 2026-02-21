export type AdminRole = 'super_admin' | 'admin' | 'finance' | 'support';

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
    super_admin: ['all'],
    admin: ['orders', 'customers', 'esims', 'coupons', 'refunds', 'analytics', 'audit', 'settings'],
    finance: ['orders', 'refunds', 'analytics', 'audit'],
    support: ['orders', 'customers', 'esims', 'audit'],
};

export function hasPermission(role: AdminRole, permission: string): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions.includes('all') || permissions.includes(permission);
}

export const ROLE_LABELS: Record<AdminRole, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    finance: 'Finance',
    support: 'Support',
};

export const ROLE_COLORS: Record<AdminRole, string> = {
    super_admin: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    finance: 'bg-green-100 text-green-800',
    support: 'bg-yellow-100 text-yellow-800',
};
