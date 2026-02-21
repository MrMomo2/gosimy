import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import type { AdminRole } from '@/lib/admin/roles';

export type UserRole = 'user' | 'admin';

interface AdminUser {
    id: string;
    email: string | undefined;
    role: AdminRole;
    twoFactorEnabled: boolean;
}

export async function getAdminUser(): Promise<AdminUser | null> {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const adminClient = createSupabaseAdminClient();
    const { data: adminData } = await adminClient
        .from('admin_users')
        .select('role, two_factor_enabled')
        .eq('user_id', user.id)
        .single();

    if (!adminData) return null;

    return {
        id: user.id,
        email: user.email,
        role: adminData.role as AdminRole,
        twoFactorEnabled: adminData.two_factor_enabled ?? false,
    };
}

export async function requireAdmin(): Promise<AdminUser> {
    const admin = await getAdminUser();
    if (!admin) {
        throw new Error('Unauthorized: Admin access required');
    }
    return admin;
}

export async function requireRole(requiredRole: AdminRole): Promise<AdminUser> {
    const admin = await requireAdmin();
    const roleHierarchy: AdminRole[] = ['support', 'finance', 'admin', 'super_admin'];
    const adminLevel = roleHierarchy.indexOf(admin.role);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);

    if (adminLevel < requiredLevel) {
        throw new Error(`Unauthorized: ${requiredRole} role required`);
    }
    return admin;
}

export async function requireSuperAdmin(): Promise<AdminUser> {
    return requireRole('super_admin');
}

export async function requireAdminWith2FA(): Promise<AdminUser> {
    const admin = await requireAdmin();
    if (!admin.twoFactorEnabled) {
        throw new Error('2FA must be enabled for admin access');
    }
    return admin;
}

export async function updateAdminLastLogin(userId: string): Promise<void> {
    const adminClient = createSupabaseAdminClient();
    await adminClient
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('user_id', userId);
}
