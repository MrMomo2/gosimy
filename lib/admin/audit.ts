import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function logAdminAction(
    supabase: ReturnType<typeof createSupabaseAdminClient>,
    adminEmail: string,
    action: string,
    resourceType: string,
    resourceId: string,
    details?: Record<string, unknown>,
) {
    try {
        await supabase.from('admin_audit_log').insert({
            admin_email: adminEmail,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details: details ?? {},
        });
    } catch (err) {
        // Never let audit logging break the main operation
        console.error('[audit] Failed to log action:', err);
    }
}
